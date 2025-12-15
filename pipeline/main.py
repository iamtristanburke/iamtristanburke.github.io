"""
Main entry point for the financial analysis pipeline.
This script orchestrates data ingestion, analysis, and output generation.
"""

import json
import os
from datetime import datetime
from pathlib import Path

from analysis import FinancialAnalyzer


def ensure_output_directory():
    """Ensure the data output directory exists."""
    output_dir = Path(__file__).parent.parent / "data"
    output_dir.mkdir(exist_ok=True)
    return output_dir


def main():
    """Main pipeline execution."""
    print("Starting financial analysis pipeline...")
    
    # Initialize analyzer
    analyzer = FinancialAnalyzer()
    
    # Ingest data (replace with your actual data source)
    print("Ingesting data...")
    data = analyzer.ingest_data()
    
    # Run analysis
    print("Running analysis...")
    results = analyzer.analyze(data)
    
    # Generate output
    output_dir = ensure_output_directory()
    timestamp = datetime.now().isoformat()
    
    # Save results as JSON
    output_file = output_dir / "analysis_results.json"
    output_data = {
        "timestamp": timestamp,
        "results": results,
        "metadata": {
            "pipeline_version": "1.0.0",
            "data_points": len(data) if isinstance(data, list) else 1
        }
    }
    
    with open(output_file, "w") as f:
        json.dump(output_data, f, indent=2)
    
    print(f"Analysis complete! Results saved to {output_file}")
    return output_data


if __name__ == "__main__":
    main()
