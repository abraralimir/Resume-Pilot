'use server';

import { z } from 'zod';
import { analyzeResumeAgainstJobDescription, AnalyzeResumeAgainstJobDescriptionOutput } from '@/ai/flows/ats-scan-and-score';
import { enhanceResume, EnhanceResumeOutput } from '@/ai/flows/ai-powered-resume-enhancement';
import { upgradeResumeWithoutJD, UpgradeResumeWithoutJDOutput } from '@/ai/flows/resume-upgrade-no-jd';
import { analyzeLinkedInProfile, AnalyzeLinkedInProfileOutput, LinkedInProfile } from '@/ai/flows/linkedin-profile-analyzer';

const resumeSchema = z.string().min(50, "Resume text must be at least 50 characters.");

export async function getAtsScore(
  resume: string,
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
  return await analyzeResumeAgainstJobDescription({resume: validated.data.resume, jobDescriptionText: validated.data.jobDescriptionText});
}

export async function getEnhancedResume(
  resume: string,
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

export async function getLinkedInAnalysis(profile: LinkedInProfile): Promise<AnalyzeLinkedInProfileOutput> {
    const validated = z.object({
        name: z.string(),
        email: z.string().email(),
        picture: z.string().url(),
    }).safeParse(profile);

    if (!validated.success) {
        throw new Error('Invalid LinkedIn profile data provided.');
    }

    return await analyzeLinkedInProfile(validated.data);
}
