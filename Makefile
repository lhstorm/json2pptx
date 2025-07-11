# PPTX Generator/Reader Project Makefile

.PHONY: help install test test-quick test-roundtrip test-unit test-coverage clean lint format

# Default target
help:
	@echo "PPTX Generator/Reader Project"
	@echo "=============================="
	@echo ""
	@echo "Available targets:"
	@echo "  install      - Install dependencies"
	@echo "  test         - Run all tests"
	@echo "  test-quick   - Run quick tests only"
	@echo "  test-roundtrip - Run round-trip tests"
	@echo "  test-unit    - Run unit tests"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  clean        - Clean temporary files"
	@echo "  lint         - Run code linting (future)"
	@echo "  format       - Format code (future)"
	@echo ""
	@echo "Usage examples:"
	@echo "  make install"
	@echo "  make test"
	@echo "  make test-quick"

# Install dependencies
install:
	@echo "Installing dependencies..."
	pip install -r requirements.txt
	pip install -r tests/requirements.txt

# Run all tests
test:
	@echo "Running all tests..."
	python run_tests.py

# Run quick tests (no slow round-trip tests)
test-quick:
	@echo "Running quick tests..."
	python -m pytest tests/test_simple_roundtrip.py::TestFileValidation tests/test_simple_roundtrip.py::TestQuickValidation -v

# Run round-trip tests only
test-roundtrip:
	@echo "Running round-trip tests..."
	python -m pytest tests/test_simple_roundtrip.py::TestSimpleRoundTrip::test_roundtrip_conversion -v

# Run unit tests only
test-unit:
	@echo "Running unit tests..."
	python run_tests.py --unit

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	python run_tests.py --coverage
	@echo "Coverage report generated in tests/outputs/coverage_html/"

# Clean temporary files
clean:
	@echo "Cleaning temporary files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	rm -rf tests/outputs/*.pptx 2>/dev/null || true
	rm -rf tests/outputs/*.json 2>/dev/null || true
	@echo "Cleanup complete."

# Lint code (placeholder for future)
lint:
	@echo "Code linting not yet implemented."
	@echo "Future: Run flake8, pylint, mypy"

# Format code (placeholder for future)
format:
	@echo "Code formatting not yet implemented."
	@echo "Future: Run black, isort"

# Quick validation
validate:
	@echo "Running quick validation..."
	python -m pytest tests/test_simple_roundtrip.py::TestFileValidation -v
	python -m pytest tests/test_simple_roundtrip.py::TestQuickValidation -v

# Development setup
dev-setup: install
	@echo "Development environment setup complete."
	@echo "Run 'make test-quick' to verify installation."

# CI/CD target (future)
ci: test-coverage
	@echo "CI/CD pipeline complete."