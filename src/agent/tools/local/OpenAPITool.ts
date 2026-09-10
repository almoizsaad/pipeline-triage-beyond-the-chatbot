import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';
import { ConnectivityLayer } from '../../core/ConnectivityLayer';

/**
 * Tool for dynamically interacting with any OpenAPI-compliant API.
 */
export class OpenAPITool implements Tool<any, any> {
  public readonly name = 'openapi';
  public readonly description = 'Execute requests against any API defined by an OpenAPI/Swagger specification.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'http',
    tags: ['openapi', 'swagger', 'api', 'dynamic'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['network_access'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 30000
  };

  public readonly inputSchema = z.object({
    specUrl: z.string().describe('URL to the OpenAPI specification JSON/YAML'),
    operationId: z.string().describe('The operationId to execute'),
    parameters: z.record(z.string(), z.any()).optional().describe('Path, query, or header parameters'),
    body: z.any().optional().describe('Request body'),
    baseUrl: z.string().optional().describe('Override the base URL defined in the spec')
  }).passthrough();
  
  public readonly outputSchema = z.any();

  public async execute(input: any, options?: ToolExecutionOptions): Promise<any> {
    const { specUrl, operationId, parameters, body, baseUrl: baseUrlOverride } = input;

    // 1. Fetch Spec
    const specResponse = await fetch(specUrl);
    if (!specResponse.ok) {
      throw new Error(`Failed to fetch OpenAPI spec from ${specUrl}`);
    }
    const spec = await specResponse.json();

    // 2. Resolve Operation
    const operation = this.findOperation(spec, operationId);
    if (!operation) {
      throw new Error(`Operation "${operationId}" not found in spec.`);
    }

    // 3. Build URL and Request
    const baseUrl = baseUrlOverride || spec.servers?.[0]?.url || '';
    const { url, method } = this.buildRequest(baseUrl, operation.path, operation.method, parameters);

    // 4. Execute with Resilience
    return await ConnectivityLayer.withRetry(async ({ signal }) => {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(parameters?.headers || {})
        },
        body: body ? JSON.stringify(body) : undefined,
        signal
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    }, { timeout: options?.timeout || this.options.timeout });
  }

  private findOperation(spec: any, operationId: string): { path: string; method: string; op: any } | null {
    for (const [path, methods] of Object.entries(spec.paths || {})) {
      for (const [method, op] of Object.entries(methods as any)) {
        if ((op as any).operationId === operationId) {
          return { path, method, op };
        }
      }
    }
    return null;
  }

  private buildRequest(baseUrl: string, path: string, method: string, params: any): { url: string; method: string } {
    let renderedPath = path;
    const queryParams = new URLSearchParams();

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (renderedPath.includes(`{${key}}`)) {
          renderedPath = renderedPath.replace(`{${key}}`, String(value));
        } else {
          queryParams.append(key, String(value));
        }
      }
    }

    const queryString = queryParams.toString();
    const url = `${baseUrl.replace(/\/$/, '')}${renderedPath}${queryString ? `?${queryString}` : ''}`;

    return { url, method: method.toUpperCase() };
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
