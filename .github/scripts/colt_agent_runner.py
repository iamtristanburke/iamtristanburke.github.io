#!/usr/bin/env python3
"""
Colt Agent Runner - Executes LLM analysis and saves results to Firebase Realtime Database
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
DB_BASE_PATH = "colt-agent"

# Firebase configuration from environment
FIREBASE_DATABASE_URL = os.getenv('FIREBASE_DATABASE_URL')
FIREBASE_SERVICE_ACCOUNT_KEY = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')  # JSON string or path to file


def get_firebase_auth_token() -> str:
    """Get Firebase auth token for REST API authentication."""
    # For Realtime Database, we can use a service account or database secrets
    # For simplicity, we'll use the database URL with .json endpoint
    # In production, you'd want to use proper authentication
    service_account_key = FIREBASE_SERVICE_ACCOUNT_KEY
    if service_account_key:
        # If it's a file path, read it
        if os.path.isfile(service_account_key):
            with open(service_account_key, 'r') as f:
                service_account = json.load(f)
        else:
            # Assume it's a JSON string
            service_account = json.loads(service_account_key)
        
        # Use Firebase Admin SDK or REST API with service account
        # For now, we'll use the simpler approach with database secrets
        # In production, implement proper OAuth2 token generation
        pass
    
    # Return empty string - Firebase Realtime Database REST API can work without auth
    # if database rules allow it, or use database secrets
    return ""


def firebase_write(path: str, data: Dict[str, Any]) -> bool:
    """Write data to Firebase Realtime Database using REST API."""
    if not FIREBASE_DATABASE_URL:
        print("Error: FIREBASE_DATABASE_URL environment variable not set")
        return False
    
    # Remove trailing slash from database URL
    db_url = FIREBASE_DATABASE_URL.rstrip('/')
    
    # Construct the full path
    full_path = f"{db_url}/{path}.json"
    
    # Add auth token if available
    auth_token = get_firebase_auth_token()
    params = {}
    if auth_token:
        params['auth'] = auth_token
    
    try:
        response = requests.put(full_path, json=data, params=params, timeout=10)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error writing to Firebase: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return False


def firebase_read(path: str) -> Dict[str, Any] | None:
    """Read data from Firebase Realtime Database using REST API."""
    if not FIREBASE_DATABASE_URL:
        return None
    
    db_url = FIREBASE_DATABASE_URL.rstrip('/')
    full_path = f"{db_url}/{path}.json"
    
    auth_token = get_firebase_auth_token()
    params = {}
    if auth_token:
        params['auth'] = auth_token
    
    try:
        response = requests.get(full_path, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error reading from Firebase: {e}")
        return None


def load_prompt_config() -> Dict[str, Any]:
    """Load the prompt configuration from JSON file or Firebase."""
    # Try Firebase first
    firebase_config = firebase_read(f"{DB_BASE_PATH}/prompt")
    if firebase_config:
        print("Loaded prompt configuration from Firebase")
        return firebase_config
    
    # Fallback to local file
    if not PROMPT_FILE.exists():
        print(f"Error: Prompt file not found at {PROMPT_FILE} and not in Firebase")
        sys.exit(1)
    
    with open(PROMPT_FILE, 'r') as f:
        config = json.load(f)
        print("Loaded prompt configuration from local file")
        return config


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
             error: str = None, model: str = None, tokens_used: int = None) -> bool:
    """Save agent run to Firebase."""
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
    
    path = f"{DB_BASE_PATH}/runs/{run_id}"
    success = firebase_write(path, run_data)
    
    if success:
        print(f"Saved run to Firebase: {path}")
    else:
        print(f"Failed to save run to Firebase: {path}")
    
    return success


def save_insight(run_id: str, timestamp: str, insight_data: Dict[str, Any]) -> str:
    """Save an insight to Firebase."""
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
    
    path = f"{DB_BASE_PATH}/insights/{insight_id}"
    if firebase_write(path, insight):
        print(f"Saved insight to Firebase: {path}")
    else:
        print(f"Failed to save insight to Firebase: {path}")
    
    return insight_id


def save_action(run_id: str, timestamp: str, action_data: Dict[str, Any]) -> str:
    """Save an action to Firebase."""
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
    
    path = f"{DB_BASE_PATH}/actions/{action_id}"
    if firebase_write(path, action):
        print(f"Saved action to Firebase: {path}")
    else:
        print(f"Failed to save action to Firebase: {path}")
    
    return action_id


def update_manifest(run_id: str, insight_ids: List[str], action_ids: List[str]):
    """Update manifest in Firebase with new run information."""
    manifest_path = f"{DB_BASE_PATH}/manifest"
    
    # Read existing manifest
    manifest = firebase_read(manifest_path) or {'runs': [], 'insights': [], 'actions': []}
    
    # Add new IDs
    if run_id not in manifest.get('runs', []):
        manifest.setdefault('runs', []).append(run_id)
    
    for insight_id in insight_ids:
        if insight_id not in manifest.get('insights', []):
            manifest.setdefault('insights', []).append(insight_id)
    
    for action_id in action_ids:
        if action_id not in manifest.get('actions', []):
            manifest.setdefault('actions', []).append(action_id)
    
    # Keep only last 100 entries
    manifest['runs'] = manifest['runs'][-100:]
    manifest['insights'] = manifest['insights'][-500:]
    manifest['actions'] = manifest['actions'][-500:]
    
    firebase_write(manifest_path, manifest)
    print(f"Updated manifest in Firebase")


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
        if not save_run(
            run_id=run_id,
            timestamp=timestamp,
            prompt=prompt_config['userPrompt'],
            status='completed',
            output=api_response['content'],
            model=api_response['model'],
            tokens_used=api_response['tokens_used']
        ):
            print("Warning: Failed to save run to Firebase")
        
        # Save insights
        print(f"Saving {len(parsed_data['insights'])} insights...")
        insight_ids = []
        for insight_data in parsed_data['insights']:
            insight_id = save_insight(run_id, timestamp, insight_data)
            insight_ids.append(insight_id)
        
        # Save actions
        print(f"Saving {len(parsed_data['actions'])} actions...")
        action_ids = []
        for action_data in parsed_data['actions']:
            action_id = save_action(run_id, timestamp, action_data)
            action_ids.append(action_id)
        
        # Update manifest
        update_manifest(run_id, insight_ids, action_ids)
        
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
