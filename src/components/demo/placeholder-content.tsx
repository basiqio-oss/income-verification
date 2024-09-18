'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FaSpinner } from 'react-icons/fa';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const IncomeVerification = () => {
  const [title, setTitle] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [accounts, setAccounts] = useState<string[]>([]); // Array for selected account IDs
  const [users, setUsers] = useState<string[]>([]); // Array for selected user IDs
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [userList, setUserList] = useState<any[]>([]);
  const [accountList, setAccountList] = useState<any[]>([]); // Store accounts for selected users
  const [accountError, setAccountError] = useState<string>(''); // Error message for accounts
  const [visibleUsers, setVisibleUsers] = useState<number>(10); // Number of users to show initially
  const [jobId, setJobId] = useState<string | null>(null); // Store job ID for polling
  const [pollAttempts, setPollAttempts] = useState<number>(0); // Counter for polling attempts

  const router = useRouter();
  const token = localStorage.getItem("BASI_Q_TOKEN");

  // Polling constants
  const POLLING_INTERVAL = 2000; // Polling every 2 seconds
  const MAX_ATTEMPTS = 30; // Maximum attempts before timeout

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userResponse = await axios.get(`https://au-api.basiq.io/users?limit=1`, {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${token}`,
          },
        });
        setUserList(userResponse.data.data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users');
      }
    };

    fetchUsers();
  }, [token]);

  const handleCheckboxChange = async (userId: string) => {
    if (users.includes(userId)) {
      setUsers(users.filter(u => u !== userId));
      setAccountList(accountList.filter((acc: any) => acc.userId !== userId));
    } else {
      setUsers([...users, userId]);

      try {
        const response = await axios.get(`https://au-api.basiq.io/users/${userId}/accounts`, {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${token}`,
          },
        });

        const accountsData = response.data.data;
        if (accountsData.length > 0) {
          setAccountList(prevList => [...prevList, ...accountsData.map((acc: any) => ({ ...acc, userId }))]);
        } else {
          setAccountError(`No accounts found for user ${userId}`);
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setAccountError('Failed to fetch accounts');
      }
    }
  };

  const handleAccountCheckboxChange = (accountId: string) => {
    if (accounts.includes(accountId)) {
      setAccounts(accounts.filter(acc => acc !== accountId));
    } else {
      setAccounts([...accounts, accountId]);
    }
  };

  const handleVerifyIncome = async () => {
    setIsLoading(true);
    setError('');
    setIsPolling(true);
    setPollAttempts(0);

    try {
      const response = await axios.post('https://au-api.basiq.io/reports', {
        reportType: 'CON_AFFOR_01',
        title: title || 'Default Title',
        filters: [
          { name: 'fromDate', value: fromDate },
          { name: 'toDate', value: toDate },
          { name: 'accounts', value: accounts },
          { name: 'users', value: users }
        ]
      }, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'authorization': `Bearer ${token}`,
          'content-type': 'application/json'
        }
      });

      const jobId = response.data.id;
      setJobId(jobId);
      console.log('Job ID:', jobId);

      // Start polling for job status
      const pollJobStatus = async () => {
        if (pollAttempts >= MAX_ATTEMPTS) {
          setError('Job status check timed out.');
          setIsPolling(false);
          setIsLoading(false);
          return;
        }

        try {
          const statusResponse = await axios.get(`https://au-api.basiq.io/jobs/${jobId}`, {
            headers: {
              'authorization': `Bearer ${token}`,
              'accept': 'application/json'
            }
          });

          const jobStatus = statusResponse.data.steps[0].status;
          if (jobStatus === 'success') {
            const reportUrl = statusResponse.data.links.source;

            const reportResponse = await axios.get(reportUrl, {
              headers: {
                'authorization': `Bearer ${token}`,
                'accept': 'application/json'
              }
            });

            localStorage.setItem('reportData', JSON.stringify(reportResponse.data));
            router.push('/report');
            setIsPolling(false);
            setIsLoading(false);
          } else if (jobStatus === 'failed') {
            setError('Income verification failed');
            setIsPolling(false);
            setIsLoading(false);
          } else {
            setPollAttempts(prev => prev + 1);
            setTimeout(pollJobStatus, POLLING_INTERVAL); // Poll again after the interval
          }
        } catch (err) {
          console.error('Error checking job status:', err);
          setError('Failed to check job status');
          setIsPolling(false);
          setIsLoading(false);
        }
      };

      pollJobStatus(); // Start polling immediately
    } catch (err) {
      console.error('Error verifying income:', err);
      setError('Failed to verify income');
      setIsLoading(false);
      setIsPolling(false);
    }
  };

  const handleLoadMoreUsers = () => {
    setVisibleUsers(visibleUsers + 10); // Load 10 more users
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
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold">Select Users</h3>
            {userList.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {userList.slice(0, visibleUsers).map((user) => (
                  <div key={user.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={user.id}
                      value={user.id}
                      checked={users.includes(user.id)}
                      onChange={() => handleCheckboxChange(user.id)}
                      className="mr-2"
                    />
                    <Label htmlFor={user.id}>{user.email || `User ${user.id}`}</Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No users found.</p>
            )}

            {visibleUsers < userList.length && (
              <Button onClick={handleLoadMoreUsers} className="mt-4">
                Load More Users
              </Button>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold">Select Accounts</h3>
            {accountList.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {accountList.map((account) => (
                  <div key={account.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={account.id}
                      value={account.id}
                      checked={accounts.includes(account.id)}
                      onChange={() => handleAccountCheckboxChange(account.id)}
                      className="mr-2"
                    />
                    <Label htmlFor={account.id}>{account.name || `Account ${account.id}`}</Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{accountError || 'No accounts found for selected users.'}</p>
            )}
          </div>

          <Button
            onClick={handleVerifyIncome}
            disabled={isLoading || isPolling}
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

          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomeVerification;
