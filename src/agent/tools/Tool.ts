import { z } from 'zod';

/**
 * Metadata for a tool, providing versioning and categorization.
 */
export interface ToolMetadata {
  version: string;
  author?: string;
  tags?: string[];
  category?: 'filesystem' | 'network' | 'utility' | 'browser' | 'search' | 'git' | 'http' | 'system' | 'knowledge' | 'protocol' | 'other';
}

/**
 * Permission requirements for tool execution.
 */
export interface ToolPermissions {
  requiredPermissions: string[];
  requiresApproval?: boolean;
}

/**
 * Options for tool execution, including timeouts and retries.
 */
export interface ToolExecutionOptions {
  timeout?: number;
  retry?: {
    attempts: number;
    delay: number;
    backoff?: boolean;
  };
  streaming?: boolean;
  onStream?: (chunk: any) => void;
}

/**
 * Health status of a tool.
 */
export interface ToolHealth {
  status: 'healthy' | 'degraded' | 'failing';
  lastChecked: Date;
  errorCount: number;
  message?: string;
  latency?: number;
}

/**
 * Standard output format for all tool executions.
 */
export interface ToolOutput<TOutput = unknown> {
  success: boolean;
  data?: TOutput;
  error?: string;
  cost?: number; // Estimated cost
  latency: number; // Execution time in ms
  metadata?: Record<string, unknown>;
}

/**
 * Unified Tool interface for the Nexus Agent OS.
 */
export interface Tool<TInput = any, TOutput = any> {
  /**
   * The unique name of the tool.
   */
  readonly name: string;

  /**
   * A clear description of what the tool does and its parameters.
   */
  readonly description: string;

  /**
   * Metadata for the tool.
   */
  readonly metadata: ToolMetadata;

  /**
   * Permission requirements for the tool.
   */
  readonly permissions: ToolPermissions;

  /**
   * Default execution options for the tool.
   */
  readonly options: ToolExecutionOptions;

  /**
   * Zod schema for input validation.
   */
  readonly inputSchema: z.ZodType<TInput>;

  /**
   * Zod schema for output validation.
   */
  readonly outputSchema: z.ZodType<TOutput>;

  /**
   * Executes the tool with the provided input.
   * This is the internal implementation; consumers should use ToolRegistry.
   * @param input The validated input parameters.
   * @param options Overrides for default execution options.
   */
  execute(input: TInput, options?: ToolExecutionOptions): Promise<TOutput>;

  /**
   * Checks the health of the tool (e.g., verifying external dependencies).
   */
  checkHealth(): Promise<ToolHealth>;
}
