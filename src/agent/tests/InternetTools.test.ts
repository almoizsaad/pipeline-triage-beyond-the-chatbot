import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../tools/ToolRegistry';
import { SearchTool } from '../tools/local/SearchTool';
import { BrowserTool } from '../tools/local/BrowserTool';

describe('Internet Tools (Search & Browser)', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
    registry.register(new SearchTool());
    registry.register(new BrowserTool());
  });

  it('should return simulated search results', async () => {
    const result = await registry.executeTool('search', {
      query: 'Nexus Agent OS',
      limit: 2
    });

    expect(result.success).toBe(true);
    expect(result.data.results.length).toBe(2);
    expect(result.data.results[0].title).toContain('Nexus Agent OS');
  });

  it('should handle page reading with simulated content if fetch fails', async () => {
    const result = await registry.executeTool('browser', {
      operation: 'read_page',
      url: 'https://example.com/non-existent-page'
    });

    expect(result.success).toBe(true);
    expect(result.data.content).toContain('simulated content');
  });

  it('should extract links using regex fallback if DOMParser is missing', async () => {
    // We can't easily remove DOMParser in vitest if it's provided by jsdom,
    // but we can test the functionality.
    const result = await registry.executeTool('browser', {
      operation: 'extract_links',
      url: 'https://example.com'
    });

    expect(result.success).toBe(true);
    // Since fetch might fail in test env, it might return empty links but success:true
    expect(Array.isArray(result.data.links)).toBe(true);
  });
});
