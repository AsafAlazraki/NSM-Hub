
'use server';
/**
 * @fileOverview An AI agent for generating service operation descriptions.
 *
 * - generateOperationDescription - A function that generates a detailed description for a service operation heading.
 * - GenerateOperationDescriptionInput - The input type for the generateOperationDescription function.
 * - GenerateOperationDescriptionOutput - The return type for the generateOperationDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getSampleOperations } from '@/lib/storage';


const GenerateOperationDescriptionInputSchema = z.object({
  heading: z.string().describe('The heading of the service operation (e.g., "Annual Engine Service").'),
});
export type GenerateOperationDescriptionInput = z.infer<typeof GenerateOperationDescriptionInputSchema>;


const GenerateOperationDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('The detailed, checklist-style description for the service operation.'),
});
export type GenerateOperationDescriptionOutput = z.infer<typeof GenerateOperationDescriptionOutputSchema>;


export async function generateOperationDescription(input: GenerateOperationDescriptionInput): Promise<GenerateOperationDescriptionOutput> {
    const existingOperations = await getSampleOperations(5);
    const result = await generateOperationDescriptionFlow({ ...input, existingOperations });
    return result;
}


const prompt = ai.definePrompt({
  name: 'generateOperationDescriptionPrompt',
  input: { schema: z.object({
    heading: GenerateOperationDescriptionInputSchema.shape.heading,
    existingOperations: z.array(z.object({
        heading: z.string(),
        description: z.string(),
    })).describe("A few examples of existing operations to learn the style from.")
  })},
  output: { schema: GenerateOperationDescriptionOutputSchema },
  prompt: `You are an expert marine service technician. Your task is to generate a detailed, checklist-style description for a given service operation heading.

The output should be a plain text list of tasks. Do not use markdown or bullet points. Each task should be on a new line.

To ensure your response is relevant and follows the correct format, please refer to the following examples of past operations:

{{#if existingOperations}}
EXAMPLES:
{{#each existingOperations}}
Heading: {{{heading}}}
Description:
{{{description}}}
---
{{/each}}
{{/if}}

Now, generate a new description for the following operation.

Heading: {{{heading}}}
`,
});

const generateOperationDescriptionFlow = ai.defineFlow(
  {
    name: 'generateOperationDescriptionFlow',
    inputSchema: z.object({
        heading: GenerateOperationDescriptionInputSchema.shape.heading,
        existingOperations: z.array(z.object({
            heading: z.string(),
            description: z.string(),
        }))
    }),
    outputSchema: GenerateOperationDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
