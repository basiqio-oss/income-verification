'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClipLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';
import { Select, MenuItem, Avatar, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDropzone } from 'react-dropzone';
import { Upload } from "lucide-react";

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
  const theme = useTheme();

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

        const { data } = response.data;
        const errorInstitution = data.find((item: any) => item.code === 'institution-not-supported');

        if (errorInstitution) {
          setUploadError(`Error: ${errorInstitution.detail}`);
          return;
        }

        setInstitutions(data);
      } catch (err) {
        setUploadError('Failed to fetch institutions');
      }
    };

    fetchInstitutions();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setStatementFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv']
    }
  });

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
        const failedStep = steps.find((step: any) => step.status === 'failed');

        if (failedStep) {
          setJobStatus(`Job Failed at: ${failedStep.title}. Error: ${failedStep.result.detail}`);
          setPolling(false);
          clearInterval(intervalId);
          return;
        }

        const allStepsSuccessful = steps.every((step: any) => step.status === 'success');

        if (allStepsSuccessful) {
          setJobStatus('Job Completed');
          setPolling(false);
          clearInterval(intervalId);
          router.push('/income');
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
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="inline-flex items-center">
          <h2 className="text-2xl font-semibold">Upload Statement</h2>
        </CardHeader>

        <CardContent>
          <div className="mb-6">
            <div
              {...getRootProps()}
              className={`border-2 p-6 rounded-lg text-center ${isDragActive ? 'border-blue-500' : 'border-gray-300'} mb-6`}  
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files here...</p>
              ) : (
                <p>Drag and drop a file here (PDF or CSV), or click to select one</p>
              )}
            </div>

            <Select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value as string)}
              displayEmpty
              className="w-full mb-4"
              style={{
                color: theme.palette.mode === 'light' ? 'rgb(128 , 128, 128)' : 'rgb(0, 0, 0)',
                border: '1px solid white',
              }}
              MenuProps={{
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                PaperProps: {
                  style: {
                    maxHeight: 48 * 4.5 + 8,
                    width: 250,
                  },
                },
              }}
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
                    <Typography style={{ color: theme.palette.text.primary }}>
                      {selectedInstitution?.shortName || selectedInstitution?.name}
                    </Typography>
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
                  <Typography style={{ color: theme.palette.text.primary }}>
                    {institution.shortName || institution.name}
                  </Typography>
                </MenuItem>
              ))}
            </Select>


            <button
              onClick={handleUpload}
              className="px-4 py-2 rounded hover:bg-opacity-90 transition"
              style={{
                backgroundColor: theme.palette.mode === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
                color: theme.palette.mode === 'light' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
                border: '1px solid white',
              }}
              disabled={uploading || polling}
            >
              {polling ? 'Uploading...' : 'Upload Statement'}
            </button>

            {uploadError && <p className="text-red-500 mt-2">{uploadError}</p>}
            {uploadSuccess && <p className="text-green-500 mt-2">{uploadSuccess}</p>}
            {polling && (
              <div className="flex justify-center mt-4">
                <ClipLoader color={theme.palette.primary.main} loading={polling} size={50} />
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
