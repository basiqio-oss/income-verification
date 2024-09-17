'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const IncomeVerification = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      setError('');

      const token = localStorage.getItem("BASI_Q_TOKEN");
      const userId = localStorage.getItem("USER_ID"); // Ensure USER_ID is stored in localStorage

      if (!token || !userId) {
        setError('Token or User ID not found');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`https://au-api.basiq.io/users/${userId}/accounts`, {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${token}`,
          },
        });

        // Check if response data contains accounts
        if (response.data && response.data.data) {
          setAccounts(response.data.data);
        } else {
          setError('No accounts found');
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError('Failed to fetch accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  return (
    <div >
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-gray-800">Accounts List</h2>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-blue-500">Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {accounts.length > 0 ? (
            <ul>
              {accounts.map((account: any) => (
                <li key={account.id} className="py-2 border-b">
                  <p className="font-semibold">{account.name}</p>
                  <p>Account ID: {account.id}</p>
                  <p>Account Number: {account.accountNo}</p>
                  <p>Balance: {account.balance} {account.currency}</p>
                  <p>Institution: {account.institution}</p>
                  <p>Status: {account.status}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No accounts found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomeVerification;
