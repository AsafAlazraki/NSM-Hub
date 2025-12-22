
/**
 * @fileoverview This is the main Genkit configuration file.
 *
 * A global `ai` object is exported from this file. This object should
 * be used to define all AI-related functionality.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// This is the primary Genkit initialization.
// It is recommended to keep this as the single source of truth for Genkit plugins.
export const ai = genkit({
  plugins: [googleAI({ apiVersion: 'v1beta' })],
});
