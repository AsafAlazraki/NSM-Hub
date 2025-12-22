
'use server';
/**
 * @fileOverview An AI agent for retrieving standard features for a boat model.
 *
 * - getStandardFeatures - A function that takes a boat model name and returns its standard features.
 * - GetStandardFeaturesInput - The input type for the getStandardFeatures function.
 * - GetStandardFeaturesOutput - The return type for the getStandardFeatures function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


const GetStandardFeaturesInputSchema = z.object({
  modelName: z.string().describe('The full name of the boat model (e.g., "Sport 520").'),
});
export type GetStandardFeaturesInput = z.infer<typeof GetStandardFeaturesInputSchema>;

const GetStandardFeaturesOutputSchema = z.object({
  features: z.array(z.string()).describe('A list of the standard features for the boat model.'),
});
export type GetStandardFeaturesOutput = z.infer<typeof GetStandardFeaturesOutputSchema>;


export async function getStandardFeatures(input: GetStandardFeaturesInput): Promise<GetStandardFeaturesOutput> {
  const result = await getStandardFeaturesFlow(input);
  return result;
}


const prompt = ai.definePrompt({
  name: 'getStandardFeaturesPrompt',
  input: { schema: GetStandardFeaturesInputSchema },
  output: { schema: GetStandardFeaturesOutputSchema },
  prompt: `You are a boat sales expert who knows the standard features for all Highfield boat models.

Your task is to list the standard features for the following model: {{{modelName}}}

Return the features as a simple list of strings.`,
});

const getStandardFeaturesFlow = ai.defineFlow(
  {
    name: 'getStandardFeaturesFlow',
    inputSchema: GetStandardFeaturesInputSchema,
    outputSchema: GetStandardFeaturesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
