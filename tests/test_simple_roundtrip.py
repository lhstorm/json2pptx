"""
Simple round-trip tests that focus on end-to-end functionality.
"""

import pytest
import json
import sys
import subprocess
from pathlib import Path
from typing import Dict, Any
import tempfile
import os


class TestSimpleRoundTrip:
    """Simple round-trip tests using subprocess calls."""
    
    @pytest.fixture
    def project_root(self):
        """Return the project root directory."""
        return Path(__file__).parent.parent
    
    @pytest.fixture
    def test_json_files(self, project_root):
        """Get all test JSON files."""
        test_json_dir = project_root / "tests" / "test_json"
        return list(test_json_dir.glob("*.json"))
    
    @pytest.mark.roundtrip
    @pytest.mark.parametrize("json_file", [
        "test.json",
        "test_corporate.json", 
        "test_education.json",
        "test_improved_business.json",
        "test_improved_tech.json"
    ])
    def test_roundtrip_conversion(self, json_file, project_root):
        """Test complete round-trip conversion for each template."""
        
        json_path = project_root / "tests" / "test_json" / json_file
        generator_script = project_root / "pptx-generator.py"
        reader_script = project_root / "pptx-reader.py"
        
        assert json_path.exists(), f"Test file not found: {json_path}"
        assert generator_script.exists(), f"Generator script not found: {generator_script}"
        assert reader_script.exists(), f"Reader script not found: {reader_script}"
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Step 1: JSON → PPTX
            json_name = Path(json_file).stem
            pptx_path_1 = temp_path / f"{json_name}_step1.pptx"
            result1 = subprocess.run([
                sys.executable, str(generator_script), 
                str(json_path), str(pptx_path_1)
            ], capture_output=True, text=True, cwd=project_root)
            
            assert result1.returncode == 0, f"Generator failed for {json_file}: {result1.stderr}"
            assert pptx_path_1.exists(), f"PPTX not generated for {json_file}"
            
            # Step 2: PPTX → JSON
            json_path_2 = temp_path / f"{json_name}_step2.json"
            result2 = subprocess.run([
                sys.executable, str(reader_script),
                str(pptx_path_1), str(json_path_2)
            ], capture_output=True, text=True, cwd=project_root)
            
            assert result2.returncode == 0, f"Reader failed for {json_file}: {result2.stderr}"
            assert json_path_2.exists(), f"JSON not generated for {json_file}"
            
            # Step 3: JSON → PPTX (final)
            pptx_path_2 = temp_path / f"{json_name}_step3.pptx"
            result3 = subprocess.run([
                sys.executable, str(generator_script),
                str(json_path_2), str(pptx_path_2)
            ], capture_output=True, text=True, cwd=project_root)
            
            assert result3.returncode == 0, f"Final generator failed for {json_file}: {result3.stderr}"
            assert pptx_path_2.exists(), f"Final PPTX not generated for {json_file}"
            
            # Validate content
            self._validate_json_structure(json_path, json_path_2, json_file)
    
    def _validate_json_structure(self, original_path: Path, converted_path: Path, filename: str):
        """Validate that the JSON structure is preserved."""
        
        with open(original_path, 'r', encoding='utf-8') as f:
            original = json.load(f)
        
        with open(converted_path, 'r', encoding='utf-8') as f:
            converted = json.load(f)
        
        # Basic structure validation
        assert "presentation_metadata" in converted, f"Missing metadata in {filename}"
        assert "slides" in converted, f"Missing slides in {filename}"
        assert isinstance(converted["slides"], list), f"Slides not a list in {filename}"
        
        # Slide count should match
        original_count = len(original["slides"])
        converted_count = len(converted["slides"])
        assert original_count == converted_count, \
            f"Slide count mismatch in {filename}: {original_count} → {converted_count}"
        
        # Each slide should have basic structure
        for i, slide in enumerate(converted["slides"]):
            assert "slide_number" in slide, f"Missing slide_number in slide {i+1} of {filename}"
            assert "slide_type" in slide, f"Missing slide_type in slide {i+1} of {filename}"
            assert "content" in slide, f"Missing content in slide {i+1} of {filename}"
        
        print(f"✅ {filename}: {original_count} slides processed successfully")


class TestFileValidation:
    """Test that files can be opened and are valid."""
    
    @pytest.fixture
    def project_root(self):
        return Path(__file__).parent.parent
    
    @pytest.mark.unit
    def test_json_files_are_valid(self, project_root):
        """Test that all JSON test files are valid."""
        test_json_dir = project_root / "tests" / "test_json"
        
        for json_file in test_json_dir.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Basic validation
                assert isinstance(data, dict), f"Invalid JSON structure in {json_file.name}"
                assert "slides" in data, f"Missing slides in {json_file.name}"
                assert isinstance(data["slides"], list), f"Slides not a list in {json_file.name}"
                
                print(f"✅ {json_file.name}: Valid JSON with {len(data['slides'])} slides")
                
            except Exception as e:
                pytest.fail(f"Invalid JSON file {json_file.name}: {e}")
    
    @pytest.mark.unit
    def test_scripts_exist(self, project_root):
        """Test that main scripts exist and are executable."""
        scripts = ["pptx-generator.py", "pptx-reader.py"]
        
        for script in scripts:
            script_path = project_root / script
            assert script_path.exists(), f"Script not found: {script}"
            assert script_path.is_file(), f"Script is not a file: {script}"
            
            # Check if script runs with --help (basic syntax check)
            result = subprocess.run([
                sys.executable, str(script_path), "--help"
            ], capture_output=True, text=True, cwd=project_root)
            
            # Scripts should either show help or show usage (exit code 0 or 1)
            assert result.returncode in [0, 1], f"Script has syntax errors: {script}"


class TestQuickValidation:
    """Quick validation tests that run fast."""
    
    @pytest.fixture
    def project_root(self):
        return Path(__file__).parent.parent
    
    @pytest.mark.unit
    def test_single_slide_roundtrip(self, project_root):
        """Test round-trip with a minimal single slide presentation."""
        
        # Create minimal test data
        test_data = {
            "presentation_metadata": {
                "title": "Test",
                "author": "Test",
                "date": "2024-01-01",
                "theme": {
                    "primary_color": "#2C3E50",
                    "secondary_color": "#3498DB",
                    "accent_color": "#E74C3C"
                }
            },
            "slides": [
                {
                    "slide_number": 1,
                    "slide_type": "title_slide",
                    "content": {
                        "title": "Test Title",
                        "subtitle": "Test Subtitle",
                        "author": "Test Author",
                        "date": "2024-01-01"
                    },
                    "speaker_notes": "Test notes",
                    "transition": "fade",
                    "duration": 30
                }
            ]
        }
        
        generator_script = project_root / "pptx-generator.py"
        reader_script = project_root / "pptx-reader.py"
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Save test JSON
            json_input = temp_path / "test_input.json"
            with open(json_input, 'w', encoding='utf-8') as f:
                json.dump(test_data, f, indent=2)
            
            # Generate PPTX
            pptx_output = temp_path / "test_output.pptx"
            result1 = subprocess.run([
                sys.executable, str(generator_script),
                str(json_input), str(pptx_output)
            ], capture_output=True, text=True, cwd=project_root)
            
            assert result1.returncode == 0, f"Generator failed: {result1.stderr}"
            assert pptx_output.exists(), "PPTX not generated"
            
            # Read back to JSON
            json_output = temp_path / "test_output.json"
            result2 = subprocess.run([
                sys.executable, str(reader_script),
                str(pptx_output), str(json_output)
            ], capture_output=True, text=True, cwd=project_root)
            
            assert result2.returncode == 0, f"Reader failed: {result2.stderr}"
            assert json_output.exists(), "JSON not generated"
            
            # Validate output
            with open(json_output, 'r', encoding='utf-8') as f:
                output_data = json.load(f)
            
            assert "slides" in output_data
            assert len(output_data["slides"]) == 1
            assert output_data["slides"][0]["slide_type"] == "title_slide"
            
            print("✅ Single slide round-trip test passed")


if __name__ == "__main__":
    # Run tests directly
    pytest.main([__file__, "-v"])