// src/app/api/get-job/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  try {
    // Extract jobId and token from query parameters
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    const token = url.searchParams.get('token');

    if (!jobId || jobId === 'null' || !token || token === 'null') {
      // Return a message prompting the user to connect a bank account if jobId or token is missing
      return NextResponse.json({ message: 'Please connect a bank account' }, { status: 400 });
    }

    // Fetch job details from Basiq API
    const jobResponse = await axios.get(`https://au-api.basiq.io/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'basiq-version': '3.0',
      },
    });

    return NextResponse.json(jobResponse.data, { status: 200 });
  } catch (error) {
    console.error('Error fetching job details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
