/**
 * TypeScript interfaces for Colt Agent trading tool
 */

export interface AgentRun {
  id: string;
  timestamp: string; // ISO 8601 format
  prompt: string;
  status: 'completed' | 'failed' | 'running';
  output?: string;
  error?: string;
  model?: string;
  tokensUsed?: number;
}

export interface Insight {
  id: string;
  runId: string;
  timestamp: string; // ISO 8601 format
  category: 'market' | 'sector' | 'stock' | 'macro' | 'technical' | 'fundamental';
  content: string;
  confidence: number; // 0-100
  relatedTickers?: string[];
}

export interface Action {
  id: string;
  runId: string;
  timestamp: string; // ISO 8601 format
  type: 'buy' | 'sell';
  ticker: string;
  rationale: string;
  confidence: number; // 0-100
  targetPrice?: number;
  stopLoss?: number;
  quantity?: number;
}

export interface PromptConfig {
  version: number;
  systemMessage: string;
  userPrompt: string;
  parameters: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
}

