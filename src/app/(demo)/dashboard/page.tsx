"use client"; // Ensure this file runs in the client context

import Link from "next/link";
import PlaceholderContent from "@/components/demo/placeholder-content";
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
  const [jobDetails, setJobDetails] = useState<any>(null); // State to store job details
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve the email and token from local storage on the client side
    const email = localStorage.getItem("USER_EMAIL");
    const token = localStorage.getItem("BASI_Q_TOKEN");
    setUserEmail(email || null);

    // Extract jobId from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');
    
    if (jobId && token) {
      setLoading(true);
      axios.get(`/api/get-job?jobId=${jobId}&token=${token}`) // Pass token as query parameter
        .then(response => {
          setJobDetails(response.data);
          setLoading(false);
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
        {/* Instructions for using the income verification feature */}
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
        {loading && <p>Loading job details...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {jobDetails && (
          <div className="mt-6 p-4 space-y-4">
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
        <PlaceholderContent />
      </div>
    </ContentLayout>
  );
}
