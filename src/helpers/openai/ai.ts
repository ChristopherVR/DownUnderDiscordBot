import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { logger } from '../logger/logger.js';

type UserId = number | string;

class AIHelper {
  private conversations = new Map<UserId, ChatCompletionMessageParam[]>();
  private openAI: OpenAI;

  constructor() {
    const apiKey = process.env.OPEN_AI_TOKEN;
    if (!apiKey) {
      throw new Error('OPEN_AI_TOKEN is not set in the environment variables.');
    }
    this.openAI = new OpenAI({ apiKey });
  }

  public async ask(prompt: string, userId: UserId): Promise<string | undefined> {
    try {
      const messages = this.conversations.get(userId) ?? [];

      messages.push({
        content: prompt,
        role: 'user',
      });

      this.conversations.set(userId, messages);

      const completion = await this.openAI.chat.completions.create({
        messages: messages,
        model: 'gpt-3.5-turbo',
      });

      const response = completion.choices[0].message.content?.trim();

      if (response) {
        messages.push({
          content: response,
          role: 'assistant',
        });
        this.conversations.set(userId, messages);
      }

      return response;
    } catch (error) {
      logger('Error communicating with OpenAI', error).error();
      this.clearHistory(userId);
      return 'An error occurred while communicating with OpenAI. Your conversation history has been cleared.';
    }
  }

  public clearHistory(userId: UserId): void {
    this.conversations.delete(userId);
  }
}

export const aiHelper = new AIHelper();
