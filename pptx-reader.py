#!/usr/bin/env python3
"""
PowerPoint to JSON Converter
============================

A script for converting PowerPoint presentations back to JSON format.
Designed to work as the reverse of pptx-generator.py.

Requirements:
    - python-pptx>=1.0.0

Usage:
    python pptx-reader.py input.pptx output.json
"""

import json
import sys
import os
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path

from pptx import Presentation
from pptx.enum.text import PP_ALIGN
from pptx.enum.chart import XL_CHART_TYPE
from pptx.enum.shapes import MSO_SHAPE_TYPE

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class PresentationReader:
    """Converts PowerPoint presentations to JSON format."""
    
    def __init__(self):
        self.slide_counter = 0
    
    def _extract_presentation_metadata(self, prs) -> Dict[str, Any]:
        """Extract presentation metadata."""
        try:
            # Try to extract title from first slide or core properties
            title = "Extracted Presentation"
            author = "PPTX Reader"
            date = ""
            
            # Get title from first slide if it's a title slide
            if prs.slides:
                first_slide = prs.slides[0]
                if first_slide.shapes.title:
                    title = first_slide.shapes.title.text.strip()
            
            # Try to get metadata from core properties
            if hasattr(prs, 'core_properties'):
                if prs.core_properties.title:
                    title = prs.core_properties.title
                if prs.core_properties.author:
                    author = prs.core_properties.author
                if prs.core_properties.created:
                    date = prs.core_properties.created.strftime("%Y-%m-%d")
            
            return {
                "title": title,
                "author": author,
                "date": date,
                "theme": {
                    "primary_color": "#1a237e",
                    "secondary_color": "#3f51b5",
                    "accent_color": "#ff5722",
                    "background_color": "#fafafa",
                    "text_color": "#212121",
                    "font_family": "Segoe UI"
                }
            }
        except Exception as e:
            logger.debug(f"Error extracting metadata: {e}")
            return {
                "title": "Extracted Presentation",
                "author": "PPTX Reader",
                "date": "",
                "theme": {
                    "primary_color": "#2C3E50",
                    "secondary_color": "#3498DB",
                    "accent_color": "#E74C3C"
                }
            }
    
    def read_presentation(self, pptx_path: str) -> Dict[str, Any]:
        """Read a PowerPoint presentation and convert to JSON format."""
        try:
            prs = Presentation(pptx_path)
            
            # Extract presentation metadata
            presentation_data = {
                "presentation_metadata": self._extract_presentation_metadata(prs),
                "slides": []
            }
            
            # Process each slide
            for slide_num, slide in enumerate(prs.slides, 1):
                logger.info(f"Processing slide {slide_num}")
                slide_data = self._extract_slide_data(slide, slide_num, is_first=slide_num==1)
                if slide_data:
                    presentation_data["slides"].append(slide_data)
            
            return presentation_data
            
        except Exception as e:
            logger.error(f"Error reading presentation: {e}")
            raise
    
    def _extract_slide_data(self, slide, slide_num: int, is_first: bool = False) -> Optional[Dict[str, Any]]:
        """Extract data from a single slide."""
        try:
            # Analyze slide content to determine type
            slide_type = self._determine_slide_type(slide, is_first)
            
            slide_data = {
                "slide_number": slide_num,
                "slide_type": slide_type,
                "content": self._extract_content_by_type(slide, slide_type)
            }
            
            # Add title if not a title slide (title slides handle title in content)
            if slide_type not in ["title_slide"]:
                slide_data["title"] = self._extract_title(slide)
            
            # Add background image if present
            background_image = self._extract_background_image(slide)
            if background_image:
                slide_data["background_image"] = background_image
            
            # Extract speaker notes if available
            speaker_notes = self._extract_speaker_notes(slide)
            if speaker_notes:
                slide_data["speaker_notes"] = speaker_notes
            
            # Add transition and duration (defaults since they're not in PPTX metadata easily)
            slide_data["transition"] = "fade" if slide_num == 1 else "slide"
            slide_data["duration"] = 30 if slide_type == "title_slide" else 15
            
            return slide_data
            
        except Exception as e:
            logger.error(f"Error extracting slide {slide_num}: {e}")
            return None
    
    def _determine_slide_type(self, slide, is_first: bool = False) -> str:
        """Determine the slide type based on content analysis."""
        shapes = list(slide.shapes)
        
        # Count different types of content
        text_boxes = 0
        charts = 0
        tables = 0
        images = 0
        text_shapes_with_content = []
        
        for shape in shapes:
            if shape.shape_type == MSO_SHAPE_TYPE.TEXT_BOX:
                text_boxes += 1
            elif shape.shape_type == MSO_SHAPE_TYPE.CHART:
                charts += 1
            elif shape.shape_type == MSO_SHAPE_TYPE.TABLE:
                tables += 1
            elif shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                images += 1
            
            # Collect text shapes with content
            if hasattr(shape, 'text_frame') and shape.text_frame.text.strip():
                text_shapes_with_content.append(shape.text_frame.text.strip())
        
        # Check for specific slide types first
        if charts > 0:
            return "chart_slide"
        elif tables > 0:
            return "data_table" if "comparison" not in self._extract_title(slide).lower() else "comparison_table"
        elif images > 0 and text_boxes >= 1:
            return "text_image_left"  # Default to left layout
        elif images > 0:
            return "image_full"
        elif self._has_numbered_list(slide):
            return "numbered_list"
        elif self._has_bullet_points(slide):
            return "bullet_points"
        elif text_boxes >= 3:
            return "content_three_column"
        elif text_boxes == 2:
            return "content_two_column"
        
        # Distinguish between title_slide and section_header
        elif is_first:
            return "title_slide"
        elif self._is_section_header(slide):
            return "section_header"
        elif self._is_title_slide(slide):
            return "title_slide"
        else:
            return "bullet_points"  # Default fallback
    
    def _extract_title(self, slide) -> str:
        """Extract the title from a slide."""
        try:
            if slide.shapes.title:
                return slide.shapes.title.text.strip()
        except:
            pass
        
        # Fallback: look for the first text shape
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame') and shape.text_frame.text.strip():
                text = shape.text_frame.text.strip()
                if len(text) < 100:  # Likely a title
                    return text
        
        return ""
    
    def _extract_content_by_type(self, slide, slide_type: str) -> Dict[str, Any]:
        """Extract content based on slide type."""
        content = {}
        
        if slide_type == "chart_slide":
            content = self._extract_chart_content(slide)
        elif slide_type == "data_table":
            content = self._extract_table_content(slide)
        elif slide_type in ["text_image_left", "text_image_right"]:
            content = self._extract_text_image_content(slide)
        elif slide_type == "bullet_points":
            content = self._extract_bullet_points(slide)
        elif slide_type == "numbered_list":
            content = self._extract_numbered_list(slide)
        elif slide_type in ["content_two_column", "content_three_column"]:
            content = self._extract_multi_column_content(slide, slide_type)
        elif slide_type == "title_slide":
            content = self._extract_title_slide_content(slide)
        elif slide_type == "section_header":
            content = self._extract_section_header_content(slide)
        else:
            # Generic content extraction
            content = self._extract_generic_content(slide)
        
        return content
    
    def _extract_chart_content(self, slide) -> Dict[str, Any]:
        """Extract chart data from slide."""
        content = {"chart_type": "bar", "chart_data": {"labels": [], "datasets": []}}
        
        for shape in slide.shapes:
            if shape.shape_type == MSO_SHAPE_TYPE.CHART:
                chart = shape.chart
                
                # Determine chart type
                if chart.chart_type == XL_CHART_TYPE.PIE:
                    content["chart_type"] = "pie"
                elif chart.chart_type == XL_CHART_TYPE.LINE:
                    content["chart_type"] = "line"
                elif chart.chart_type == XL_CHART_TYPE.AREA:
                    content["chart_type"] = "area"
                else:
                    content["chart_type"] = "bar"
                
                # Extract chart data
                try:
                    if hasattr(chart, 'chart_data'):
                        chart_data = chart.chart_data
                        
                        # Extract categories/labels
                        if hasattr(chart_data, 'categories'):
                            content["chart_data"]["labels"] = list(chart_data.categories)
                        
                        # Extract series data
                        if hasattr(chart_data, 'series'):
                            for series in chart_data.series:
                                dataset = {
                                    "name": series.name if hasattr(series, 'name') else f"Series {len(content['chart_data']['datasets']) + 1}",
                                    "values": list(series.values) if hasattr(series, 'values') else []
                                }
                                content["chart_data"]["datasets"].append(dataset)
                    
                    # Fallback: try to extract from chart plots
                    elif hasattr(chart, 'plots') and chart.plots:
                        plot = chart.plots[0]
                        if hasattr(plot, 'categories'):
                            content["chart_data"]["labels"] = [cat.label for cat in plot.categories]
                        
                        if hasattr(plot, 'series'):
                            for i, series in enumerate(plot.series):
                                dataset = {
                                    "name": f"Series {i + 1}",
                                    "values": []
                                }
                                if hasattr(series, 'values'):
                                    dataset["values"] = list(series.values)
                                content["chart_data"]["datasets"].append(dataset)
                        
                except Exception as e:
                    logger.debug(f"Could not extract chart data: {e}")
                    # Create placeholder data
                    content["chart_data"]["labels"] = ["Category 1", "Category 2", "Category 3"]
                    content["chart_data"]["datasets"] = [{
                        "name": "Data Series",
                        "values": [10, 20, 15]
                    }]
                
                break
        
        return content
    
    def _extract_table_content(self, slide) -> Dict[str, Any]:
        """Extract table data from slide."""
        content = {"headers": [], "rows": []}
        
        for shape in slide.shapes:
            if shape.shape_type == MSO_SHAPE_TYPE.TABLE:
                table = shape.table
                
                # Extract headers (first row)
                if table.rows:
                    headers = []
                    for cell in table.rows[0].cells:
                        headers.append(cell.text.strip())
                    content["headers"] = headers
                
                # Extract data rows
                rows = []
                try:
                    for i in range(1, len(table.rows)):  # Skip header row
                        row = table.rows[i]
                        row_data = []
                        for cell in row.cells:
                            row_data.append(cell.text.strip())
                        rows.append(row_data)
                    content["rows"] = rows
                except Exception as e:
                    logger.debug(f"Error extracting table rows: {e}")
                    content["rows"] = []
                
                break
        
        return content
    
    def _extract_text_image_content(self, slide) -> Dict[str, Any]:
        """Extract text and image content."""
        content = {"text": "", "image_path": ""}
        
        text_content = []
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame') and shape.text_frame.text.strip():
                text = shape.text_frame.text.strip()
                if not self._is_title_text(text):
                    text_content.append(text)
            elif shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                content["image_path"] = "extracted_image.png"  # Placeholder
        
        content["text"] = "\n".join(text_content)
        return content
    
    def _extract_bullet_points(self, slide) -> Dict[str, Any]:
        """Extract bullet point content with hierarchy."""
        content = {"points": []}
        
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame'):
                text_frame = shape.text_frame
                if text_frame.text.strip() and not self._is_title_text(text_frame.text):
                    # Process paragraphs to extract hierarchy
                    for paragraph in text_frame.paragraphs:
                        text = paragraph.text.strip()
                        if text:
                            # Determine hierarchy level based on indentation
                            level = 0
                            if hasattr(paragraph, 'level'):
                                level = paragraph.level
                            elif text.startswith('  '):  # Manual indentation detection
                                level = 1
                            
                            # Remove bullet characters
                            clean_text = text.lstrip('•-* ').strip()
                            
                            point_data = {"text": clean_text, "level": level}
                            
                            # Avoid duplicates
                            if point_data not in content["points"]:
                                content["points"].append(point_data)
        
        return content
    
    def _extract_numbered_list(self, slide) -> Dict[str, Any]:
        """Extract numbered list content with hierarchy."""
        content = {"items": []}
        
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame'):
                text_frame = shape.text_frame
                full_text = text_frame.text.strip()
                if full_text and not self._is_title_text(full_text):
                    # Split by lines and process each potential list item
                    import re
                    lines = full_text.split('\n')
                    
                    for line in lines:
                        line = line.strip()
                        if line:
                            # Determine level based on indentation
                            level = 0
                            if line.startswith('  '):
                                level = 1
                            
                            # Remove number prefix and clean up
                            clean_line = re.sub(r'^\d+\.\s*', '', line)
                            clean_line = clean_line.lstrip('•-* ').strip()
                            
                            if clean_line:
                                item_data = {"text": clean_line, "level": level}
                                # Avoid duplicates
                                if item_data not in content["items"]:
                                    content["items"].append(item_data)
        
        return content
    
    def _extract_multi_column_content(self, slide, slide_type: str) -> Dict[str, Any]:
        """Extract multi-column content."""
        num_columns = 3 if slide_type == "content_three_column" else 2
        content = {"columns": [{"title": "", "content": ""} for _ in range(num_columns)]}
        
        text_shapes = []
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame') and shape.text_frame.text.strip():
                if not self._is_title_text(shape.text_frame.text):
                    text_shapes.append(shape)
        
        # Sort by position (left to right)
        try:
            text_shapes.sort(key=lambda x: x.left)
        except Exception as e:
            logger.debug(f"Could not sort shapes by position: {e}")
        
        for i, shape in enumerate(text_shapes[:num_columns]):
            if i < len(content["columns"]):
                text_lines = shape.text_frame.text.strip().split('\n')
                if text_lines:
                    content["columns"][i]["title"] = text_lines[0]
                    content["columns"][i]["content"] = '\n'.join(text_lines[1:])
        
        return content
    
    def _extract_title_slide_content(self, slide) -> Dict[str, Any]:
        """Extract title slide content with proper structure."""
        content = {
            "title": self._extract_title(slide),
            "subtitle": "",
            "author": "",
            "date": ""
        }
        
        text_shapes = []
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame') and shape.text_frame.text.strip():
                text = shape.text_frame.text.strip()
                if text != content["title"]:
                    text_shapes.append(text)
        
        # Parse text shapes to extract subtitle, author, date
        for i, text in enumerate(text_shapes):
            lines = text.split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Detect patterns
                if not content["subtitle"] and len(line) > 20 and len(line) < 100:
                    content["subtitle"] = line
                elif not content["author"] and any(title in line.lower() for title in ['dr.', 'prof.', 'cto', 'ceo', 'officer', 'director']):
                    content["author"] = line
                elif not content["date"] and any(month in line.lower() for month in ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', '2024', '2025']):
                    content["date"] = line
                elif not content["author"] and not content["date"]:
                    # If no clear patterns, use order: subtitle, author, date
                    if not content["subtitle"]:
                        content["subtitle"] = line
                    elif not content["author"]:
                        content["author"] = line
                    elif not content["date"]:
                        content["date"] = line
        
        return content
    
    def _extract_section_header_content(self, slide) -> Dict[str, Any]:
        """Extract section header content."""
        content = {
            "title": self._extract_title(slide),
            "subtitle": ""
        }
        
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame'):
                text = shape.text_frame.text.strip()
                if text and text != content["title"] and not content["subtitle"]:
                    content["subtitle"] = text
                    break
        
        return content
    
    def _extract_generic_content(self, slide) -> Dict[str, Any]:
        """Extract generic content from slide."""
        content = {"text": ""}
        
        text_content = []
        title = self._extract_title(slide)
        
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame'):
                text = shape.text_frame.text.strip()
                if text and text != title:
                    text_content.append(text)
        
        content["text"] = "\n".join(text_content)
        return content
    
    def _extract_background_image(self, slide) -> str:
        """Extract background image if present."""
        # This is complex to implement fully - would need to check slide background
        # For now, return empty string
        return ""
    
    def _extract_speaker_notes(self, slide) -> str:
        """Extract speaker notes from slide."""
        try:
            if hasattr(slide, 'notes_slide') and slide.notes_slide:
                notes_slide = slide.notes_slide
                if hasattr(notes_slide, 'notes_text_frame') and notes_slide.notes_text_frame:
                    return notes_slide.notes_text_frame.text.strip()
        except Exception as e:
            logger.debug(f"Could not extract speaker notes: {e}")
        return ""
    
    def _is_title_text(self, text: str) -> bool:
        """Check if text is likely a title."""
        return len(text) < 100 and '\n' not in text
    
    def _has_bullet_points(self, slide) -> bool:
        """Check if slide has bullet points."""
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame'):
                text = shape.text_frame.text
                if '"' in text or text.count('\n') > 2:
                    return True
        return False
    
    def _has_numbered_list(self, slide) -> bool:
        """Check if slide has numbered list."""
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame'):
                text = shape.text_frame.text
                import re
                if re.search(r'^\d+\.', text, re.MULTILINE):
                    return True
        return False
    
    def _is_title_slide(self, slide) -> bool:
        """Check if slide is a title slide."""
        text_shapes = 0
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame') and shape.text_frame.text.strip():
                text_shapes += 1
        
        return text_shapes <= 3  # Title slides typically have few text elements
    
    def _is_first_slide(self, slide) -> bool:
        """Check if this is the first slide in the presentation."""
        # This is a simple heuristic - in practice we'd track slide position
        return False  # Will be set correctly during processing
    
    def _is_section_header(self, slide) -> bool:
        """Check if slide is a section header."""
        text_shapes = 0
        total_text_length = 0
        
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame') and shape.text_frame.text.strip():
                text_shapes += 1
                total_text_length += len(shape.text_frame.text.strip())
        
        # Section headers typically have 1-2 text elements with moderate text
        return text_shapes <= 2 and 10 < total_text_length < 200


def main():
    """Main function to run the PPTX to JSON converter."""
    if len(sys.argv) != 3:
        print("Usage: python pptx-reader.py input.pptx output.json")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not os.path.exists(input_path):
        print(f"Error: Input file '{input_path}' not found.")
        sys.exit(1)
    
    try:
        reader = PresentationReader()
        logger.info(f"Reading presentation from: {input_path}")
        
        presentation_data = reader.read_presentation(input_path)
        
        # Save to JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(presentation_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"JSON saved successfully to: {output_path}")
        print(f" Conversion completed: {output_path}")
        
    except Exception as e:
        logger.error(f"Error during conversion: {e}")
        print(f" Conversion failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()