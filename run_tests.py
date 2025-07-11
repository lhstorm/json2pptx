#!/usr/bin/env python3
"""
Test runner script for PPTX Generator and Reader.

Usage:
    python run_tests.py                    # Run all tests
    python run_tests.py --unit            # Run only unit tests  
    python run_tests.py --integration     # Run only integration tests
    python run_tests.py --roundtrip       # Run only round-trip tests
    python run_tests.py --fast            # Skip slow tests
    python run_tests.py --coverage        # Run with coverage report
    python run_tests.py --parallel        # Run tests in parallel
"""

import sys
import argparse
import subprocess
from pathlib import Path
import os


def main():
    parser = argparse.ArgumentParser(description="Run PPTX Generator/Reader tests")
    
    # Test selection
    parser.add_argument("--unit", action="store_true", help="Run unit tests only")
    parser.add_argument("--integration", action="store_true", help="Run integration tests only")
    parser.add_argument("--roundtrip", action="store_true", help="Run round-trip tests only")
    parser.add_argument("--generator", action="store_true", help="Run generator tests only")
    parser.add_argument("--reader", action="store_true", help="Run reader tests only")
    
    # Test execution options
    parser.add_argument("--fast", action="store_true", help="Skip slow tests")
    parser.add_argument("--coverage", action="store_true", help="Run with coverage report")
    parser.add_argument("--parallel", action="store_true", help="Run tests in parallel")
    parser.add_argument("--html-report", action="store_true", help="Generate HTML test report")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    # File options
    parser.add_argument("--file", "-f", help="Run specific test file")
    parser.add_argument("--test", "-t", help="Run specific test function")
    
    args = parser.parse_args()
    
    # Build pytest command
    cmd = ["python", "-m", "pytest"]
    
    # Add test directory
    test_dir = Path(__file__).parent / "tests"
    cmd.append(str(test_dir))
    
    # Test selection markers
    markers = []
    if args.unit:
        markers.append("unit")
    if args.integration:
        markers.append("integration")
    if args.roundtrip:
        markers.append("roundtrip")
    if args.generator:
        markers.append("generator")
    if args.reader:
        markers.append("reader")
    
    if markers:
        cmd.extend(["-m", " or ".join(markers)])
    
    # Skip slow tests if requested
    if args.fast:
        cmd.extend(["-m", "not slow"])
    
    # Coverage options
    if args.coverage:
        cmd.extend([
            "--cov=.", 
            "--cov-report=term-missing",
            "--cov-report=html:tests/outputs/coverage_html"
        ])
    
    # Parallel execution
    if args.parallel:
        cmd.extend(["-n", "auto"])
    
    # HTML report
    if args.html_report:
        cmd.extend(["--html=tests/outputs/report.html", "--self-contained-html"])
    
    # Verbose output
    if args.verbose:
        cmd.append("-v")
    
    # Specific file or test
    if args.file:
        cmd.append(args.file)
    
    if args.test:
        cmd.extend(["-k", args.test])
    
    # Ensure output directory exists
    output_dir = Path(__file__).parent / "tests" / "outputs"
    output_dir.mkdir(exist_ok=True)
    
    # Set working directory
    os.chdir(Path(__file__).parent)
    
    print(f"Running command: {' '.join(cmd)}")
    print("-" * 60)
    
    # Run tests
    try:
        result = subprocess.run(cmd)
        return result.returncode
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
        return 1
    except Exception as e:
        print(f"Error running tests: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())