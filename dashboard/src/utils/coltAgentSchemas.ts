/**
 * Zod validation schemas for Colt Agent data
 * Note: Install zod with: npm install zod
 */

// We'll use a type-safe approach - if zod is not available, we'll use type guards
// For now, define the schemas structure that can be used once zod is installed

export interface ZodSchema {
  parse: (data: unknown) => unknown;
  safeParse: (data: unknown) => { success: boolean; data?: unknown; error?: unknown };
}

// Type guards as fallback until zod is installed
export function validateAgentRun(data: unknown): data is import('../types/colt-agent').AgentRun {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.prompt === 'string' &&
    (obj.status === 'completed' || obj.status === 'failed' || obj.status === 'running')
  );
}

export function validateInsight(data: unknown): data is import('../types/colt-agent').Insight {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.runId === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.confidence === 'number' &&
    obj.confidence >= 0 &&
    obj.confidence <= 100
  );
}

export function validateAction(data: unknown): data is import('../types/colt-agent').Action {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.runId === 'string' &&
    typeof obj.timestamp === 'string' &&
    (obj.type === 'buy' || obj.type === 'sell') &&
    typeof obj.ticker === 'string' &&
    typeof obj.rationale === 'string' &&
    typeof obj.confidence === 'number' &&
    obj.confidence >= 0 &&
    obj.confidence <= 100
  );
}

export function validatePromptConfig(data: unknown): data is import('../types/colt-agent').PromptConfig {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.version !== 'number' || typeof obj.systemMessage !== 'string' || typeof obj.userPrompt !== 'string') {
    return false;
  }
  if (typeof obj.parameters !== 'object' || obj.parameters === null) return false;
  const params = obj.parameters as Record<string, unknown>;
  return (
    typeof params.model === 'string' &&
    typeof params.temperature === 'number' &&
    typeof params.maxTokens === 'number'
  );
}

// Once zod is installed, replace the above with proper schemas:
/*
import { z } from 'zod';

export const AgentRunSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  prompt: z.string(),
  status: z.enum(['completed', 'failed', 'running']),
  output: z.string().optional(),
  error: z.string().optional(),
  model: z.string().optional(),
  tokensUsed: z.number().optional(),
});

export const InsightSchema = z.object({
  id: z.string(),
  runId: z.string(),
  timestamp: z.string(),
  category: z.enum(['market', 'sector', 'stock', 'macro', 'technical', 'fundamental']),
  content: z.string(),
  confidence: z.number().min(0).max(100),
  relatedTickers: z.array(z.string()).optional(),
});

export const ActionSchema = z.object({
  id: z.string(),
  runId: z.string(),
  timestamp: z.string(),
  type: z.enum(['buy', 'sell']),
  ticker: z.string(),
  rationale: z.string(),
  confidence: z.number().min(0).max(100),
  targetPrice: z.number().optional(),
  stopLoss: z.number().optional(),
  quantity: z.number().optional(),
});

export const PromptConfigSchema = z.object({
  version: z.number(),
  systemMessage: z.string(),
  userPrompt: z.string(),
  parameters: z.object({
    model: z.string(),
    temperature: z.number(),
    maxTokens: z.number(),
  }),
});
*/

