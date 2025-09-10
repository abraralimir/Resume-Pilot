'use client';

import { Button } from "@/components/ui/button";
import { Linkedin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function LinkedInPage() {
    
    const handleLinkedInSignIn = () => {
        // We can keep the popup experience for a better UX
        const width = 600, height = 700;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        window.open(
            '/api/auth/linkedin/signin',
            'linkedin-auth',
            `width=${width},height=${height},top=${top},left=${left}`
        );
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center">
                <div className="container mx-auto max-w-lg px-4 py-12 text-center">
                    <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
                        AI-Powered LinkedIn Profile Analysis
                    </h1>
                    <p className="mt-6 text-lg text-muted-foreground">
                        Unlock your career potential. Get an instant, data-driven analysis of your LinkedIn profile to stand out to recruiters and land your dream job.
                    </p>
                    <Button size="lg" className="mt-8" onClick={handleLinkedInSignIn}>
                        <Linkedin className="mr-2 h-5 w-5" />
                        Sign in with LinkedIn to Get Started
                    </Button>
                </div>
            </main>
            <Footer />
        </div>
    );
}
