'use client';

import Link from "next/link"; 
import { useEffect, useState, useRef } from 'react'; 
import axios from 'axios'; 
import { CircularProgressBar } from "@/components/CircularProgressBar"; 

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null); 
  const [jobDetails, setJobDetails] = useState<any>(null); 
  const [loading, setLoading] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null); 
  const [progress, setProgress] = useState<number>(0); 
  const [progressBarColor, setProgressBarColor] = useState<string>('green'); 
  const [statusText, setStatusText] = useState<string>(''); 
  const [titleText, setTitleText] = useState<string>(''); 
  const [showConnectMessage, setShowConnectMessage] = useState<boolean>(false); 
  const intervalRef = useRef<NodeJS.Timeout | null>(null); 
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null); 

  useEffect(() => {
    const email = localStorage.getItem("USER_EMAIL");
    const token = localStorage.getItem("BASI_Q_TOKEN");
    const storedJobId = localStorage.getItem("JOB_ID");
    setUserEmail(email || null); 

    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId') || storedJobId;

    if (!jobId) {
      setShowConnectMessage(true);
      return;
    }

    localStorage.setItem("JOB_ID", jobId);

    if (token) {
      setLoading(true); 

      const fetchJobDetails = () => {
        axios.get(`/api/get-job?jobId=${jobId}&token=${token}`)
          .then(response => {
            const jobData = response.data; 
            setJobDetails(jobData); 

            const steps = jobData.steps || [];
            const totalSteps = steps.length;
            const completedSteps = steps.filter((step: any) => step.status === 'success').length;
            const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

            setProgress(progressPercentage); 

            const anyFailure = steps.some((step: any) => step.status === 'failed');
            setProgressBarColor(anyFailure ? 'red' : 'green'); 

            // Update status and title based on job step results
            if (anyFailure) {
              const failedStep = steps.find((step: any) => step.status === 'failed');
              setStatusText('Failed'); 
              setTitleText(failedStep.result?.title || 'Job Failed'); 
              setProgress(100); // Set progress to 100 on failure
            } else if (steps.length > 0) {
              const lastStep = steps[steps.length - 1];
              if (lastStep.status === 'success') {
                setStatusText('Success'); 
                setTitleText('Job Completed'); 
              } else {
                setStatusText('In Progress'); 
                setTitleText('');
              }
            } else {
              setStatusText('No Steps'); 
              setTitleText('');
            }

            // Stop the progress when all steps are complete
            const lastStep = steps[steps.length - 1];
            if (lastStep && (lastStep.status === 'success' || lastStep.status === 'failed')) {
              clearInterval(intervalRef.current!);
              clearInterval(progressIntervalRef.current!); 
            }
          })
          .catch(err => {
            console.error('API request error:', err);
            if (err.response?.data?.error === 'Internal server error') {
              setStatusText('Failed'); 
              setTitleText('Please retry to connect a bank account'); 
              setProgressBarColor('red'); 
              setProgress(100); // Set progress to 100 on internal error
              clearInterval(intervalRef.current!);
            } else if (err.response?.data?.message === 'Please connect a bank account') {
              setStatusText('Action Required'); 
              setTitleText('Please connect a bank account to proceed.'); 
              setProgressBarColor('gray'); 
              clearInterval(intervalRef.current!);
            } else {
              setError('Failed to fetch job details: ' + (err.response?.data?.error || err.message || 'Unknown error')); 
            }
          })
          .finally(() => setLoading(false)); 
      };

      fetchJobDetails(); 

      intervalRef.current = setInterval(() => {
        fetchJobDetails();
      }, 2000);

      // Increment progress every second until it reaches the calculated progress
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 100)); // Increment progress by 1
      }, 100); // Adjust the interval duration as needed

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    } else {
      setError('Token is missing'); 
    }
  }, []);

  return (
    <div className="p-6">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 mr-4">Welcome,</h1>
          <p className="text-xl text-gray-600">{userEmail || 'Guest'}</p> 
        </div>
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mr-4">Bank Connection Status</h2>
        </div>
      </div>
      {showConnectMessage ? (
        <div className="flex items-center mb-6">
          <CircularProgressBar
            value={0}
            color="gray"
            status="Action Required"
            title="Please connect a bank account"
          />
          <div className="mt-4 text-center">
            <p className="text-lg text-gray-700">To proceed with the income verification, you need to connect a bank account.</p>
            <Link href="/" className="mt-2 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Connect Bank Account
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-center mb-6">
          <CircularProgressBar
            value={progress}
            color={progressBarColor}
            status={statusText}
            title={titleText}
          />
        </div>
      )}
      {error && <div className="text-red-500 mt-4">{error}</div>} 
    </div>
  );
}
