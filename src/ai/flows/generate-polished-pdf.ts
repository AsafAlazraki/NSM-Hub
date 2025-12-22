
'use server';

/**
 * @fileOverview THIS FLOW IS DEPRECATED.
 * The PDF generation logic has been moved to the client-side for better reliability.
 * This file is kept to prevent breaking imports but should not be used.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePolishedPdfInputSchema = z.object({
  reportText: z.string().describe('The extracted raw text content from the diagnostic PDF(s).'),
  customerName: z.string().describe("The customer's name."),
});
export type GeneratePolishedPdfInput = z.infer<typeof GeneratePolishedPdfInputSchema>;

const GeneratePolishedPdfOutputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe('The generated PDF document as a data URI.'),
});
export type GeneratePolishedPdfOutput = z.infer<typeof GeneratePolishedPdfOutputSchema>;


export async function generatePolishedPdf(input: GeneratePolishedPdfInput): Promise<GeneratePolishedPdfOutput> {
  console.error("DEPRECATED: generatePolishedPdf is called, but this functionality has been moved to the client.");
  throw new Error("This AI flow is deprecated and should not be used.");
}
