'use server';
/**
 * @fileOverview Analyzes a LinkedIn profile from a URL, providing a score, feedback, and an enhanced version.
 *
 * - analyzeLinkedInProfile - A function that handles the LinkedIn profile analysis.
 * - scrapeLinkedInProfile - A Genkit tool for scraping text content from a LinkedIn profile.
 * - LinkedInProfileAnalysis - The return type for the analyzeLinkedInProfile function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import puppeteer from 'puppeteer';

const scrapeLinkedInProfile = ai.defineTool(
  {
    name: 'scrapeLinkedInProfile',
    description: 'Scrapes the text content from a given LinkedIn profile URL. Only works for public profiles.',
    inputSchema: z.object({ url: z.string().url() }),
    outputSchema: z.object({ content: z.string() }),
  },
  async ({ url }) => {
    let browser;
    try {
      browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // A simple heuristic to wait for the main content. This might need adjustment.
      await page.waitForSelector('#main-content', { timeout: 10000 });

      const content = await page.evaluate(() => {
        // This is a simplified selector. Real LinkedIn structure is complex and changes.
        // This selector tries to grab the main content area of the profile.
        const mainContent = document.querySelector('main, #main-content, .scaffold-layout__main');
        return mainContent ? mainContent.innerText : 'Could not extract profile content.';
      });
      
      return { content };
    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error);
      // Return a structured error message that the LLM can understand
      return { content: `Failed to scrape the profile. The URL might be private, invalid, or the page structure has changed. Error: ${(error as Error).message}` };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
  }
);

const LinkedInProfileAnalysisSchema = z.object({
  profileScore: z.number().describe('A score from 0-100 evaluating the overall quality and completeness of the LinkedIn profile.'),
  feedback: z.string().describe('Detailed, actionable feedback on how to improve the profile, presented as a bulleted list.'),
  enhancedProfile: z.string().describe('A rewritten, enhanced version of the key sections of the LinkedIn profile (like Headline, About, and Experience), formatted in Markdown for readability.'),
});
export type LinkedInProfileAnalysis = z.infer<typeof LinkedInProfileAnalysisSchema>;


const analyzeProfilePrompt = ai.definePrompt({
    name: 'analyzeProfilePrompt',
    input: { schema: z.object({ profileContent: z.string() }) },
    output: { schema: LinkedInProfileAnalysisSchema },
    tools: [scrapeLinkedInProfile],
    prompt: `You are an expert career coach and LinkedIn profile optimizer.

    Analyze the provided LinkedIn profile text and generate a comprehensive analysis.

    The profile content is as follows:
    {{{profileContent}}}

    Based on the content, perform the following tasks:
    1.  **Score the Profile (0-100):** Evaluate the profile on completeness, keyword optimization, clarity, and impact.
    2.  **Provide Actionable Feedback:** Give specific, bulleted suggestions for improvement. Focus on the headline, summary (About section), experience descriptions, and skills.
    3.  **Generate an Enhanced Profile:** Rewrite the key sections (Headline, About, and the most recent Experience entries) to be more impactful and keyword-rich. Format this as a professional Markdown document.
    
    If the profile content indicates a scraping failure, explain that the analysis cannot be completed and suggest checking if the profile is public.
    `
});

const analyzeLinkedInProfileFlow = ai.defineFlow(
  {
    name: 'analyzeLinkedInProfileFlow',
    inputSchema: z.string().url(),
    outputSchema: LinkedInProfileAnalysisSchema,
  },
  async (url) => {
    const { content } = await scrapeLinkedInProfile({ url });
    const { output } = await analyzeProfilePrompt({ profileContent: content });
    return output!;
  }
);


export async function analyzeLinkedInProfile(url: string): Promise<LinkedInProfileAnalysis> {
    return analyzeLinkedInProfileFlow(url);
}
