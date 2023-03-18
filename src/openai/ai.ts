import { Configuration, OpenAIApi } from 'openai';

export const ask = async (prompt: string | undefined): Promise<string | undefined> => {
  const configuration = new Configuration({
    apiKey: process.env.OPEN_AI_TOKEN,
  });
  const openAI = new OpenAIApi(configuration);
  const response = await openAI.createCompletion({
    model: 'text-davinci-002',
    prompt,
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  const answer = response.data.choices[0].text;
  return answer;
};

export default ask;
