import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';
import { ConnectivityLayer } from '../../core/ConnectivityLayer';

/**
 * Tool for web browsing and content extraction.
 */
export class BrowserTool implements Tool<any, any> {
  public readonly name = 'browser';
  public readonly description = 'Browse the web, read page content, extract data, and take screenshots.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.1.0',
    category: 'browser',
    tags: ['web', 'browse', 'scrape', 'html', 'resilient'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['network_access'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 30000
  };

  public readonly inputSchema = z.discriminatedUnion('operation', [
    z.object({
      operation: z.literal('navigate'),
      url: z.string()
    }).passthrough(),
    z.object({
      operation: z.literal('read_page'),
      url: z.string(),
      useProxy: z.boolean().default(true)
    }).passthrough(),
    z.object({
      operation: z.literal('extract_links'),
      url: z.string(),
      useProxy: z.boolean().default(true)
    }).passthrough(),
    z.object({
      operation: z.literal('screenshot'),
      url: z.string()
    }).passthrough(),
    z.object({
      operation: z.literal('extract_dom'),
      url: z.string(),
      selector: z.string().optional(),
      useProxy: z.boolean().default(true)
    }).passthrough()
  ]);
  
  public readonly outputSchema = z.any();

  public async execute(input: any, options?: ToolExecutionOptions): Promise<any> {
    const parsed = this.inputSchema.parse(input);
    const timeout = options?.timeout || this.options.timeout;
    
    switch (parsed.operation) {
      case 'read_page':
        return await this.readPage(parsed.url, (parsed as any).useProxy, timeout);
      case 'extract_links':
        return await this.extractLinks(parsed.url, (parsed as any).useProxy, timeout);
      case 'screenshot':
        return await this.takeScreenshot(parsed.url);
      case 'extract_dom':
        return await this.extractDOM(parsed.url, (parsed as any).selector, (parsed as any).useProxy, timeout);
      case 'navigate':
        return { success: true, url: parsed.url };
      default:
        throw new Error(`Unsupported operation`);
    }
  }

  private getProxyUrl(url: string): string {
    const proxyBase = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_BROWSER_PROXY : process.env.VITE_BROWSER_PROXY) 
      || 'https://cors-anywhere.herokuapp.com/'; // Fallback to public proxy if not configured
    return `${proxyBase}${url}`;
  }

  private async fetchPage(url: string, useProxy: boolean, signal?: AbortSignal): Promise<Response> {
    const targetUrl = useProxy ? this.getProxyUrl(url) : url;
    const response = await fetch(targetUrl, { signal });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  }

  private async readPage(url: string, useProxy: boolean, timeout?: number): Promise<{ title: string; content: string }> {
    return await ConnectivityLayer.withRetry(async ({ signal }) => {
      console.info(`[BrowserTool] Navigating to: ${url} (Proxy: ${useProxy})`);
      
      const response = await this.fetchPage(url, useProxy, signal);
      const html = await response.text();
      
      let title = url;
      let content = '';

      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        title = doc.title;
        
        const scripts = doc.querySelectorAll('script, style, iframe, noscript, svg, path');
        scripts.forEach(s => s.remove());
        
        content = doc.body.innerText.replace(/\s+/g, ' ').trim();
      } else {
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        title = titleMatch ? titleMatch[1] : url;
        content = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                      .replace(/<style[\s\S]*?<\/style>/gi, '')
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();
      }
      
      return { title, content: content.slice(0, 10000) };
    }, { timeout });
  }

  private async extractLinks(url: string, useProxy: boolean, timeout?: number): Promise<{ links: Array<{ text: string; href: string }> }> {
    return await ConnectivityLayer.withRetry(async ({ signal }) => {
      const response = await this.fetchPage(url, useProxy, signal);
      const html = await response.text();
      const links: Array<{ text: string; href: string }> = [];

      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        Array.from(doc.querySelectorAll('a')).forEach(a => {
          const href = a.getAttribute('href');
          if (href && href.startsWith('http')) {
            links.push({ text: a.innerText.trim(), href });
          }
        });
      } else {
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
          if (match[1].startsWith('http')) {
            links.push({ href: match[1], text: match[2].replace(/<[^>]+>/g, '').trim() });
          }
        }
      }
      
      return { links: links.slice(0, 50) };
    }, { timeout });
  }

  private async takeScreenshot(url: string): Promise<{ screenshotUrl: string }> {
    return {
      screenshotUrl: `https://api.screenshot.com/v1/capture?url=${encodeURIComponent(url)}`
    };
  }

  private async extractDOM(url: string, selector: string | undefined, useProxy: boolean, timeout?: number): Promise<{ html: string }> {
    return await ConnectivityLayer.withRetry(async ({ signal }) => {
      const response = await this.fetchPage(url, useProxy, signal);
      const html = await response.text();
      
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        if (selector) {
          const element = doc.querySelector(selector);
          return { html: element ? element.outerHTML : '' };
        }
        
        return { html: doc.documentElement.outerHTML };
      } else {
        return { html }; // Fallback to raw HTML
      }
    }, { timeout });
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
