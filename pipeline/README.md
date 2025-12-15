# Financial Analysis Pipeline

This Python pipeline ingests financial data, performs analysis, and outputs results in JSON format for consumption by the dashboard.

## Setup

1. Install dependencies:
```bash
cd pipeline
pip install -r requirements.txt
```

2. Run the pipeline locally:
```bash
python main.py
```

## Structure

- `main.py` - Main entry point that orchestrates the pipeline
- `analysis.py` - Contains financial analysis functions
- `requirements.txt` - Python dependencies

## Data Flow

1. **Ingest**: Data is ingested from your data source (API, CSV, database, etc.)
2. **Analyze**: Financial analysis is performed on the data
3. **Output**: Results are saved as JSON in the `../data/` directory

## Customization

### Adding Data Sources

Edit `analysis.py` → `ingest_data()` method to connect to your data source:

```python
def ingest_data(self):
    # Example: API call
    response = requests.get("https://api.example.com/data")
    return response.json()
    
    # Example: CSV file
    # df = pd.read_csv("data.csv")
    # return df.to_dict("records")
```

### Adding Analysis Functions

Add your custom analysis functions to `analysis.py`:

```python
def calculate_roi(self, data):
    # Your ROI calculation logic
    pass
```

### Output Format

Results are saved to `data/analysis_results.json` with the following structure:

```json
{
  "timestamp": "2024-01-01T12:00:00",
  "results": {
    "summary": {...},
    "statistics": {...},
    "category_breakdown": {...}
  },
  "metadata": {...}
}
```

## GitHub Actions

The pipeline runs automatically on a schedule via GitHub Actions (see `.github/workflows/pipeline.yml`). Results are committed back to the repository so the dashboard can access them.

## Environment Variables

If you need API keys or secrets, add them as GitHub Secrets and reference them in the workflow file:

```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
```
