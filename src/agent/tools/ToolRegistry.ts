import { z } from 'zod';
import type { Tool, ToolOutput, ToolExecutionOptions, ToolHealth } from './Tool';
import { ToolMemory } from '../memory/ToolMemory';

/**
 * ToolRegistry manages a collection of tools, providing methods for
 * registration, retrieval, and safe execution with validation, retries, and timeouts.
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private memory: ToolMemory;

  constructor(memory?: ToolMemory) {
    this.memory = memory || new ToolMemory();
  }

  public get toolMemory(): ToolMemory {
    return this.memory;
  }

  /**
   * Registers a new tool in the registry.
   */
  public register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`[ToolRegistry] Tool with name "${tool.name}" is already registered.`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Checks if a tool with the given name is registered.
   */
  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Retrieves a tool by its unique name.
   */
  public getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Returns a list of all registered tool names and descriptions.
   */
  public listTools(): Array<{ name: string; description: string; metadata: any }> {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      metadata: tool.metadata,
    }));
  }

  public describeTools(): string {
    const description = Array.from(this.tools.values()).map(tool => {
      let inputDesc = 'any';
      
      try {
        inputDesc = this.describeZodSchema(tool.inputSchema);
      } catch (e) {
        inputDesc = 'Schema description unavailable';
      }

      return `- ${tool.name} (v${tool.metadata.version}): ${tool.description}\n  Category: ${tool.metadata.category}\n  Input: ${inputDesc}`;
    }).join('\n');

    return description;
  }

  private describeZodSchema(schema: z.ZodType<any>): string {
    if (!schema || !schema._def) return 'any';

    // Use instanceof for reliable type checking if possible
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const fields = Object.keys(shape).map(key => {
        const field = shape[key];
        const isOptional = field instanceof z.ZodOptional || field instanceof z.ZodDefault;
        return `${key}: ${this.describeZodSchema(field)}${isOptional ? '?' : ''}`;
      });
      return `{ ${fields.join(', ')} }`;
    }

    if (schema instanceof z.ZodDiscriminatedUnion) {
      const options = (schema._def as any).options;
      if (Array.isArray(options)) {
        return `(${options.map((opt: any) => this.describeZodSchema(opt)).join(' | ')})`;
      }
      return 'union';
    }

    if (schema instanceof z.ZodUnion) {
      const options = (schema._def as any).options;
      if (Array.isArray(options)) {
        return `(${options.map((opt: any) => this.describeZodSchema(opt)).join(' | ')})`;
      }
      return 'union';
    }

    if (schema instanceof z.ZodEnum) {
      const values = (schema._def as any).values;
      if (Array.isArray(values)) {
        return values.map((v: any) => `'${v}'`).join(' | ');
      }
      return 'string';
    }

    if (schema instanceof z.ZodArray) {
      const innerType = (schema._def as any).type;
      return `${innerType ? this.describeZodSchema(innerType) : 'any'}[]`;
    }

    if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) {
      const innerType = (schema._def as any).innerType;
      return innerType ? this.describeZodSchema(innerType) : 'any';
    }

    if (schema instanceof z.ZodString) return 'string';
    if (schema instanceof z.ZodNumber) return 'number';
    if (schema instanceof z.ZodBoolean) return 'boolean';

    // Fallback to typeName if available
    const typeName = (schema._def as any).typeName;
    if (typeName) {
      return typeName.replace('Zod', '').toLowerCase();
    }

    return 'any';
  }

  /**
   * Executes a tool with full validation, retry, and timeout support.
   */
  public async executeTool<TInput = any, TOutput = any>(
    name: string,
    input: TInput,
    options?: ToolExecutionOptions
  ): Promise<ToolOutput<TOutput>> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`[ToolRegistry] Tool with name "${name}" not found.`);
    }

    const startTime = Date.now();
    const execOptions = { ...tool.options, ...options };

    try {
      // 1. Validate Input Schema
      let validatedInput;
      try {
        validatedInput = tool.inputSchema.parse(input);
      } catch (validationError: any) {
        console.error(`[ToolRegistry] Validation failed for tool "${name}". Input:`, input);
        const isZodError = validationError instanceof z.ZodError || validationError.name === 'ZodError';
        if (isZodError) {
          const issues = validationError.issues || validationError.errors || [];
          console.error(`[ToolRegistry] Zod validation issues for tool "${name}":`, JSON.stringify(issues, null, 2));
          throw new Error(`Input validation failed for ${name}: ${issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
        }
        console.error(`[ToolRegistry] Unexpected error during validation for tool "${name}":`, validationError);
        throw validationError;
      }

      // 2. Check Permissions (Security Layer)
      await this.verifyPermissions(tool);

      // 3. Execute with Retry and Timeout
      const rawResult = await this.executeWithOrchestration(
        async () => await tool.execute(validatedInput, execOptions),
        execOptions
      );

      // 4. Validate Output Schema
      const validatedOutput = tool.outputSchema.parse(rawResult);

      const latency = Date.now() - startTime;

      // TODO: Implement actual cost estimation if needed
      const cost = 0;

      const output: ToolOutput<TOutput> = {
        success: true,
        data: validatedOutput,
        latency,
        cost,
        metadata: {
          toolVersion: tool.metadata.version,
          executedAt: new Date().toISOString()
        }
      };

      // Log success (Mission 6 integration point)
      this.logExecution(name, validatedInput, output);

      return output;
    } catch (error) {
      const latency = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      
      const output: ToolOutput<TOutput> = {
        success: false,
        error: message,
        latency,
        metadata: {
          toolVersion: tool.metadata.version,
          executedAt: new Date().toISOString()
        }
      };

      // Log failure
      this.logExecution(name, input, output);

      return output;
    }
  }

  /**
   * Verifies that the tool has the necessary permissions to execute.
   */
  private async verifyPermissions(tool: Tool): Promise<void> {
    // Placeholder for real permission system
    if (tool.permissions.requiredPermissions.length > 0) {
      console.log(`[ToolRegistry] Verifying permissions for ${tool.name}: ${tool.permissions.requiredPermissions.join(', ')}`);
    }
    
    if (tool.permissions.requiresApproval) {
      // In a real system, this would trigger an approval flow
      console.log(`[ToolRegistry] Tool ${tool.name} requires manual approval.`);
    }
  }

  /**
   * Handles retry logic and timeouts for tool execution.
   */
  private async executeWithOrchestration<T>(
    operation: () => Promise<T>,
    options: ToolExecutionOptions
  ): Promise<T> {
    const { timeout, retry } = options;
    let attempts = retry?.attempts ?? 1;
    let lastError: any;

    while (attempts > 0) {
      try {
        if (timeout) {
          return await this.withTimeout(operation(), timeout);
        } else {
          return await operation();
        }
      } catch (error) {
        lastError = error;
        attempts--;
        
        if (attempts > 0 && retry) {
          const delay = retry.backoff 
            ? retry.delay * (Math.pow(2, (retry.attempts - attempts))) 
            : retry.delay;
            
          console.warn(`[ToolRegistry] Execution failed, retrying in ${delay}ms... (${attempts} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Wraps a promise with a timeout.
   */
  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Execution timed out after ${ms}ms`)), ms)
      ),
    ]);
  }

  /**
   * Logs tool execution for auditing and memory (Mission 6).
   */
  private logExecution(name: string, input: any, output: ToolOutput): void {
    this.memory.log({
      id: crypto.randomUUID(),
      toolName: name,
      input,
      output,
      timestamp: Date.now()
    });
    console.log(`[ToolRegistry][Log] Tool: ${name}, Success: ${output.success}, Latency: ${output.latency}ms`);
  }

  /**
   * Checks the health of all registered tools.
   */
  public async checkAllHealth(): Promise<Record<string, ToolHealth>> {
    const healthMap: Record<string, ToolHealth> = {};
    for (const [name, tool] of this.tools.entries()) {
      healthMap[name] = await tool.checkHealth();
    }
    return healthMap;
  }

  public unregister(name: string): void {
    this.tools.delete(name);
  }

  public clear(): void {
    this.tools.clear();
  }
}

// Export a singleton instance for common use cases
export const globalToolRegistry = new ToolRegistry();
