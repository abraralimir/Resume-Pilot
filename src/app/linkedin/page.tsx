'use client';

import { Button } from "@/components/ui/button";
import { Construction, Linkedin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useRouter } from "next/navigation";

export default function LinkedInPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center">
                <div className="container mx-auto max-w-lg px-4 py-12 text-center">
                    <Construction className="mx-auto h-16 w-16 text-primary" />
                    <h1 className="mt-6 font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
                        Coming Soon!
                    </h1>
                    <p className="mt-6 text-lg text-muted-foreground">
                        Our AI-Powered LinkedIn Profile Analyzer is currently under construction. We're working hard to bring you a tool that will help you stand out to recruiters and land your dream job.
                    </p>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Check back soon!
                    </p>
                    <Button size="lg" className="mt-8" onClick={() => router.push('/')}>
                        Back to ResumePilot
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
}
