'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { getLinkedInAnalysis } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { LinkedInProfile } from '@/ai/flows/linkedin-profile-analyzer';
import { Skeleton } from '@/components/ui/skeleton';

export default function LinkedInProfilePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const [profile, setProfile] = useState<LinkedInProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, startAnalyzing] = useTransition();

    useEffect(() => {
        const errorParam = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const picture = searchParams.get('picture');

        // This effect runs on the page after the server-side callback.
        // It handles three scenarios: error, success in popup, success on main page.
        if (errorParam) {
            const decodedError = `Login Failed: ${decodeURIComponent(errorDesc || errorParam)}`;
            setError(decodedError);
            setIsLoading(false);
            // If we are in a popup, tell the main window about the error and close.
            if (window.opener) {
                const errorUrl = new URL(window.location.href);
                errorUrl.searchParams.set('error', 'true');
                errorUrl.searchParams.set('error_description', decodedError);
                 window.opener.location.href = `/linkedin/profile?${errorUrl.searchParams.toString()}`;
                window.close();
            }
            return;
        }

        // If we have profile data, it means success.
        if (name && email && picture) {
            const userProfile = { name, email, picture };
            setProfile(userProfile);
            setIsLoading(false);

            // If this page is running in the popup, we must update the main window
            // and close the popup.
            if (window.opener) {
                window.opener.location.href = window.location.href;
                window.close();
            }
        } else {
            // If there's no error and no profile data, we might be on the initial load
            // of the main window's /linkedin/profile page. We can just wait.
            setIsLoading(false);
        }

    }, [searchParams, router]);


    const handleAnalyze = async () => {
        if (!profile) return;

        startAnalyzing(async () => {
            try {
                const result = await getLinkedInAnalysis(profile);
                setAnalysis(result.analysis);
            } catch (err) {
                toast({
                    variant: 'destructive',
                    title: 'Analysis Failed',
                    description: err instanceof Error ? err.message : 'An unknown error occurred.',
                });
            }
        });
    };

    if (error) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2"><AlertCircle /> Authentication Failed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{error}</p>
                            <Button onClick={() => router.push('/linkedin')} className="mt-4 w-full">Try Again</Button>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        )
    }
    
    if (!profile && !error) {
        return (
             <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                   <div className="flex flex-col items-center gap-4 text-center">
                      <h1 className="font-headline text-3xl font-bold">Profile Analysis</h1>
                      <p className="text-muted-foreground max-w-md">Sign in with LinkedIn on the previous page to view your profile analysis.</p>
                      <Button onClick={() => router.push('/linkedin')}>Go to Sign In</Button>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    if (profile) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 py-12 md:py-20">
                    <div className="container max-w-4xl mx-auto space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-3xl">Your LinkedIn Profile</CardTitle>
                                <CardDescription>Here is the basic information we retrieved. Now, let's analyze it!</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                                <Image
                                    src={profile.picture}
                                    alt={profile.name}
                                    width={100}
                                    height={100}
                                    className="rounded-full"
                                />
                                <div className="text-center sm:text-left">
                                    <h2 className="text-2xl font-semibold">{profile.name}</h2>
                                    <p className="text-muted-foreground">{profile.email}</p>
                                </div>
                                <Button size="lg" className="sm:ml-auto" onClick={handleAnalyze} disabled={isAnalyzing}>
                                    {isAnalyzing ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Sparkles className="mr-2 h-5 w-5"/>}
                                    Analyze with AI
                                </Button>
                            </CardContent>
                        </Card>

                        {(isAnalyzing || analysis) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline text-3xl">AI-Powered Analysis & Suggestions</CardTitle>
                                    <CardDescription>Expert recommendations to optimize your profile.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isAnalyzing ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-8 w-3/4"/>
                                            <Skeleton className="h-24 w-full"/>
                                            <Skeleton className="h-6 w-5/6"/>
                                        </div>
                                    ) : (
                                    analysis && (
                                        <Alert className="bg-transparent text-base">
                                            <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
                                        </Alert>
                                    )
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
                <Footer />
            </div>
        );
    }
    
     return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-lg">Loading Profile...</p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
