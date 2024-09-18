'use client';

import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClipLoader } from 'react-spinners';
import { useRouter } from 'next/navigation'; // Import useRouter

const IncomeVerification = () => {
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [institutionId, setInstitutionId] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');
  const [jobStatus, setJobStatus] = useState<string>('');
  const [polling, setPolling] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [accountsInfo, setAccountsInfo] = useState<any[]>([]);

  const router = useRouter(); // Initialize useRouter

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setStatementFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!statementFile || !institutionId) {
      setUploadError('Please provide both a statement file and institution ID.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    setJobStatus('');
    setPolling(false);

    const token = localStorage.getItem("BASI_Q_TOKEN");
    const userId = localStorage.getItem("USER_ID");

    if (!token || !userId) {
      setUploadError('Token or User ID not found');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('statement', statementFile);
    formData.append('institutionId', institutionId);

    try {
      const response = await axios.post(`https://au-api.basiq.io/users/${userId}/statements`, formData, {
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${token}`,
          'content-type': 'multipart/form-data',
        },
      });

      if (response.status === 202 && response.data.type === 'job') {
        const jobId = response.data.id;
       setJobStatus('Polling for job status...');
        setPolling(true);
        pollJobStatus(jobId);
      } else {
        setUploadError(`Unexpected response: ${JSON.stringify(response.data)}`);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setUploadError(`Failed to upload statement: ${err.response?.data?.error || err.message}`);
      } else {
        setUploadError(`Failed to upload statement: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const pollJobStatus = (jobId: string) => {
    const token = localStorage.getItem("BASI_Q_TOKEN");

    if (!token) {
      setUploadError('Token not found');
      setPolling(false);
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(`https://au-api.basiq.io/jobs/${jobId}`, {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${token}`,
          },
        });

        console.log('Job status response:', response.data); // Debugging

        const { steps } = response.data;
        const allStepsSuccessful = steps.every((step: any) => step.status === 'success');

        if (allStepsSuccessful) {
          setJobStatus('Job Completed');
          setPolling(false);
          clearInterval(intervalId);

          // Fetch user and account information from job result
          fetchJobResults(steps);

          // Redirect to income page
          router.push('/income');
        } else if (response.data.status === 'failed') {
          setJobStatus('Job Failed');
          setPolling(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setUploadError(`Failed to fetch job status: ${err.response?.data?.error || err.message}`);
        } else {
          setUploadError(`Failed to fetch job status: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        setPolling(false);
        clearInterval(intervalId);
      }
    }, 2000); // Poll every 2 seconds
  };

  const fetchJobResults = async (steps: any[]) => {
    const token = localStorage.getItem("BASI_Q_TOKEN");

    if (!token) {
      setUploadError('Token not found');
      return;
    }

    try {
      // Fetch user info from the first step URL
      const userResponse = await axios.get(`https://au-api.basiq.io${steps[1].result.url}`, {
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${token}`,
        },
      });

      setUserInfo(userResponse.data);

      // Fetch account info from the second step URL
      const accountsResponse = await axios.get(`https://au-api.basiq.io${steps[2].result.url}`, {
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${token}`,
        },
      });

      setAccountsInfo(accountsResponse.data);

    } catch (err) {
      if (axios.isAxiosError(err)) {
        setUploadError(`Failed to fetch job results: ${err.response?.data?.error || err.message}`);
      } else {
        setUploadError(`Failed to fetch job results: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <div>
      {/* Upload Statement Form */}
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-gray-800">Upload Statement</h2>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full mb-4"
            />
            <input
              type="text"
              placeholder="Institution ID"
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="block w-full mb-4 p-2 border rounded"
            />
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              disabled={uploading || polling}
            >
              {uploading ? 'Uploading...' : polling ? 'Polling...' : 'Upload Statement'}
            </button>
            {uploadError && <p className="text-red-500 mt-2">{uploadError}</p>}
            {uploadSuccess && <p className="text-green-500 mt-2">{uploadSuccess}</p>}
            {polling && (
              <div className="flex justify-center mt-4">
                <ClipLoader color="#000" loading={polling} size={50} />
              </div>
            )}
            {jobStatus && <p className="text-gray-500 mt-2">{jobStatus}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomeVerification;
