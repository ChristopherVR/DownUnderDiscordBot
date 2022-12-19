import { Configuration, OpenAIApi } from 'openai';
import { env } from 'process';

const configuration = new Configuration({
  apiKey: env.OPEN_AI_TOKEN,
});
const openai = new OpenAIApi(configuration);
export const ask = async (prompt: string | undefined): Promise<string | undefined> => {
  const response = await openai.createCompletion({
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
