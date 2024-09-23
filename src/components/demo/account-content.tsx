'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Component for handling income verification accounts
const IncomeVerification = () => {
  // State to hold accounts data
  const [accounts, setAccounts] = useState<any[]>([]);
  // State to manage loading status
  const [loading, setLoading] = useState<boolean>(true);
  // State to hold error messages
  const [error, setError] = useState<string>('');

  // Effect to fetch accounts data when the component mounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true); // Set loading to true before fetching
      setError(''); // Clear previous error messages

      // Retrieve token and user ID from localStorage
      const token = localStorage.getItem("BASI_Q_TOKEN");
      const userId = localStorage.getItem("USER_ID"); // Ensure USER_ID is stored in localStorage

      // Check if token and user ID exist
      if (!token || !userId) {
        setError('Token or User ID not found'); // Set error if missing
        setLoading(false); // Stop loading
        return; // Exit the function
      }

      try {
        // Make API request to fetch accounts for the user
        const response = await axios.get(`https://au-api.basiq.io/users/${userId}/accounts`, {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${token}`, // Include token in the authorization header
          },
        });

        // Check if response data contains accounts
        if (response.data && response.data.data) {
          setAccounts(response.data.data); // Set accounts state with fetched data
        } else {
          setError('No accounts found'); // Set error if no accounts are returned
        }
      } catch (err) {
        // Handle any errors during the API call
        console.error('Error fetching accounts:', err); // Log error for debugging
        setError('Failed to fetch accounts'); // Set error message
      } finally {
        setLoading(false); // Stop loading whether the request was successful or failed
      }
    };

    fetchAccounts(); // Call the fetchAccounts function
  }, []); // Empty dependency array to run effect only once on mount

  return (
    <div>
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-gray-800">Accounts List</h2>
        </CardHeader>
        <CardContent>
          {/* Show loading indicator while data is being fetched */}
          {loading && <p className="text-blue-500">Loading...</p>}
          {/* Show error message if there is one */}
          {error && <p className="text-red-500">{error}</p>}
          {/* Display accounts if available */}
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
            <p>No accounts found</p> // Message if no accounts are available
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomeVerification; // Export the component for use in other parts of the application
