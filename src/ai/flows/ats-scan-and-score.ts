'use server';
/**
 * @fileOverview Analyzes a resume against a job description to provide an ATS compatibility score and identify areas for improvement.
 *
 * - analyzeResumeAgainstJobDescription - A function that handles the resume analysis process.
 * - AnalyzeResumeAgainstJobDescriptionInput - The input type for the analyzeResumeAgainstJobDescription function.
 * - AnalyzeResumeAgainstJobDescriptionOutput - The return type for the analyzeResumeAgainstJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeResumeAgainstJobDescriptionInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume.'),
  jobDescriptionText: z.string().describe('The text content of the job description.'),
});
export type AnalyzeResumeAgainstJobDescriptionInput = z.infer<
  typeof AnalyzeResumeAgainstJobDescriptionInputSchema
>;

const AnalyzeResumeAgainstJobDescriptionOutputSchema = z.object({
  atsScore: z
    .number()
    .describe(
      'A score representing the ATS compatibility of the resume against the job description (0-100).' // Corrected typo here
    ),
  areasForImprovement: z
    .string()
    .describe(
      'Specific suggestions on how to improve the resume to better match the job description.'
    ),
});
export type AnalyzeResumeAgainstJobDescriptionOutput = z.infer<
  typeof AnalyzeResumeAgainstJobDescriptionOutputSchema
>;

export async function analyzeResumeAgainstJobDescription(
  input: AnalyzeResumeAgainstJobDescriptionInput
): Promise<AnalyzeResumeAgainstJobDescriptionOutput> {
  return analyzeResumeAgainstJobDescriptionFlow(input);
}

const analyzeResumeAgainstJobDescriptionPrompt = ai.definePrompt({
  name: 'analyzeResumeAgainstJobDescriptionPrompt',
  input: {schema: AnalyzeResumeAgainstJobDescriptionInputSchema},
  output: {schema: AnalyzeResumeAgainstJobDescriptionOutputSchema},
  prompt: `You are an expert ATS (Applicant Tracking System) resume analyst.

  Analyze the following resume against the job description and provide an ATS compatibility score (0-100) and specific suggestions on how to improve the resume to better match the job description.

  Resume:
  {{resumeText}}

  Job Description:
  {{jobDescriptionText}}

  Provide the ATS score and areas for improvement in a structured format.
  `, // Ensuring prompt is valid Handlebars syntax
});

const analyzeResumeAgainstJobDescriptionFlow = ai.defineFlow(
  {
    name: 'analyzeResumeAgainstJobDescriptionFlow',
    inputSchema: AnalyzeResumeAgainstJobDescriptionInputSchema,
    outputSchema: AnalyzeResumeAgainstJobDescriptionOutputSchema,
  },
  async input => {
    const {output} = await analyzeResumeAgainstJobDescriptionPrompt(input);
    return output!;
  }
);
