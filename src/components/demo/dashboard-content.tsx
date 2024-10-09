'use client';

import Link from "next/link"; 
import { useEffect, useState, useRef } from 'react'; 
import axios from 'axios'; 
import { CircularProgressBar } from "@/components/CircularProgressBar"; 
import Cookies from 'js-cookie';
import { 
  COOKIES_JOB, 
  COOKIES_TOKEN, 
  LOCAL_STORAGE_USER_EMAIL, 
  LOCAL_STORAGE_TOKEN, 
  LOCAL_STORAGE_JOB_ID 
} from '@/components/Constants/constants';



export default function DashboardPage() {
  // State variables for managing user email, job details, loading state, error messages, progress, and other UI text
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
    // Retrieve user email and token from local storage
    const email = localStorage.getItem(LOCAL_STORAGE_USER_EMAIL);
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN);

    // Check if the jobId exists in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');

    // If jobId is found in URL, set it in cookies and local storage
    if (jobId) {
      Cookies.set(COOKIES_JOB, jobId); // Set jobId in cookie
      localStorage.setItem(LOCAL_STORAGE_JOB_ID, jobId); // Also store in local storage for future reference
    } else {
      // If no jobId is found, check local storage
      const storedJobId = localStorage.getItem(LOCAL_STORAGE_JOB_ID);
      if (!storedJobId) {
        // Show message to connect bank account if jobId is still not found
        setShowConnectMessage(true);
        return;
      }
    }

    // Set cookies if token exists
    if (token) {
      Cookies.set(COOKIES_TOKEN, token);
    }

    setUserEmail(email || null); 

    // Proceed only if the token is available
    if (token) {
      setLoading(true); 

      const fetchJobDetails = () => {
        // Use the jobId from the URL or local storage
        const currentJobId = jobId || localStorage.getItem(LOCAL_STORAGE_JOB_ID);

        if (!currentJobId) {
          setShowConnectMessage(true);
          return;
        }

        // Make API call to fetch job details using the job ID and token
        axios.get(`/api/get-job`)
          .then(response => {
            const jobData = response.data; 
            setJobDetails(jobData); 

            // Calculate progress based on job steps
            const steps = jobData.steps || [];
            const totalSteps = steps.length;
            const completedSteps = steps.filter((step: any) => step.status === 'success').length;
            const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

            setProgress(progressPercentage); 

            // Determine progress bar color based on step status
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

            // Stop progress updates when all steps are complete
            const lastStep = steps[steps.length - 1];
            if (lastStep && (lastStep.status === 'success' || lastStep.status === 'failed')) {
              clearInterval(intervalRef.current!);
              clearInterval(progressIntervalRef.current!); 
            }
          })
          .catch(err => {
            // Handle API errors and set appropriate messages
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
              setProgress(100); // Set progress to 100 on internal error
              setProgressBarColor('gray'); 
              clearInterval(intervalRef.current!);
            } else {
              setError('Failed to fetch job details: ' + (err.response?.data?.error || err.message || 'Unknown error')); 
            }
          })
          .finally(() => setLoading(false)); 
      };

      // Fetch job details immediately
      fetchJobDetails(); 

      // Set up interval to fetch job details every 2 seconds
      intervalRef.current = setInterval(() => {
        fetchJobDetails();
      }, 2000);

      // Increment progress every second until it reaches the calculated progress
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 100)); // Increment progress by 1
      }, 1000); // Adjust the interval duration as needed

      // Cleanup function to clear intervals on component unmount
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
        // Render message to connect bank account if needed
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
        // Render progress bar with current job progress
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
