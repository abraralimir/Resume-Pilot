
import {NextRequest, NextResponse} from 'next/server';
import { getAccessToken, getProfileData } from '@/app/services/linkedin';

// This new route exists solely to be called from the client-side callback page.
// It securely exchanges the authorization code for an access token and profile data on the server.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Authorization code not found.' }, { status: 400 });
  }

  try {
    const { access_token } = await getAccessToken(code);
    const profileData = await getProfileData(access_token);
    
    // Return the fetched profile data to the callback page.
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('LinkedIn Exchange Code Error:', error);
    const errorMessage = (error instanceof Error) ? error.message : 'Failed to fetch LinkedIn profile data.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


    