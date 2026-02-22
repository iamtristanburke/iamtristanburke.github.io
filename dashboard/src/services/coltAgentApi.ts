/**
 * API service for Colt Agent - fetches data from GitHub JSON files
 */

import type { AgentRun, Insight, Action, PromptConfig } from '../types/colt-agent';
import { validateAgentRun, validateInsight, validateAction, validatePromptConfig } from '../utils/coltAgentSchemas';

// Determine if we're in development or production
const isDevelopment = import.meta.env.DEV;
const REPO_OWNER = 'iamtristanburke';
const REPO_NAME = 'iamtristanburke.github.io';
const BRANCH = 'main'; // or 'master' depending on your default branch

// Base URL for GitHub raw content
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

// Local development base (if running locally, files should be in public or served via proxy)
const LOCAL_BASE = isDevelopment ? '/data' : '';

/**
 * Get the base URL for fetching data files
 */
function getDataBaseUrl(): string {
  if (isDevelopment) {
    // In development, try to use local files or proxy
    // For Vite dev server, files in public/ are served at root
    return '';
  }
  // In production (GitHub Pages), use raw GitHub URLs
  return GITHUB_RAW_BASE;
}

/**
 * Fetch a JSON file from GitHub or local
 */
async function fetchJsonFile<T>(path: string, validator?: (data: unknown) => data is T): Promise<T | null> {
  try {
    const baseUrl = getDataBaseUrl();
    const url = `${baseUrl}${path}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // File doesn't exist yet
      }
      throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (validator && !validator(data)) {
      console.error(`Invalid data format for ${path}`);
      return null;
    }
    
    return data as T;
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return null;
  }
}

/**
 * List JSON files in a directory (GitHub API or local)
 */
async function listJsonFiles(directory: string): Promise<string[]> {
  try {
    const baseUrl = getDataBaseUrl();
    
    if (isDevelopment) {
      // In development, we'd need a different approach - maybe a local API endpoint
      // For now, return empty array - files will be fetched individually
      return [];
    }
    
    // For GitHub, we'd need to use the GitHub API to list files
    // For simplicity, we'll fetch known files or use a manifest
    // This is a limitation - we'll need to maintain a manifest file or use GitHub API
    const manifestUrl = `${baseUrl}/data/colt-agent/manifest.json`;
    const manifest = await fetchJsonFile<{ files: string[] }>(manifestUrl);
    
    if (manifest?.files) {
      return manifest.files.filter(f => f.startsWith(directory));
    }
    
    return [];
  } catch (error) {
    console.error(`Error listing files in ${directory}:`, error);
    return [];
  }
}

/**
 * Fetch agent runs
 */
export async function fetchAgentRuns(limit: number = 10): Promise<AgentRun[]> {
  const runs: AgentRun[] = [];
  
  // For now, we'll try to fetch a manifest or known files
  // In a real implementation, you'd maintain a manifest.json file
  // that lists all run files, or use GitHub API to list directory contents
  
  // Try fetching a manifest first
  const manifestPath = '/data/colt-agent/manifest.json';
  const manifest = await fetchJsonFile<{ runs: string[] }>(manifestPath);
  
  if (manifest?.runs && manifest.runs.length > 0) {
    // Fetch the most recent runs
    const runFiles = manifest.runs.slice(-limit).reverse();
    
    for (const file of runFiles) {
      const run = await fetchJsonFile<AgentRun>(`/data/colt-agent/runs/${file}`, validateAgentRun);
      if (run) {
        runs.push(run);
      }
    }
  }
  
  // If no runs found via manifest, return empty array (will show empty state)
  
  return runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Fetch insights for a specific run or all recent insights
 */
export async function fetchInsights(runId?: string, limit: number = 20): Promise<Insight[]> {
  const insights: Insight[] = [];
  
  if (runId) {
    // Fetch insights for a specific run
    const insightFiles = await listJsonFiles('/data/colt-agent/insights/');
    const relevantFiles = insightFiles.filter(f => f.includes(runId));
    
    for (const file of relevantFiles) {
      const insight = await fetchJsonFile<Insight>(file, validateInsight);
      if (insight) {
        insights.push(insight);
      }
    }
  } else {
    // Fetch all recent insights
    const manifest = await fetchJsonFile<{ insights: string[] }>('/data/colt-agent/manifest.json');
    
    if (manifest?.insights && manifest.insights.length > 0) {
      const insightFiles = manifest.insights.slice(-limit).reverse();
      for (const file of insightFiles) {
        const insight = await fetchJsonFile<Insight>(`/data/colt-agent/insights/${file}`, validateInsight);
        if (insight) {
          insights.push(insight);
        }
      }
    }
  }
  
  return insights.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Fetch actions for a specific run or all recent actions
 */
export async function fetchActions(runId?: string, limit: number = 20): Promise<Action[]> {
  const actions: Action[] = [];
  
  if (runId) {
    // Fetch actions for a specific run
    const actionFiles = await listJsonFiles('/data/colt-agent/actions/');
    const relevantFiles = actionFiles.filter(f => f.includes(runId));
    
    for (const file of relevantFiles) {
      const action = await fetchJsonFile<Action>(file, validateAction);
      if (action) {
        actions.push(action);
      }
    }
  } else {
    // Fetch all recent actions
    const manifest = await fetchJsonFile<{ actions: string[] }>('/data/colt-agent/manifest.json');
    
    if (manifest?.actions && manifest.actions.length > 0) {
      const actionFiles = manifest.actions.slice(-limit).reverse();
      for (const file of actionFiles) {
        const action = await fetchJsonFile<Action>(`/data/colt-agent/actions/${file}`, validateAction);
        if (action) {
          actions.push(action);
        }
      }
    }
  }
  
  return actions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Fetch the current prompt configuration
 */
export async function fetchPromptConfig(): Promise<PromptConfig | null> {
  return fetchJsonFile<PromptConfig>('/prompts/trading-agent.json', validatePromptConfig);
}

/**
 * Update the prompt configuration
 * Note: This would require GitHub API access or a backend endpoint
 * For now, this is a placeholder that would need to be implemented
 * via a backend service or GitHub API integration
 */
export async function updatePromptConfig(config: PromptConfig): Promise<boolean> {
  // This would need to be implemented via:
  // 1. A backend API endpoint that commits to GitHub
  // 2. Direct GitHub API calls (requires authentication)
  // 3. A GitHub App or OAuth integration
  
  console.warn('updatePromptConfig: Not yet implemented. Requires GitHub API integration.');
  return false;
}

/**
 * Trigger a manual agent run
 * Note: This would require GitHub API access to trigger the workflow
 */
export async function triggerManualRun(): Promise<boolean> {
  // This would need to be implemented via GitHub API workflow_dispatch
  console.warn('triggerManualRun: Not yet implemented. Requires GitHub API integration.');
  return false;
}

