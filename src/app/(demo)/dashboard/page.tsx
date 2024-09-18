"use client";

import Link from "next/link";
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
import { Bar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  TimeScale
);

interface UserDetail {
  type: string;
  id: string;
  email: string;
  mobile: string;
  businessName: string;
  verificationStatus: boolean;
  createdTime: string;
  links: {
    self: string;
  };
}

interface UserDetailSubset {
  email: string;
  createdTime: string;
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [barChartData, setBarChartData] = useState<any>(null);
  const [scatterChartData, setScatterChartData] = useState<any>(null);

  useEffect(() => {
    const email = localStorage.getItem("USER_EMAIL");
    const token = localStorage.getItem("BASI_Q_TOKEN");
    const storedJobId = localStorage.getItem("JOB_ID");
    setUserEmail(email || null);

    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId') || storedJobId;

    if (jobId) {
      localStorage.setItem("JOB_ID", jobId);

      if (token) {
        setLoading(true);
        const interval = setInterval(() => {
          setProgress((prev) => (prev < 100 ? prev + 1 : 100));
        }, 100);

        // Fetch job details
        axios.get(`/api/get-job?jobId=${jobId}&token=${token}`)
          .then(response => {
            setJobDetails(response.data);
            setProgress(100);
            setLoading(false);
            clearInterval(interval);

            // Prepare bar chart data
            setBarChartData({
              labels: response.data.steps.map((step: any) => step.title),
              datasets: [
                {
                  label: 'Step Status',
                  data: response.data.steps.map((step: any) => step.status === 'success' ? 1 : 0),
                  backgroundColor: response.data.steps.map((step: any) =>
                    step.status === 'success' ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)'
                  ),
                  borderColor: response.data.steps.map((step: any) =>
                    step.status === 'success' ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
                  ),
                  borderWidth: 1,
                },
              ],
            });
          })
          .catch(err => {
            console.error('API request error:', err);
            setError('Failed to fetch job details: ' + (err.response?.data?.error || err.message || 'Unknown error'));
            setLoading(false);
            clearInterval(interval);
          });

        // Fetch users
        axios.get('https://au-api.basiq.io/users', {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${token}`,
          },
        })
          .then(response => {
            const usersData: UserDetail[] = response.data.data || [];
            setUsers(usersData);

            // Aggregate user creation dates
            const dateCounts: { [key: string]: { count: number, details: UserDetailSubset[] } } = {};
            usersData.forEach((user: UserDetail) => {
              const date = new Date(user.createdTime).toISOString().split('T')[0];
              if (!dateCounts[date]) {
                dateCounts[date] = { count: 0, details: [] };
              }
              dateCounts[date].count += 1;
              dateCounts[date].details.push({
                email: user.email,
                createdTime: user.createdTime
              });
            });

            // Prepare scatter chart data
            setScatterChartData({
              datasets: [{
                label: 'Number of Users',
                data: Object.keys(dateCounts).map(date => ({
                  x: new Date(date).getTime(),
                  y: dateCounts[date].count,
                  details: dateCounts[date].details
                })),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                pointStyle: 'circle',
                pointRadius: 5,
              }],
            });
          })
          .catch(err => {
            console.error('Failed to fetch users:', err);
            setError('Failed to fetch users: ' + (err.response?.data?.error || err.message || 'Unknown error'));
          });
      } else {
        setError('Token is missing');
      }
    } else {
      setError('Job ID is missing');
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
        {barChartData && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Job Details</h2>
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: (tooltipItem) => {
                        const value = (tooltipItem as any).raw as number;
                        return `Status: ${value === 1 ? 'Success' : 'Failure'}`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Steps',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Status',
                    },
                    suggestedMin: 0,
                    suggestedMax: 1,
                    ticks: {
                      stepSize: 1,
                      callback: (value) => (value === 1 ? 'Success' : 'Failure'),
                    },
                  },
                },
              }}
            />
          </div>
        )}
        {scatterChartData && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Number of Users per Day</h2>
            <Scatter
              data={scatterChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  tooltip: {
                    callbacks: {
                      title: (tooltipItems) => {
                        const date = new Date(tooltipItems[0].parsed.x).toLocaleDateString();
                        return date;
                      },
                      label: (tooltipItem) => {
                        const rawData = (tooltipItem as { raw: { details?: UserDetailSubset[] } }).raw;
                        const details = rawData.details || [];
                        const numberOfUsers = details.length;
                        const emails = details.slice(0, 3).map(detail => detail.email).join(', ');
                        return `Users (${numberOfUsers}): ${emails}${numberOfUsers > 3 ? '...' : ''}`;
                      },
                      footer: (tooltipItems) => {
                        const rawData = (tooltipItems[0] as { raw: { details?: UserDetailSubset[] } }).raw;
                        const details = rawData.details || [];
                        return details.slice(0, 3).map(detail => `Created Time: ${new Date(detail.createdTime).toLocaleString()}`).join('\n') + (details.length > 3 ? '\n...' : '');
                      }
                    },
                  },
                },
                scales: {
                  x: {
                    type: 'time',
                    time: {
                      unit: 'day',
                    },
                    title: {
                      display: true,
                      text: 'Creation Date',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Number of Users',
                    },
                    suggestedMin: 0,
                    suggestedMax: Math.max(...(scatterChartData.datasets[0].data.map((point: any) => point.y))) || 1,
                  },
                },
              }}
            />
          </div>
        )}
        {error && <div className="text-red-500 mt-4">{error}</div>}
      </div>
    </ContentLayout>
  );
}
