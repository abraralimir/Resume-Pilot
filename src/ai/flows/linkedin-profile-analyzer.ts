'use server';
/**
 * @fileOverview Analyzes a LinkedIn profile to provide expert suggestions for improvement.
 *
 * - analyzeLinkedInProfile - A function that handles the profile analysis.
 * - LinkedInProfile - The input type for the analysis function.
 * - AnalyzeLinkedInProfileOutput - The return type for the analysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const LinkedInProfileSchema = z.object({
  name: z.string().describe("The user's full name."),
  email: z.string().email().describe("The user's email address."),
  picture: z.string().url().describe("A URL to the user's profile picture."),
  // We can add more fields here later like headline, summary, experience etc.
});
export type LinkedInProfile = z.infer<typeof LinkedInProfileSchema>;

const AnalyzeLinkedInProfileOutputSchema = z.object({
  analysis: z
    .string()
    .describe(
      'A comprehensive analysis of the LinkedIn profile with specific, actionable suggestions for improvement. The output should be formatted as professional HTML with clear headings (<h2>), paragraphs (<p>), and lists (<ul><li>). It should be ready to be rendered in a div.'
    ),
});
export type AnalyzeLinkedInProfileOutput = z.infer<
  typeof AnalyzeLinkedInProfileOutputSchema
>;

export async function analyzeLinkedInProfile(
  input: LinkedInProfile
): Promise<AnalyzeLinkedInProfileOutput> {
  return analyzeLinkedInProfileFlow(input);
}

const analyzeLinkedInProfilePrompt = ai.definePrompt({
  name: 'analyzeLinkedInProfilePrompt',
  input: {schema: LinkedInProfileSchema},
  output: {schema: AnalyzeLinkedInProfileOutputSchema},
  prompt: `You are an expert career coach and LinkedIn profile optimization specialist.

  Analyze the provided LinkedIn profile data and provide a detailed, constructive analysis with actionable suggestions for improvement. Since you only have basic data (name, email, picture), focus your analysis on what can be inferred and what the user should focus on adding.

  Instructions:
  1.  **Start with a Positive Opening:** Acknowledge the user's name and the great first step they've taken.
  2.  **Profile Picture Analysis:** Comment on the importance of a professional photo. Based on the provided picture URL (you cannot see the image, but assume it's there), give general advice on what makes a good profile picture (e.g., clear, professional, friendly).
  3.  **Headline is Crucial:** Explain that the headline is one of the most important parts of a profile. Since you don't have it, strongly advise the user to create a compelling, keyword-rich headline. Give them a formula, like "[Job Title] at [Company] | Helping [Target Audience] with [Value Proposition]".
  4.  **The "About" Section:** Emphasize the need for a strong "About" summary. Advise them to write a narrative that covers their experience, skills, and career goals.
  5.  **Call to Action:** Encourage the user to fill out their Experience, Skills, and Education sections on LinkedIn to provide a complete picture for recruiters.
  6.  **Formatting:** Format the entire output as a single block of professional HTML. Use <h2> for main section titles, <p> for paragraphs, and <ul> with <li> for bullet points. Do not include <html> or <body> tags.

  User's Profile Data:
  Name: {{{name}}}
  Email: {{{email}}}
  `,
});

const analyzeLinkedInProfileFlow = ai.defineFlow(
  {
    name: 'analyzeLinkedInProfileFlow',
    inputSchema: LinkedInProfileSchema,
    outputSchema: AnalyzeLinkedInProfileOutputSchema,
  },
  async input => {
    const {output} = await analyzeLinkedInProfilePrompt(input);
    return output!;
  }
);
