'use server';

import { z } from 'zod';
import { analyzeResumeAgainstJobDescription, AnalyzeResumeAgainstJobDescriptionOutput } from '@/ai/flows/ats-scan-and-score';
import { enhanceResume, EnhanceResumeOutput } from '@/ai/flows/ai-powered-resume-enhancement';
import { upgradeResumeWithoutJD, UpgradeResumeWithoutJDOutput } from '@/ai/flows/resume-upgrade-no-jd';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
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

export async function parseResumeFile(fileBuffer: ArrayBuffer, fileType: string): Promise<{ text: string }> {
    try {
        if (fileType === 'application/pdf') {
            const data = await pdf(Buffer.from(fileBuffer));
            return { text: data.text };
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const { value } = await mammoth.extractRawText({ buffer: Buffer.from(fileBuffer) });
            return { text: value };
        } else {
            throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
        }
    } catch (error) {
        console.error("Error parsing file:", error);
        throw new Error("Failed to read the contents of the file. It might be corrupted or in an unsupported format.");
    }
}


export async function getAtsScore(
  resumeText: string,
  jobDescriptionText: string
): Promise<AnalyzeResumeAgainstJobDescriptionOutput> {
  const schema = z.object({
    resumeText: z.string().min(50, "Resume text must be at least 50 characters."),
    jobDescriptionText: z.string().min(50, "Job description must be at least 50 characters."),
  });
  const validated = schema.safeParse({ resumeText, jobDescriptionText });
  if (!validated.success) {
    throw new Error(validated.error.errors.map(e => e.message).join(', '));
  }
  return await analyzeResumeAgainstJobDescription(validated.data);
}

export async function getEnhancedResume(
  resumeText: string,
  jobDescription: string | undefined,
  desiredJobRole: string | undefined,
): Promise<EnhanceResumeOutput | UpgradeResumeWithoutJDOutput> {
    if (jobDescription) {
        const schema = z.object({
            resumeText: z.string().min(50, "Resume text must be at least 50 characters."),
            jobDescription: z.string().min(50, "Job description must be at least 50 characters."),
        });
        const validated = schema.safeParse({ resumeText, jobDescription });

        if (!validated.success) {
            throw new Error(validated.error.errors.map(e => e.message).join(', '));
        }
        return await enhanceResume(validated.data);
    } else if (desiredJobRole) {
        const schema = z.object({
            resumeText: z.string().min(50, "Resume text must be at least 50 characters."),
            jobType: z.string().min(3, "Desired job role must be at least 3 characters."),
        });
        const validated = schema.safeParse({ resumeText, jobType: desiredJobRole });
        if (!validated.success) {
            throw new Error(validated.error.errors.map(e => e.message).join(', '));
        }
        return await upgradeResumeWithoutJD(validated.data);
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