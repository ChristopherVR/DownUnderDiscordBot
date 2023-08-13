import { Configuration, OpenAIApi } from 'openai';

export const ask = async (
  prompt: string | undefined,
  conversationId?: number | string,
): Promise<{
  answer: string | undefined;
  conversationId: string | undefined;
}> => {
  const configuration = new Configuration({
    apiKey: process.env.OPEN_AI_TOKEN,
  });
  const openAI = new OpenAIApi(configuration);
  const response = await openAI.createCompletion({
    model: 'gpt-3.5-turbo',
    prompt,
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    ...(conversationId ? { context: conversationId } : {}),
  });

  const answer = response.data.choices[0].text?.trim();
  const id = response.headers['x-ctx-conversation-id'];

  return {
    answer,
    conversationId: id,
  };
};

export default ask;
