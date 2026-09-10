/**
 * Advanced Tool interface with schema validation support.
 */
export interface AdvancedTool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: unknown; // JSON Schema or Zod
  outputSchema: unknown;
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Helper to check if a tool is an AdvancedTool.
 */
export function isAdvancedTool(tool: unknown): tool is AdvancedTool {
  return typeof tool === 'object' && tool !== null && 'inputSchema' in tool && 'outputSchema' in tool;
}
