import { globalContainer } from '../core/ServiceContainer';
import { ExecutiveBrain } from '../core/ExecutiveBrain';
import { ToolRegistry } from '../tools/ToolRegistry';

/**
 * MCPBridge provides a bridge between the Nexus Agent OS and the Model Context Protocol.
 * It allows external LLMs to use Nexus tools and coordinate missions.
 */
export class MCPBridge {
  private brain: ExecutiveBrain;
  private toolRegistry: ToolRegistry;

  constructor() {
    this.brain = globalContainer.resolve(ExecutiveBrain);
    this.toolRegistry = globalContainer.resolve(ToolRegistry);
  }

  /**
   * Lists available tools in MCP format.
   */
  public listTools() {
    return this.toolRegistry.listTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  /**
   * Calls a tool via the Nexus runtime.
   */
  public async callTool(name: string, args: any) {
    const tool = this.toolRegistry.getTool(name);
    if (!tool) throw new Error(`Tool ${name} not found`);
    return await tool.execute(args);
  }

  /**
   * Initiates a mission via MCP.
   */
  public async startMission(goal: string) {
    return await this.brain.createMission(goal, {
      description: `MCP-initiated mission: ${goal}`,
      successCriteria: ['MCP goal reached'],
      priority: 'high'
    });
  }
}
