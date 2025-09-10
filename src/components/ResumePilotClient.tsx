"use client";

import React, { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
  ArrowDown,
  CheckCircle,
  Clipboard,
  Download,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { getAtsScore, getEnhancedResume } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Skeleton } from "./ui/skeleton";

type AtsResult = { atsScore: number; areasForImprovement: string };
type EnhancedResult = { enhancedResume: string };

const heroImage = PlaceHolderImages.find((img) => img.id === "hero-background");

const CircleProgress = ({ score }: { score: number }) => {
  const progress = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex size-48 items-center justify-center">
      <svg className="absolute size-full" viewBox="0 0 100 100">
        <circle
          className="stroke-current text-border"
          strokeWidth="8"
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
        />
        <circle
          className="stroke-current text-primary transition-all duration-1000 ease-out"
          strokeWidth="8"
          strokeLinecap="round"
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="font-headline text-5xl font-bold text-foreground">
        {Math.round(score)}
      </span>
    </div>
  );
};

export function ResumePilotClient() {
  const [resume, setResume] = useState("");
  const [jobInputMode, setJobInputMode] = useState<"description" | "role">(
    "description"
  );
  const [jobDescription, setJobDescription] = useState("");
  const [jobRole, setJobRole] = useState("");

  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [enhancedResume, setEnhancedResume] = useState<string>("");
  const [editedEnhancedResume, setEditedEnhancedResume] = useState("");
  
  const [isScanning, startScanning] = useTransition();
  const [isEnhancing, startEnhancing] = useTransition();

  const { toast } = useToast();

  const resultsRef = useRef<HTMLDivElement>(null);
  const enhanceRef = useRef<HTMLDivElement>(null);
  const mainToolRef = useRef<HTMLDivElement>(null);


  const handleScrollToTool = () => {
    mainToolRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScan = () => {
    if (jobInputMode === "description" && (!resume || !jobDescription)) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please provide both a resume and a job description.",
      });
      return;
    }
     if (jobInputMode === "role") {
       toast({
        variant: "destructive",
        title: "Invalid Action",
        description: "ATS Scan requires a job description. Please switch tabs.",
      });
      return;
    }

    startScanning(async () => {
      setAtsResult(null);
      setEnhancedResume("");
      try {
        const result = await getAtsScore(resume, jobDescription);
        setAtsResult(result);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
     if (!resume || (!jobDescription && !jobRole)) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please provide a resume and either a job description or a desired role.",
      });
      return;
    }
    
    startEnhancing(async () => {
      setEnhancedResume("");
      try {
        const result = await getEnhancedResume(
          resume,
          jobInputMode === 'description' ? jobDescription : undefined,
          jobInputMode === 'role' ? jobRole : undefined,
        );
        setEnhancedResume(result.enhancedResume);
        setEditedEnhancedResume(result.enhancedResume);
        setTimeout(() => enhanceRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Enhancement Failed",
          description: (error as Error).message,
        });
      }
    });
  };

  const handleDownload = (format: "txt" | "pdf" | "docx") => {
    if (format === "txt") {
      const blob = new Blob([editedEnhancedResume], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume-pilot.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Download Started",
        description: "Your .txt resume is downloading."
      })
    } else {
      toast({
        title: "Feature Coming Soon",
        description: `Downloading as ${format.toUpperCase()} will be available in a future update.`,
      });
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-16">
      {/* Hero Section */}
      <section className="relative mb-16 flex flex-col items-center justify-center text-center">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="absolute inset-0 -z-10 object-cover opacity-10"
            data-ai-hint={heroImage.imageHint}
            priority
          />
        )}
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-background via-transparent to-background"></div>

        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Navigate Your Career Path
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Instantly score your resume against any job, then let our AI co-pilot
          enhance it to perfection.
        </p>
        <Button size="lg" className="mt-8" onClick={handleScrollToTool}>
          Get Started <ArrowDown className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* Main Tool Section */}
      <section ref={mainToolRef} className="space-y-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              1. Provide Your Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-2">
            {/* Resume Input */}
            <div className="space-y-2">
              <Label htmlFor="resume-input" className="text-lg">
                Your Resume
              </Label>
              <div className="group relative">
                <Textarea
                  id="resume-input"
                  placeholder="Paste your resume here..."
                  className="min-h-96 resize-y"
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-transparent bg-background/80 opacity-0 transition-opacity group-focus-within:opacity-0 group-hover:opacity-100">
                    <UploadCloud className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="font-semibold text-muted-foreground">Upload PDF, DOCX, or Image</p>
                    <p className="text-sm text-muted-foreground/80">(Feature simulated: paste text directly)</p>
                </div>
              </div>
            </div>

            {/* Job Description/Role Input */}
            <div className="space-y-2">
              <Tabs
                value={jobInputMode}
                onValueChange={(v) =>
                  setJobInputMode(v as "description" | "role")
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="description">Job Description</TabsTrigger>
                  <TabsTrigger value="role">Desired Role</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-4">
                  <Label htmlFor="jd-input" className="text-lg">Job Description</Label>
                   <div className="group relative mt-2">
                    <Textarea
                      id="jd-input"
                      placeholder="Paste the job description here..."
                      className="min-h-96 resize-y"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                     <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-transparent bg-background/80 opacity-0 transition-opacity group-focus-within:opacity-0 group-hover:opacity-100">
                        <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
                        <p className="font-semibold text-muted-foreground">Paste from any source</p>
                        <p className="text-sm text-muted-foreground/80">LinkedIn, Google Docs, etc.</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="role" className="mt-4">
                  <Label htmlFor="role-input" className="text-lg">Desired Job Role</Label>
                  <Input
                    id="role-input"
                    placeholder="e.g., Senior Software Engineer"
                    className="mt-2 text-base"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No job description? No problem. Tell us what you're looking for.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={handleScan} disabled={isScanning || jobInputMode === 'role'}>
                {isScanning ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Scanning...</>) : (<>ATS Scan</>)}
            </Button>
            <Button size="lg" variant="outline" onClick={handleEnhance} disabled={isEnhancing}>
                {isEnhancing ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enhancing...</>) : (<><Sparkles className="mr-2 h-5 w-5"/> AI Enhance</>)}
            </Button>
        </div>
      </section>

      {/* Results Sections */}
      <div className="mt-12 space-y-8">
        {isScanning && (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">2. ATS Score & Analysis</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-8 md:flex-row">
                    <Skeleton className="size-48 rounded-full" />
                    <div className="w-full flex-1 space-y-4">
                        <Skeleton className="h-8 w-3/4"/>
                        <Skeleton className="h-6 w-full"/>
                        <Skeleton className="h-6 w-full"/>
                        <Skeleton className="h-6 w-5/6"/>
                    </div>
                </CardContent>
             </Card>
        )}
        {atsResult && (
          <div ref={resultsRef}>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">2. ATS Score & Analysis</CardTitle>
                </CardHeader>
              <CardContent className="flex flex-col items-center gap-8 md:flex-row">
                <CircleProgress score={atsResult.atsScore} />
                <div className="flex-1">
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Areas for Improvement</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5">
                      {atsResult.areasForImprovement.split('\n').map((line, i) => line.trim() && <li key={i}>{line.replace(/^- /, '')}</li>)}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isEnhancing && (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">3. Your Enhanced Resume</CardTitle>
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-96 w-full"/>
                </CardContent>
            </Card>
        )}
        {enhancedResume && (
          <div ref={enhanceRef}>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">3. Your Enhanced Resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  className="min-h-[600px] font-mono text-sm"
                  value={editedEnhancedResume}
                  onChange={(e) => setEditedEnhancedResume(e.target.value)}
                />
                <div className="flex flex-wrap items-center justify-end gap-2">
                   <Button variant="ghost" onClick={() => {
                        navigator.clipboard.writeText(editedEnhancedResume);
                        toast({title: "Copied to clipboard!"})
                   }}>
                        <Clipboard className="mr-2 h-4 w-4" />
                        Copy
                    </Button>
                  <Button onClick={() => handleDownload("txt")}>
                    <Download className="mr-2 h-4 w-4" />
                    Download .txt
                  </Button>
                   <Button variant="secondary" onClick={() => handleDownload("pdf")}>
                    <Download className="mr-2 h-4 w-4" />
                    Download .pdf
                  </Button>
                   <Button variant="secondary" onClick={() => handleDownload("docx")}>
                    <Download className="mr-2 h-4 w-4" />
                    Download .docx
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
