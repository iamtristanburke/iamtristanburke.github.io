#!/usr/bin/env python3
"""
Colt Agent Runner - Executes LLM analysis and saves results to JSON files
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import uuid

try:
    import openai
    import requests
except ImportError:
    print("Error: Required packages not installed. Run: pip install openai requests")
    sys.exit(1)

# Configuration
REPO_ROOT = Path(__file__).parent.parent.parent
PROMPT_FILE = REPO_ROOT / "prompts" / "trading-agent.json"
RUNS_DIR = REPO_ROOT / "data" / "colt-agent" / "runs"
INSIGHTS_DIR = REPO_ROOT / "data" / "colt-agent" / "insights"
ACTIONS_DIR = REPO_ROOT / "data" / "colt-agent" / "actions"

# Ensure directories exist
RUNS_DIR.mkdir(parents=True, exist_ok=True)
INSIGHTS_DIR.mkdir(parents=True, exist_ok=True)
ACTIONS_DIR.mkdir(parents=True, exist_ok=True)


def load_prompt_config() -> Dict[str, Any]:
    """Load the prompt configuration from JSON file."""
    if not PROMPT_FILE.exists():
        print(f"Error: Prompt file not found at {PROMPT_FILE}")
        sys.exit(1)
    
    with open(PROMPT_FILE, 'r') as f:
        return json.load(f)


def call_openai_api(prompt_config: Dict[str, Any]) -> Dict[str, Any]:
    """Call OpenAI API with the configured prompt."""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable not set")
        sys.exit(1)
    
    client = openai.OpenAI(api_key=api_key)
    
    try:
        response = client.chat.completions.create(
            model=prompt_config['parameters']['model'],
            messages=[
                {"role": "system", "content": prompt_config['systemMessage']},
                {"role": "user", "content": prompt_config['userPrompt']}
            ],
            temperature=prompt_config['parameters']['temperature'],
            max_tokens=prompt_config['parameters']['maxTokens']
        )
        
        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else None
        
        return {
            'content': content,
            'tokens_used': tokens_used,
            'model': prompt_config['parameters']['model']
        }
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        raise


def parse_llm_output(content: str) -> Dict[str, List[Dict[str, Any]]]:
    """Parse LLM output to extract insights and actions."""
    try:
        # Try to parse as JSON
        data = json.loads(content)
        
        # Validate structure
        insights = data.get('insights', [])
        actions = data.get('actions', [])
        
        return {
            'insights': insights if isinstance(insights, list) else [],
            'actions': actions if isinstance(actions, list) else []
        }
    except json.JSONDecodeError:
        # If not JSON, try to extract from text
        print("Warning: LLM output is not valid JSON. Attempting to extract structured data...")
        return {
            'insights': [{'content': content, 'category': 'market', 'confidence': 50}],
            'actions': []
        }


def save_run(run_id: str, timestamp: str, prompt: str, status: str, output: str = None, 
             error: str = None, model: str = None, tokens_used: int = None):
    """Save agent run to JSON file."""
    run_data = {
        'id': run_id,
        'timestamp': timestamp,
        'prompt': prompt,
        'status': status,
        'output': output,
        'error': error,
        'model': model,
        'tokensUsed': tokens_used
    }
    
    filename = f"{timestamp.replace(':', '-').replace(' ', 'T').split('.')[0]}.json"
    filepath = RUNS_DIR / filename
    
    with open(filepath, 'w') as f:
        json.dump(run_data, f, indent=2)
    
    print(f"Saved run to {filepath}")


def save_insight(run_id: str, timestamp: str, insight_data: Dict[str, Any]) -> str:
    """Save an insight to JSON file."""
    insight_id = str(uuid.uuid4())
    insight = {
        'id': insight_id,
        'runId': run_id,
        'timestamp': timestamp,
        'category': insight_data.get('category', 'market'),
        'content': insight_data.get('content', ''),
        'confidence': insight_data.get('confidence', 50),
        'relatedTickers': insight_data.get('relatedTickers', [])
    }
    
    filename = f"{timestamp.replace(':', '-').replace(' ', 'T').split('.')[0]}-{insight_id[:8]}.json"
    filepath = INSIGHTS_DIR / filename
    
    with open(filepath, 'w') as f:
        json.dump(insight, f, indent=2)
    
    return filename


def save_action(run_id: str, timestamp: str, action_data: Dict[str, Any]) -> str:
    """Save an action to JSON file."""
    action_id = str(uuid.uuid4())
    action = {
        'id': action_id,
        'runId': run_id,
        'timestamp': timestamp,
        'type': action_data.get('type', 'buy'),
        'ticker': action_data.get('ticker', ''),
        'rationale': action_data.get('rationale', ''),
        'confidence': action_data.get('confidence', 50),
        'targetPrice': action_data.get('targetPrice'),
        'stopLoss': action_data.get('stopLoss'),
        'quantity': action_data.get('quantity')
    }
    
    filename = f"{timestamp.replace(':', '-').replace(' ', 'T').split('.')[0]}-{action_id[:8]}.json"
    filepath = ACTIONS_DIR / filename
    
    with open(filepath, 'w') as f:
        json.dump(action, f, indent=2)
    
    return filename


def update_manifest(run_id: str, timestamp: str, insight_files: List[str], action_files: List[str]):
    """Update manifest.json with new run information."""
    manifest_file = REPO_ROOT / "data" / "colt-agent" / "manifest.json"
    
    if manifest_file.exists():
        with open(manifest_file, 'r') as f:
            manifest = json.load(f)
    else:
        manifest = {'runs': [], 'insights': [], 'actions': []}
    
    run_filename = f"{timestamp.replace(':', '-').replace(' ', 'T').split('.')[0]}.json"
    if run_filename not in manifest['runs']:
        manifest['runs'].append(run_filename)
    
    # Add new insight and action files
    for insight_file in insight_files:
        if insight_file not in manifest['insights']:
            manifest['insights'].append(insight_file)
    
    for action_file in action_files:
        if action_file not in manifest['actions']:
            manifest['actions'].append(action_file)
    
    # Keep only last 100 entries
    manifest['runs'] = manifest['runs'][-100:]
    manifest['insights'] = manifest['insights'][-500:]
    manifest['actions'] = manifest['actions'][-500:]
    
    with open(manifest_file, 'w') as f:
        json.dump(manifest, f, indent=2)


def main():
    """Main execution function."""
    print("Starting Colt Agent run...")
    
    # Load prompt configuration
    prompt_config = load_prompt_config()
    print(f"Loaded prompt configuration (version {prompt_config.get('version', 1)})")
    
    # Generate run ID and timestamp
    run_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    try:
        # Call OpenAI API
        print("Calling OpenAI API...")
        api_response = call_openai_api(prompt_config)
        
        # Parse LLM output
        print("Parsing LLM output...")
        parsed_data = parse_llm_output(api_response['content'])
        
        # Save run
        save_run(
            run_id=run_id,
            timestamp=timestamp,
            prompt=prompt_config['userPrompt'],
            status='completed',
            output=api_response['content'],
            model=api_response['model'],
            tokens_used=api_response['tokens_used']
        )
        
        # Save insights
        print(f"Saving {len(parsed_data['insights'])} insights...")
        insight_files = []
        for insight_data in parsed_data['insights']:
            filename = save_insight(run_id, timestamp, insight_data)
            insight_files.append(filename)
        
        # Save actions
        print(f"Saving {len(parsed_data['actions'])} actions...")
        action_files = []
        for action_data in parsed_data['actions']:
            filename = save_action(run_id, timestamp, action_data)
            action_files.append(filename)
        
        # Update manifest
        update_manifest(run_id, timestamp, insight_files, action_files)
        
        print(f"Colt Agent run completed successfully! Run ID: {run_id}")
        print(f"  - Insights: {len(parsed_data['insights'])}")
        print(f"  - Actions: {len(parsed_data['actions'])}")
        print(f"  - Tokens used: {api_response['tokens_used']}")
        
    except Exception as e:
        # Save error run
        print(f"Error during run: {e}")
        save_run(
            run_id=run_id,
            timestamp=timestamp,
            prompt=prompt_config['userPrompt'],
            status='failed',
            error=str(e)
        )
        sys.exit(1)


if __name__ == '__main__':
    main()

