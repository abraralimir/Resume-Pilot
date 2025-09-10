'use server';
/**
 * @fileOverview Enhances resumes using AI, focusing on keyword optimization and phrasing improvements based on a job description.
 *
 * - enhanceResume - A function that handles the resume enhancement process.
 * - EnhanceResumeInput - The input type for the enhanceResume function.
 * - EnhanceResumeOutput - The return type for the enhanceResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const EnhanceResumeInputSchema = z.object({
  resume: z.string().describe("The user's resume as plain text."),
  jobDescription: z
    .string()
    .optional()
    .describe('The job description to tailor the resume to.'),
});
export type EnhanceResumeInput = z.infer<typeof EnhanceResumeInputSchema>;

const EnhanceResumeOutputSchema = z.object({
  enhancedResume: z
    .string()
    .describe(
      'The enhanced resume text, formatted in Markdown for a professional appearance with clear headings, lists, and spacing.'
    ),
});
export type EnhanceResumeOutput = z.infer<typeof EnhanceResumeOutputSchema>;

export async function enhanceResume(
  input: EnhanceResumeInput
): Promise<EnhanceResumeOutput> {
  return enhanceResumeFlow(input);
}

const enhanceResumePrompt = ai.definePrompt({
  name: 'enhanceResumePrompt',
  input: {schema: EnhanceResumeInputSchema},
  output: {schema: EnhanceResumeOutputSchema},
  prompt: `You are an expert resume writer specializing in Applicant Tracking System (ATS) optimization.

  Your goal is to enhance the provided resume to increase its ATS compatibility and appeal to recruiters, focusing on keyword optimization and phrasing improvements.
  Preserve the user's personal information and core experiences while making these improvements.

  The output should be a professionally formatted resume in Markdown, ready to be presented. It should have clear headings, use bullet points for job responsibilities, and have proper spacing.

  Instructions:
  1.  Analyze the resume and identify areas for improvement based on the job description.
  2.  Incorporate relevant keywords and phrases from the job description into the resume.
  3.  Improve the phrasing and grammar of the resume to make it more clear and concise.
  4.  Ensure the enhanced resume maintains the original structure and content as much as possible.
  5.  Do not remove or alter any personal information such as name, contact details, or previous job titles unless absolutely necessary for optimization.
  6.  Format the final output in Markdown with professional headings (e.g., ## Experience), bullet points for lists, and appropriate line breaks for readability.

  Job Description: {{{jobDescription}}}

  Resume:
  {{{resume}}}

  Enhanced Resume (in Markdown):`,
});

const enhanceResumeFlow = ai.defineFlow(
  {
    name: 'enhanceResumeFlow',
    inputSchema: EnhanceResumeInputSchema,
    outputSchema: EnhanceResumeOutputSchema,
  },
  async input => {
    const {output} = await enhanceResumePrompt(input);
    return output!;
  }
);
