/**
 * Interface for LLM providers that support structured output.
 */
export interface LLMProvider {
  /**
   * Generates a structured output based on a prompt and a schema.
   * @param prompt The prompt to send to the LLM.
   * @param schema The expected structure of the response.
   */
  generateStructuredOutput<T>(prompt: string, schema: unknown): Promise<T>;

  /**
   * Generates a vector embedding for the given text.
   */
  embed(text: string): Promise<number[]>;
}
