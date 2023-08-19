import { OpenAI } from 'openai';
import { CreateChatCompletionRequestMessage } from 'openai/resources/chat';

type UserId = number | string;

const conversations = new Map<UserId, CreateChatCompletionRequestMessage[]>();

export const ask = async (prompt: string, userId: number | string): Promise<string | undefined> => {
  const openAI = new OpenAI({ apiKey: process.env.OPEN_AI_TOKEN! });

  const messages = conversations.get(userId) ?? [];

  messages.push({
    content: prompt,
    role: 'user',
  });
  const compeltion = await openAI.chat.completions.create({
    messages: messages,
    model: 'gpt-3.5-turbo',
  });

  const response = compeltion.choices[0].message.content?.trim();

  return response;
};

export default ask;
