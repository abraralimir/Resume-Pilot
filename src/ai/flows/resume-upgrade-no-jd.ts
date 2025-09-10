'use server';
/**
 * @fileOverview Enhances a resume based on a specified job type when a job description is not available.
 *
 * - upgradeResumeWithoutJD - A function that takes resume data and a desired job type, then upgrades the resume.
 * - UpgradeResumeWithoutJDInput - The input type for the upgradeResumeWithoutJD function.
 * - UpgradeResumeWithoutJDOutput - The return type for the upgradeResumeWithoutJD function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UpgradeResumeWithoutJDSchema = z.object({
  resume: z.union([
    z.string().describe('The text content of the resume.'),
    z.string().describe("A data URI of the user's resume file (PDF or DOCX). Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  ]),
  jobType: z.string().describe('The type of job the user is seeking (e.g., Software Engineer, Project Manager).'),
});

export type UpgradeResumeWithoutJDInput = z.infer<typeof UpgradeResumeWithoutJDSchema>;

const UpgradeResumeWithoutJDOutputSchema = z.object({
  enhancedResume: z.string().describe('The upgraded resume text, formatted in Markdown and optimized for the specified job type.'),
});

export type UpgradeResumeWithoutJDOutput = z.infer<typeof UpgradeResumeWithoutJDOutputSchema>;

export async function upgradeResumeWithoutJD(input: UpgradeResumeWithoutJDInput): Promise<UpgradeResumeWithoutJDOutput> {
  return upgradeResumeWithoutJDFlow(input);
}

const upgradeResumeWithoutJDPrompt = ai.definePrompt({
  name: 'upgradeResumeWithoutJDPrompt',
  input: {schema: UpgradeResumeWithoutJDSchema},
  output: {schema: UpgradeResumeWithoutJDOutputSchema},
  prompt: `You are an expert resume writer specializing in optimizing resumes for Applicant Tracking Systems (ATS) and maximizing their impact for specific job types.

  I will provide you with a resume and the type of job the user is seeking. Your task is to enhance the resume by:

  1.  Identifying relevant keywords and skills for the specified job type.
  2.  Incorporating those keywords and skills into the resume in a natural and compelling way.
  3.  Improving the phrasing and overall presentation of the resume to make it more appealing to recruiters and hiring managers.
  4.  Ensuring that the core information of the resume like name, contact details are not altered.
  5.  Formatting the final output in Markdown with professional headings (e.g., ## Experience), bullet points for lists, and appropriate line breaks for readability.

  Here's the resume:
  {{#if (isString resume)}}
  {{{resume}}}
  {{else}}
  {{media url=resume}}
  {{/if}}

  The user is seeking a job as a: {{{jobType}}}

  Provide the enhanced resume text (in Markdown):
  `,
});

const upgradeResumeWithoutJDFlow = ai.defineFlow(
  {
    name: 'upgradeResumeWithoutJDFlow',
    inputSchema: UpgradeResumeWithoutJDSchema,
    outputSchema: UpgradeResumeWithoutJDOutputSchema,
  },
  async input => {
    const {output} = await upgradeResumeWithoutJDPrompt(input);
    return output!;
  }
);
