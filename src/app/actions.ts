'use server';

import { z } from 'zod';
import { analyzeResumeAgainstJobDescription, AnalyzeResumeAgainstJobDescriptionOutput } from '@/ai/flows/ats-scan-and-score';
import { enhanceResume, EnhanceResumeOutput } from '@/ai/flows/ai-powered-resume-enhancement';
import { upgradeResumeWithoutJD, UpgradeResumeWithoutJDOutput } from '@/ai/flows/resume-upgrade-no-jd';

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
