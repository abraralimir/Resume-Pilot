'use server';

import { z } from 'zod';
import { analyzeResumeAgainstJobDescription, AnalyzeResumeAgainstJobDescriptionOutput } from '@/ai/flows/ats-scan-and-score';
import { enhanceResume, EnhanceResumeOutput } from '@/ai/flows/ai-powered-resume-enhancement';
import { upgradeResumeWithoutJD, UpgradeResumeWithoutJDOutput } from '@/ai/flows/resume-upgrade-no-jd';
import puppeteer from 'puppeteer';
import htmlToDocx from 'html-to-docx';

// Helper function to convert Markdown to basic HTML
function markdownToHtml(markdown: string): string {
    let html = markdown
        // Headers
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/__(.*)__/gim, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/_(.*)_/gim, '<em>$1</em>')
        // Unordered lists
        .replace(/^\s*[-*+] (.*)/gim, '<li>$1</li>')
        .replace(/<\/li>\n<li>/gim, '</li><li>')
        .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
        .replace(/<\/ul>\n<ul>/g, '')
        // Paragraphs
        .replace(/\n\n/g, '</p><p>')
        .replace(/<p>$/g, '')
         // Line breaks
        .replace(/\n/g, '<br>');

    return `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; line-height: 1.5; font-size: 11pt; }
          h1, h2, h3 { color: #2F2F2F; }
          h1 { font-size: 20pt; }
          h2 { font-size: 16pt; }
          h3 { font-size: 14pt; }
          ul { padding-left: 20px; margin: 0; }
          li { margin-bottom: 5px; }
          p { margin: 0 0 10px 0; }
        </style>
      </head>
      <body><p>${html}</p></body>
    </html>
  `;
}

const resumeSchema = z.union([
    z.string().min(50, "Resume text must be at least 50 characters."),
    z.string().startsWith("data:").min(100, "Invalid file data."),
]);


export async function getAtsScore(
  resume: string, // Can be text or data URI
  jobDescriptionText: string
): Promise<AnalyzeResumeAgainstJobDescriptionOutput> {
  const schema = z.object({
    resume: resumeSchema,
    jobDescriptionText: z.string().min(50, "Job description must be at least 50 characters."),
  });
  const validated = schema.safeParse({ resume, jobDescriptionText });
  if (!validated.success) {
    throw new Error(validated.error.errors.map(e => e.message).join(', '));
  }
  return await analyzeResumeAgainstJobDescription(validated.data);
}

export async function getEnhancedResume(
  resume: string, // Can be text or data URI
  jobDescription: string | undefined,
  desiredJobRole: string | undefined,
): Promise<EnhanceResumeOutput | UpgradeResumeWithoutJDOutput> {
    if (jobDescription) {
        const schema = z.object({
            resume: resumeSchema,
            jobDescription: z.string().min(50, "Job description must be at least 50 characters."),
        });
        const validated = schema.safeParse({ resume, jobDescription });

        if (!validated.success) {
            throw new Error(validated.error.errors.map(e => e.message).join(', '));
        }
        return await enhanceResume(validated.data);
    } else if (desiredJobRole) {
        const schema = z.object({
            resume: resumeSchema,
            jobType: z.string().min(3, "Desired job role must be at least 3 characters."),
        });
        const validated = schema.safeParse({ resume, jobType: desiredJobRole });
        if (!validated.success) {
            throw new Error(validated.error.errors.map(e => e.message).join(', '));
        }
        const { resume: validatedResume, jobType } = validated.data;
        return await upgradeResumeWithoutJD({ resume: validatedResume, jobType });
    } else {
        throw new Error("Either a job description or a desired job role must be provided.");
    }
}

export async function downloadEnhancedResume(resumeMarkdown: string, format: 'pdf' | 'docx'): Promise<string> {
    const resumeHtml = markdownToHtml(resumeMarkdown);

    try {
        if (format === 'pdf') {
            const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox']});
            const page = await browser.newPage();
            await page.setContent(resumeHtml, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' } });
            await browser.close();
            return pdfBuffer.toString('base64');
        } else if (format === 'docx') {
            const docxBuffer = await htmlToDocx(resumeHtml, undefined, {
                font: 'Calibri',
                fontSize: 12,
            });
            return (docxBuffer as Buffer).toString('base64');
        } else {
            throw new Error('Unsupported download format.');
        }
    } catch (error) {
        console.error(`Error generating ${format}:`, error);
        throw new Error(`Failed to generate ${format.toUpperCase()} file. Please try again.`);
    }
}
