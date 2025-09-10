
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This is a client-side component to handle the final step of LinkedIn auth.
export default function LinkedInCallbackPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const profileParam = searchParams.get('profile');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`Login failed: ${searchParams.get('error_description') || errorParam}`);
      return;
    }
    
    if (profileParam) {
        try {
            const profileData = JSON.parse(profileParam);
             if (window.opener) {
                // Send the profile data to the main window that opened this popup.
                window.opener.postMessage({ type: 'linkedin-profile', data: profileData }, window.location.origin);
                // Close the popup window.
                window.close();
            } else {
                setError('Could not find the main window. Please close this tab and try again.');
            }
        } catch(e) {
            setError('Failed to parse profile data.');
        }
    }

  }, [searchParams]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      {error ? (
        <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive">Authentication Failed</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <button 
                onClick={() => window.close()}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
                Close
            </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg">Finalizing Authentication...</p>
          <p className="text-sm text-muted-foreground">Please wait, this window will close automatically.</p>
        </div>
      )}
    </div>
  );
}
