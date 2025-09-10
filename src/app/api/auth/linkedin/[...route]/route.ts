
import {NextRequest, NextResponse} from 'next/server';
import { getAccessToken, getProfileData } from '@/app/services/linkedin';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
// The redirect URI now points to our new callback page
const REDIRECT_URI = 'http://localhost:9002/linkedin/callback';

export async function GET(req: NextRequest, { params }: { params: { route: string[] } }) {
  const route = params.route[0];

  if (route === 'signin') {
    // The 'profile' scope is deprecated, using 'openid profile email' which are part of the new standard.
    const scope = 'openid profile email';
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    return NextResponse.redirect(authUrl);
  }

  // The original callback logic is no longer needed here, as it will be handled by the new page.
  // We keep the file in case we need to add other related API routes later.
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

    