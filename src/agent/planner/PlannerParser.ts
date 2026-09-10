/**
 * PlannerParser handles the extraction and recovery of JSON plans from LLM responses.
 */
export class PlannerParser {
  /**
   * Extracts JSON from a string that may contain markdown fences or other text.
   */
  public parsePlan<T>(input: string): T {
    try {
      // 1. Attempt direct parse
      return JSON.parse(input) as T;
    } catch {
      // 2. Attempt to extract from markdown fences
      const jsonMatch = input.match(/```json\n([\s\S]*?)\n```/) || input.match(/```([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1].trim()) as T;
        } catch {
          // Continue to recovery
        }
      }

      // 3. Attempt to find first { and last }
      const firstBrace = input.indexOf('{');
      const lastBrace = input.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          const rawJson = input.substring(firstBrace, lastBrace + 1);
          return JSON.parse(rawJson) as T;
        } catch {
          throw new Error('Failed to recover malformed JSON from LLM response.');
        }
      }

      throw new Error(`Invalid JSON format in LLM response: ${input.substring(0, 100)}...`);
    }
  }

  /**
   * Basic recovery for common malformed JSON issues.
   */
  public recoverMalformed(input: string): string {
    // This could be expanded to fix common issues like trailing commas
    return input.trim();
  }
}
