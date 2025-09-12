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
  resume: z.string().describe("The user's resume as plain text."),
  jobDescriptionText: z
    .string()
    .describe('The text content of the job description.'),
});
export type AnalyzeResumeAgainstJobDescriptionInput = z.infer<
  typeof AnalyzeResumeAgainstJobDescriptionInputSchema
>;

const AnalyzeResumeAgainstJobDescriptionOutputSchema = z.object({
  atsScore: z
    .number()
    .describe(
      'A score representing the ATS compatibility of the resume against the job description (0-100), based on a weighted analysis of keywords, skills, experience, and formatting.'
    ),
  areasForImprovement: z
    .string()
    .describe(
      'Specific, structured suggestions in Markdown on how to improve the resume. This should include sections for "Missing Keywords" and "Actionable Suggestions".'
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
  prompt: `You are an expert ATS (Applicant Tracking System) resume analyst. Your task is to provide a detailed, quantitative analysis of a resume against a given job description.

  **Instructions:**

  1.  **Analyze the resume and job description across four key dimensions:**
      *   **Keyword & Phrase Match:** Identify crucial keywords, technologies, and phrases in the job description and see how often they appear in the resume.
      *   **Skills Alignment:** Compare the skills listed in the job description (e.g., "Python," "Project Management," "SEO") with the skills on the resume.
      *   **Experience Relevance:** Evaluate if the work experience described (job titles, responsibilities) aligns with the requirements of the role.
      *   **Format & Readability:** Assess the resume's structure. Is it clean, using standard headings (like "Experience," "Education")? Is it easy for a machine to parse? Avoid complex tables or columns.

  2.  **Calculate a Weighted ATS Score:**
      *   Assign a score from 0-100 for each of the four dimensions.
      *   Calculate the final, weighted \`atsScore\` using the following formula:
          *   (Keyword Match Score * 0.4) + (Skills Alignment Score * 0.3) + (Experience Relevance Score * 0.2) + (Format & Readability Score * 0.1)
      *   Round the final score to the nearest whole number.

  3.  **Provide Structured Areas for Improvement:**
      *   The \`areasForImprovement\` field must be a Markdown string.
      *   It must contain a main heading: \`## Areas for Improvement\`.
      *   Under this, create two subheadings:
          *   \`### Missing Keywords:\` List the most important keywords and skills from the job description that are missing from the resume.
          *   \`### Actionable Suggestions:\` Provide specific, bullet-pointed advice on how to improve the resume. For example, "Quantify your achievements in the Project Manager role with metrics (e.g., 'managed a budget of $X' or 'increased efficiency by Y%')." or "Integrate keywords like 'Agile Methodology' and 'Scrum Master' into your experience descriptions."

  **Input:**

  Resume:
  \`\`\`
  {{{resume}}}
  \`\`\`

  Job Description:
  \`\`\`
  {{{jobDescriptionText}}}
  \`\`\`

  **Output:**

  Begin your analysis now and provide the final JSON object with the calculated \`atsScore\` and the structured, Markdown-formatted \`areasForImprovement\`.
  `,
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
