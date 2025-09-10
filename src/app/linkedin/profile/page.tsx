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

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

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
        if (errorParam) {
            const description = searchParams.get('error_description');
            setError(`Login Failed: ${decodeURIComponent(description || errorParam)}`);
            setIsLoading(false);
            return;
        }

        // The auth flow now stores profile data in a cookie. We need to read it.
        try {
            const profileCookie = getCookie('linkedin_profile');
            if (profileCookie) {
                const profileData = JSON.parse(decodeURIComponent(profileCookie));
                setProfile({
                  name: `${profileData.given_name} ${profileData.family_name}`,
                  email: profileData.email,
                  picture: profileData.picture,
                });
            } else if (!profile) {
                 setError("Could not retrieve LinkedIn profile. Please try signing in again.");
            }
        } catch (e) {
            console.error("Failed to parse profile cookie", e);
            setError("There was an issue processing your profile data. Please try again.");
        } finally {
             setIsLoading(false);
        }
        
        // This is a workaround to close the popup if it's still open
        if (window.opener) {
            window.opener.location.reload(); // Reload the main page
            window.close();
        }

    }, [searchParams, router, profile]);

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

    if (isLoading) {
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
        )
    }

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

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 py-12 md:py-20">
                <div className="container max-w-4xl mx-auto space-y-8">
                    {profile && (
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
                    )}

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
