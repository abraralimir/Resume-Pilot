
import {NextRequest, NextResponse} from 'next/server';
import { getAccessToken, getProfileData } from '@/app/services/linkedin';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
// The redirect URI now points to our new callback page
const REDIRECT_URI = 'http://localhost:9002/api/auth/linkedin/callback';

export async function GET(req: NextRequest, { params }: { params: { route: string[] } }) {
  const route = params.route[0];

  if (route === 'signin') {
    // The 'profile' scope is deprecated, using 'openid profile email' which are part of the new standard.
    const scope = 'openid profile email';
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    return NextResponse.redirect(authUrl);
  }

  if (route === 'callback') {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      const errorDescription = searchParams.get('error_description') || 'An error occurred.';
      return NextResponse.redirect(`http://localhost:9002/linkedin/callback?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription)}`);
    }

    if (!code) {
      return NextResponse.redirect(`http://localhost:9002/linkedin/callback?error=no_code&error_description=Authorization code not found.`);
    }

    // Since we are now handling the callback on the server, we can directly
    // exchange the code for profile data here.
    try {
        const { access_token } = await getAccessToken(code);
        const profileData = await getProfileData(access_token);
        
        // We'll pass the data via query params to the client-side page
        const clientCallbackUrl = new URL('http://localhost:9002/linkedin/callback');
        clientCallbackUrl.searchParams.set('profile', JSON.stringify(profileData));

        return NextResponse.redirect(clientCallbackUrl.toString());

    } catch (err) {
        console.error('LinkedIn Callback Error:', err);
        const errorMessage = (err instanceof Error) ? err.message : 'Failed to fetch LinkedIn profile data.';
        return NextResponse.redirect(`http://localhost:9002/linkedin/callback?error=exchange_failed&error_description=${encodeURIComponent(errorMessage)}`);
    }
  }

  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
