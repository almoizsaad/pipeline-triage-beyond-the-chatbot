import type { LLMProvider } from './LLMProvider';
import { ConnectivityLayer } from '../core/ConnectivityLayer';
import { APIMetricsManager } from '../core/APIMetricsManager';

export class GeminiLLMProvider implements LLMProvider {
  private apiKey: string;
  private apiBase: string;
  private model: string;
  private metrics?: APIMetricsManager;

  constructor(
    apiKey: string = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_GEMINI_API_KEY : process.env.VITE_GEMINI_API_KEY) || '',
    apiBase: string = 'https://generativelanguage.googleapis.com/v1beta',
    model: string = 'gemini-3.1-flash-lite',
    metrics?: APIMetricsManager
  ) {
    this.apiKey = apiKey;
    this.apiBase = apiBase;
    this.model = model;
    this.metrics = metrics;

    if (!this.apiKey) {
      console.warn('[GeminiLLMProvider] API key not configured. Calls will fail.');
    }
  }

  public async generateStructuredOutput<T>(prompt: string, schema: unknown): Promise<T> {
    if (!this.apiKey) {
      throw new Error('[GeminiLLMProvider] API key not configured.');
    }

    const start = Date.now();
    try {
      return await ConnectivityLayer.withRetry(async ({ signal }) => {
        const fullPrompt = `${prompt}\n\nIMPORTANT: You MUST respond with a valid JSON object matching this schema: ${JSON.stringify(schema)}. Do not include any other text.`;
        
        const response = await fetch(`${this.apiBase}/models/${this.model}:generateContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: fullPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`[GeminiLLMProvider] API error: ${response.status} ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!content) {
          throw new Error('[GeminiLLMProvider] No content returned from API');
        }

        // Record metrics
        const tokens = data.usageMetadata?.totalTokenCount || 0;
        this.metrics?.recordMetric({
          provider: 'gemini',
          operation: 'generateStructuredOutput',
          status: 'success',
          latency: Date.now() - start,
          tokens,
          cost: (tokens / 1000000) * 0.1 // Rough estimate for flash-lite: $0.1 per 1M tokens
        });

        try {
          const cleaned = content.replace(/^```json\n?/, '').replace(/```$/, '').trim();
          return JSON.parse(cleaned) as T;
        } catch (parseError) {
          console.error('[GeminiLLMProvider] JSON parse error:', parseError, 'Content:', content);
          throw new Error('[GeminiLLMProvider] Failed to parse JSON response');
        }
      }, { timeout: 30000 });
    } catch (error: any) {
      this.metrics?.recordMetric({
        provider: 'gemini',
        operation: 'generateStructuredOutput',
        status: 'failure',
        latency: Date.now() - start
      });
      console.error('[GeminiLLMProvider] Error generating structured output:', error);
      throw error;
    }
  }

  public async embed(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('[GeminiLLMProvider] API key not configured.');
    }

    const start = Date.now();
    try {
      return await ConnectivityLayer.withRetry(async ({ signal }) => {
        const response = await fetch(`${this.apiBase}/models/gemini-embedding-2:embedContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal,
          body: JSON.stringify({
            model: 'models/gemini-embedding-2',
            content: {
              parts: [{ text }],
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`[GeminiLLMProvider] Embedding API error: ${response.status}`);
        }

        const data = await response.json();
        
        this.metrics?.recordMetric({
          provider: 'gemini',
          operation: 'embed',
          status: 'success',
          latency: Date.now() - start,
          tokens: text.length / 4, // Very rough estimate
          cost: 0 // Embedding is usually free or very cheap
        });

        return data.embedding.values;
      }, { timeout: 10000 });
    } catch (error: any) {
      this.metrics?.recordMetric({
        provider: 'gemini',
        operation: 'embed',
        status: 'failure',
        latency: Date.now() - start
      });
      console.error('[GeminiLLMProvider] Error generating embedding:', error);
      return this.fallbackEmbed(text);
    }
  }

  private fallbackEmbed(text: string): number[] {
    const size = 128;
    const embedding = new Array(size).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 0);

    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        const char = word.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }

      for (let i = 0; i < size; i++) {
        const x = Math.sin(hash + i) * 10000;
        embedding[i] += x - Math.floor(x);
      }
    }

    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < size; i++) {
        embedding[i] /= norm;
      }
    }

    return embedding;
  }
}
