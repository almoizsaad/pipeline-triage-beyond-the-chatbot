import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../tools/ToolRegistry';
import { registerDefaultTools } from '../tools/registerTools';

describe('Production Tools Verification', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
    registerDefaultTools(registry);
  });

  it('should have all required tools registered', () => {
    const tools = registry.listTools().map(t => t.name);
    const required = [
      'clock',
      'uuid_generator',
      'filesystem',
      'terminal',
      'git',
      'calculator',
      'json_parser',
      'markdown_processor',
      'csv_parser',
      'pdf_inspector',
      'image_metadata'
    ];

    required.forEach(name => {
      expect(tools).toContain(name);
    });
  });

  it('ClockTool should return current time', async () => {
    const result = await registry.executeTool('clock', {});
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('iso');
    expect(result.data).toHaveProperty('timezone');
  });

  it('UUIDTool should generate a v4 UUID', async () => {
    const result = await registry.executeTool('uuid_generator', { version: 4 });
    expect(result.success).toBe(true);
    expect(result.data.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('CalculatorTool should evaluate expressions', async () => {
    const result = await registry.executeTool('calculator', { expression: '2 + 2 * 3' });
    expect(result.success).toBe(true);
    expect(result.data.result).toBe(8);
  });

  it('JSONTool should parse and format', async () => {
    const parseResult = await registry.executeTool('json_parser', { operation: 'parse', text: '{"a": 1}' });
    expect(parseResult.success).toBe(true);
    expect(parseResult.data.a).toBe(1);

    const formatResult = await registry.executeTool('json_parser', { operation: 'format', data: { b: 2 } });
    expect(formatResult.success).toBe(true);
    expect(formatResult.data).toContain('"b": 2');
  });
});
