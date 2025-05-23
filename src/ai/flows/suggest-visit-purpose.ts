// The ai object was initialized in src/ai/genkit.ts.
'use server';

/**
 * @fileOverview An AI agent that suggests the purpose of a visitor's visit based on their name and flat number.
 *
 * - suggestVisitPurpose - A function that suggests the purpose of visit.
 * - SuggestVisitPurposeInput - The input type for the suggestVisitPurpose function.
 * - SuggestVisitPurposeOutput - The return type for the suggestVisitPurpose function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestVisitPurposeInputSchema = z.object({
  visitorName: z.string().describe('The name of the visitor.'),
  flatNumber: z.string().describe('The flat number the visitor is visiting.'),
});
export type SuggestVisitPurposeInput = z.infer<typeof SuggestVisitPurposeInputSchema>;

const SuggestVisitPurposeOutputSchema = z.object({
  purpose: z.string().describe('The suggested purpose of the visit.'),
});
export type SuggestVisitPurposeOutput = z.infer<typeof SuggestVisitPurposeOutputSchema>;

export async function suggestVisitPurpose(input: SuggestVisitPurposeInput): Promise<SuggestVisitPurposeOutput> {
  return suggestVisitPurposeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestVisitPurposePrompt',
  input: {schema: SuggestVisitPurposeInputSchema},
  output: {schema: SuggestVisitPurposeOutputSchema},
  prompt: `You are a helpful assistant that suggests the purpose of a visitor\'s visit to a residential flat.

  Given the visitor\'s name and flat number, suggest a likely purpose for their visit.

  Visitor Name: {{{visitorName}}}
  Flat Number: {{{flatNumber}}}

  Suggest a purpose for the visit in a few words.`,
});

const suggestVisitPurposeFlow = ai.defineFlow(
  {
    name: 'suggestVisitPurposeFlow',
    inputSchema: SuggestVisitPurposeInputSchema,
    outputSchema: SuggestVisitPurposeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
