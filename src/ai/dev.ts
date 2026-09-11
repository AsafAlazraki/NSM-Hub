
/**
 * @fileoverview This file is loaded only in the development environment and is
 * used to register Genkit flows that are in active development.
 */
import { config } from 'dotenv';
config();

// Import your flows here to make them available during development.
import '@/ai/flows/generate-polished-pdf.ts';
import '@/ai/flows/generate-operation-description.ts';
import '@/ai/flows/analyze-diagnostic-report.ts';
import '@/ai/flows/extract-parts-from-document.ts';
