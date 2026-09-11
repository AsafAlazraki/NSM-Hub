'use server';
/**
 * @fileOverview An AI agent for extracting a parts list from an uploaded supplier document.
 *
 * Takes a supplier parts document (a PDF or a photo of one — e.g. a Yamaha parts
 * order/quote) and returns the line items in a structured form so they can be
 * appended to the parts list of a quote operation.
 *
 * - extractPartsFromDocument - A function that takes the document as a data URI and returns the extracted parts.
 * - ExtractPartsFromDocumentInput - The input type for the extractPartsFromDocument function.
 * - ExtractPartsFromDocumentOutput - The return type for the extractPartsFromDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractPartsFromDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A supplier parts document (PDF or image) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractPartsFromDocumentInput = z.infer<typeof ExtractPartsFromDocumentInputSchema>;

const ExtractedPartSchema = z.object({
  partNumber: z.string().optional().describe('The part number / SKU exactly as printed, e.g. "6DA-42610-01". Omit if the document has no part numbers.'),
  description: z.string().describe('The part description, e.g. "TOP COWLING ASSY".'),
  quantity: z.number().describe('The quantity for this line item. Use 1 if the document does not show a quantity.'),
  unitPrice: z.number().optional().describe('The price of ONE unit of this part, not the line total. If the document only shows a line total, divide it by the quantity. Omit if the document shows no prices.'),
});

const ExtractPartsFromDocumentOutputSchema = z.object({
  parts: z.array(ExtractedPartSchema).describe('Every part line item found in the document, in the order they appear.'),
  pricesIncludeGst: z.boolean().describe('true when the unit prices in the document are GST-inclusive, false when they are GST-exclusive.'),
});
export type ExtractPartsFromDocumentOutput = z.infer<typeof ExtractPartsFromDocumentOutputSchema>;

export async function extractPartsFromDocument(input: ExtractPartsFromDocumentInput): Promise<ExtractPartsFromDocumentOutput> {
  return extractPartsFromDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractPartsFromDocumentPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: ExtractPartsFromDocumentInputSchema },
  output: { schema: ExtractPartsFromDocumentOutputSchema },
  prompt: `You are an expert marine parts interpreter working for an Australian boat dealership.
The attached document is a supplier parts list — typically a parts quote, order or invoice
(for example a Yamaha parts order with columns like Part No, Model, Description, Qty, Ret. Price and Item Total).
It may be a scan or a photo, so read it carefully.

Extract EVERY part line item from the document. For each line item provide:
- The part number / SKU exactly as printed (omit if there is none).
- The description exactly as printed.
- The quantity (1 if none is shown).
- The unit (each) price. If only a line total is shown, divide it by the quantity. Omit prices entirely if the document shows none.

Ignore rows that are not part line items (headers, subtotals, totals, freight, notes).

Also decide whether the prices are GST-inclusive or GST-exclusive:
- Wording like "inc GST" / "incl. GST" on prices or the total, or line prices that sum to a total labelled "inc GST", means they are GST-inclusive.
- Wording like "ex GST" / "plus GST", or a separate GST line added on top of the item prices, means they are GST-exclusive.
- If there is no clear indication, assume retail-style documents are GST-inclusive.

Document: {{media url=documentDataUri}}`,
});

const extractPartsFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractPartsFromDocumentFlow',
    inputSchema: ExtractPartsFromDocumentInputSchema,
    outputSchema: ExtractPartsFromDocumentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
