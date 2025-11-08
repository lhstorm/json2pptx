# JSON to PowerPoint Converter Docker Image
# Supports both JSON→PPTX and PPTX→JSON conversion

FROM python:3.11-slim

LABEL maintainer="json2pptx"
LABEL description="Bidirectional converter between JSON and PowerPoint presentations"
LABEL version="2.0.0"

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    libxml2 \
    libxslt1.1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY pptx-generator.py .
COPY pptx-reader.py .
COPY .json2pptx.example.yml .

# Create directories for input/output
RUN mkdir -p /input /output

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV LOG_FORMAT=standard

# Add scripts to PATH
ENV PATH="/app:${PATH}"

# Default command shows help
CMD ["python", "pptx-generator.py", "--help"]

# Usage examples:
#
# Generate PPTX from JSON:
#   docker run -v $(pwd):/input -v $(pwd):/output json2pptx \
#     python pptx-generator.py /input/presentation.json /output/presentation.pptx
#
# Convert PPTX to JSON:
#   docker run -v $(pwd):/input -v $(pwd):/output json2pptx \
#     python pptx-reader.py /input/presentation.pptx /output/presentation.json
#
# Batch process:
#   docker run -v $(pwd):/input -v $(pwd):/output json2pptx \
#     python pptx-generator.py --batch "/input/*.json" --output-dir /output
#
# Validate JSON:
#   docker run -v $(pwd):/input json2pptx \
#     python pptx-generator.py /input/presentation.json --validate
