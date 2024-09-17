// app/api/server/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body to get the email
    const { email } = await req.json();

    // Get the Basiq API token from the headers
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token || !email) {
      return NextResponse.json({ error: 'Token or email is missing' }, { status: 400 });
    }
    console.log(token); 

    // Step 1: Create a user
    const userResponse = await axios.post(
      'https://au-api.basiq.io/users',
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const userId = userResponse.data.id;
    console.log(userResponse); 
    // Check if userId is retrieved
    if (!userId) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Step 2: Generate a Client Access Token
    const clientTokenResponse = await axios.post(
      'https://au-api.basiq.io/token',
      new URLSearchParams({
        scope: 'CLIENT_ACCESS',
        userId,
      }),
      {
        headers: {
          Authorization: `Basic ${process.env.NEXT_PUBLIC_BASI_Q_API_KEY}`,
          'Accept': 'application/json',
          'basiq-version': '3.0',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const clientAccessToken = clientTokenResponse.data.access_token;
    console.log(clientTokenResponse);
    // Check if clientAccessToken is retrieved
    if (!clientAccessToken) {
      console.error('Failed to retrieve client access token:', clientTokenResponse.data);
      return NextResponse.json({ error: 'Failed to generate client access token' }, { status: 500 });
    }

    // Step 3: Redirect to the consent URL
    const consentUrl = `https://consent.basiq.io/home?token=${clientAccessToken}&action=connect`;

    // Return the consent URL
    return NextResponse.json({ consentUrl, userId }, { status: 200 });
  } catch (error) {
    console.error('Error in server route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
