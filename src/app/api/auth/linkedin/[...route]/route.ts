
import {NextRequest, NextResponse} from 'next/server';
import { getAccessToken, getProfileData } from '@/app/services/linkedin';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;

function getRedirectUri(req: NextRequest): string {
    const host = req.headers.get('host') || 'localhost:9002';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    return `${protocol}://${host}/api/auth/linkedin/callback`;
}

export async function GET(req: NextRequest, { params }: { params: { route: string[] } }) {
  const route = params.route[0];
  
  if (route === 'signin') {
    const REDIRECT_URI = getRedirectUri(req);
    const scope = 'openid profile email';
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    return NextResponse.redirect(authUrl);
  }

  if (route === 'callback') {
    const REDIRECT_URI = getRedirectUri(req); // Re-create the same URI for the token exchange
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const host = req.headers.get('host') || 'localhost:9002';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const clientCallbackUrl = new URL(`${protocol}://${host}/linkedin/callback`);

    if (error) {
      const errorDescription = searchParams.get('error_description') || 'An error occurred.';
      clientCallbackUrl.searchParams.set('error', encodeURIComponent(error));
      clientCallbackUrl.searchParams.set('error_description', encodeURIComponent(errorDescription));
      return NextResponse.redirect(clientCallbackUrl.toString());
    }

    if (!code) {
        clientCallbackUrl.searchParams.set('error', 'no_code');
        clientCallbackUrl.searchParams.set('error_description', 'Authorization code not found.');
        return NextResponse.redirect(clientCallbackUrl.toString());
    }

    try {
        const { access_token } = await getAccessToken(code, REDIRECT_URI);
        const profileData = await getProfileData(access_token);
        
        clientCallbackUrl.searchParams.set('profile', JSON.stringify(profileData));
        return NextResponse.redirect(clientCallbackUrl.toString());

    } catch (err) {
        console.error('LinkedIn Callback Error:', err);
        const errorMessage = (err instanceof Error) ? err.message : 'Failed to fetch LinkedIn profile data.';
        clientCallbackUrl.searchParams.set('error', 'exchange_failed');
        clientCallbackUrl.searchParams.set('error_description', encodeURIComponent(errorMessage));
        return NextResponse.redirect(clientCallbackUrl.toString());
    }
  }

  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
