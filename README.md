# JSON to PowerPoint Converter

A powerful Python toolkit for bidirectional conversion between JSON and PowerPoint presentations. Generate professional presentations from structured data or extract presentation content back to JSON format for analysis and manipulation.

## 🎯 Features

### Core Features
- **20+ Slide Types**: Complete support for title slides, bullet points, charts, tables, images, timelines, and more
- **Professional Styling**: Consistent themes, fonts, colors, and layouts with customizable color schemes
- **Native Charts**: PowerPoint-native charts (bar, line, pie, area) with proper styling and data visualization
- **Bidirectional Conversion**: JSON → PPTX → JSON with high-fidelity round-trip conversion
- **Comprehensive Testing**: Full test suite with round-trip validation across all slide types
- **LLM Integration**: Optimized prompt template for generating presentations with AI

### Advanced CLI Features ✨ NEW!
- **Validation Mode**: Check JSON validity without generating presentations
- **Batch Processing**: Convert multiple JSON files at once with glob patterns
- **Progress Bars**: Visual feedback with tqdm for long operations
- **Structured Logging**: JSON-formatted logs for CI/CD integration
- **Config File Support**: YAML configuration files for default settings
- **Docker Support**: Containerized deployment with Docker/Docker Compose

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/lhstorm/json2pptx.git
cd json2pptx
pip install -r requirements.txt
```

### Basic Usage

```bash
# Generate PowerPoint from JSON
python pptx-generator.py input.json output.pptx

# Extract JSON from PowerPoint
python pptx-reader.py input.pptx output.json

# Run comprehensive tests
python -m pytest tests/ -v
```

### Advanced Usage ✨ NEW!

```bash
# Validate JSON without generating presentation
python pptx-generator.py input.json --validate

# Batch process multiple files
python pptx-generator.py --batch "presentations/*.json" --output-dir ./output

# Use custom configuration file
python pptx-generator.py input.json output.pptx --config my-config.yml

# Enable structured JSON logging (great for CI/CD)
python pptx-generator.py input.json output.pptx --log-format json

# Disable progress bars for cleaner logs
python pptx-generator.py input.json output.pptx --no-progress

# Overwrite existing files
python pptx-generator.py input.json output.pptx --overwrite

# Show version
python pptx-generator.py --version

# Get help
python pptx-generator.py --help
```

## 📋 JSON Structure

### Required Top-Level Structure

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
  "slides": [...]
}
```

### Slide Structure

**CRITICAL**: Every slide except `title_slide` MUST have a `"title"` field at the root level:

```json
{
  "slide_number": 1,
  "slide_type": "bullet_points",
  "title": "Slide Title Here",  // REQUIRED for all non-title slides
  "content": { /* slide-specific content */ },
  "speaker_notes": "Optional notes",
  "transition": "fade",
  "duration": 30
}
```

## 🎨 Complete Slide Type Reference

### 1. Title Slide
```json
{
  "slide_number": 1,
  "slide_type": "title_slide",
  "content": {
    "title": "Main Presentation Title",
    "subtitle": "Descriptive subtitle", 
    "author": "Presenter Name and Title",
    "date": "Month Year"
  }
}
```

### 2. Section Header
```json
{
  "slide_number": 2,
  "slide_type": "section_header",
  "content": {
    "title": "Section Title",
    "subtitle": "Section description"
  }
}
```

### 3. Bullet Points
```json
{
  "slide_number": 3,
  "slide_type": "bullet_points",
  "title": "Key Points",
  "content": {
    "title": "Key Points", 
    "points": [
      {"text": "Main point", "level": 1},
      {"text": "Sub-point", "level": 2},
      {"text": "Another main point", "level": 1}
    ]
  }
}
```

### 4. Chart Slide
**IMPORTANT**: Use `"data"` and `"options"` (not `"chart_data"` and `"chart_options"`):

```json
{
  "slide_number": 4,
  "slide_type": "chart_slide",
  "title": "Performance Data",
  "content": {
    "title": "Performance Data",
    "chart_type": "bar",
    "data": {
      "labels": ["Q1", "Q2", "Q3", "Q4"],
      "datasets": [
        {
          "name": "Revenue",
          "values": [100, 120, 140, 160]
        }
      ]
    },
    "options": {
      "show_legend": true,
      "show_grid": true
    }
  }
}
```

### 5. Data Table
```json
{
  "slide_number": 5,
  "slide_type": "data_table", 
  "title": "Quarterly Metrics",
  "content": {
    "title": "Quarterly Metrics",
    "headers": ["Metric", "Q1", "Q2", "Q3", "Q4"],
    "rows": [
      ["Revenue", "$1.2M", "$1.5M", "$1.8M", "$2.1M"],
      ["Growth", "15%", "20%", "25%", "30%"]
    ],
    "style": "striped"
  }
}
```

### 6. Comparison Table
```json
{
  "slide_number": 6,
  "slide_type": "comparison_table",
  "title": "Solution Comparison", 
  "content": {
    "title": "Solution Comparison",
    "items": [
      {"name": "Option A"},
      {"name": "Option B"}
    ],
    "criteria": [
      {
        "name": "Cost",
        "values": ["$100", "$150"]
      },
      {
        "name": "Performance",
        "values": ["High", "Medium"]
      }
    ]
  }
}
```

### 7. Text with Image
**IMPORTANT**: Use `"image"` field (not `"image_path"`):

```json
{
  "slide_number": 7,
  "slide_type": "text_image_left",
  "title": "Feature Overview",
  "content": {
    "title": "Feature Overview",
    "text": "Descriptive text about the features",
    "image": "https://picsum.photos/800/600?random=tech"
  }
}
```

### 8. Two-Column Content
**IMPORTANT**: Use `"left_column"` and `"right_column"` (not `"columns"` array):

```json
{
  "slide_number": 8,
  "slide_type": "content_two_column",
  "title": "Challenges & Solutions",
  "content": {
    "title": "Challenges & Solutions",
    "left_column": "Current challenges:\\n• Legacy systems\\n• Scale limitations",
    "right_column": "Our solutions:\\n• Modern architecture\\n• Auto-scaling"
  }
}
```

### 9. Three-Column Content
```json
{
  "slide_number": 9,
  "slide_type": "content_three_column", 
  "title": "Three-Way Breakdown",
  "content": {
    "title": "Three-Way Breakdown",
    "left_column": "Research phase",
    "middle_column": "Development phase", 
    "right_column": "Deployment phase"
  }
}
```

### 10. Timeline
```json
{
  "slide_number": 10,
  "slide_type": "timeline",
  "title": "Project Timeline",
  "content": {
    "title": "Project Timeline", 
    "events": [
      {
        "date": "2024-Q1",
        "title": "Project Kickoff",
        "description": "Initial planning"
      }
    ]
  }
}
```

### 11. Process Flow  
```json
{
  "slide_number": 11,
  "slide_type": "process_flow",
  "title": "Process Overview",
  "content": {
    "title": "Process Overview",
    "steps": [
      {"text": "Step 1"},
      {"text": "Step 2"}, 
      {"text": "Step 3"}
    ]
  }
}
```

### 12. Quote Slide
**IMPORTANT**: Use `"attribution"` (not `"author"`):

```json
{
  "slide_number": 12,
  "slide_type": "quote_slide",
  "content": {
    "quote": "Innovation distinguishes between a leader and a follower.",
    "attribution": "Steve Jobs"
  }
}
```

### 13. Icon Points
```json
{
  "slide_number": 13,
  "slide_type": "icon_points",
  "title": "Key Benefits",
  "content": {
    "title": "Key Benefits",
    "points": [
      {
        "text": "Performance\\n10x faster processing", 
        "icon": "rocket"
      },
      {
        "text": "Security\\nEnterprise-grade protection",
        "icon": "shield"
      }
    ]
  }
}
```

### 14. Team Slide
**IMPORTANT**: Use `"photo"` field (not `"image"`):

```json
{
  "slide_number": 14,
  "slide_type": "team_slide", 
  "title": "Our Team",
  "content": {
    "title": "Our Team",
    "members": [
      {
        "name": "John Smith",
        "role": "CEO & Founder",
        "photo": "https://picsum.photos/200/200?random=person1"
      }
    ]
  }
}
```

### 15. Contact Slide
```json
{
  "slide_number": 15,
  "slide_type": "contact_slide",
  "content": {
    "title": "Get In Touch",
    "name": "Company Representative",
    "email": "contact@company.com",
    "phone": "+1 (555) 123-4567",
    "website": "www.company.com",
    "address": "123 Business Ave, City, State 12345"
  }
}
```

### 16. Thank You Slide
```json
{
  "slide_number": 16,
  "slide_type": "thank_you",
  "content": {
    "title": "Thank You",
    "subtitle": "Questions & Discussion",
    "contact": "presenter@company.com"
  }
}
```

## 🎨 Chart Types & Configuration

### Supported Chart Types
- `"bar"` - Bar charts for categorical data
- `"line"` - Line charts for trends over time  
- `"pie"` - Pie charts for proportional data
- `"area"` - Area charts for cumulative data

### Chart Color Handling
The generator automatically applies theme colors to chart series. For pie charts, colors are applied to individual data points for proper multi-color visualization.

## 🧪 Testing Framework

The project includes comprehensive testing with working examples:

```bash
# Run all tests
python -m pytest tests/ -v

# Test specific functionality  
python -m pytest tests/test_simple_roundtrip.py -v

# Quick validation
python run_tests.py
```

### Test Templates
Five complete presentation templates in `tests/test_json/`:
- `test.json` - Comprehensive 22-slide showcase
- `test_corporate.json` - Business presentation
- `test_education.json` - Educational content
- `test_improved_business.json` - Strategic business  
- `test_improved_tech.json` - Technology showcase

## 🤖 LLM Integration

Use the included `PROMPT_TEMPLATE.txt` with language models to generate properly-structured JSON presentations. The template includes:

- User customization fields at the top for easy editing
- Complete slide type specifications with working examples
- Critical JSON structure rules
- Image URL guidelines and theme suggestions

## ⚙️ Configuration File ✨ NEW!

Create a `.json2pptx.yml` file in your project directory or home directory to set default options:

```yaml
# Theme configuration
theme:
  primary_color: '#2C3E50'
  secondary_color: '#3498DB'
  accent_color: '#E74C3C'
  background_color: '#FFFFFF'
  text_color: '#2C3E50'
  font_family: 'Calibri'

# Output configuration
output:
  default_directory: '.'
  overwrite: false

# Logging configuration
logging:
  level: 'INFO'
  format: 'standard'  # or 'json'
```

Copy `.json2pptx.example.yml` to `.json2pptx.yml` and customize as needed.

### Configuration Priority

1. Command-line arguments (highest priority)
2. Config file specified with `--config`
3. `.json2pptx.yml` in current directory
4. `~/.json2pptx.yml` in home directory
5. Built-in defaults (lowest priority)

## 🐳 Docker Usage ✨ NEW!

### Using Docker

```bash
# Build the image
docker build -t json2pptx .

# Generate presentation
docker run -v $(pwd):/workspace json2pptx \
  python pptx-generator.py /workspace/input.json /workspace/output.pptx

# Batch process
docker run -v $(pwd):/workspace json2pptx \
  python pptx-generator.py --batch "/workspace/*.json" --output-dir /workspace/output

# Validate JSON
docker run -v $(pwd):/workspace json2pptx \
  python pptx-generator.py /workspace/input.json --validate
```

### Using Docker Compose

```bash
# Build
docker-compose build

# Generate presentation
docker-compose run --rm json2pptx python pptx-generator.py input.json output.pptx

# Batch process
docker-compose run --rm json2pptx \
  python pptx-generator.py --batch "*.json" --output-dir ./output

# Validate
docker-compose run --rm json2pptx python pptx-generator.py input.json --validate
```

### Benefits of Docker

- No need to install Python or dependencies locally
- Consistent environment across different systems
- Easy CI/CD integration
- Isolated execution

## ⚠️ Common Issues & Solutions

### JSON Structure Errors
1. **Missing "title" field**: Add `"title"` at slide level for all non-title slides
2. **Wrong chart structure**: Use `"data"` and `"options"` (not `"chart_data"`/`"chart_options"`)
3. **Image field naming**: Use `"image"` for images, `"photo"` for team members
4. **Quote attribution**: Use `"attribution"` field (not `"author"`)

### Content Issues  
1. **Empty slides**: Always provide meaningful content for all fields
2. **Image loading**: Images fail gracefully with placeholder text
3. **Chart data**: Ensure data arrays match label count

## 📁 Project Structure

```
json2pptx/
├── pptx-generator.py           # Main JSON→PPTX converter (enhanced)
├── pptx-reader.py              # Main PPTX→JSON converter
├── PROMPT_TEMPLATE.txt         # LLM prompt for JSON generation
├── requirements.txt            # Python dependencies (updated)
├── Dockerfile                  # Docker image definition ✨ NEW!
├── docker-compose.yml          # Docker Compose config ✨ NEW!
├── .dockerignore               # Docker ignore patterns ✨ NEW!
├── .json2pptx.example.yml      # Example config file ✨ NEW!
├── tests/                      # Comprehensive test suite
│   ├── test_json/             # Working example templates
│   ├── test_simple_roundtrip.py
│   └── ...
└── README.md                  # This file (updated)
```

## 🔄 CI/CD Integration ✨ NEW!

### GitHub Actions Example

```yaml
name: Generate Presentations

on: [push]

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Validate all JSON files
        run: python pptx-generator.py --batch "presentations/*.json" --validate --log-format json

      - name: Generate presentations
        run: python pptx-generator.py --batch "presentations/*.json" --output-dir ./output --no-progress

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: presentations
          path: output/*.pptx
```

### Using Docker in CI/CD

```yaml
# Using pre-built Docker image
jobs:
  generate:
    runs-on: ubuntu-latest
    container: json2pptx:latest
    steps:
      - uses: actions/checkout@v3
      - run: python pptx-generator.py --batch "*.json" --output-dir ./output --log-format json
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `python -m pytest tests/ -v`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **Repository**: https://github.com/lhstorm/json2pptx
- **Issues**: https://github.com/lhstorm/json2pptx/issues
- **python-pptx docs**: https://python-pptx.readthedocs.io/

---

*Generate professional PowerPoint presentations programmatically with structured JSON data and comprehensive slide type support.*
