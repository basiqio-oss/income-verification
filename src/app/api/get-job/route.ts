// app/api/get-job/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  try {
    // Extract jobId and token from query parameters
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const token = searchParams.get('token'); // Extract token from query parameters

    console.log(jobId);
    if (!jobId || !token) {
      return NextResponse.json({ error: 'Job ID and token are required' }, { status: 400 });
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
