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
    console.log('--- LinkedIn Sign-In Initiated ---');
    // --- Step 1: Generate and store state and code verifier ---
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = base64URLEncode(crypto.randomBytes(32));

    const codeChallenge = base64URLEncode(sha256(codeVerifier));

    console.log('Generated state:', state);
    console.log('Generated code_verifier:', codeVerifier);
    console.log('Using REDIRECT_URI:', REDIRECT_URI);

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

    console.log('Setting cookies and redirecting to LinkedIn...');
    // Set cookies on the response object that will actually be returned
    response.cookies.set('linkedin_state', state, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', maxAge: 60 * 10, path: '/', sameSite: 'lax' }); // 10 minutes
    response.cookies.set('linkedin_code_verifier', codeVerifier, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', maxAge: 60 * 10, path: '/', sameSite: 'lax' });

    return response;
  }

  if (route === 'callback') {
    console.log('--- LinkedIn Callback Received ---');
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    const storedState = req.cookies.get('linkedin_state')?.value;
    const storedCodeVerifier = req.cookies.get('linkedin_code_verifier')?.value;
    
    console.log('State from LinkedIn:', state);
    console.log('Stored state from cookie:', storedState);
    console.log('Stored code_verifier from cookie:', storedCodeVerifier ? '[PRESENT]' : '[MISSING]');

    const clientCallbackUrl = new URL(`${APP_URL}/linkedin/profile`);

    // --- Validate state ---
    if (error || !state || !storedState || state !== storedState) {
      const errorDescription = searchParams.get('error_description') || 'Invalid state or an error occurred.';
      console.error('State validation failed. Error:', error, 'Description:', errorDescription);
      console.error(`Comparison failed: state (from LinkedIn) was "${state}", storedState (from cookie) was "${storedState}"`);
      clientCallbackUrl.searchParams.set('error', error || 'state_mismatch');
      clientCallbackUrl.searchParams.set('error_description', encodeURIComponent(errorDescription));
      const response = NextResponse.redirect(clientCallbackUrl.toString());
      // Clean up cookies on failure
      response.cookies.delete('linkedin_state');
      response.cookies.delete('linkedin_code_verifier');
      return response;
    }
    
    console.log('State validation successful.');

    if (!code || !storedCodeVerifier) {
        const errorDescription = !code ? 'Authorization code not found.' : 'Code verifier not found. Your session may have expired.';
        console.error('Missing code or code_verifier. Error:', errorDescription);
        clientCallbackUrl.searchParams.set('error', !code ? 'no_code' : 'no_code_verifier');
        clientCallbackUrl.searchParams.set('error_description', encodeURIComponent(errorDescription));
        const response = NextResponse.redirect(clientCallbackUrl.toString());
        response.cookies.delete('linkedin_state');
        response.cookies.delete('linkedin_code_verifier');
        return response;
    }

    try {
        console.log('Exchanging authorization code for access token...');
        // Exchange code for access token
        const { access_token } = await getAccessToken(code, REDIRECT_URI, storedCodeVerifier);
        console.log('Access token received successfully.');
        const profileData = await getProfileData(access_token);
        console.log('Profile data received:', profileData.given_name, profileData.email);
        
        // Pass data to the client-side page via URL parameters
        clientCallbackUrl.searchParams.set('name', `${profileData.given_name} ${profileData.family_name}`);
        clientCallbackUrl.searchParams.set('email', profileData.email);
        clientCallbackUrl.searchParams.set('picture', profileData.picture);

        const response = NextResponse.redirect(clientCallbackUrl.toString());

        console.log('Redirecting to profile page with user data.');
        // Clear state and verifier cookies as they are single-use
        response.cookies.delete('linkedin_state');
        response.cookies.delete('linkedin_code_verifier');
        
        return response;

    } catch (err) {
        console.error('LinkedIn Callback Error during token exchange or profile fetch:', err);
        const errorMessage = (err instanceof Error) ? err.message : 'Failed to fetch LinkedIn profile data.';
        clientCallbackUrl.searchParams.set('error', 'exchange_failed');
        clientCallbackUrl.searchParams.set('error_description', encodeURIComponent(errorMessage));
        return NextResponse.redirect(clientCallbackUrl.toString());
    }
  }

  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
