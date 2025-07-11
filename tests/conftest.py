"""
Pytest configuration and fixtures for PPTX generator/reader testing.
"""

import pytest
import json
import os
import tempfile
from pathlib import Path
from typing import Dict, Any, Generator
import sys

# Add parent directory to path to import our modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from pptx import Presentation


@pytest.fixture(scope="session")
def test_data_dir() -> Path:
    """Return the path to test JSON files."""
    return Path(__file__).parent / "test_json"


@pytest.fixture(scope="session")
def output_dir() -> Path:
    """Return the path to test outputs."""
    output_path = Path(__file__).parent / "outputs"
    output_path.mkdir(exist_ok=True)
    return output_path


@pytest.fixture(scope="function")
def temp_dir() -> Generator[Path, None, None]:
    """Create a temporary directory for test files."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        yield Path(tmp_dir)


@pytest.fixture(scope="session")
def test_json_files(test_data_dir: Path) -> Dict[str, Path]:
    """Load all test JSON files."""
    json_files = {}
    for json_file in test_data_dir.glob("*.json"):
        if json_file.name.startswith("test_"):
            json_files[json_file.stem] = json_file
    return json_files


@pytest.fixture
def sample_presentation_data() -> Dict[str, Any]:
    """Return a minimal valid presentation data structure for testing."""
    return {
        "presentation_metadata": {
            "title": "Test Presentation",
            "author": "Test Author",
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


@pytest.fixture
def all_slide_types() -> list:
    """Return list of all supported slide types."""
    return [
        "title_slide",
        "section_header", 
        "bullet_points",
        "numbered_list",
        "chart_slide",
        "data_table",
        "comparison_table",
        "text_image_left",
        "text_image_right",
        "image_full",
        "content_single",
        "content_two_column",
        "content_three_column",
        "timeline",
        "process_flow",
        "quote_slide",
        "icon_points",
        "team_slide",
        "contact_slide",
        "thank_you"
    ]


@pytest.fixture
def chart_types() -> list:
    """Return list of supported chart types."""
    return ["bar", "line", "pie", "area"]


class TestHelpers:
    """Helper methods for testing."""
    
    @staticmethod
    def validate_json_structure(data: Dict[str, Any]) -> bool:
        """Validate that JSON has required structure."""
        required_keys = ["presentation_metadata", "slides"]
        if not all(key in data for key in required_keys):
            return False
        
        if not isinstance(data["slides"], list):
            return False
            
        for slide in data["slides"]:
            if not isinstance(slide, dict):
                return False
            if "slide_number" not in slide or "slide_type" not in slide:
                return False
                
        return True
    
    @staticmethod
    def validate_pptx_file(file_path: Path) -> bool:
        """Validate that PPTX file can be opened."""
        try:
            prs = Presentation(str(file_path))
            return len(prs.slides) > 0
        except Exception:
            return False
    
    @staticmethod
    def count_slides_by_type(data: Dict[str, Any]) -> Dict[str, int]:
        """Count slides by type in JSON data."""
        counts = {}
        for slide in data.get("slides", []):
            slide_type = slide.get("slide_type", "unknown")
            counts[slide_type] = counts.get(slide_type, 0) + 1
        return counts


@pytest.fixture
def test_helpers() -> TestHelpers:
    """Return test helper instance."""
    return TestHelpers()


# Test configuration
pytest_plugins = []

def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "roundtrip: mark test as round-trip conversion test"
    )
    config.addinivalue_line(
        "markers", "generator: mark test as generator-specific test"
    )
    config.addinivalue_line(
        "markers", "reader: mark test as reader-specific test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically."""
    for item in items:
        # Add slow marker to roundtrip tests
        if "roundtrip" in item.name.lower():
            item.add_marker(pytest.mark.slow)
        
        # Add integration marker to tests with multiple components
        if any(word in item.name.lower() for word in ["roundtrip", "integration", "end_to_end"]):
            item.add_marker(pytest.mark.integration)