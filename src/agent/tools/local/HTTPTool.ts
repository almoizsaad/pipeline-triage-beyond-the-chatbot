import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';
import { ConnectivityLayer } from '../../core/ConnectivityLayer';
import { APIMetricsManager } from '../../core/APIMetricsManager';

/**
 * Tool for performing HTTP requests.
 */
export class HTTPTool implements Tool<any, any> {
  public readonly name = 'http';
  public readonly description = 'Perform HTTP requests (GET, POST, PUT, DELETE, etc.) to any API.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.1.0',
    category: 'http',
    tags: ['http', 'api', 'rest', 'network', 'resilient'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['network_access'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 30000
  };

  private metrics?: APIMetricsManager;

  constructor(metrics?: APIMetricsManager) {
    this.metrics = metrics;
  }

  public readonly inputSchema = z.object({
    url: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.any().optional(),
    responseType: z.enum(['json', 'text', 'blob']).default('json'),
    rateLimitKey: z.string().optional()
  }).passthrough();
  
  public readonly outputSchema = z.any();

  public async execute(input: any, options?: ToolExecutionOptions): Promise<any> {
    const { url, method, headers, body, responseType, rateLimitKey } = input;
    const start = Date.now();
    const provider = new URL(url).hostname;
    
    // Apply rate limiting if a key is provided
    if (rateLimitKey) {
      await ConnectivityLayer.withRateLimit(rateLimitKey, 10, 60000); // Default 10 req/min per key
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const result = await ConnectivityLayer.withRetry(async ({ signal }) => {
        const response = await fetch(url, { ...fetchOptions, signal });
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        if (options?.streaming && options.onStream && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            options.onStream(decoder.decode(value, { stream: true }));
          }
        }

        let data;
        switch (responseType) {
          case 'json':
            data = await response.json();
            break;
          case 'text':
            data = await response.text();
            break;
          case 'blob':
            data = await response.blob();
            break;
          default:
            data = await response.json();
        }

        this.metrics?.recordMetric({
          provider,
          operation: method,
          status: 'success',
          latency: Date.now() - start
        });

        return data;
      }, { timeout: options?.timeout || this.options.timeout });

      return result;
    } catch (error: any) {
      this.metrics?.recordMetric({
        provider,
        operation: method,
        status: 'failure',
        latency: Date.now() - start
      });
      throw error;
    }
  }

  public async checkHealth(): Promise<ToolHealth> {
    try {
      const start = Date.now();
      // Test connectivity to a reliable DNS/API endpoint
      const response = await fetch('https://1.1.1.1/cdn-cgi/trace', { method: 'GET', mode: 'cors' });
      if (!response.ok) throw new Error('Cloudflare check failed');
      
      return {
        status: 'healthy',
        lastChecked: new Date(),
        errorCount: 0,
        latency: Date.now() - start
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        lastChecked: new Date(),
        errorCount: 1,
        message: `Network check failed: ${error.message}`
      };
    }
  }
}
