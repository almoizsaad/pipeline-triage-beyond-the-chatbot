import { agent } from '../bootstrap/createAgent';
import { APIMetricsManager } from '../core/APIMetricsManager';
import type { LLMProvider } from '../providers/LLMProvider';

async function runConnectivityTest() {
  console.log('--- Phase 9.1: Real Connectivity Verification ---');
  
  const llmProvider = agent.provider as unknown as LLMProvider;
  const toolRegistry = agent.toolRegistry;
  const eventBus = agent.eventBus;
  const metricsManager = APIMetricsManager.getInstance(eventBus);

  // 1. Test LLM Connectivity
  console.log('\n[1/7] Testing Gemini LLM Connectivity...');
  try {
    const response = await llmProvider.generateStructuredOutput(
      'Verify connection. Respond with { "status": "ok" }',
      { type: 'object', properties: { status: { type: 'string' } } }
    );
    console.log('LLM Response:', response);
  } catch (error: any) {
    console.error('LLM Failure:', error.message);
  }

  // 2. Test Real Search (DuckDuckGo fallback if Tavily fails)
  console.log('\n[2/7] Testing Real Search Tool...');
  try {
    const searchTool = toolRegistry.getTool('search');
    if (!searchTool) throw new Error('Search tool not found');
    const results = await searchTool.execute({ query: 'latest AI news', limit: 2, provider: 'duckduckgo' });
    console.log('Search Results Count:', results.results?.length || 0);
    if (results.results?.[0]) console.log('Top Result:', results.results[0].title);
  } catch (error: any) {
    console.error('Search Failure:', error.message);
  }

  // 3. Test HTTP Tool (REST API)
  console.log('\n[3/7] Testing HTTP Tool (Cloudflare Trace)...');
  try {
    const httpTool = toolRegistry.getTool('http');
    if (!httpTool) throw new Error('HTTP tool not found');
    const response = await httpTool.execute({ url: 'https://1.1.1.1/cdn-cgi/trace', responseType: 'text' });
    console.log('HTTP Response Snippet:', String(response).substring(0, 50));
  } catch (error: any) {
    console.error('HTTP Failure:', error.message);
  }

  // 4. Test Browser Tool (with Proxy)
  console.log('\n[4/7] Testing Browser Tool (Proxy Attempt)...');
  try {
    const browserTool = toolRegistry.getTool('browser');
    if (!browserTool) throw new Error('Browser tool not found');
    const page = await browserTool.execute({ operation: 'read_page', url: 'https://example.com' });
    console.log('Browser Page Title:', page.title);
    console.log('Browser Content Length:', page.content?.length || 0);
  } catch (error: any) {
    console.error('Browser Failure:', error.message);
  }

  // 5. Test Network Failure & Retry
  console.log('\n[5/7] Testing Retry Logic (Invalid URL)...');
  try {
    const httpTool = toolRegistry.getTool('http');
    if (!httpTool) throw new Error('HTTP tool not found');
    await httpTool.execute({ url: 'https://invalid-domain-name-that-should-fail.com' });
  } catch (error: any) {
    console.log('Expected Failure (after retries):', error.message);
  }

  // 6. Test Timeout Logic
  console.log('\n[6/7] Testing Timeout Logic (Slow Endpoint)...');
  try {
    const httpTool = toolRegistry.getTool('http');
    if (!httpTool) throw new Error('HTTP tool not found');
    // Using a delay service to test timeout
    await httpTool.execute({ url: 'https://httpbin.org/delay/5' }, { timeout: 1000 });
  } catch (error: any) {
    console.log('Expected Timeout:', error.message);
  }

  // 7. Verify Metrics & Health
  console.log('\n[7/7] Verifying API Metrics & Health Monitoring...');
  const stats = metricsManager.getAllStats();
  Object.entries(stats).forEach(([provider, s]) => {
    console.log(`- ${provider}: Calls=${s.totalCalls}, SuccessRate=${(s.successRate * 100).toFixed(1)}%, Latency=${s.avgLatency.toFixed(0)}ms, Health=${s.healthStatus}`);
  });

  console.log('\n--- Verification Complete ---');
}

runConnectivityTest().catch(console.error);
