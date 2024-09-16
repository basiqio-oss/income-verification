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
  } catch (error) {
    return NextResponse.error();
  }
}
