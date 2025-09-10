
'use server';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

export async function getAccessToken(code: string, redirectUri: string): Promise<{ access_token: string }> {
  const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
      throw new Error('LinkedIn Client ID or Secret is not configured in environment variables.');
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: LINKEDIN_CLIENT_ID,
    client_secret: LINKEDIN_CLIENT_SECRET,
    redirect_uri: redirectUri,
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
