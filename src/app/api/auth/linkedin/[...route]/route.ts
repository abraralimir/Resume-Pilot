
import {NextRequest, NextResponse} from 'next/server';
import { getAccessToken, getProfileData } from '@/app/services/linkedin';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const REDIRECT_URI = 'http://localhost:9002/api/auth/linkedin/callback';

export async function GET(req: NextRequest, { params }: { params: { route: string[] } }) {
  const route = params.route[0];

  if (route === 'signin') {
    const scope = 'profile openid email';
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    return NextResponse.redirect(authUrl);
  }

  if (route === 'callback') {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Authorization code not found.' }, { status: 400 });
    }

    try {
      const { access_token } = await getAccessToken(code);
      const profileData = await getProfileData(access_token);
      
      // For now, just return the data. We'll integrate this into the app UI later.
      // In a real app, you'd likely store this in a session or redirect the user.
      return NextResponse.json(profileData);
    } catch (error) {
      console.error('LinkedIn Callback Error:', error);
      return NextResponse.json({ error: 'Failed to fetch LinkedIn profile data.' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
