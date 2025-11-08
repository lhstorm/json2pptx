#!/usr/bin/env python3
"""
Enhanced PowerPoint Generator Script
===================================

A comprehensive script for generating PowerPoint presentations from JSON data.
Supports multiple slide types, charts, tables, and custom styling with proper
python-pptx best practices and error handling.

Requirements:
    - python-pptx>=1.0.0
    - requests (for downloading images)
    - jsonschema (for validation)

Usage:
    python pptx-generator-improved.py input.json output.pptx
"""

import json
import sys
import os
import logging
import argparse
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple, Union
from io import BytesIO
import requests
from pathlib import Path
import glob as file_glob

try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False

try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False

from pptx import Presentation
from pptx.util import Inches, Pt, Cm
from pptx.enum.text import PP_ALIGN, MSO_AUTO_SIZE
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.chart.data import CategoryChartData
from pptx.enum.dml import MSO_THEME_COLOR
from pptx.oxml.xmlchemy import OxmlElement
# from pptx.enum.table import MSO_VERTICAL_ALIGNMENT  # Not available in all versions

# Configure logging (will be reconfigured based on args)
logger = logging.getLogger(__name__)


class StructuredLogger:
    """Logger that supports both standard and JSON output."""

    def __init__(self, name: str, log_format: str = 'standard'):
        self.logger = logging.getLogger(name)
        self.log_format = log_format

        # Remove existing handlers
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)

        handler = logging.StreamHandler()

        if log_format == 'json':
            handler.setFormatter(JsonFormatter())
        else:
            handler.setFormatter(
                logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
            )

        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def info(self, message: str, **kwargs):
        if self.log_format == 'json':
            self.logger.info(json.dumps({'level': 'info', 'message': message, **kwargs}))
        else:
            self.logger.info(message)

    def error(self, message: str, **kwargs):
        if self.log_format == 'json':
            self.logger.error(json.dumps({'level': 'error', 'message': message, **kwargs}))
        else:
            self.logger.error(message)

    def warning(self, message: str, **kwargs):
        if self.log_format == 'json':
            self.logger.warning(json.dumps({'level': 'warning', 'message': message, **kwargs}))
        else:
            self.logger.warning(message)

    def debug(self, message: str, **kwargs):
        if self.log_format == 'json':
            self.logger.debug(json.dumps({'level': 'debug', 'message': message, **kwargs}))
        else:
            self.logger.debug(message)


class JsonFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record):
        log_data = {
            'timestamp': datetime.now().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        return json.dumps(log_data)


class ConfigLoader:
    """Load configuration from YAML file."""

    DEFAULT_CONFIG = {
        'theme': {
            'primary_color': '#2C3E50',
            'secondary_color': '#3498DB',
            'accent_color': '#E74C3C',
            'background_color': '#FFFFFF',
            'text_color': '#2C3E50',
            'font_family': 'Calibri'
        },
        'output': {
            'default_directory': '.',
            'overwrite': False
        },
        'logging': {
            'level': 'INFO',
            'format': 'standard'
        }
    }

    @classmethod
    def load(cls, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load configuration from file or use defaults."""
        config = cls.DEFAULT_CONFIG.copy()

        if not HAS_YAML:
            logger.warning("PyYAML not installed, using default config")
            return config

        # Try to load from specified path or default locations
        paths_to_try = []
        if config_path:
            paths_to_try.append(config_path)
        paths_to_try.extend([
            '.json2pptx.yml',
            '.json2pptx.yaml',
            os.path.expanduser('~/.json2pptx.yml'),
            os.path.expanduser('~/.json2pptx.yaml')
        ])

        for path in paths_to_try:
            if os.path.exists(path):
                try:
                    with open(path, 'r') as f:
                        user_config = yaml.safe_load(f)
                        if user_config:
                            # Deep merge configs
                            config = cls._merge_configs(config, user_config)
                            logger.info(f"Loaded configuration from: {path}")
                            break
                except Exception as e:
                    logger.warning(f"Error loading config from {path}: {e}")

        return config

    @classmethod
    def _merge_configs(cls, base: Dict, override: Dict) -> Dict:
        """Deep merge two configuration dictionaries."""
        result = base.copy()
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = cls._merge_configs(result[key], value)
            else:
                result[key] = value
        return result


class PresentationConstants:
    """Constants for presentation dimensions and styling."""
    
    # Standard dimensions
    SLIDE_WIDTH = Inches(10)
    SLIDE_HEIGHT = Inches(7.5)
    
    # Standard margins
    MARGIN_SMALL = Inches(0.1)
    MARGIN_MEDIUM = Inches(0.25)
    MARGIN_LARGE = Inches(0.5)
    
    # Font sizes
    FONT_TITLE = 36
    FONT_SUBTITLE = 24
    FONT_HEADING = 28
    FONT_BODY = 18
    FONT_CAPTION = 14
    FONT_SMALL = 12
    
    # Standard positions
    TITLE_TOP = Inches(0.5)
    TITLE_HEIGHT = Inches(1)
    CONTENT_TOP = Inches(1.75)
    CONTENT_HEIGHT = Inches(5)
    
    # Chart dimensions
    CHART_WIDTH = Inches(8)
    CHART_HEIGHT = Inches(4.5)


class PresentationValidator:
    """Validates JSON input structure."""
    
    SCHEMA = {
        "type": "object",
        "required": ["slides"],
        "properties": {
            "presentation_metadata": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "author": {"type": "string"},
                    "date": {"type": "string"},
                    "theme": {
                        "type": "object",
                        "properties": {
                            "primary_color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
                            "secondary_color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
                            "accent_color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
                            "background_color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
                            "text_color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
                            "font_family": {"type": "string"}
                        }
                    }
                }
            },
            "slides": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["slide_type", "content"],
                    "properties": {
                        "slide_number": {"type": "integer"},
                        "slide_type": {"type": "string"},
                        "content": {"type": "object"},
                        "speaker_notes": {"type": "string"},
                        "transition": {"type": "string"},
                        "duration": {"type": "number"}
                    }
                }
            }
        }
    }
    
    @classmethod
    def validate(cls, data: Dict[str, Any]) -> bool:
        """Validate JSON data against schema."""
        if not HAS_JSONSCHEMA:
            logger.warning("jsonschema not available, skipping validation")
            return True
        
        try:
            jsonschema.validate(data, cls.SCHEMA)
            return True
        except jsonschema.ValidationError as e:
            logger.error(f"JSON validation error: {e.message}")
            return False
        except Exception as e:
            logger.error(f"Validation error: {e}")
            return False


class EnhancedPresentationGenerator:
    """
    Enhanced PowerPoint presentation generator with proper error handling,
    text manipulation, and python-pptx best practices.
    """
    
    # Default theme colors
    DEFAULT_THEME = {
        'primary_color': '#2C3E50',
        'secondary_color': '#3498DB',
        'accent_color': '#E74C3C',
        'background_color': '#FFFFFF',
        'text_color': '#2C3E50',
        'font_family': 'Calibri'
    }
    
    def __init__(self, json_file_path: str, show_progress: bool = True):
        """
        Initialize the presentation generator with JSON data.

        Args:
            json_file_path (str): Path to the JSON file containing presentation data
            show_progress (bool): Whether to show progress bars
        """
        self.json_data = self._load_and_validate_json(json_file_path)
        self.prs = Presentation()
        self.theme = self.json_data.get('presentation_metadata', {}).get('theme', self.DEFAULT_THEME)
        self._cached_colors = {}
        self._cached_fonts = {}
        self.show_progress = show_progress and HAS_TQDM

        logger.info(f"Initialized presentation generator with {len(self.json_data.get('slides', []))} slides")
    
    def _load_and_validate_json(self, json_file_path: str) -> Dict[str, Any]:
        """Load and validate JSON file."""
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not PresentationValidator.validate(data):
                raise ValueError("JSON validation failed")
            
            return data
        except FileNotFoundError:
            logger.error(f"JSON file not found: {json_file_path}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON format: {e}")
            raise
        except Exception as e:
            logger.error(f"Error loading JSON: {e}")
            raise
    
    def _get_color(self, hex_color: str) -> RGBColor:
        """
        Convert hex color to RGB color with caching.
        
        Args:
            hex_color (str): Hex color string (e.g., '#FFFFFF')
            
        Returns:
            RGBColor: RGB color object
        """
        if hex_color not in self._cached_colors:
            hex_color = hex_color.lstrip('#')
            self._cached_colors[hex_color] = RGBColor(
                int(hex_color[0:2], 16),
                int(hex_color[2:4], 16),
                int(hex_color[4:6], 16)
            )
        return self._cached_colors[hex_color]
    
    def _set_text_with_formatting(self, text_frame, text: str, font_size: int = PresentationConstants.FONT_BODY, 
                                 bold: bool = False, italic: bool = False, 
                                 color: str = None, alignment: PP_ALIGN = None) -> None:
        """
        Properly set text using paragraphs and runs with validation.
        
        Args:
            text_frame: Text frame object
            text (str): Text content
            font_size (int): Font size in points
            bold (bool): Whether to make text bold
            italic (bool): Whether to make text italic
            color (str): Hex color for text
            alignment (PP_ALIGN): Text alignment
        """
        if not hasattr(text_frame, 'paragraphs'):
            logger.warning("Object does not support text")
            return
        
        # Clear existing paragraphs except the first
        for i in range(len(text_frame.paragraphs) - 1, 0, -1):
            text_frame._remove_paragraph(text_frame.paragraphs[i])
        
        # Set text using proper paragraph/run methods
        if text_frame.paragraphs:
            p = text_frame.paragraphs[0]
            p.clear()
        else:
            p = text_frame.add_paragraph()
        
        run = p.add_run()
        run.text = text
        
        # Apply formatting
        font = run.font
        font.size = Pt(font_size)
        font.bold = bold
        font.italic = italic
        font.name = self.theme.get('font_family', 'Calibri')
        
        if color:
            font.color.rgb = self._get_color(color)
        else:
            font.color.rgb = self._get_color(self.theme.get('text_color', '#000000'))
        
        if alignment:
            p.alignment = alignment
        
        # Configure text frame properties for proper wrapping
        text_frame.margin_left = PresentationConstants.MARGIN_SMALL
        text_frame.margin_right = PresentationConstants.MARGIN_SMALL
        text_frame.margin_top = PresentationConstants.MARGIN_SMALL
        text_frame.margin_bottom = PresentationConstants.MARGIN_SMALL
        text_frame.word_wrap = True  # Enable word wrapping
        # Use more conservative auto-sizing to avoid issues
        try:
            text_frame.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
        except:
            # Fallback if auto_size causes issues
            pass
    
    def _add_text_with_placeholder_or_textbox(self, slide, content_key: str, content: Dict[str, Any],
                                            left: float, top: float, width: float, height: float,
                                            font_size: int = PresentationConstants.FONT_BODY,
                                            bold: bool = False, alignment: PP_ALIGN = None) -> None:
        """
        Add text using placeholder if available, otherwise create textbox.
        """
        text = content.get(content_key, '')
        if not text:
            return
        
        # Try to use placeholder first
        placeholder_used = False
        if content_key == 'title' and hasattr(slide, 'shapes') and hasattr(slide.shapes, 'title'):
            try:
                if slide.shapes.title and hasattr(slide.shapes.title, 'text_frame'):
                    self._set_text_with_formatting(
                        slide.shapes.title.text_frame, text, font_size, bold, 
                        alignment=alignment or PP_ALIGN.LEFT
                    )
                    placeholder_used = True
            except Exception as e:
                logger.debug(f"Could not use title placeholder: {e}")
        
        # Fallback to textbox
        if not placeholder_used:
            textbox = slide.shapes.add_textbox(left, top, width, height)
            self._set_text_with_formatting(
                textbox.text_frame, text, font_size, bold, 
                alignment=alignment or PP_ALIGN.LEFT
            )
    
    def _add_background_image(self, slide, image_source: str) -> bool:
        """
        Add a background image. Since we add it first, it will naturally be behind other content.
        
        Args:
            slide: The slide object
            image_source (str): Path or URL to the image
            
        Returns:
            bool: True if successful, False if failed
        """
        try:
            # Simply add the background image - since we call this first,
            # it will naturally be behind other content
            success = self._add_image_with_error_handling(
                slide, image_source, 0, 0,
                PresentationConstants.SLIDE_WIDTH, PresentationConstants.SLIDE_HEIGHT
            )
            
            if success:
                logger.debug("Background image added successfully")
            
            return success
        except Exception as e:
            logger.warning(f"Error adding background image: {e}")
            return False

    def _add_image_with_error_handling(self, slide, image_source: str, left: float, top: float,
                                     width: float, height: float) -> bool:
        """
        Add an image with comprehensive error handling.
        
        Returns:
            bool: True if successful, False if failed
        """
        try:
            if image_source.startswith(('http://', 'https://')):
                # Download image from URL with timeout
                response = requests.get(image_source, timeout=10, stream=True)
                response.raise_for_status()
                
                # Check content type
                content_type = response.headers.get('content-type', '').lower()
                if not content_type.startswith('image/'):
                    logger.warning(f"URL does not point to an image: {image_source}")
                    return False
                
                image_stream = BytesIO(response.content)
                slide.shapes.add_picture(image_stream, left, top, width, height)
            else:
                # Local file
                if not os.path.exists(image_source):
                    logger.warning(f"Image file not found: {image_source}")
                    return False
                
                slide.shapes.add_picture(image_source, left, top, width, height)
            
            return True
            
        except requests.RequestException as e:
            logger.warning(f"Error downloading image from {image_source}: {e}")
            return False
        except Exception as e:
            logger.warning(f"Error adding image: {e}")
            return False
    
    def _add_placeholder_shape(self, slide, left: float, top: float, width: float, height: float,
                             text: str = "Image Placeholder") -> None:
        """Add a placeholder shape when image loading fails."""
        shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = RGBColor(220, 220, 220)
        shape.line.color.rgb = RGBColor(128, 128, 128)
        
        if hasattr(shape, 'text_frame'):
            self._set_text_with_formatting(
                shape.text_frame, text, PresentationConstants.FONT_CAPTION,
                alignment=PP_ALIGN.CENTER
            )
    
    def _create_native_chart(self, slide, chart_type: str, data: Dict[str, Any], 
                           left: float, top: float, width: float, height: float) -> None:
        """
        Create charts using native python-pptx chart functionality.
        """
        try:
            # Map chart types
            chart_type_mapping = {
                'bar': XL_CHART_TYPE.COLUMN_CLUSTERED,
                'line': XL_CHART_TYPE.LINE,
                'pie': XL_CHART_TYPE.PIE,
                'area': XL_CHART_TYPE.AREA
            }
            
            xl_chart_type = chart_type_mapping.get(chart_type, XL_CHART_TYPE.COLUMN_CLUSTERED)
            
            # Prepare chart data
            chart_data = CategoryChartData()
            chart_data.categories = data.get('labels', [])
            
            for dataset in data.get('datasets', []):
                chart_data.add_series(
                    dataset.get('name', 'Series'), 
                    dataset.get('values', [])
                )
            
            # Add chart to slide
            chart = slide.shapes.add_chart(
                xl_chart_type, left, top, width, height, chart_data
            ).chart
            
            # Style the chart
            chart.has_legend = True
            chart.legend.position = XL_LEGEND_POSITION.RIGHT
            chart.legend.include_in_layout = False
            
            # Apply theme colors to chart
            if hasattr(chart, 'plots') and chart.plots:
                plot = chart.plots[0]
                if hasattr(plot, 'series'):
                    colors = [
                        self.theme.get('primary_color', '#2C3E50'),
                        self.theme.get('secondary_color', '#3498DB'),
                        self.theme.get('accent_color', '#E74C3C'),
                        '#9B59B6',  # Purple
                        '#F39C12',  # Orange
                        '#1ABC9C',  # Turquoise
                        '#E67E22',  # Carrot
                        '#34495E'   # Wet Asphalt
                    ]
                    
                    # For pie charts, apply colors to data points within the series
                    if xl_chart_type == XL_CHART_TYPE.PIE and plot.series:
                        try:
                            series = plot.series[0]  # Pie charts typically have one series
                            if hasattr(series, 'points'):
                                for i, point in enumerate(series.points):
                                    if i < len(colors) and hasattr(point, 'format'):
                                        try:
                                            point.format.fill.solid()
                                            point.format.fill.fore_color.rgb = self._get_color(colors[i % len(colors)])
                                        except Exception as e:
                                            logger.debug(f"Could not apply color to pie chart point {i}: {e}")
                        except Exception as e:
                            logger.debug(f"Could not apply colors to pie chart data points: {e}")
                    else:
                        # For other chart types, apply colors to series
                        for i, series in enumerate(plot.series):
                            if i < len(colors) and hasattr(series, 'format'):
                                try:
                                    series.format.fill.solid()
                                    series.format.fill.fore_color.rgb = self._get_color(colors[i % len(colors)])
                                except Exception as e:
                                    logger.debug(f"Could not apply color to series {i}: {e}")
            
        except Exception as e:
            logger.error(f"Error creating native chart: {e}")
            # Fallback to placeholder
            self._add_placeholder_shape(slide, left, top, width, height, "Chart Placeholder")
    
    def _create_enhanced_table(self, slide, headers: List[str], rows: List[List], 
                             left: float, top: float, width: float, height: float,
                             style: str = 'default') -> None:
        """
        Create table with enhanced styling and proper error handling.
        """
        try:
            if not headers or not rows:
                logger.warning("Empty table data provided")
                return
            
            num_cols = len(headers)
            num_rows = len(rows) + 1  # +1 for header row
            
            # Add table
            table = slide.shapes.add_table(
                num_rows, num_cols, left, top, width, height
            ).table
            
            # Set column widths evenly
            col_width = int(width / num_cols)
            for col in table.columns:
                col.width = col_width
            
            # Style header row
            for col_idx, header in enumerate(headers):
                cell = table.cell(0, col_idx)
                cell.text = str(header)
                
                # Header styling
                cell.fill.solid()
                cell.fill.fore_color.rgb = self._get_color(self.theme['primary_color'])
                # cell.vertical_alignment = MSO_VERTICAL_ALIGNMENT.MIDDLE  # Not available in all versions
                
                # Header text formatting
                if hasattr(cell, 'text_frame'):
                    self._set_text_with_formatting(
                        cell.text_frame, str(header), 
                        PresentationConstants.FONT_CAPTION, bold=True, 
                        color='#FFFFFF', alignment=PP_ALIGN.CENTER
                    )
            
            # Add data rows
            for row_idx, row_data in enumerate(rows, 1):
                for col_idx, cell_data in enumerate(row_data):
                    if col_idx < num_cols:
                        cell = table.cell(row_idx, col_idx)
                        cell.text = str(cell_data)
                        # cell.vertical_alignment = MSO_VERTICAL_ALIGNMENT.MIDDLE  # Not available in all versions
                        
                        # Apply striped styling if requested
                        if style == 'striped' and row_idx % 2 == 0:
                            cell.fill.solid()
                            cell.fill.fore_color.rgb = RGBColor(248, 248, 248)
                        
                        # Data cell text formatting
                        if hasattr(cell, 'text_frame'):
                            self._set_text_with_formatting(
                                cell.text_frame, str(cell_data),
                                PresentationConstants.FONT_SMALL, 
                                alignment=PP_ALIGN.CENTER
                            )
            
        except Exception as e:
            logger.error(f"Error creating table: {e}")
            # Fallback to simple text
            textbox = slide.shapes.add_textbox(left, top, width, height)
            self._set_text_with_formatting(
                textbox.text_frame, "Table data could not be displayed",
                PresentationConstants.FONT_BODY
            )
    
    def _add_speaker_notes(self, slide, notes: str) -> None:
        """Add speaker notes to a slide with error handling."""
        try:
            if notes and hasattr(slide, 'notes_slide'):
                notes_slide = slide.notes_slide
                if hasattr(notes_slide, 'notes_text_frame'):
                    self._set_text_with_formatting(
                        notes_slide.notes_text_frame, notes,
                        PresentationConstants.FONT_BODY
                    )
        except Exception as e:
            logger.warning(f"Could not add speaker notes: {e}")
    
    # Slide type methods (enhanced versions)
    
    def _add_title_slide(self, slide_data: Dict[str, Any]) -> None:
        """Add a title slide using placeholders when possible."""
        try:
            slide_layout = self.prs.slide_layouts[0]  # Title slide layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Store placeholder content but don't populate yet
            title_text = content.get('title', 'Untitled Presentation')
            subtitle_text = content.get('subtitle', '')
            if content.get('author'):
                subtitle_text += f"\n{content['author']}"
            if content.get('date'):
                subtitle_text += f"\n{content['date']}"
            
            # Add background image FIRST (before populating placeholders)
            if content.get('background_image'):
                if not self._add_background_image(slide, content['background_image']):
                    logger.warning("Background image could not be loaded")
            
            # Now populate title placeholder (will be on top of background)
            if hasattr(slide.shapes, 'title') and slide.shapes.title:
                self._set_text_with_formatting(
                    slide.shapes.title.text_frame,
                    title_text,
                    PresentationConstants.FONT_TITLE, bold=True,
                    alignment=PP_ALIGN.CENTER
                )
            
            # Use subtitle placeholder or create textbox
            if subtitle_text:
                try:
                    # Try to use subtitle placeholder
                    if len(slide.placeholders) > 1:
                        self._set_text_with_formatting(
                            slide.placeholders[1].text_frame, subtitle_text,
                            PresentationConstants.FONT_SUBTITLE,
                            alignment=PP_ALIGN.CENTER
                        )
                    else:
                        # Fallback to textbox
                        self._add_text_with_placeholder_or_textbox(
                            slide, 'subtitle', {'subtitle': subtitle_text},
                            Inches(1), Inches(3), Inches(8), Inches(2),
                            PresentationConstants.FONT_SUBTITLE, alignment=PP_ALIGN.CENTER
                        )
                except Exception as e:
                    logger.debug(f"Subtitle placeholder failed, using textbox: {e}")
            
        except Exception as e:
            logger.error(f"Error creating title slide: {e}")
            raise
    
    def _add_section_header(self, slide_data: Dict[str, Any]) -> None:
        """Add a section header slide."""
        try:
            slide_layout = self.prs.slide_layouts[2]  # Section header layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True, alignment=PP_ALIGN.CENTER
            )
            
            # Add subtitle if present
            if content.get('subtitle'):
                self._add_text_with_placeholder_or_textbox(
                    slide, 'subtitle', content,
                    Inches(1), Inches(3), Inches(8), Inches(1),
                    PresentationConstants.FONT_SUBTITLE, alignment=PP_ALIGN.CENTER
                )
                
        except Exception as e:
            logger.error(f"Error creating section header slide: {e}")
            raise
    
    def _add_bullet_points(self, slide_data: Dict[str, Any]) -> None:
        """Add a slide with bullet points using proper paragraph handling."""
        try:
            slide_layout = self.prs.slide_layouts[1]  # Bullet slide layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True
            )
            
            # Add bullet points using proper placeholder or textbox
            points = content.get('points', [])
            if points:
                try:
                    # Try to use content placeholder
                    if len(slide.placeholders) > 1:
                        body_shape = slide.placeholders[1]
                        text_frame = body_shape.text_frame
                        
                        # Clear existing paragraphs
                        for i in range(len(text_frame.paragraphs) - 1, 0, -1):
                            text_frame._remove_paragraph(text_frame.paragraphs[i])
                        
                        # Add bullet points
                        for i, point in enumerate(points):
                            if i == 0:
                                p = text_frame.paragraphs[0]
                            else:
                                p = text_frame.add_paragraph()
                            
                            p.text = point['text']
                            p.level = point.get('level', 0)
                            
                            # Format paragraph
                            for run in p.runs:
                                run.font.size = Pt(PresentationConstants.FONT_BODY)
                                run.font.name = self.theme.get('font_family', 'Calibri')
                                run.font.color.rgb = self._get_color(
                                    self.theme.get('text_color', '#000000')
                                )
                    else:
                        # Fallback to textbox
                        bullet_text = '\n'.join([f"• {point['text']}" for point in points])
                        self._add_text_with_placeholder_or_textbox(
                            slide, 'points', {'points': bullet_text},
                            PresentationConstants.MARGIN_LARGE, PresentationConstants.CONTENT_TOP,
                            Inches(8), PresentationConstants.CONTENT_HEIGHT,
                            PresentationConstants.FONT_BODY
                        )
                        
                except Exception as e:
                    logger.debug(f"Bullet points placeholder failed: {e}")
                    
        except Exception as e:
            logger.error(f"Error creating bullet points slide: {e}")
            raise
    
    def _add_chart_slide(self, slide_data: Dict[str, Any]) -> None:
        """Add a slide with a native chart."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True
            )
            
            # Create chart using native functionality
            chart_type = content.get('chart_type', 'bar')
            data = content.get('data', {})
            
            if data:
                chart_left = Inches(1)
                chart_top = Inches(1.75)
                
                self._create_native_chart(
                    slide, chart_type, data,
                    chart_left, chart_top,
                    PresentationConstants.CHART_WIDTH,
                    PresentationConstants.CHART_HEIGHT
                )
            
        except Exception as e:
            logger.error(f"Error creating chart slide: {e}")
            raise
    
    def _add_data_table(self, slide_data: Dict[str, Any]) -> None:
        """Add a slide with an enhanced data table."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True
            )
            
            # Add table
            headers = content.get('headers', [])
            rows = content.get('rows', [])
            style = content.get('style', 'default')
            
            if headers and rows:
                self._create_enhanced_table(
                    slide, headers, rows,
                    PresentationConstants.MARGIN_LARGE, Inches(1.75),
                    Inches(8.5), Inches(4.5), style
                )
                
        except Exception as e:
            logger.error(f"Error creating data table slide: {e}")
            raise
    
    def _add_text_image_slide(self, slide_data: Dict[str, Any], text_position: str = 'left') -> None:
        """Add a slide with text and image side by side."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True
            )
            
            # Content area dimensions
            content_top = Inches(1.75)
            content_height = Inches(4.5)
            content_width = Inches(4)
            margin = PresentationConstants.MARGIN_MEDIUM
            
            # Position text and image based on text_position
            if text_position == 'left':
                text_left = PresentationConstants.MARGIN_LARGE
                image_left = text_left + content_width + margin
            else:
                image_left = PresentationConstants.MARGIN_LARGE
                text_left = image_left + content_width + margin
            
            # Add text
            if content.get('text'):
                textbox = slide.shapes.add_textbox(text_left, content_top, content_width, content_height)
                self._set_text_with_formatting(
                    textbox.text_frame, content['text'],
                    PresentationConstants.FONT_BODY
                )
                # Ensure proper wrapping for long text
                textbox.text_frame.word_wrap = True
            
            # Add image
            if content.get('image'):
                if not self._add_image_with_error_handling(
                    slide, content['image'], image_left, content_top,
                    content_width, content_height
                ):
                    self._add_placeholder_shape(
                        slide, image_left, content_top, content_width, content_height
                    )
                    
        except Exception as e:
            logger.error(f"Error creating text/image slide: {e}")
            raise
    
    def _add_content_slide(self, slide_data: Dict[str, Any], columns: int = 1) -> None:
        """Add a content slide with specified number of columns."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            title_text = slide_data.get('title', content.get('title', ''))
            if title_text:
                title_shape = slide.shapes.add_textbox(
                    PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                    Inches(9), PresentationConstants.TITLE_HEIGHT
                )
                self._set_text_with_formatting(
                    title_shape.text_frame, title_text, 
                    PresentationConstants.FONT_HEADING, bold=True
                )
                title_shape.text_frame.word_wrap = True
            
            # Content area
            content_top = Inches(1.75)
            content_height = Inches(4.5)
            total_width = Inches(8.5)
            margin = PresentationConstants.MARGIN_MEDIUM
            
            if columns == 1:
                # Single column
                self._add_text_with_placeholder_or_textbox(
                    slide, 'text', content,
                    PresentationConstants.MARGIN_LARGE, content_top,
                    total_width, content_height,
                    PresentationConstants.FONT_BODY
                )
            elif columns == 2:
                # Two columns - support both old and new format
                col_width = (total_width - margin) / 2
                
                # Check if using new documented format (columns array)
                if content.get('columns') and isinstance(content['columns'], list):
                    columns_data = content['columns']
                    for i, column in enumerate(columns_data[:2]):  # Limit to 2 columns
                        col_left = PresentationConstants.MARGIN_LARGE + i * (col_width + margin)
                        textbox = slide.shapes.add_textbox(col_left, content_top, col_width, content_height)
                        
                        # Format: title + content
                        column_text = ""
                        if column.get('title'):
                            column_text += f"{column['title']}\n\n"
                        if column.get('content'):
                            column_text += column['content']
                        
                        if column_text:
                            self._set_text_with_formatting(
                                textbox.text_frame, column_text, PresentationConstants.FONT_BODY
                            )
                            # Make title bold if present
                            if column.get('title'):
                                textbox.text_frame.paragraphs[0].runs[0].font.bold = True
                            # Ensure proper wrapping for long text
                            textbox.text_frame.word_wrap = True
                
                # Fallback to old format for backward compatibility
                else:
                    # Left column
                    if content.get('left_column'):
                        textbox = slide.shapes.add_textbox(
                            PresentationConstants.MARGIN_LARGE, content_top, col_width, content_height
                        )
                        self._set_text_with_formatting(
                            textbox.text_frame, content['left_column'], PresentationConstants.FONT_BODY
                        )
                        textbox.text_frame.word_wrap = True
                    
                    # Right column
                    if content.get('right_column'):
                        textbox = slide.shapes.add_textbox(
                            PresentationConstants.MARGIN_LARGE + col_width + margin, content_top,
                            col_width, content_height
                        )
                        self._set_text_with_formatting(
                            textbox.text_frame, content['right_column'], PresentationConstants.FONT_BODY
                        )
                        textbox.text_frame.word_wrap = True
                        
            elif columns == 3:
                # Three columns - support both old and new format
                col_width = (total_width - 2 * margin) / 3
                
                # Check if using new documented format (columns array)
                if content.get('columns') and isinstance(content['columns'], list):
                    columns_data = content['columns']
                    for i, column in enumerate(columns_data[:3]):  # Limit to 3 columns
                        col_left = PresentationConstants.MARGIN_LARGE + i * (col_width + margin)
                        textbox = slide.shapes.add_textbox(col_left, content_top, col_width, content_height)
                        
                        # Format: title + content
                        column_text = ""
                        if column.get('title'):
                            column_text += f"{column['title']}\n\n"
                        if column.get('content'):
                            column_text += column['content']
                        
                        if column_text:
                            self._set_text_with_formatting(
                                textbox.text_frame, column_text, PresentationConstants.FONT_CAPTION
                            )
                            # Make title bold if present
                            if column.get('title'):
                                textbox.text_frame.paragraphs[0].runs[0].font.bold = True
                            # Ensure proper wrapping for long text
                            textbox.text_frame.word_wrap = True
                
                # Fallback to old format for backward compatibility
                else:
                    for i, col_key in enumerate(['left_column', 'middle_column', 'right_column']):
                        if content.get(col_key):
                            col_left = PresentationConstants.MARGIN_LARGE + i * (col_width + margin)
                            textbox = slide.shapes.add_textbox(col_left, content_top, col_width, content_height)
                            self._set_text_with_formatting(
                                textbox.text_frame, content[col_key], PresentationConstants.FONT_CAPTION
                            )
                            textbox.text_frame.word_wrap = True
                        
        except Exception as e:
            logger.error(f"Error creating content slide: {e}")
            raise
    
    def _add_numbered_list(self, slide_data: Dict[str, Any]) -> None:
        """Add a slide with numbered list."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True
            )
            
            # Add numbered items
            items = content.get('items', [])
            if items:
                numbered_text = '\n'.join([f"{i}. {item['text']}" for i, item in enumerate(items, 1)])
                self._add_text_with_placeholder_or_textbox(
                    slide, 'items', {'items': numbered_text},
                    PresentationConstants.MARGIN_LARGE, PresentationConstants.CONTENT_TOP,
                    Inches(8), PresentationConstants.CONTENT_HEIGHT,
                    PresentationConstants.FONT_BODY
                )
                
        except Exception as e:
            logger.error(f"Error creating numbered list slide: {e}")
            raise
    
    def _add_image_full(self, slide_data: Dict[str, Any]) -> None:
        """Add a full-slide image with optional overlay text."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add full-slide background image FIRST
            if content.get('image'):
                if not self._add_background_image(slide, content['image']):
                    self._add_placeholder_shape(
                        slide, 0, 0, PresentationConstants.SLIDE_WIDTH, PresentationConstants.SLIDE_HEIGHT,
                        "Background Image Placeholder"
                    )
            
            # Add overlay text if specified
            if content.get('overlay_text'):
                overlay_left = Inches(1)
                overlay_top = Inches(2.5)
                overlay_width = Inches(8)
                overlay_height = Inches(2)
                
                # Add background rectangle
                bg_shape = slide.shapes.add_shape(
                    MSO_SHAPE.RECTANGLE, overlay_left, overlay_top, overlay_width, overlay_height
                )
                bg_shape.fill.solid()
                bg_shape.fill.fore_color.rgb = RGBColor(0, 0, 0)
                bg_shape.line.fill.background()
                
                # Add overlay text
                textbox = slide.shapes.add_textbox(overlay_left, overlay_top, overlay_width, overlay_height)
                self._set_text_with_formatting(
                    textbox.text_frame, content['overlay_text'],
                    PresentationConstants.FONT_TITLE, bold=True, color='#FFFFFF',
                    alignment=PP_ALIGN.CENTER
                )
                
        except Exception as e:
            logger.error(f"Error creating full image slide: {e}")
            raise
    
    def _add_quote_slide(self, slide_data: Dict[str, Any]) -> None:
        """Add a quote slide."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add quote
            quote_text = f'"{content.get("quote", "")}"'
            quote_box = slide.shapes.add_textbox(Inches(1), Inches(2), Inches(8), Inches(2))
            self._set_text_with_formatting(
                quote_box.text_frame, quote_text,
                PresentationConstants.FONT_SUBTITLE, italic=True,
                alignment=PP_ALIGN.CENTER
            )
            
            # Add attribution
            if content.get('attribution'):
                attr_text = f"— {content['attribution']}"
                attr_box = slide.shapes.add_textbox(Inches(1), Inches(4.5), Inches(8), Inches(1))
                self._set_text_with_formatting(
                    attr_box.text_frame, attr_text,
                    PresentationConstants.FONT_BODY,
                    alignment=PP_ALIGN.CENTER
                )
                
        except Exception as e:
            logger.error(f"Error creating quote slide: {e}")
            raise
    
    def _add_thank_you(self, slide_data: Dict[str, Any]) -> None:
        """Add a thank you slide."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            title_box = slide.shapes.add_textbox(Inches(1), Inches(2.5), Inches(8), Inches(1.5))
            self._set_text_with_formatting(
                title_box.text_frame, content.get('title', 'Thank You!'),
                PresentationConstants.FONT_TITLE, bold=True,
                alignment=PP_ALIGN.CENTER
            )
            
            # Add subtitle if present
            if content.get('subtitle'):
                subtitle_box = slide.shapes.add_textbox(Inches(1), Inches(4.5), Inches(8), Inches(1))
                self._set_text_with_formatting(
                    subtitle_box.text_frame, content['subtitle'],
                    PresentationConstants.FONT_SUBTITLE,
                    alignment=PP_ALIGN.CENTER
                )
                
        except Exception as e:
            logger.error(f"Error creating thank you slide: {e}")
            raise
    
    def _add_timeline(self, slide_data: Dict[str, Any]) -> None:
        """Add a timeline slide with simple text representation."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True
            )
            
            # Add timeline events as text
            events = content.get('events', [])
            if events:
                timeline_text = "Timeline:\n\n"
                for event in events:
                    timeline_text += f"• {event.get('date', '')}: {event.get('title', '')}\n"
                    if event.get('description'):
                        timeline_text += f"  {event['description']}\n"
                    timeline_text += "\n"
                
                textbox = slide.shapes.add_textbox(
                    PresentationConstants.MARGIN_LARGE, PresentationConstants.CONTENT_TOP,
                    Inches(8), PresentationConstants.CONTENT_HEIGHT
                )
                self._set_text_with_formatting(
                    textbox.text_frame, timeline_text.strip(),
                    PresentationConstants.FONT_BODY
                )
                textbox.text_frame.word_wrap = True
                
        except Exception as e:
            logger.error(f"Error creating timeline slide: {e}")
            raise
    
    def _add_contact_slide(self, slide_data: Dict[str, Any]) -> None:
        """Add a contact information slide."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True, alignment=PP_ALIGN.CENTER
            )
            
            # Add contact details
            contact_text = ""
            contact_fields = [
                ('name', 'Name: '),
                ('email', 'Email: '),
                ('phone', 'Phone: '),
                ('website', 'Website: '),
                ('address', 'Address: ')
            ]
            
            for field, label in contact_fields:
                if content.get(field):
                    contact_text += f"{label}{content[field]}\n"
            
            if contact_text:
                textbox = slide.shapes.add_textbox(
                    Inches(2), Inches(2.5), Inches(6), Inches(3)
                )
                self._set_text_with_formatting(
                    textbox.text_frame, contact_text.strip(),
                    PresentationConstants.FONT_BODY, alignment=PP_ALIGN.CENTER
                )
                textbox.text_frame.word_wrap = True
                
        except Exception as e:
            logger.error(f"Error creating contact slide: {e}")
            raise
    
    def _add_process_flow(self, slide_data: Dict[str, Any]) -> None:
        """Add a process flow diagram slide with shapes and arrows."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True
            )
            
            # Add process steps
            steps = content.get('steps', [])
            if steps:
                step_top = Inches(2.5)
                step_width = Inches(1.8)
                step_height = Inches(1)
                spacing = Inches(0.3)
                
                # Calculate layout to fit all steps
                total_width = len(steps) * step_width + (len(steps) - 1) * spacing
                start_left = (PresentationConstants.SLIDE_WIDTH - total_width) / 2
                
                for i, step in enumerate(steps):
                    step_left = start_left + i * (step_width + spacing)
                    
                    # Add step box
                    shape = slide.shapes.add_shape(
                        MSO_SHAPE.ROUNDED_RECTANGLE,
                        step_left, step_top, step_width, step_height
                    )
                    
                    # Style the shape
                    shape.fill.solid()
                    shape.fill.fore_color.rgb = self._get_color(self.theme.get('secondary_color', '#3498DB'))
                    shape.line.color.rgb = self._get_color(self.theme.get('primary_color', '#2C3E50'))
                    shape.line.width = Pt(2)
                    
                    # Add text to shape
                    if hasattr(shape, 'text_frame'):
                        self._set_text_with_formatting(
                            shape.text_frame, step.get('text', f'Step {i+1}'),
                            PresentationConstants.FONT_CAPTION, bold=True, 
                            color='#FFFFFF', alignment=PP_ALIGN.CENTER
                        )
                    
                    # Add arrow between steps (simple rectangle as arrow)
                    if i < len(steps) - 1:
                        arrow_left = step_left + step_width
                        arrow_top = step_top + step_height / 2 - Pt(3)
                        arrow_width = spacing
                        arrow_height = Pt(6)
                        
                        arrow = slide.shapes.add_shape(
                            MSO_SHAPE.RECTANGLE,
                            arrow_left, arrow_top, arrow_width, arrow_height
                        )
                        arrow.fill.solid()
                        arrow.fill.fore_color.rgb = self._get_color(self.theme.get('primary_color', '#2C3E50'))
                        arrow.line.fill.background()
                        
                        # Add arrow head (triangle)
                        triangle_left = arrow_left + spacing - Pt(8)
                        triangle_top = step_top + step_height / 2 - Pt(6)
                        triangle = slide.shapes.add_shape(
                            MSO_SHAPE.RIGHT_TRIANGLE,
                            triangle_left, triangle_top, Pt(12), Pt(12)
                        )
                        triangle.fill.solid()
                        triangle.fill.fore_color.rgb = self._get_color(self.theme.get('primary_color', '#2C3E50'))
                        triangle.line.fill.background()
                        
        except Exception as e:
            logger.error(f"Error creating process flow slide: {e}")
            raise
    
    def _add_comparison_table(self, slide_data: Dict[str, Any]) -> None:
        """Add a comparison table slide."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True
            )
            
            # Create comparison table
            items = content.get('items', [])
            criteria = content.get('criteria', [])
            
            if items and criteria:
                # Convert comparison table format to standard table format
                headers = [""] + [item['name'] for item in items]  # Empty first column for criteria names
                rows = []
                
                for criterion in criteria:
                    row = [criterion['name']] + criterion.get('values', [])
                    rows.append(row)
                
                # Use the enhanced table creation method
                self._create_enhanced_table(
                    slide, headers, rows,
                    PresentationConstants.MARGIN_LARGE, Inches(1.75),
                    Inches(8.5), Inches(4.5), 'default'
                )
            else:
                # Fallback text if no data
                textbox = slide.shapes.add_textbox(
                    PresentationConstants.MARGIN_LARGE, PresentationConstants.CONTENT_TOP,
                    Inches(8), Inches(2)
                )
                self._set_text_with_formatting(
                    textbox.text_frame, "No comparison data available",
                    PresentationConstants.FONT_BODY
                )
                
        except Exception as e:
            logger.error(f"Error creating comparison table slide: {e}")
            raise
    
    def _add_icon_points(self, slide_data: Dict[str, Any]) -> None:
        """Add a slide with icon-based points."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True
            )
            
            # Add icon points
            points = content.get('points', [])
            if points:
                # Arrange in grid (max 3 columns)
                cols = min(3, len(points))
                rows = (len(points) + cols - 1) // cols
                
                point_width = Inches(2.5)
                point_height = Inches(1.8)
                h_spacing = Inches(0.5)
                v_spacing = Inches(0.3)
                
                start_top = Inches(1.75)
                total_width = cols * point_width + (cols - 1) * h_spacing
                start_left = (PresentationConstants.SLIDE_WIDTH - total_width) / 2
                
                for i, point in enumerate(points):
                    row = i // cols
                    col = i % cols
                    
                    point_left = start_left + col * (point_width + h_spacing)
                    point_top = start_top + row * (point_height + v_spacing)
                    
                    # Add icon placeholder (circular shape)
                    icon_size = Inches(0.8)
                    icon_left = point_left + (point_width - icon_size) / 2
                    
                    icon_shape = slide.shapes.add_shape(
                        MSO_SHAPE.OVAL,
                        icon_left, point_top, icon_size, icon_size
                    )
                    icon_shape.fill.solid()
                    icon_shape.fill.fore_color.rgb = self._get_color(self.theme.get('accent_color', '#E74C3C'))
                    icon_shape.line.color.rgb = self._get_color(self.theme.get('primary_color', '#2C3E50'))
                    icon_shape.line.width = Pt(2)
                    
                    # Add text below icon
                    text_top = point_top + icon_size + Inches(0.1)
                    text_height = point_height - icon_size - Inches(0.1)
                    
                    text_box = slide.shapes.add_textbox(
                        point_left, text_top, point_width, text_height
                    )
                    self._set_text_with_formatting(
                        text_box.text_frame, point.get('text', ''),
                        PresentationConstants.FONT_CAPTION,
                        alignment=PP_ALIGN.CENTER
                    )
                    text_box.text_frame.word_wrap = True
                    
        except Exception as e:
            logger.error(f"Error creating icon points slide: {e}")
            raise
    
    def _add_team_slide(self, slide_data: Dict[str, Any]) -> None:
        """Add a team members slide."""
        try:
            slide_layout = self.prs.slide_layouts[5]  # Blank layout
            slide = self.prs.slides.add_slide(slide_layout)
            
            content = slide_data['content']
            
            # Add title
            self._add_text_with_placeholder_or_textbox(
                slide, 'title', content,
                PresentationConstants.MARGIN_LARGE, PresentationConstants.TITLE_TOP,
                Inches(9), PresentationConstants.TITLE_HEIGHT,
                PresentationConstants.FONT_HEADING, bold=True
            )
            
            # Add team members
            members = content.get('members', [])
            if members:
                # Arrange in grid (max 4 columns)
                cols = min(4, len(members))
                rows = (len(members) + cols - 1) // cols
                
                member_width = Inches(2)
                member_height = Inches(2.5)
                h_spacing = Inches(0.25)
                v_spacing = Inches(0.25)
                
                start_top = Inches(1.8)
                total_width = cols * member_width + (cols - 1) * h_spacing
                start_left = (PresentationConstants.SLIDE_WIDTH - total_width) / 2
                
                for i, member in enumerate(members):
                    row = i // cols
                    col = i % cols
                    
                    member_left = start_left + col * (member_width + h_spacing)
                    member_top = start_top + row * (member_height + v_spacing)
                    
                    # Add photo placeholder or actual photo
                    photo_size = Inches(1.2)
                    photo_left = member_left + (member_width - photo_size) / 2
                    
                    if member.get('photo'):
                        # Try to add actual photo
                        if not self._add_image_with_error_handling(
                            slide, member['photo'], 
                            photo_left, member_top, photo_size, photo_size
                        ):
                            # Fallback to placeholder
                            self._add_photo_placeholder(slide, photo_left, member_top, photo_size)
                    else:
                        # Add placeholder circle
                        self._add_photo_placeholder(slide, photo_left, member_top, photo_size)
                    
                    # Add name
                    name_top = member_top + photo_size + Inches(0.1)
                    name_box = slide.shapes.add_textbox(
                        member_left, name_top, member_width, Inches(0.4)
                    )
                    self._set_text_with_formatting(
                        name_box.text_frame, member.get('name', ''),
                        PresentationConstants.FONT_CAPTION, bold=True,
                        alignment=PP_ALIGN.CENTER
                    )
                    name_box.text_frame.word_wrap = True
                    
                    # Add role
                    role_top = name_top + Inches(0.4)
                    role_box = slide.shapes.add_textbox(
                        member_left, role_top, member_width, Inches(0.4)
                    )
                    self._set_text_with_formatting(
                        role_box.text_frame, member.get('role', ''),
                        PresentationConstants.FONT_SMALL,
                        alignment=PP_ALIGN.CENTER
                    )
                    role_box.text_frame.word_wrap = True
                    
        except Exception as e:
            logger.error(f"Error creating team slide: {e}")
            raise
    
    def _add_photo_placeholder(self, slide, left: float, top: float, size: float) -> None:
        """Add a circular photo placeholder."""
        shape = slide.shapes.add_shape(MSO_SHAPE.OVAL, left, top, size, size)
        shape.fill.solid()
        shape.fill.fore_color.rgb = RGBColor(200, 200, 200)
        shape.line.color.rgb = self._get_color(self.theme.get('primary_color', '#2C3E50'))
        shape.line.width = Pt(2)

    def generate_presentation(self, output_path: str) -> None:
        """
        Generate the complete presentation and save to file.

        Args:
            output_path (str): Path where the presentation should be saved
        """
        try:
            logger.info("Starting presentation generation...")

            slides = self.json_data.get('slides', [])

            # Create iterator with or without progress bar
            if self.show_progress:
                slide_iterator = tqdm(enumerate(slides, 1), total=len(slides), desc="Generating slides")
            else:
                slide_iterator = enumerate(slides, 1)

            # Process each slide
            for i, slide_data in slide_iterator:
                slide_type = slide_data.get('slide_type')
                if not self.show_progress:
                    logger.info(f"Processing slide {i}: {slide_type}")

                # Route to appropriate slide creation method
                slide_creators = {
                    'title_slide': self._add_title_slide,
                    'section_header': self._add_section_header,
                    'content_single': lambda x: self._add_content_slide(x, columns=1),
                    'content_two_column': lambda x: self._add_content_slide(x, columns=2),
                    'content_three_column': lambda x: self._add_content_slide(x, columns=3),
                    'bullet_points': self._add_bullet_points,
                    'numbered_list': self._add_numbered_list,
                    'text_image_left': lambda x: self._add_text_image_slide(x, 'left'),
                    'text_image_right': lambda x: self._add_text_image_slide(x, 'right'),
                    'image_full': self._add_image_full,
                    'quote_slide': self._add_quote_slide,
                    'chart_slide': self._add_chart_slide,
                    'data_table': self._add_data_table,
                    'timeline': self._add_timeline,
                    'contact_slide': self._add_contact_slide,
                    'process_flow': self._add_process_flow,
                    'comparison_table': self._add_comparison_table,
                    'icon_points': self._add_icon_points,
                    'team_slide': self._add_team_slide,
                    'thank_you': self._add_thank_you,
                }
                
                creator = slide_creators.get(slide_type)
                if creator:
                    try:
                        creator(slide_data)
                        
                        # Add speaker notes if present
                        if slide_data.get('speaker_notes'):
                            current_slide = self.prs.slides[-1]
                            self._add_speaker_notes(current_slide, slide_data['speaker_notes'])
                            
                    except Exception as e:
                        logger.error(f"Error creating slide {i} ({slide_type}): {e}")
                        # Continue with next slide instead of failing completely
                        continue
                else:
                    logger.warning(f"Unknown slide type: {slide_type}")
            
            # Save presentation
            self.prs.save(output_path)
            logger.info(f"Presentation saved successfully to: {output_path}")
            
        except Exception as e:
            logger.error(f"Error generating presentation: {e}")
            raise


def validate_json(json_path: str, config: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validate JSON without generating presentation.

    Args:
        json_path (str): Path to JSON file
        config (Dict[str, Any]): Configuration dictionary

    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Validate against schema
        if HAS_JSONSCHEMA and PresentationValidator.validate(data):
            return True, None
        elif not HAS_JSONSCHEMA:
            # Basic validation without schema
            if 'slides' not in data:
                return False, "Missing 'slides' key in JSON"
            if not isinstance(data['slides'], list):
                return False, "'slides' must be an array"
            if len(data['slides']) == 0:
                return False, "No slides found in JSON"
            return True, None
        else:
            return False, "JSON validation failed"

    except json.JSONDecodeError as e:
        return False, f"Invalid JSON format: {e}"
    except FileNotFoundError:
        return False, f"File not found: {json_path}"
    except Exception as e:
        return False, f"Validation error: {e}"


def process_single_file(input_path: str, output_path: str, config: Dict[str, Any],
                       show_progress: bool = True, validate_only: bool = False) -> bool:
    """
    Process a single JSON file to PPTX.

    Args:
        input_path (str): Input JSON file path
        output_path (str): Output PPTX file path
        config (Dict[str, Any]): Configuration dictionary
        show_progress (bool): Show progress bars
        validate_only (bool): Only validate, don't generate

    Returns:
        bool: Success status
    """
    try:
        # Validate JSON
        is_valid, error_msg = validate_json(input_path, config)

        if not is_valid:
            logger.error(f"Validation failed for {input_path}: {error_msg}")
            print(f"✗ {input_path}: {error_msg}")
            return False

        if validate_only:
            print(f"✓ {input_path}: Valid")
            return True

        # Check if output file exists
        if os.path.exists(output_path) and not config.get('output', {}).get('overwrite', False):
            logger.warning(f"Output file exists: {output_path}. Use --overwrite to replace.")
            print(f"⚠ {output_path} already exists. Use --overwrite to replace.")
            return False

        # Generate presentation
        generator = EnhancedPresentationGenerator(input_path, show_progress=show_progress)
        generator.generate_presentation(output_path)
        print(f"✓ {output_path}")
        return True

    except Exception as e:
        logger.error(f"Error processing {input_path}: {e}")
        print(f"✗ {input_path}: {e}")
        return False


def process_batch(pattern: str, output_dir: str, config: Dict[str, Any],
                 show_progress: bool = True, validate_only: bool = False) -> Dict[str, int]:
    """
    Process multiple JSON files matching a pattern.

    Args:
        pattern (str): File glob pattern (e.g., "*.json")
        output_dir (str): Output directory for PPTX files
        config (Dict[str, Any]): Configuration dictionary
        show_progress (bool): Show progress bars
        validate_only (bool): Only validate, don't generate

    Returns:
        Dict[str, int]: Statistics (success, failed counts)
    """
    # Find matching files
    files = file_glob.glob(pattern)

    if not files:
        logger.error(f"No files found matching pattern: {pattern}")
        print(f"✗ No files found matching: {pattern}")
        return {'success': 0, 'failed': 0}

    # Create output directory if needed
    if not validate_only and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    stats = {'success': 0, 'failed': 0}

    # Process files with optional progress bar
    file_iterator = tqdm(files, desc="Processing files") if show_progress and HAS_TQDM else files

    for input_path in file_iterator:
        if not validate_only:
            # Generate output filename
            base_name = os.path.splitext(os.path.basename(input_path))[0]
            output_path = os.path.join(output_dir, f"{base_name}.pptx")
        else:
            output_path = None

        # Process file (without individual progress bars to avoid clutter)
        success = process_single_file(
            input_path, output_path, config,
            show_progress=False, validate_only=validate_only
        )

        if success:
            stats['success'] += 1
        else:
            stats['failed'] += 1

    return stats


def main():
    """Main function with full argument parsing support."""
    parser = argparse.ArgumentParser(
        description='Enhanced PowerPoint Generator - Convert JSON to PPTX',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate single presentation
  %(prog)s input.json output.pptx

  # Validate JSON without generating
  %(prog)s input.json --validate

  # Batch process multiple files
  %(prog)s --batch "presentations/*.json" --output-dir ./output

  # Use custom config and structured logging
  %(prog)s input.json output.pptx --config my-config.yml --log-format json

  # Disable progress bars
  %(prog)s input.json output.pptx --no-progress
        """
    )

    # Positional arguments
    parser.add_argument('input', nargs='?', help='Input JSON file or glob pattern (for batch mode)')
    parser.add_argument('output', nargs='?', help='Output PPTX file (not used in batch mode)')

    # Optional arguments
    parser.add_argument('--validate', action='store_true',
                       help='Validate JSON without generating presentation')
    parser.add_argument('--batch', action='store_true',
                       help='Batch mode: process multiple files matching input pattern')
    parser.add_argument('--output-dir', default='.',
                       help='Output directory for batch mode (default: current directory)')
    parser.add_argument('--config', metavar='PATH',
                       help='Path to configuration file (.json2pptx.yml)')
    parser.add_argument('--log-format', choices=['standard', 'json'], default='standard',
                       help='Log output format (default: standard)')
    parser.add_argument('--no-progress', action='store_true',
                       help='Disable progress bars')
    parser.add_argument('--overwrite', action='store_true',
                       help='Overwrite existing output files')
    parser.add_argument('--version', action='version', version='json2pptx 2.0.0')

    args = parser.parse_args()

    # Load configuration
    config = ConfigLoader.load(args.config)

    # Override config with command-line arguments
    if args.overwrite:
        config['output']['overwrite'] = True
    if args.log_format:
        config['logging']['format'] = args.log_format

    # Configure logging
    global logger
    logger = StructuredLogger(__name__, log_format=config['logging']['format'])

    # Determine mode and validate arguments
    if args.batch:
        # Batch mode
        if not args.input:
            parser.error("Input pattern required for batch mode")

        logger.info("Running in batch mode", pattern=args.input)
        stats = process_batch(
            args.input, args.output_dir, config,
            show_progress=not args.no_progress,
            validate_only=args.validate
        )

        print(f"\nBatch processing complete:")
        print(f"  Success: {stats['success']}")
        print(f"  Failed:  {stats['failed']}")
        sys.exit(0 if stats['failed'] == 0 else 1)

    else:
        # Single file mode
        if not args.input:
            parser.print_help()
            sys.exit(1)

        if not args.validate and not args.output:
            parser.error("Output file required (or use --validate)")

        logger.info("Processing single file", input=args.input)
        success = process_single_file(
            args.input, args.output, config,
            show_progress=not args.no_progress,
            validate_only=args.validate
        )

        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()