# PPTX Generator & Reader

A powerful Python toolkit for bidirectional conversion between JSON and PowerPoint presentations. Generate professional presentations from structured data or extract presentation content back to JSON format for analysis and manipulation.

## 🎯 What This Project Does

This project provides two complementary tools:

1. **PPTX Generator** (`pptx-generator.py`): Converts JSON data into fully-formatted PowerPoint presentations
2. **PPTX Reader** (`pptx-reader.py`): Extracts content from PowerPoint presentations back into structured JSON format

### Key Features

- **20+ Slide Types**: Support for title slides, bullet points, charts, tables, images, timelines, and more
- **Professional Styling**: Consistent themes, fonts, colors, and layouts
- **Chart Generation**: Native PowerPoint charts (bar, line, pie, area) with proper styling
- **Image Handling**: Automatic image downloading and positioning
- **Round-trip Conversion**: JSON → PPTX → JSON with high fidelity
- **Error Handling**: Graceful fallbacks and comprehensive logging
- **Extensible Architecture**: Easy to add new slide types and features

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone "https://github.com/lhstorm/json2pptx.git"
cd pdf_to_ppt_lite

# Create virtual environment
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Basic Usage

```bash
# Generate PowerPoint from JSON
python pptx-generator.py input.json output.pptx

# Extract JSON from PowerPoint
python pptx-reader.py input.pptx output.json

# Round-trip conversion
python pptx-generator.py data.json presentation.pptx
python pptx-reader.py presentation.pptx extracted.json
```

## 📋 JSON Data Model

The JSON format follows a structured schema that defines presentation metadata and slide content. Here's the complete specification:

### Top-Level Structure

```json
{
  "presentation_metadata": {
    "title": "Presentation Title",
    "author": "Author Name",
    "date": "2024-01-01",
    "theme": {
      "primary_color": "#2C3E50",
      "secondary_color": "#3498DB",
      "accent_color": "#E74C3C",
      "background_color": "#FFFFFF",
      "text_color": "#212121",
      "font_family": "Calibri"
    }
  },
  "slides": [
    // Array of slide objects
  ]
}
```

### Slide Structure

Each slide follows this basic structure:

```json
{
  "slide_number": 1,
  "slide_type": "title_slide",
  "content": {
    // Slide-specific content
  },
  "title": "Slide Title",           // Optional, for non-title slides
  "background_image": "url",        // Optional
  "speaker_notes": "Notes text",    // Optional
  "transition": "fade",             // Optional: fade, slide, etc.
  "duration": 30                    // Optional: seconds
}
```

## 🎨 Supported Slide Types

### 1. Title Slide (`title_slide`)

The opening slide of a presentation with main title, subtitle, author, and date.

```json
{
  "slide_number": 1,
  "slide_type": "title_slide",
  "content": {
    "title": "Advanced Technology Showcase",
    "subtitle": "Innovation Through Engineering Excellence",
    "author": "Dr. Sarah Kim, Chief Technology Officer",
    "date": "December 2024"
  },
  "speaker_notes": "Welcome to our technology showcase.",
  "transition": "fade",
  "duration": 30
}
```

### 2. Section Header (`section_header`)

Introduces a new section with title and subtitle.

```json
{
  "slide_number": 2,
  "slide_type": "section_header",
  "content": {
    "title": "Technology Overview",
    "subtitle": "Emerging Trends & Innovations"
  },
  "speaker_notes": "Starting with an overview of key trends.",
  "transition": "slide",
  "duration": 15
}
```

### 3. Bullet Points (`bullet_points`)

Hierarchical bullet point lists with multiple levels.

```json
{
  "slide_number": 3,
  "slide_type": "bullet_points",
  "content": {
    "points": [
      {"text": "Artificial Intelligence & Machine Learning", "level": 0},
      {"text": "Computer Vision and Natural Language Processing", "level": 1},
      {"text": "Predictive Analytics and Decision Support", "level": 1},
      {"text": "Cloud-Native Architecture", "level": 0},
      {"text": "Microservices and Containerization", "level": 1},
      {"text": "Auto-scaling and Fault Tolerance", "level": 1}
    ]
  },
  "title": "Key Technology Pillars",
  "speaker_notes": "These are our core technology focus areas."
}
```

### 4. Numbered List (`numbered_list`)

Sequential numbered items with hierarchy support.

```json
{
  "slide_number": 4,
  "slide_type": "numbered_list",
  "content": {
    "items": [
      {"text": "Phase 1: Infrastructure Modernization (Q1 2025)", "level": 0},
      {"text": "Phase 2: AI/ML Platform Deployment (Q2 2025)", "level": 0},
      {"text": "Phase 3: Edge Computing Rollout (Q3 2025)", "level": 0},
      {"text": "Phase 4: Quantum Integration Pilot (Q4 2025)", "level": 0}
    ]
  },
  "title": "Implementation Roadmap"
}
```

### 5. Chart Slide (`chart_slide`)

Data visualization with multiple chart types.

```json
{
  "slide_number": 5,
  "slide_type": "chart_slide",
  "content": {
    "chart_type": "bar",  // bar, line, pie, area
    "chart_data": {
      "labels": ["Q1", "Q2", "Q3", "Q4"],
      "datasets": [
        {
          "name": "Revenue",
          "values": [100, 120, 140, 160]
        },
        {
          "name": "Profit",
          "values": [20, 25, 35, 45]
        }
      ]
    },
    "chart_options": {
      "show_legend": true,
      "show_grid": true
    }
  },
  "title": "Quarterly Performance"
}
```

### 6. Data Table (`data_table`)

Structured data in tabular format.

```json
{
  "slide_number": 6,
  "slide_type": "data_table",
  "content": {
    "headers": ["Metric", "Q1", "Q2", "Q3", "Q4"],
    "rows": [
      ["Revenue", "$1.2M", "$1.5M", "$1.8M", "$2.1M"],
      ["Users", "10K", "15K", "22K", "28K"],
      ["Growth", "25%", "30%", "35%", "40%"]
    ]
  },
  "title": "Performance Metrics"
}
```

### 7. Comparison Table (`comparison_table`)

Side-by-side comparison of items and criteria.

```json
{
  "slide_number": 7,
  "slide_type": "comparison_table",
  "content": {
    "items": ["Option A", "Option B", "Option C"],
    "criteria": [
      {"name": "Cost", "values": ["$100", "$150", "$120"]},
      {"name": "Performance", "values": ["High", "Medium", "High"]},
      {"name": "Scalability", "values": ["Excellent", "Good", "Very Good"]}
    ]
  },
  "title": "Solution Comparison"
}
```

### 8. Text with Image (`text_image_left`, `text_image_right`)

Text content with accompanying image, positioned left or right.

```json
{
  "slide_number": 8,
  "slide_type": "text_image_left",
  "content": {
    "text": "Our quantum computing research initiative includes:\n\n• State-of-the-art quantum processors\n• Error correction protocols\n• Hybrid classical-quantum algorithms",
    "image_path": "https://example.com/quantum-lab.jpg"
  },
  "title": "Quantum Computing Research"
}
```

### 9. Full-Screen Image (`image_full`)

Large image that fills most of the slide.

```json
{
  "slide_number": 9,
  "slide_type": "image_full",
  "content": {
    "image_path": "https://example.com/data-center.jpg",
    "caption": "State-of-the-art data center facility"
  },
  "title": "Infrastructure Overview"
}
```

### 10. Single Content (`content_single`)

Single block of text content.

```json
{
  "slide_number": 10,
  "slide_type": "content_single",
  "content": {
    "text": "Our mission is to leverage cutting-edge technology to solve complex business challenges and drive innovation across industries."
  },
  "title": "Our Mission"
}
```

### 11. Two-Column Layout (`content_two_column`)

Content split into two columns.

```json
{
  "slide_number": 11,
  "slide_type": "content_two_column",
  "content": {
    "columns": [
      {
        "title": "Current Challenges",
        "content": "• Legacy system limitations\n• Scalability constraints\n• Security vulnerabilities"
      },
      {
        "title": "Our Solutions",
        "content": "• Modern cloud architecture\n• Auto-scaling infrastructure\n• Zero-trust security model"
      }
    ]
  },
  "title": "Challenges & Solutions"
}
```

### 12. Three-Column Layout (`content_three_column`)

Content split into three columns.

```json
{
  "slide_number": 12,
  "slide_type": "content_three_column",
  "content": {
    "columns": [
      {
        "title": "Research",
        "content": "Fundamental research and proof of concepts"
      },
      {
        "title": "Development",
        "content": "Prototype development and testing"
      },
      {
        "title": "Deployment",
        "content": "Production deployment and optimization"
      }
    ]
  },
  "title": "Development Pipeline"
}
```

### 13. Timeline (`timeline`)

Chronological sequence of events.

```json
{
  "slide_number": 13,
  "slide_type": "timeline",
  "content": {
    "events": [
      {
        "date": "2024-Q1",
        "title": "Project Initiation",
        "description": "Requirements gathering and team formation"
      },
      {
        "date": "2024-Q2",
        "title": "Development Phase",
        "description": "Core platform development and testing"
      },
      {
        "date": "2024-Q3",
        "title": "Beta Launch",
        "description": "Limited user testing and feedback collection"
      }
    ]
  },
  "title": "Project Timeline"
}
```

### 14. Process Flow (`process_flow`)

Step-by-step process visualization.

```json
{
  "slide_number": 14,
  "slide_type": "process_flow",
  "content": {
    "steps": [
      {
        "title": "Data Collection",
        "description": "Gather raw data from multiple sources"
      },
      {
        "title": "Processing",
        "description": "Clean and transform data using ML pipelines"
      },
      {
        "title": "Analysis",
        "description": "Apply algorithms and generate insights"
      },
      {
        "title": "Visualization",
        "description": "Create dashboards and reports"
      }
    ]
  },
  "title": "Data Pipeline Process"
}
```

### 15. Quote Slide (`quote_slide`)

Highlighted quote with attribution.

```json
{
  "slide_number": 15,
  "slide_type": "quote_slide",
  "content": {
    "quote": "Innovation distinguishes between a leader and a follower.",
    "author": "Steve Jobs",
    "title": "Innovation Philosophy"
  }
}
```

### 16. Icon Points (`icon_points`)

Bullet points with icons or emojis.

```json
{
  "slide_number": 16,
  "slide_type": "icon_points",
  "content": {
    "points": [
      {
        "icon": "🚀",
        "title": "Performance",
        "description": "10x faster processing with optimized algorithms"
      },
      {
        "icon": "🔒",
        "title": "Security",
        "description": "Enterprise-grade security with end-to-end encryption"
      },
      {
        "icon": "⚡",
        "title": "Efficiency",
        "description": "Automated workflows reduce manual effort by 80%"
      }
    ]
  },
  "title": "Key Benefits"
}
```

### 17. Team Slide (`team_slide`)

Team member profiles with photos.

```json
{
  "slide_number": 17,
  "slide_type": "team_slide",
  "content": {
    "members": [
      {
        "name": "Dr. Sarah Kim",
        "role": "Chief Technology Officer",
        "bio": "15+ years in enterprise architecture",
        "image": "https://example.com/sarah.jpg"
      },
      {
        "name": "Michael Chen",
        "role": "Lead AI Engineer",
        "bio": "PhD in Machine Learning from MIT",
        "image": "https://example.com/michael.jpg"
      }
    ]
  },
  "title": "Our Team"
}
```

### 18. Contact Slide (`contact_slide`)

Contact information and details.

```json
{
  "slide_number": 18,
  "slide_type": "contact_slide",
  "content": {
    "title": "Get In Touch",
    "email": "info@company.com",
    "phone": "+1 (555) 123-4567",
    "address": "123 Innovation Drive, Tech City, CA 94000",
    "website": "www.company.com",
    "social": {
      "linkedin": "company-linkedin",
      "twitter": "@company"
    }
  }
}
```

### 19. Thank You Slide (`thank_you`)

Closing slide with thank you message.

```json
{
  "slide_number": 19,
  "slide_type": "thank_you",
  "content": {
    "title": "Thank You",
    "subtitle": "Questions & Discussion",
    "contact": "sarah.kim@company.com"
  }
}
```

## 🎨 Styling and Themes

### Color Specification

Colors are specified using hex codes:

```json
"theme": {
  "primary_color": "#1a237e",      // Main brand color
  "secondary_color": "#3f51b5",    // Secondary brand color
  "accent_color": "#ff5722",       // Highlight color
  "background_color": "#fafafa",   // Slide background
  "text_color": "#212121",         // Main text color
  "font_family": "Segoe UI"        // Font family
}
```

### Advanced Styling Options

```json
{
  "slide_styling": {
    "background_gradient": {
      "start_color": "#667eea",
      "end_color": "#764ba2",
      "direction": "diagonal"
    },
    "border": {
      "width": 2,
      "color": "#cccccc",
      "style": "solid"
    }
  }
}
```

## 🖼️ Working with Images

### Image Sources

Images can be specified using:

1. **HTTP/HTTPS URLs**: `https://example.com/image.jpg`
2. **Local file paths**: `./images/chart.png`
3. **Placeholder services**: `https://picsum.photos/800/600`

### Image Guidelines

- **Supported formats**: JPG, PNG, GIF, BMP
- **Recommended resolution**: 1920x1080 for full slides, 800x600 for side images
- **File size**: Under 5MB per image for best performance
- **Accessibility**: Include alt text in image descriptions

### Example Image Usage

```json
{
  "slide_type": "text_image_left",
  "content": {
    "text": "Description of the technology",
    "image_path": "https://picsum.photos/800/600?random=1",
    "image_alt": "Modern data center with servers",
    "image_caption": "Our primary data center facility"
  }
}
```

## 📊 Chart Configuration

### Chart Types

1. **Bar Charts**: `"chart_type": "bar"`
2. **Line Charts**: `"chart_type": "line"`  
3. **Pie Charts**: `"chart_type": "pie"`
4. **Area Charts**: `"chart_type": "area"`

### Chart Data Structure

```json
{
  "chart_data": {
    "labels": ["Category 1", "Category 2", "Category 3"],
    "datasets": [
      {
        "name": "Series 1",
        "values": [10, 20, 15],
        "color": "#3498db"  // Optional custom color
      },
      {
        "name": "Series 2", 
        "values": [15, 25, 20],
        "color": "#e74c3c"
      }
    ]
  },
  "chart_options": {
    "show_legend": true,
    "show_grid": true,
    "show_values": false,
    "legend_position": "right"  // top, bottom, left, right
  }
}
```

### Pie Chart Specific

For pie charts, use only one dataset:

```json
{
  "chart_type": "pie",
  "chart_data": {
    "labels": ["Desktop", "Mobile", "Tablet"],
    "datasets": [
      {
        "name": "Usage",
        "values": [60, 30, 10]
      }
    ]
  }
}
```

## 🛠️ Advanced Usage

### Batch Processing

Process multiple JSON files:

```bash
# Process all JSON files in a directory
for file in *.json; do
  python pptx-generator.py "$file" "${file%.json}.pptx"
done
```

### Environment Variables

Configure behavior using environment variables:

```bash
export PPTX_DEFAULT_THEME="corporate"
export PPTX_IMAGE_QUALITY="high"
export PPTX_TIMEOUT="30"
python pptx-generator.py input.json output.pptx
```

### Custom Themes

Create custom theme files:

```json
// themes/corporate.json
{
  "name": "Corporate Theme",
  "colors": {
    "primary": "#003366",
    "secondary": "#0066cc", 
    "accent": "#ff6600"
  },
  "fonts": {
    "title": "Arial Black",
    "body": "Arial",
    "code": "Courier New"
  }
}
```

### Logging and Debugging

Enable detailed logging:

```bash
# Set log level
export PPTX_LOG_LEVEL="DEBUG"

# Log to file
python pptx-generator.py input.json output.pptx > generation.log 2>&1
```

## 🧪 Testing

The project includes comprehensive testing:

```bash
# Quick validation
make test-quick

# Full round-trip testing
make test-roundtrip

# Run specific test
python -m pytest tests/test_simple_roundtrip.py -v
```

### Test Templates

The project includes 5 comprehensive test templates:

1. **test.json**: 22 slides covering all slide types
2. **test_corporate.json**: Business/finance presentation
3. **test_education.json**: Educational content
4. **test_improved_business.json**: Strategic business
5. **test_improved_tech.json**: Technology showcase

## 🚨 Error Handling

### Common Issues and Solutions

1. **Invalid JSON**: Use a JSON validator to check syntax
2. **Missing images**: Images will be replaced with placeholders
3. **Chart data errors**: Verify data structure matches examples
4. **Font issues**: Fonts fall back to system defaults

### Validation

Validate JSON before processing:

```python
import json
import jsonschema

# Load and validate
with open('presentation.json') as f:
    data = json.load(f)
    
# Basic structure validation
assert 'slides' in data
assert 'presentation_metadata' in data
```

## 📝 Best Practices

### JSON Structure

1. **Consistent naming**: Use clear, descriptive field names
2. **Proper nesting**: Follow the documented schema structure
3. **Data validation**: Validate data types and required fields
4. **Error handling**: Provide fallback content for missing data

### Content Guidelines

1. **Text length**: Keep titles under 60 characters, bullet points under 100
2. **Image quality**: Use high-resolution images (1920x1080 recommended)
3. **Color contrast**: Ensure sufficient contrast for readability
4. **Slide count**: Limit presentations to 20-30 slides for optimal engagement

### Performance

1. **Image optimization**: Compress images before use
2. **Chart complexity**: Limit chart data points to 10-15 for clarity
3. **Batch processing**: Process multiple files sequentially for large batches

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Run the test suite: `make test-roundtrip`
5. Submit a pull request

### Development Setup

```bash
# Clone and setup
git clone <repository-url>
cd pdf_to_ppt_lite
python -m venv env
source env/bin/activate
pip install -r requirements.txt
pip install -r tests/requirements.txt

# Run tests
make test-quick
```

## 📄 License

[Add your license information here]

## 🔗 Related Projects

- [python-pptx](https://python-pptx.readthedocs.io/) - Core PowerPoint library
- [JSON Schema](https://json-schema.org/) - JSON validation standards

## 📞 Support

For questions, issues, or contributions:

- Create an issue on GitHub
- Review the test examples in `tests/test_json/`
- Check the comprehensive test suite for usage patterns

---

*This project enables powerful automation of PowerPoint presentation generation and analysis through structured JSON data, making it easy to create professional presentations programmatically or extract presentation content for further processing.*
