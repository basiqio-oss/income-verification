'use client';

import Link from "next/link"; // Importing Link component for navigation
import { useEffect, useState, useRef } from 'react'; // Importing hooks from React
import axios from 'axios'; // Importing Axios for API requests
import { CircularProgressBar } from "@/components/CircularProgressBar"; // Importing custom CircularProgressBar component

export default function DashboardPage() {
  // State variables
  const [userEmail, setUserEmail] = useState<string | null>(null); // User email state
  const [jobDetails, setJobDetails] = useState<any>(null); // Job details state
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [progress, setProgress] = useState<number>(0); // Progress percentage state
  const [progressBarColor, setProgressBarColor] = useState<string>('green'); // Progress bar color state
  const [statusText, setStatusText] = useState<string>(''); // Status text state
  const [titleText, setTitleText] = useState<string>(''); // Title text state
  const [showConnectMessage, setShowConnectMessage] = useState<boolean>(false); // Message to show if bank account is needed
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Reference for interval ID

  useEffect(() => {
    // Retrieve user email and token from local storage
    const email = localStorage.getItem("USER_EMAIL");
    const token = localStorage.getItem("BASI_Q_TOKEN");
    const storedJobId = localStorage.getItem("JOB_ID");
    setUserEmail(email || null); // Set user email state

    // Get job ID from URL parameters or local storage
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId') || storedJobId;

    if (!jobId) {
      // Show connect message if job ID is not available
      setShowConnectMessage(true);
      return;
    }

    localStorage.setItem("JOB_ID", jobId); // Store job ID in local storage

    if (token) {
      setLoading(true); // Set loading state to true

      const fetchJobDetails = () => {
        // Fetch job details from API
        axios.get(`/api/get-job?jobId=${jobId}&token=${token}`)
          .then(response => {
            const jobData = response.data; // Extract job data from response
            setJobDetails(jobData); // Set job details state

            // Determine the progress based on job steps
            const steps = jobData.steps || [];
            const totalSteps = steps.length;
            const completedSteps = steps.filter((step: any) => step.status === 'success').length;
            const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0; // Calculate progress percentage

            setProgress(progressPercentage); // Update progress state

            // Determine the color of the progress bar based on job step statuses
            const anyFailure = steps.some((step: any) => step.status === 'failed');
            setProgressBarColor(anyFailure ? 'red' : 'green'); // Set progress bar color

            // Get the status and title for the progress bar
            const failedStep = steps.find((step: any) => step.status === 'failed');
            if (failedStep) {
              setStatusText('Failed'); // Set status text for failed step
              setTitleText(failedStep.result?.title || 'Job Failed'); // Set title text for failed job
            } else if (steps.length > 0) {
              const lastStep = steps[steps.length - 1];
              if (lastStep.status === 'success') {
                setStatusText('Success'); // Set status text for successful job
                setTitleText('Job Completed'); // Set title text for completed job
              } else {
                setStatusText('In Progress'); // Set status text for ongoing job
                setTitleText('');
              }
            } else {
              setStatusText('No Steps'); // Handle case with no job steps
              setTitleText('');
            }

            // Stop polling if the job is complete
            const lastStep = steps[steps.length - 1];
            if (lastStep && (lastStep.status === 'success' || lastStep.status === 'failed')) {
              clearInterval(intervalRef.current!); // Clear interval if job is done
            }
          })
          .catch(err => {
            console.error('API request error:', err); // Log API request error

            // Handle specific error cases
            if (err.response?.data?.error === 'Internal server error') {
              setStatusText('Error'); // Set error status text
              setTitleText('Internal Server Error'); // Set error title
              setProgressBarColor('red'); // Set progress bar color to red
              clearInterval(intervalRef.current!); // Clear interval
            } else if (err.response?.data?.message === 'Please connect a bank account') {
              setStatusText('Action Required'); // Set action required status
              setTitleText('Please connect a bank account to proceed.'); // Set title for bank connection
              setProgressBarColor('gray'); // Set progress bar color to gray
              clearInterval(intervalRef.current!); // Clear interval
            } else {
              setError('Failed to fetch job details: ' + (err.response?.data?.error || err.message || 'Unknown error')); // Set error message
            }
          })
          .finally(() => setLoading(false)); // Set loading state to false after fetching
      };

      fetchJobDetails(); // Fetch job details initially

      // Set up polling to fetch job details every 2 seconds
      intervalRef.current = setInterval(() => {
        fetchJobDetails();
      }, 2000);

      return () => {
        // Cleanup function to clear interval on component unmount
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setError('Token is missing'); // Set error if token is missing
    }
  }, []);

  return (
    <div className="p-6">
      <div className="p-6">
        {/* Welcome Section */}
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 mr-4">Welcome,</h1>
          <p className="text-xl text-gray-600">{userEmail || 'Guest'}</p> {/* Display user email or "Guest" */}
        </div>

        {/* Section Header */}
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mr-4">Bank Connection Status</h2>
        </div>
      </div>
      {showConnectMessage ? (
        // Display message if bank connection is required
        <div className="mt-4 flex flex-col items-center">
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
        // Display the progress bar if job is in progress
        <div className="mt-4 flex flex-col items-center">
          <CircularProgressBar
            value={progress}
            color={progressBarColor}
            status={statusText}
            title={titleText}
          />
        </div>
      )}
      {error && <div className="text-red-500 mt-4">{error}</div>} {/* Display error message if any */}
    </div>
  );
}
