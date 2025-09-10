
'use server';

import {NextRequest, NextResponse} from 'next/server';
import { getAccessToken, getProfileData } from '@/app/services/linkedin';
import crypto from 'crypto';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
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
    
    // Store state and code verifier in cookies
    const cookies = new NextResponse().cookies;
    cookies.set('linkedin_state', state, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', maxAge: 60 * 10 }); // 10 minutes
    cookies.set('linkedin_code_verifier', codeVerifier, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', maxAge: 60 * 10 });

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
    
    // Create a response to redirect and set the cookies
    const response = NextResponse.redirect(authUrl);
    response.cookies.set(cookies.get('linkedin_state')!);
    response.cookies.set(cookies.get('linkedin_code_verifier')!);
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
    
    // Clear cookies after retrieving them, regardless of outcome
    const response = NextResponse.redirect(clientCallbackUrl.toString());
    response.cookies.delete('linkedin_state');
    response.cookies.delete('linkedin_code_verifier');

    // --- Step 3: Validate state ---
    if (error || !state || !storedState || state !== storedState) {
      const errorDescription = searchParams.get('error_description') || 'Invalid state or an error occurred.';
      clientCallbackUrl.searchParams.set('error', error || 'state_mismatch');
      clientCallbackUrl.search-params.set('error_description', encodeURIComponent(errorDescription));
      return response;
    }

    if (!code) {
        clientCallbackUrl.searchParams.set('error', 'no_code');
        clientCallbackUrl.searchParams.set('error_description', 'Authorization code not found.');
        return response;
    }

    if (!storedCodeVerifier) {
        clientCallbackUrl.searchParams.set('error', 'no_code_verifier');
        clientCallbackUrl.searchParams.set('error_description', 'Code verifier not found. Your session may have expired.');
        return response;
    }

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
