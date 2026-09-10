import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Adapter tool for interacting with Model Context Protocol (MCP) servers.
 */
export class MCPTool implements Tool<any, any> {
  public readonly name = 'mcp';
  public readonly description = 'Interact with any Model Context Protocol (MCP) server to access specialized tools and resources.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'protocol',
    tags: ['mcp', 'protocol', 'adapter', 'agent-os'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['network_access', 'mcp_execute'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 30000
  };

  public readonly inputSchema = z.discriminatedUnion('operation', [
    z.object({
      operation: z.literal('list_tools'),
      serverUrl: z.string()
    }).passthrough(),
    z.object({
      operation: z.literal('call_tool'),
      serverUrl: z.string(),
      toolName: z.string(),
      args: z.record(z.string(), z.any()).optional()
    }).passthrough(),
    z.object({
      operation: z.literal('list_resources'),
      serverUrl: z.string()
    }).passthrough(),
    z.object({
      operation: z.literal('read_resource'),
      serverUrl: z.string(),
      uri: z.string()
    }).passthrough()
  ]);
  
  public readonly outputSchema = z.any();

  public async execute(input: any): Promise<any> {
    const { operation, serverUrl } = input;

    // In a real implementation, this would use the MCP SDK or a JSON-RPC over HTTP/SSE/WebSocket client.
    // For Nexus OS, we assume a JSON-RPC over HTTP bridge for simplicity in the web environment.
    
    try {
      let method = '';
      let params = {};

      switch (operation) {
        case 'list_tools':
          method = 'tools/list';
          break;
        case 'call_tool':
          method = 'tools/call';
          params = { name: input.toolName, arguments: input.args || {} };
          break;
        case 'list_resources':
          method = 'resources/list';
          break;
        case 'read_resource':
          method = 'resources/read';
          params = { uri: input.uri };
          break;
      }

      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Math.random().toString(36).substring(7),
          method,
          params
        })
      });

      if (!response.ok) {
        throw new Error(`MCP Server Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(`MCP Protocol Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      return data.result;
    } catch (error: any) {
      throw new Error(`MCP Request failed: ${error.message}`);
    }
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
