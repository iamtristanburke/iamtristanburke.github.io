/**
 * API service for Colt Agent - uses Firebase Realtime Database
 */

import type { AgentRun, Insight, Action, PromptConfig } from '../types/colt-agent';
import { validateAgentRun, validateInsight, validateAction, validatePromptConfig } from '../utils/coltAgentSchemas';
import { getFirebaseDatabase } from '../config/firebase';
import { ref, get, query, orderByChild, limitToLast, startAt, endAt, set, push } from 'firebase/database';

const DB_BASE_PATH = 'colt-agent';

/**
 * Fetch agent runs
 */
export async function fetchAgentRuns(runLimit: number = 10): Promise<AgentRun[]> {
  const db = getFirebaseDatabase();
  if (!db) {
    console.warn('Firebase not initialized. Falling back to empty array.');
    return [];
  }

  try {
    const runsRef = ref(db, `${DB_BASE_PATH}/runs`);
    const snapshot = await get(query(runsRef, orderByChild('timestamp'), limitToLast(runLimit)));
    
    if (!snapshot.exists()) {
      return [];
    }

    const runs: AgentRun[] = [];
    snapshot.forEach((childSnapshot) => {
      const run = childSnapshot.val();
      if (validateAgentRun(run)) {
        runs.push(run);
      }
    });

    return runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (error) {
    console.error('Error fetching agent runs:', error);
    return [];
  }
}

/**
 * Fetch insights for a specific run or all recent insights
 */
export async function fetchInsights(runId?: string, insightLimit: number = 20): Promise<Insight[]> {
  const db = getFirebaseDatabase();
  if (!db) {
    console.warn('Firebase not initialized. Falling back to empty array.');
    return [];
  }

  try {
    const insightsRef = ref(db, `${DB_BASE_PATH}/insights`);
    let queryRef;
    
    if (runId) {
      // Filter by runId - use orderByChild with startAt/endAt for range query
      queryRef = query(insightsRef, orderByChild('runId'), startAt(runId), endAt(runId + '\uf8ff'), limitToLast(insightLimit));
    } else {
      // Get all recent insights
      queryRef = query(insightsRef, orderByChild('timestamp'), limitToLast(insightLimit));
    }

    const snapshot = await get(queryRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const insights: Insight[] = [];
    snapshot.forEach((childSnapshot) => {
      const insight = childSnapshot.val();
      if (validateInsight(insight)) {
        // Double-check runId match if filtering
        if (!runId || insight.runId === runId) {
          insights.push(insight);
        }
      }
    });

    return insights.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (error) {
    console.error('Error fetching insights:', error);
    return [];
  }
}

/**
 * Fetch actions for a specific run or all recent actions
 */
export async function fetchActions(runId?: string, actionLimit: number = 20): Promise<Action[]> {
  const db = getFirebaseDatabase();
  if (!db) {
    console.warn('Firebase not initialized. Falling back to empty array.');
    return [];
  }

  try {
    const actionsRef = ref(db, `${DB_BASE_PATH}/actions`);
    let queryRef;
    
    if (runId) {
      // Filter by runId - use orderByChild with startAt/endAt for range query
      queryRef = query(actionsRef, orderByChild('runId'), startAt(runId), endAt(runId + '\uf8ff'), limitToLast(actionLimit));
    } else {
      // Get all recent actions
      queryRef = query(actionsRef, orderByChild('timestamp'), limitToLast(actionLimit));
    }

    const snapshot = await get(queryRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const actions: Action[] = [];
    snapshot.forEach((childSnapshot) => {
      const action = childSnapshot.val();
      if (validateAction(action)) {
        // Double-check runId match if filtering
        if (!runId || action.runId === runId) {
          actions.push(action);
        }
      }
    });

    return actions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (error) {
    console.error('Error fetching actions:', error);
    return [];
  }
}

/**
 * Fetch the current prompt configuration
 */
export async function fetchPromptConfig(): Promise<PromptConfig | null> {
  const db = getFirebaseDatabase();
  if (!db) {
    console.warn('Firebase not initialized. Cannot fetch prompt config.');
    return null;
  }

  try {
    const promptRef = ref(db, `${DB_BASE_PATH}/prompt`);
    const snapshot = await get(promptRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    const config = snapshot.val();
    if (validatePromptConfig(config)) {
      return config;
    }

    return null;
  } catch (error) {
    console.error('Error fetching prompt config:', error);
    return null;
  }
}

/**
 * Update the prompt configuration
 */
export async function updatePromptConfig(config: PromptConfig): Promise<boolean> {
  const db = getFirebaseDatabase();
  if (!db) {
    console.warn('Firebase not initialized. Cannot update prompt config.');
    return false;
  }

  try {
    const promptRef = ref(db, `${DB_BASE_PATH}/prompt`);
    await set(promptRef, config);
    return true;
  } catch (error) {
    console.error('Error updating prompt config:', error);
    return false;
  }
}

/**
 * Trigger a manual agent run
 * Note: This would require a backend endpoint or GitHub API integration
 */
export async function triggerManualRun(): Promise<boolean> {
  // This could be implemented by:
  // 1. Writing a trigger flag to Firebase that the GitHub Action polls
  // 2. Using GitHub API to trigger workflow_dispatch
  // 3. A backend endpoint that triggers the workflow
  
  console.warn('triggerManualRun: Not yet implemented.');
  return false;
}
