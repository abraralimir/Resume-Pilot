
'use server';

import {NextRequest, NextResponse} from 'next/server';
import { getAccessToken, getProfileData } from '@/app/services/linkedin';
import crypto from 'crypto';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const REDIRECT_URI = `${APP_URL}/api/auth/linkedin/callback`;
const SCOPE = 'openid profile email';


// Helper function to create a Base64-URL-encoded string
function base64URLEncode(str: Buffer): string {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Helper function to SHA256 hash a string
function sha256(buffer: string): Buffer {
    return crypto.createHash('sha256').update(buffer).digest();
}


export async function GET(req: NextRequest, { params }: { params: { route: string[] } }) {
  const route = params.route[0];
  
  if (route === 'signin') {
    // --- Step 1: Generate and store state and code verifier ---
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = base64URLEncode(crypto.randomBytes(32));

    const codeChallenge = base64URLEncode(sha256(codeVerifier));
    
    const authUrlParams = new URLSearchParams({
        response_type: 'code',
        client_id: LINKEDIN_CLIENT_ID!,
        redirect_uri: REDIRECT_URI,
        scope: SCOPE,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${authUrlParams.toString()}`;
    
    // Create a response to redirect AND set the cookies
    const response = NextResponse.redirect(authUrl);
    
    // Set cookies on the response object that will actually be returned
    response.cookies.set('linkedin_state', state, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', maxAge: 60 * 10, path: '/' }); // 10 minutes
    response.cookies.set('linkedin_code_verifier', codeVerifier, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', maxAge: 60 * 10, path: '/' });

    return response;
  }

  if (route === 'callback') {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // --- Step 2: Retrieve state and code verifier from cookies ---
    const storedState = req.cookies.get('linkedin_state')?.value;
    const storedCodeVerifier = req.cookies.get('linkedin_code_verifier')?.value;
    
    const clientCallbackUrl = new URL(`${APP_URL}/linkedin/callback`);
    
    // Create a response object that we can modify and return
    const response = NextResponse.redirect(clientCallbackUrl.toString());

    // --- Step 3: Validate state ---
    if (error || !state || !storedState || state !== storedState) {
      const errorDescription = searchParams.get('error_description') || 'Invalid state or an error occurred.';
      clientCallbackUrl.searchParams.set('error', error || 'state_mismatch');
      clientCallbackUrl.searchParams.set('error_description', encodeURIComponent(errorDescription));
       // Clear cookies on error
      response.cookies.delete('linkedin_state');
      response.cookies.delete('linkedin_code_verifier');
      response.headers.set('Location', clientCallbackUrl.toString());
      return response;
    }

    if (!code) {
        clientCallbackUrl.searchParams.set('error', 'no_code');
        clientCallbackUrl.searchParams.set('error_description', 'Authorization code not found.');
        response.cookies.delete('linkedin_state');
        response.cookies.delete('linkedin_code_verifier');
        response.headers.set('Location', clientCallbackUrl.toString());
        return response;
    }

    if (!storedCodeVerifier) {
        clientCallbackUrl.searchParams.set('error', 'no_code_verifier');
        clientCallbackUrl.searchParams.set('error_description', 'Code verifier not found. Your session may have expired.');
        response.cookies.delete('linkedin_state');
        response.cookies.delete('linkedin_code_verifier');
        response.headers.set('Location', clientCallbackUrl.toString());
        return response;
    }
    
    // Clear cookies after retrieving them, as they are single-use
    response.cookies.delete('linkedin_state');
    response.cookies.delete('linkedin_code_verifier');

    try {
        // --- Step 4: Exchange code for access token ---
        const { access_token } = await getAccessToken(code, REDIRECT_URI, storedCodeVerifier);
        const profileData = await getProfileData(access_token);
        
        clientCallbackUrl.searchParams.set('profile', JSON.stringify(profileData));
        response.headers.set('Location', clientCallbackUrl.toString());
        return response;

    } catch (err) {
        console.error('LinkedIn Callback Error:', err);
        const errorMessage = (err instanceof Error) ? err.message : 'Failed to fetch LinkedIn profile data.';
        clientCallbackUrl.searchParams.set('error', 'exchange_failed');
        clientCallbackUrl.searchParams.set('error_description', encodeURIComponent(errorMessage));
        response.headers.set('Location', clientCallbackUrl.toString());
        return response;
    }
  }

  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
