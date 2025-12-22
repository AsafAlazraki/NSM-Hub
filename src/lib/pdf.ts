'use server';

import type { SourceFile } from './types';
// Using the specific file for better compatibility with server environments
//import pdf from 'pdf-parse/lib/pdf-parse.js';
import * as pdfParse from 'pdf-parse'

/**
 * Extracts text from an array of PDF files.
 * @param files An array of source files, where content is a Base64 encoded string.
 * @returns A concatenated string of all extracted text.
 */
export async function extractTextFromPdfs(files: SourceFile[]): Promise<string> {
  let combinedText = '';

  for (const file of files) {
    try {
      // The file content is a data URI: "data:application/pdf;base64,JVBERi0xLjQKJ..."
      // We need to extract just the Base64 part.
      const base64Data = file.content.split(',')[1];
      if (!base64Data) {
        console.warn(`Could not find Base64 data for file: ${file.name}`);
        continue;
      }
      
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      const data = await pdfParse(pdfBuffer);
      combinedText += `\n\n--- START OF FILE: ${file.name} ---\n\n`;
      combinedText += data.text;
      combinedText += `\n\n--- END OF FILE: ${file.name} ---\n\n`;
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      // Optionally, append an error message to the combined text
      combinedText += `\n\n--- ERROR PROCESSING FILE: ${file.name} ---\n\n`;
    }
  }

  return combinedText;
}
