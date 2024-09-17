"use client"; // Add this line at the top

import Link from "next/link";
//import PlaceholderContent from "@/components/demo/placeholder-content";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const email = localStorage.getItem("USER_EMAIL");
    const token = localStorage.getItem("BASI_Q_TOKEN");
    setUserEmail(email || null);
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');
    if (jobId && token) {
      setLoading(true);
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 100 ? prev + 1 : 100));
      }, 100);

      axios.get(`/api/get-job?jobId=${jobId}&token=${token}`)
        .then(response => {
          setJobDetails(response.data);
          setProgress(100);
          setLoading(false);
          clearInterval(interval);
        })
        .catch(err => {
          if (axios.isAxiosError(err)) {
            console.error('API request error:', err.response?.data || err.message || err);
            setError('Failed to fetch job details: ' + (err.response?.data?.error || err.message || 'Unknown error'));
          } else {
            console.error('Unexpected error:', err);
            setError('Failed to fetch job details: An unexpected error occurred.');
          }
          setLoading(false);
          clearInterval(interval);
        });
    } else {
      if (!jobId) {
        setError('Job ID is missing');
      }
      if (!token) {
        setError('Token is missing');
      }
    }
  }, []);

  return (
    <ContentLayout title="Dashboard">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">
          Welcome{userEmail ? `, ${userEmail}` : ''}
        </h1>
        <div className="mt-6 p-4">
          <h2 className="text-xl font-semibold mb-2">Income Verification Instructions</h2>
          <p className="mb-2">
            To use the income verification feature with our reports endpoint, follow these steps:
          </p>
          <ol className="list-decimal list-inside">
            <li>Navigate to the <strong>Users</strong> tab to obtain the necessary user IDs.</li>
            <li>Go to the <strong>Account</strong> tab to get the account IDs.</li>
            <li>Use these IDs to create the report.</li>
          </ol>
        </div>
        {loading && (
          <div className="mt-4">
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-teal-600 bg-teal-200">
                  Loading
                </div>
                <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-teal-600 bg-teal-200">
                  {progress}%
                </div>
              </div>
              <div className="relative flex mb-2 items-center justify-between">
                <div className="w-full bg-gray-200 rounded-full">
                  <div
                    className="bg-teal-500 text-xs font-medium text-teal-100 text-center p-0.5 leading-none rounded-l-full"
                    style={{ width: `${progress}%` }}
                  >
                    &nbsp;
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-red-500">{error}</p>}
        {jobDetails && (
          <div className="rounded-xl border bg-card text-card-foreground w-full max-w-3xl shadow-lg">
            <Card>
              <CardHeader>
                <CardTitle>Job ID</CardTitle>
                <CardDescription>{jobDetails.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <p><strong>Created At:</strong> {new Date(jobDetails.created).toLocaleString()}</p>
                <p><strong>Updated At:</strong> {new Date(jobDetails.updated).toLocaleString()}</p>
                <p><strong>Job Type:</strong> {jobDetails.jobType}</p>
              </CardContent>
              <CardFooter>
                <p>Status: {jobDetails.steps.every((step: any) => step.status === 'success') ? 'Success' : 'Incomplete'}</p>
              </CardFooter>
            </Card>
            {jobDetails.steps.map((step: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>Step: {step.title}</CardTitle>
                  <CardDescription>Status: {step.status}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
        <p>&nbsp;</p>
        {/* <PlaceholderContent /> */}
      </div>
    </ContentLayout>
  );
}
