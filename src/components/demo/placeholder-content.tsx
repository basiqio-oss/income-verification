'use client';

import { useState } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FaSpinner } from 'react-icons/fa';

const IncomeVerification = () => {
  const [title, setTitle] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [accounts, setAccounts] = useState<string>('');
  const [users, setUsers] = useState<string>('');
  const [reportData, setReportData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);

  //const token = process.env.NEXT_PUBLIC_BASI_Q_TOKEN;
  const token = localStorage.getItem("BASI_Q_TOKEN");


  const POLLING_INTERVAL = 2000; // 2 seconds
  const MAX_ATTEMPTS = 30; // Adjust based on expected time for job completion

  const handleVerifyIncome = async () => {
    setIsLoading(true);
    setIsPolling(true);
    setError('');
    setReportData('');

    const parsedAccounts = accounts.split(',').map(acc => acc.trim());
    const parsedUsers = users.split(',').map(user => user.trim());

    try {
      // Create report request
      const response = await axios.post('https://au-api.basiq.io/reports', {
        reportType: 'CON_AFFOR_01',
        title: title || 'Default Title',
        filters: [
          { name: 'fromDate', value: fromDate },
          { name: 'toDate', value: toDate },
          { name: 'accounts', value: parsedAccounts },
          { name: 'users', value: parsedUsers }
        ]
      }, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'authorization': `Bearer ${token}`,
          'content-type': 'application/json'
        }
      });

      const jobId = response.data.id;
      setJobId(jobId);
      console.log('Job ID:', jobId);

      // Polling function
      const checkJobStatus = async (jobId: string, attempts: number = 0) => {
        if (attempts >= MAX_ATTEMPTS) {
          setError('Job status check timed out.');
          setIsPolling(false);
          setIsLoading(false);
          return;
        }

        try {
          console.log('Checking job status for jobId:', jobId, 'Attempt:', attempts + 1);
          const statusResponse = await axios.get(`https://au-api.basiq.io/jobs/${jobId}`, {
            headers: {
              'authorization': `Bearer ${token}`,
              'accept': 'application/json'
            }
          });

          console.log('Job Status Response:', statusResponse.data);

          const jobStatus = statusResponse.data.steps[0].status;
          if (jobStatus === 'success') {
            const reportUrl = statusResponse.data.links.source;

            console.log('Report URL:', reportUrl);

            // Fetch the report data
            const reportResponse = await axios.get(reportUrl, {
              headers: {
                'authorization': `Bearer ${token}`,
                'accept': 'application/json'
              }
            });

            setReportData(JSON.stringify(reportResponse.data, null, 2));
            setIsPolling(false);
            setIsLoading(false);
          } else if (jobStatus === 'failed') {
            setError('Income verification failed');
            setIsPolling(false);
            setIsLoading(false);
          } else {
            setTimeout(() => checkJobStatus(jobId, attempts + 1), POLLING_INTERVAL);
          }
        } catch (err) {
          console.error('Error checking job status:', err);
          setError('Failed to check job status');
          setIsPolling(false);
          setIsLoading(false);
        }
      };

      if (jobId) {
        checkJobStatus(jobId);
      }
    } catch (err) {
      console.error('Error verifying income:', err);
      setError('Failed to verify income');
      setIsLoading(false);
      setIsPolling(false);
    }
  };

  return (
    <div>
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <h2 className="text-2xl font-semibold">Income Verification</h2>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter report title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="accounts">Accounts (comma-separated)</Label>
              <Input
                id="accounts"
                value={accounts}
                onChange={(e) => setAccounts(e.target.value)}
                placeholder="e.g., account1, account2"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="users">Users (comma-separated)</Label>
              <Input
                id="users"
                value={users}
                onChange={(e) => setUsers(e.target.value)}
                placeholder="e.g., user1, user2"
                className="mt-1"
              />
            </div>
          </div>
          <Button
            onClick={handleVerifyIncome}
            disabled={isLoading}
            className="w-full mt-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin mr-2">
                  <FaSpinner />
                </div>
                Verifying...
              </div>
            ) : 'Verify Income'}
          </Button>

          {isPolling && (
            <div className="mt-4 flex items-center justify-center text-blue-500">
              <div className="animate-spin mr-2">
                <FaSpinner />
              </div>
              Loading...
            </div>
          )}
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          {reportData && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800">Verification Data</h3>
              <Textarea
                value={reportData}
                readOnly
                rows={20}
                className="mt-2 w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomeVerification;
