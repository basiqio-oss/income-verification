// src/app/api/get-job/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';
import { 
  COOKIES_JOB, 
  COOKIES_TOKEN 
} from '@/components/Constants/constants';


export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIES_TOKEN)?.value; // Get the token value
    const jobId = cookieStore.get(COOKIES_JOB)?.value; // Get the job ID value

    if (!jobId || jobId === 'null' || !token || token === 'null') {
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

export const dynamic = 'force-dynamic'

