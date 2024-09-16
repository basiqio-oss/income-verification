import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST() {
  try {
    const response = await axios.post(
      'https://au-api.basiq.io/token',
      new URLSearchParams({ scope: 'SERVER_ACCESS' }).toString(),
      {
        headers: {
          Authorization: `Basic ${process.env.NEXT_PUBLIC_BASI_Q_API_KEY}`,
          accept: 'application/json',
          'basiq-version': '3.0',
          'content-type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return NextResponse.json({ token: response.data.access_token });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error response:', error.response?.data);
      console.error('Axios error message:', error.message);
      console.error('Axios error config:', error.config);
      console.error('Axios error status:', error.response?.status);
      return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
    }

    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
  }
}
