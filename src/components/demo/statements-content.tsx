'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClipLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';
import { Select, MenuItem, Avatar, ListItemText } from '@mui/material'; // For dropdown and avatar

const IncomeVerification = () => {
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [institutionId, setInstitutionId] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');
  const [jobStatus, setJobStatus] = useState<string>('');
  const [polling, setPolling] = useState<boolean>(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchInstitutions = async () => {
      const token = localStorage.getItem("BASI_Q_TOKEN");

      if (!token) {
        setUploadError('Token not found');
        return;
      }

      try {
        const response = await axios.get('https://au-api.basiq.io/institutions', {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${token}`,
          },
        });
        setInstitutions(response.data.data); // Set the list of banks
      } catch (err) {
        setUploadError('Failed to fetch institutions');
      }
    };

    fetchInstitutions();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setStatementFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!statementFile || !institutionId) {
      setUploadError('Please provide both a statement file and select an institution.');
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
      setUploadError(`Failed to upload statement`);
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

        const { steps } = response.data;
        const allStepsSuccessful = steps.every((step: any) => step.status === 'success');

        if (allStepsSuccessful) {
          setJobStatus('Job Completed');
          setPolling(false);
          clearInterval(intervalId);

          router.push('/income');
        } else if (response.data.status === 'failed') {
          setJobStatus('Job Failed');
          setPolling(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        setUploadError(`Failed to fetch job status`);
        setPolling(false);
        clearInterval(intervalId);
      }
    }, 2000);
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
              accept=".pdf,.csv"
              onChange={handleFileChange}
              className="block w-full mb-4"
            />
            
            {/* Dropdown with Bank Logos */}
            <Select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value as string)}
              displayEmpty
              className="w-full mb-4"
              renderValue={(selected) => {
                if (!selected) {
                  return <em>Select Institution</em>;
                }
                const selectedInstitution = institutions.find(inst => inst.id === selected);
                return (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      alt={selectedInstitution?.shortName}
                      src={selectedInstitution?.logo?.links?.square}
                      sx={{ width: 24, height: 24, marginRight: 1 }}
                    />
                    <span>{selectedInstitution?.shortName || selectedInstitution?.name}</span>
                  </div>
                );
              }}
            >
              <MenuItem value="">
                <em>Select Institution</em>
              </MenuItem>
              {institutions.map((institution) => (
                <MenuItem key={institution.id} value={institution.id}>
                  <Avatar
                    alt={institution.shortName}
                    src={institution.logo?.links?.square}
                    sx={{ width: 24, height: 24, marginRight: 1 }}
                  />
                  {institution.shortName || institution.name}
                </MenuItem>
              ))}
            </Select>

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
