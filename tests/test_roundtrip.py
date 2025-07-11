"""
Round-trip testing for PPTX Generator and Reader.

Tests the complete workflow: JSON → PPTX → JSON → PPTX
"""

import pytest
import json
import sys
from pathlib import Path
from typing import Dict, Any
import tempfile
import os

# Import our modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from pptx import Presentation


class TestRoundTripConversion:
    """Test complete round-trip conversion for all templates."""
    
    @pytest.mark.roundtrip
    @pytest.mark.parametrize("template_name", [
        "test",
        "test_corporate", 
        "test_education",
        "test_improved_business",
        "test_improved_tech"
    ])
    def test_full_roundtrip_conversion(self, template_name: str, test_json_files: Dict[str, Path], 
                                     temp_dir: Path, test_helpers):
        """Test complete round-trip conversion for each template."""
        
        # Step 1: Load original JSON
        original_json_path = test_json_files[template_name]
        with open(original_json_path, 'r', encoding='utf-8') as f:
            original_data = json.load(f)
        
        assert test_helpers.validate_json_structure(original_data), f"Invalid JSON structure in {template_name}"
        
        # Step 2: Generate PPTX from original JSON
        pptx_path_1 = temp_dir / f"{template_name}_step1.pptx"
        success = self._generate_pptx(original_json_path, pptx_path_1)
        assert success, f"Failed to generate PPTX from {template_name}"
        assert test_helpers.validate_pptx_file(pptx_path_1), f"Invalid PPTX generated from {template_name}"
        
        # Step 3: Convert PPTX back to JSON
        json_path_2 = temp_dir / f"{template_name}_step2.json"
        success = self._read_pptx(pptx_path_1, json_path_2)
        assert success, f"Failed to read PPTX back to JSON for {template_name}"
        
        with open(json_path_2, 'r', encoding='utf-8') as f:
            intermediate_data = json.load(f)
        
        assert test_helpers.validate_json_structure(intermediate_data), f"Invalid JSON structure after reading {template_name}"
        
        # Step 4: Generate PPTX from converted JSON
        pptx_path_2 = temp_dir / f"{template_name}_step3.pptx"
        success = self._generate_pptx(json_path_2, pptx_path_2)
        assert success, f"Failed to generate final PPTX for {template_name}"
        assert test_helpers.validate_pptx_file(pptx_path_2), f"Invalid final PPTX for {template_name}"
        
        # Step 5: Validate round-trip integrity
        self._validate_roundtrip_integrity(original_data, intermediate_data, template_name)
        
        # Step 6: Compare slide counts
        original_slides = len(original_data.get("slides", []))
        intermediate_slides = len(intermediate_data.get("slides", []))
        
        assert original_slides == intermediate_slides, \
            f"Slide count mismatch for {template_name}: {original_slides} → {intermediate_slides}"
    
    def _generate_pptx(self, json_path: Path, output_path: Path) -> bool:
        """Generate PPTX using the generator script."""
        try:
            import subprocess
            import sys
            
            # Use the virtual environment python
            python_exe = sys.executable
            script_path = Path(__file__).parent.parent / "pptx-generator.py"
            
            result = subprocess.run([
                python_exe, str(script_path), str(json_path), str(output_path)
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
            
            return result.returncode == 0 and output_path.exists()
        except Exception:
            return False
    
    def _read_pptx(self, pptx_path: Path, output_path: Path) -> bool:
        """Read PPTX using the reader script."""
        try:
            import subprocess
            import sys
            
            python_exe = sys.executable
            script_path = Path(__file__).parent.parent / "pptx-reader.py"
            
            result = subprocess.run([
                python_exe, str(script_path), str(pptx_path), str(output_path)
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
            
            return result.returncode == 0 and output_path.exists()
        except Exception:
            return False
    
    def _validate_roundtrip_integrity(self, original: Dict[str, Any], 
                                    converted: Dict[str, Any], template_name: str):
        """Validate that essential data is preserved in round-trip."""
        
        # Check slide count
        assert len(original["slides"]) == len(converted["slides"]), \
            f"Slide count changed for {template_name}"
        
        # Check slide types are detected correctly (some variance expected)
        original_types = [slide["slide_type"] for slide in original["slides"]]
        converted_types = [slide["slide_type"] for slide in converted["slides"]]
        
        # At least 70% of slide types should be detected correctly
        correct_types = sum(1 for o, c in zip(original_types, converted_types) if o == c)
        accuracy = correct_types / len(original_types)
        
        assert accuracy >= 0.7, \
            f"Slide type detection accuracy too low for {template_name}: {accuracy:.2%}"
        
        # Check that all slides have required fields
        for i, slide in enumerate(converted["slides"]):
            assert "slide_number" in slide, f"Missing slide_number in slide {i+1} of {template_name}"
            assert "slide_type" in slide, f"Missing slide_type in slide {i+1} of {template_name}"
            assert "content" in slide, f"Missing content in slide {i+1} of {template_name}"


class TestSlideTypeDetection:
    """Test slide type detection accuracy."""
    
    @pytest.mark.reader
    def test_slide_type_detection_accuracy(self, test_json_files: Dict[str, Path], temp_dir: Path):
        """Test that slide types are detected with reasonable accuracy."""
        
        for template_name, json_path in test_json_files.items():
            with open(json_path, 'r', encoding='utf-8') as f:
                original_data = json.load(f)
            
            # Generate PPTX
            pptx_path = temp_dir / f"{template_name}_detection.pptx"
            assert self._generate_pptx(json_path, pptx_path)
            
            # Read back
            json_path_out = temp_dir / f"{template_name}_detection.json"
            assert self._read_pptx(pptx_path, json_path_out)
            
            with open(json_path_out, 'r', encoding='utf-8') as f:
                detected_data = json.load(f)
            
            # Check detection accuracy
            original_types = [slide["slide_type"] for slide in original_data["slides"]]
            detected_types = [slide["slide_type"] for slide in detected_data["slides"]]
            
            correct = sum(1 for o, d in zip(original_types, detected_types) if o == d)
            accuracy = correct / len(original_types)
            
            print(f"\n{template_name} slide type accuracy: {accuracy:.1%} ({correct}/{len(original_types)})")
            
            # Log mismatches for debugging
            for i, (orig, det) in enumerate(zip(original_types, detected_types)):
                if orig != det:
                    print(f"  Slide {i+1}: {orig} → {det}")
    
    def _generate_pptx(self, json_path: Path, output_path: Path) -> bool:
        """Generate PPTX using the generator script."""
        try:
            import subprocess
            import sys
            
            python_exe = sys.executable
            script_path = Path(__file__).parent.parent / "pptx-generator.py"
            
            result = subprocess.run([
                python_exe, str(script_path), str(json_path), str(output_path)
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
            
            return result.returncode == 0 and output_path.exists()
        except Exception:
            return False
    
    def _read_pptx(self, pptx_path: Path, output_path: Path) -> bool:
        """Read PPTX using the reader script."""
        try:
            import subprocess
            import sys
            
            python_exe = sys.executable
            script_path = Path(__file__).parent.parent / "pptx-reader.py"
            
            result = subprocess.run([
                python_exe, str(script_path), str(pptx_path), str(output_path)
            ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
            
            return result.returncode == 0 and output_path.exists()
        except Exception:
            return False


class TestDataPreservation:
    """Test that important data is preserved through round-trip."""
    
    @pytest.mark.roundtrip
    def test_content_preservation(self, test_json_files: Dict[str, Path], temp_dir: Path):
        """Test that content is preserved through round-trip conversion."""
        
        for template_name, json_path in test_json_files.items():
            with open(json_path, 'r', encoding='utf-8') as f:
                original_data = json.load(f)
            
            # Generate and read back
            pptx_path = temp_dir / f"{template_name}_content.pptx"
            json_out_path = temp_dir / f"{template_name}_content.json"
            
            # Do conversion
            from subprocess import run
            import sys
            
            python_exe = sys.executable
            gen_script = Path(__file__).parent.parent / "pptx-generator.py"
            read_script = Path(__file__).parent.parent / "pptx-reader.py"
            
            run([python_exe, str(gen_script), str(json_path), str(pptx_path)], 
                cwd=Path(__file__).parent.parent)
            run([python_exe, str(read_script), str(pptx_path), str(json_out_path)], 
                cwd=Path(__file__).parent.parent)
            
            with open(json_out_path, 'r', encoding='utf-8') as f:
                converted_data = json.load(f)
            
            # Test specific content preservation
            self._check_title_preservation(original_data, converted_data, template_name)
            self._check_chart_data_structure(original_data, converted_data, template_name)
            self._check_table_data_structure(original_data, converted_data, template_name)
    
    def _check_title_preservation(self, original: Dict[str, Any], 
                                converted: Dict[str, Any], template_name: str):
        """Check that slide titles are preserved."""
        orig_titles = []
        conv_titles = []
        
        for slide in original["slides"]:
            if slide["slide_type"] == "title_slide":
                orig_titles.append(slide["content"].get("title", ""))
            else:
                orig_titles.append(slide.get("title", slide["content"].get("title", "")))
        
        for slide in converted["slides"]:
            if slide["slide_type"] == "title_slide":
                conv_titles.append(slide["content"].get("title", ""))
            else:
                conv_titles.append(slide.get("title", ""))
        
        # At least 80% of titles should match or be similar
        matches = 0
        for orig, conv in zip(orig_titles, conv_titles):
            if orig and conv and (orig.lower() in conv.lower() or conv.lower() in orig.lower()):
                matches += 1
        
        if orig_titles:
            accuracy = matches / len(orig_titles)
            assert accuracy >= 0.8, f"Title preservation too low for {template_name}: {accuracy:.1%}"
    
    def _check_chart_data_structure(self, original: Dict[str, Any], 
                                  converted: Dict[str, Any], template_name: str):
        """Check that chart data structures are maintained."""
        orig_charts = [s for s in original["slides"] if s["slide_type"] == "chart_slide"]
        conv_charts = [s for s in converted["slides"] if s["slide_type"] == "chart_slide"]
        
        assert len(orig_charts) == len(conv_charts), \
            f"Chart slide count mismatch for {template_name}"
        
        for orig_chart, conv_chart in zip(orig_charts, conv_charts):
            assert "chart_data" in conv_chart["content"], \
                f"Missing chart_data in converted chart for {template_name}"
    
    def _check_table_data_structure(self, original: Dict[str, Any], 
                                  converted: Dict[str, Any], template_name: str):
        """Check that table data structures are maintained."""
        orig_tables = [s for s in original["slides"] if s["slide_type"] in ["data_table", "comparison_table"]]
        conv_tables = [s for s in converted["slides"] if s["slide_type"] in ["data_table", "comparison_table"]]
        
        # Allow some variance in table detection
        assert abs(len(orig_tables) - len(conv_tables)) <= 2, \
            f"Table slide count too different for {template_name}: {len(orig_tables)} vs {len(conv_tables)}"