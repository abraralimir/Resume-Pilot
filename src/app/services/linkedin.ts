
'use server';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
// Ensure this redirect URI matches the one in your LinkedIn Developer App settings AND the one used to initiate the login.
const REDIRECT_URI = 'http://localhost:9002/linkedin/callback';

export async function getAccessToken(code: string): Promise<{ access_token: string }> {
  const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: LINKEDIN_CLIENT_ID!,
    client_secret: LINKEDIN_CLIENT_SECRET!,
    redirect_uri: REDIRECT_URI,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("LinkedIn getAccessToken error:", errorData);
    throw new Error(`Failed to get access token: ${errorData.error_description || response.statusText}`);
  }

  return response.json();
}

export async function getProfileData(accessToken: string): Promise<any> {
    // This endpoint fetches the profile fields available under the 'openid', 'profile', and 'email' scopes.
    const profileUrl = 'https://api.linkedin.com/v2/userinfo';

    const response = await fetch(profileUrl, {
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("LinkedIn getProfileData error:", errorData);
        throw new Error('Failed to fetch profile data from LinkedIn');
    }

    return response.json();
}

    