
"use client";

import React, { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
  ArrowDown,
  Clipboard,
  Download,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { getAtsScore, getEnhancedResume } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "./ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type AtsResult = { atsScore: number; areasForImprovement: string };

const heroImage = PlaceHolderImages.find((img) => img.id === "hero-background");

// Helper function to convert Markdown to plain text
function markdownToText(markdown: string): string {
  return markdown
    .replace(/^## (.*$)/gim, '$1')
    .replace(/^# (.*$)/gim, '$1')
    .replace(/\*\*(.*)\*\*/gim, '$1')
    .replace(/__(.*)__/gim, '$1')
    .replace(/\*(.*)\*/gim, '$1')
    .replace(/_(.*)_/gim, '$1')
    .replace(/^\s*[-*+] (.*)/gim, '- $1')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
}


const CircleProgress = ({ score, text }: { score: number; text: string }) => {
    const [progress, setProgress] = useState(0);
    const circumference = 2 * Math.PI * 55;

    React.useEffect(() => {
        const animation = requestAnimationFrame(() => {
            setProgress(score);
        });
        return () => cancelAnimationFrame(animation);
    }, [score]);

    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex size-56 items-center justify-center">
            <svg className="absolute size-full" viewBox="0 0 120 120">
                <circle
                    className="stroke-current text-border/50"
                    strokeWidth="8"
                    cx="60"
                    cy="60"
                    r="55"
                    fill="transparent"
                />
                <circle
                    className="stroke-current text-primary transition-[stroke-dashoffset] duration-1000 ease-out"
                    strokeWidth="8"
                    strokeLinecap="round"
                    cx="60"
                    cy="60"
                    r="55"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 60 60)"
                />
            </svg>
            <div className="flex flex-col items-center">
                <span className="font-headline text-5xl font-bold text-foreground">
                    {Math.round(score)}
                </span>
                <span className="text-sm font-medium text-muted-foreground">{text}</span>
            </div>
        </div>
    );
};


export function ResumePilotClient() {
  const [resumeText, setResumeText] = useState("");
  const [jobInputMode, setJobInputMode] = useState<"description" | "role">(
    "description"
  );
  const [jobDescription, setJobDescription] = useState("");
  const [jobRole, setJobRole] = useState("");

  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [enhancedResume, setEnhancedResume] = useState<string>("");
  
  const [isScanning, startScanning] = useTransition();
  const [isEnhancing, startEnhancing] = useTransition();

  const { toast } = useToast();

  const resultsRef = useRef<HTMLDivElement>(null);
  const enhanceRef = useRef<HTMLDivElement>(null);
  const mainToolRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  
  const handleScrollToTool = () => {
    mainToolRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleScan = () => {
    if (!resumeText) {
        toast({ variant: "destructive", title: "Missing Resume", description: "Please paste your resume." });
        return;
    }

    if (jobInputMode === "description" && !jobDescription) {
      toast({
        variant: "destructive",
        title: "Missing Job Description",
        description: "Please provide a job description for the ATS scan.",
      });
      return;
    }
     if (jobInputMode === "role") {
       toast({
        variant: "destructive",
        title: "Invalid Action",
        description: "ATS Scan requires a job description. Please use the 'Job Description' option.",
      });
      return;
    }

    startScanning(async () => {
      setAtsResult(null);
      setEnhancedResume("");
      try {
        const result = await getAtsScore(resumeText, jobDescription);
        setAtsResult(result);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: 'center' }), 100);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Scan Failed",
          description: (error as Error).message,
        });
      }
    });
  };

  const handleEnhance = () => {
    if (!resumeText) {
        toast({ variant: "destructive", title: "Missing Resume", description: "Please paste your resume." });
        return;
    }
    
     if (!jobDescription && !jobRole) {
      toast({
        variant: "destructive",
        title: "Missing Job Target",
        description: "Please provide either a job description or a desired role.",
      });
      return;
    }
    
    startEnhancing(async () => {
      setAtsResult(null);
      setEnhancedResume("");
      try {
        const result = await getEnhancedResume(
          resumeText,
          jobInputMode === 'description' ? jobDescription : undefined,
          jobInputMode === 'role' ? jobRole : undefined,
        );
        setEnhancedResume(result.enhancedResume);
        setTimeout(() => enhanceRef.current?.scrollIntoView({ behavior: "smooth", block: 'center' }), 100);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Enhancement Failed",
          description: (error as Error).message,
        });
      }
    });
  };

  const handleDownload = (content: string, format: "txt" | "docx") => {
    if (!content) return;

    const plainText = markdownToText(content);
    const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enhanced-resume.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Download Started",
      description: `Your enhanced-resume.${format} is downloading.`
    });
  };

  const handleDownloadPdf = async () => {
    const content = pdfRef.current;
    if (!content) return;

    toast({ title: "Generating PDF...", description: "Please wait a moment." });

    try {
      const canvas = await html2canvas(content, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: '#0a0e1c' // Match your dark theme background
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('enhanced-resume.pdf');
      toast({ title: "Download Started", description: "Your enhanced-resume.pdf is downloading." });
    } catch(error) {
       toast({ variant: "destructive", title: "PDF Generation Failed", description: (error as Error).message });
    }
  };


  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 md:py-20">
      {/* Hero Section */}
      <section className="relative mb-20 flex flex-col items-center justify-center text-center">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="absolute inset-0 -z-10 object-cover opacity-[0.03]"
            data-ai-hint={heroImage.imageHint}
            priority
          />
        )}
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-transparent via-transparent to-background"></div>

        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Land Your Dream Job
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
          Instantly score your resume against any job description, then let our AI co-pilot
          optimize it for success. Beat the bots and impress recruiters.
        </p>
        <Button size="lg" className="mt-8" onClick={handleScrollToTool}>
          Get Started Now <ArrowDown className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* Main Tool Section */}
      <section ref={mainToolRef} className="scroll-mt-20 space-y-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Resume Input */}
            <Card className="flex flex-col border-2 border-primary/20 bg-transparent shadow-lg shadow-primary/5">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <CardTitle className="font-headline text-2xl">1. Your Resume</CardTitle>
                        <CardDescription>Paste your full resume text below.</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <Textarea
                  id="resume-input"
                  placeholder="Paste your full resume here..."
                  className="min-h-[400px] flex-1 resize-y text-base"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Job Target Input */}
            <Card className="flex flex-col border-border bg-transparent">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">2. Job Target</CardTitle>
                <CardDescription>Provide a job description or just a role title.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <RadioGroup
                    value={jobInputMode}
                    onValueChange={(v) =>
                      setJobInputMode(v as "description" | "role")
                    }
                    className="mb-4 flex gap-4"
                  >
                      <Label htmlFor="r-desc" className={`flex-1 cursor-pointer rounded-md border p-4 text-center transition-all ${jobInputMode === 'description' ? 'border-primary bg-primary/10' : 'hover:bg-accent'}`}>
                        <RadioGroupItem value="description" id="r-desc" className="sr-only" />
                        <FileText className="mx-auto mb-2 h-6 w-6" />
                        Job Description
                      </Label>
                      <Label htmlFor="r-role" className={`flex-1 cursor-pointer rounded-md border p-4 text-center transition-all ${jobInputMode === 'role' ? 'border-primary bg-primary/10' : 'hover:bg-accent'}`}>
                        <RadioGroupItem value="role" id="r-role" className="sr-only" />
                        <Sparkles className="mx-auto mb-2 h-6 w-6" />
                        Job Role
                      </Label>
                </RadioGroup>
                
                <div className="flex-1">
                  <Textarea
                      id="jd-input"
                      placeholder="Paste the job description here for the most accurate analysis..."
                      className={`min-h-[260px] flex-1 resize-y text-base ${jobInputMode !== 'description' ? 'hidden' : ''}`}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      disabled={jobInputMode !== 'description'}
                    />

                    <div className={`flex h-full flex-col justify-center ${jobInputMode !== 'role' ? 'hidden' : ''}`}>
                      <Label htmlFor="role-input" className="mb-2 text-base">Desired Job Role</Label>
                      <Input
                        id="role-input"
                        placeholder="e.g., Senior Software Engineer"
                        className="text-base"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        disabled={jobInputMode !== 'role'}
                      />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No job description? No problem. We'll optimize your resume for this role.
                      </p>
                    </div>
                </div>

              </CardContent>
            </Card>
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border bg-card p-6 sm:flex-row sm:justify-center">
            <p className="flex-1 text-center text-lg font-medium sm:text-left">Ready to see your results?</p>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Button size="lg" onClick={handleScan} disabled={isScanning || isEnhancing || jobInputMode === 'role'}>
                  {isScanning ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Scanning...</>) : (<>ATS Scan</>)}
              </Button>
              <Button size="lg" variant="default" onClick={handleEnhance} disabled={isEnhancing || isScanning}>
                  {isEnhancing ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enhancing...</>) : (<><Sparkles className="mr-2 h-5 w-5"/> AI Enhance Resume</>)}
              </Button>
            </div>
        </div>
      </section>

      {/* Results Sections */}
      <div className="mt-16 space-y-12">
        {(isScanning || atsResult || isEnhancing || enhancedResume) && <div className="h-px w-full bg-border"></div>}
        
        {isScanning && (
             <section>
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl">Analyzing Your Resume...</CardTitle>
                    <CardDescription>Our AI is calculating your ATS score and identifying key improvements.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-12 pt-6 md:flex-row">
                    <Skeleton className="size-56 rounded-full" />
                    <div className="w-full flex-1 space-y-4">
                        <Skeleton className="h-8 w-3/4 rounded-md"/>
                        <Skeleton className="h-6 w-full rounded-md"/>
                        <Skeleton className="h-6 w-5/6 rounded-md"/>
                        <Skeleton className="h-6 w-full rounded-md"/>
                    </div>
                </CardContent>
             </section>
        )}
        {atsResult && (
          <section ref={resultsRef} className="scroll-mt-20">
             <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl">Your ATS Score & Analysis</CardTitle>
                <CardDescription>Here's how your resume stacks up against the job description.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-12 pt-6 md:flex-row md:items-start">
              <CircleProgress score={atsResult.atsScore} text="ATS SCORE" />
              <div className="flex-1">
                <Alert className="bg-transparent text-base">
                  <Lightbulb className="h-5 w-5"/>
                  <AlertTitle className="font-headline text-xl">Analysis Breakdown</AlertTitle>
                  <AlertDescription className="mt-2 prose prose-invert max-w-none prose-headings:font-headline prose-p:font-body prose-li:font-body">
                     <ReactMarkdown>{atsResult.areasForImprovement}</ReactMarkdown>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </section>
        )}

       {(isEnhancing || enhancedResume) && (!atsResult && !isScanning) && <div className="h-px w-full bg-border"></div>}

        {isEnhancing && (
            <section>
              <CardHeader className="text-center">
                  <CardTitle className="font-headline text-3xl">Enhancing Your Resume</CardTitle>
                  <CardDescription>Our AI co-pilot is rewriting your resume for maximum impact.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                    <Skeleton className="h-8 w-1/4 rounded-md"/>
                    <Skeleton className="h-6 w-full rounded-md"/>
                    <Skeleton className="h-6 w-5/6 rounded-md"/>
                    <br/>
                    <Skeleton className="h-8 w-1/3 rounded-md"/>
                    <Skeleton className="h-24 w-full rounded-md"/>
              </CardContent>
            </section>
        )}
        {enhancedResume && (
          <section ref={enhanceRef} className="scroll-mt-20">
            <Card className="bg-transparent">
              <CardHeader>
                <CardTitle className="font-headline text-3xl">Your Enhanced Resume</CardTitle>
                <CardDescription>Ready to apply! Copy or download your new resume below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div ref={pdfRef} className="rounded-lg border bg-background/50 p-6 prose prose-invert prose-headings:font-headline prose-p:font-body prose-li:font-body">
                  <ReactMarkdown>{enhancedResume}</ReactMarkdown>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                   <Button variant="ghost" onClick={() => {
                        navigator.clipboard.writeText(markdownToText(enhancedResume));
                        toast({title: "Copied to clipboard!"})
                   }}>
                        <Clipboard className="mr-2 h-4 w-4" />
                        Copy Text
                    </Button>
                  <Button onClick={() => handleDownload(enhancedResume, "txt")}>
                    <Download className="mr-2 h-4 w-4" />
                    Download .txt
                  </Button>
                   <Button onClick={() => handleDownload(enhancedResume, "docx")}>
                    <Download className="mr-2 h-4 w-4" />
                    Download .docx
                  </Button>
                  <Button onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4" />
                    Download .pdf
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
