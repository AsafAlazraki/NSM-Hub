
'use server';
/**
 * @fileOverview An AI agent for analyzing Yamaha engine diagnostic reports.
 *
 * - analyzeDiagnosticReport - A function that takes raw text from a diagnostic report and returns structured data.
 * - AnalyzeDiagnosticReportInput - The input type for the analyzeDiagnosticReport function.
 * - AnalyzeDiagnosticReportOutput - The return type for the analyzeDiagnosticReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


const EngineDetailsSchema = z.object({
  id: z.string().describe('A unique ID for the engine, can be the serial number.'),
  make: z.string().optional().describe('e.g., Yamaha'),
  model: z.string().optional().describe('e.g., F200'),
  serial: z.string().optional().describe('The engine serial number.'),
  hours: z.number().optional().describe('The total engine hours.'),
  hourAnalysis: z.array(z.object({
    rpmRange: z.string().describe('e.g., "- 1000 r/min"'),
    hours: z.number(),
  })).optional().describe('Analysis of engine hours at different RPM ranges.'),
  diagnosisRecords: z.array(z.object({
    code: z.string().describe('e.g., 28'),
    description: z.string().describe('e.g., Shift position sensor'),
    occurrences: z.number(),
  })).optional().describe('List of diagnostic codes and their occurrences.'),
  oilExchangeRecords: z.array(z.object({
    item: z.string(),
    value: z.string(),
  })).optional(),
  engineRecords: z.array(z.object({
    item: z.string(),
    value: z.string(),
  })).optional(),
  rawContent: z.string().describe("The full raw text block for this specific engine, starting from 'MODEL NAME' to just before the next 'MODEL NAME' or the end of the file.")
});

const AnalyzeDiagnosticReportInputSchema = z.object({
  reportText: z.string().describe('The raw text extracted from the diagnostic PDF(s).'),
});
export type AnalyzeDiagnosticReportInput = z.infer<typeof AnalyzeDiagnosticReportInputSchema>;

const AnalyzeDiagnosticReportOutputSchema = z.object({
  engines: z.array(EngineDetailsSchema).describe("An array of engines found and analyzed in the report."),
});
export type AnalyzeDiagnosticReportOutput = z.infer<typeof AnalyzeDiagnosticReportOutputSchema>;


export async function analyzeDiagnosticReport(input: AnalyzeDiagnosticReportInput): Promise<AnalyzeDiagnosticReportOutput> {
  const result = await analyzeReportFlow(input);
  return result;
}


const prompt = ai.definePrompt({
  name: 'analyzeDiagnosticReportPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: AnalyzeDiagnosticReportInputSchema },
  output: { schema: AnalyzeDiagnosticReportOutputSchema },
  prompt: `You are an expert marine technician specializing in analyzing Yamaha engine diagnostic reports.
Your task is to parse the provided raw text from a diagnostic report and extract key information for one or more engines.

The report text may contain data for multiple engines, each starting with a "MODEL NAME" line. You must identify each engine block and extract its information separately.

Please extract the following information for each engine found in the report:
- Engine make, model, serial number, and total hours.
- A breakdown of engine hours by RPM range.
- A list of all diagnostic fault codes, including the code, description, and number of occurrences.
- A list of all oil exchange records.
- A list of all other engine records.
- The complete raw text block for each engine.

Here is the report text:

{{{reportText}}}
`,
});

const analyzeReportFlow = ai.defineFlow(
  {
    name: 'analyzeReportFlow',
    inputSchema: AnalyzeDiagnosticReportInputSchema,
    outputSchema: AnalyzeDiagnosticReportOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
