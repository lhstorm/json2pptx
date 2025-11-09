import { ChatAnthropic } from "@langchain/anthropic";

// Get API key from environment
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set');
}

// Create Claude Sonnet client
export const createClaudeClient = (temperature: number = 0.7) => {
  return new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20241022",
    anthropicApiKey: ANTHROPIC_API_KEY,
    temperature,
    maxTokens: 4096,
  });
};

// Default client
export const claudeClient = createClaudeClient();
