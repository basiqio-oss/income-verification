'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const UsersList = () => {
  const [user, setUser] = useState<any>(null);
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [institutionName, setInstitutionName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');

      const token = localStorage.getItem("BASI_Q_TOKEN");
      const userId = localStorage.getItem("USER_ID");

      if (!token) {
        setError('Token not found');
        setLoading(false);
        return;
      }

      if (!userId) {
        setError('User ID not found');
        setLoading(false);
        return;
      }

      try {
        const userResponse = await axios.get(`https://au-api.basiq.io/users/${userId}`, {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${token}`,
          },
        });

        if (userResponse.data) {
          setUser(userResponse.data);

          // Fetch connection details if connections are available
          if (userResponse.data.connections && userResponse.data.connections.data.length > 0) {
            const connectionId = userResponse.data.connections.data[0].id;
            const connectionResponse = await axios.get(`https://au-api.basiq.io/users/${userId}/connections/${connectionId}`, {
              headers: {
                'accept': 'application/json',
                'authorization': `Bearer ${token}`,
              },
            });

            if (connectionResponse.data) {
              setConnectionDetails(connectionResponse.data);

              // Fetch institution details
              const institutionId = connectionResponse.data.institution.id;
              const institutionResponse = await axios.get(`https://au-api.basiq.io/institutions/${institutionId}`, {
                headers: {
                  'accept': 'application/json',
                  'authorization': `Bearer ${token}`,
                },
              });

              if (institutionResponse.data) {
                setInstitutionName(institutionResponse.data.name);
              } else {
                setError('Institution details not found');
              }
            } else {
              setError('Connection details not found');
            }
          }
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold mb-4">User Details</h2>
        </CardHeader>
        <CardContent className="p-6">
          {loading && <p className="text-blue-500">Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {user ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="font-semibold">Type: <span className="font-normal">{user.type}</span></p>
                <p className="font-semibold">User ID: <span className="font-normal">{user.id}</span></p>
                <p className="font-semibold">Email: <span className="font-normal">{user.email}</span></p>
                <p className="font-semibold">Mobile: <span className="font-normal">{user.mobile || 'N/A'}</span></p>
                <p className="font-semibold">First Name: <span className="font-normal">{user.firstName || 'N/A'}</span></p>
                <p className="font-semibold">Middle Name: <span className="font-normal">{user.middleName || 'N/A'}</span></p>
                <p className="font-semibold">Last Name: <span className="font-normal">{user.lastName || 'N/A'}</span></p>
                <p className="font-semibold">Business Name: <span className="font-normal">{user.businessName || 'N/A'}</span></p>
                <p className="font-semibold">Business ID No: <span className="font-normal">{user.businessIdNo || 'N/A'}</span></p>
                <p className="font-semibold">Business ID No Type: <span className="font-normal">{user.businessIdNoType || 'N/A'}</span></p>
                <p className="font-semibold">Business Address: <span className="font-normal">{user.businessAddress ? user.businessAddress : 'N/A'}</span></p>
                <p className="font-semibold">Verification Status: <span className="font-normal">{user.verificationStatus ? 'Verified' : 'Not Verified'}</span></p>
                <p className="font-semibold">Verification Date: <span className="font-normal">{user.verificationDate || 'N/A'}</span></p>
                <p className="font-semibold">Name: <span className="font-normal">{user.name || 'N/A'}</span></p>
              </div>

              <div className="space-y-4 mt-4">
                <h3 className="text-xl font-semibold">Connections</h3>
                <p>Total Connections: {user.connections.count}</p>
                {user.connections && user.connections.data.length > 0 ? (
                  <ul className="space-y-4">
                    {user.connections.data.map((connection: any) => (
                      <li key={connection.id} className="p-4 border rounded-md shadow-md space-y-2">
                        <p className="font-semibold">Connection ID: <span className="font-normal">{connection.id}</span></p>
                        {connectionDetails && connectionDetails.id === connection.id && (
                          <div className="space-y-4">
                            <p>Status: <span className="font-normal">{connectionDetails.status}</span></p>
                            <p>Created Date: <span className="font-normal">{new Date(connectionDetails.createdDate).toLocaleString()}</span></p>
                            <p>Last Used: <span className="font-normal">{new Date(connectionDetails.lastUsed).toLocaleString()}</span></p>
                            <p>MFA Enabled: <span className="font-normal">{connectionDetails.mfaEnabled ? 'Yes' : 'No'}</span></p>
                            <p>Method: <span className="font-normal">{connectionDetails.method}</span></p>
                            <p>Expiry Date: <span className="font-normal">{connectionDetails.expiryDate || 'N/A'}</span></p>
                            
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold">Profile</h4>
                              <p>Full Name: <span className="font-normal">{connectionDetails.profile.fullName}</span></p>
                              <p>First Name: <span className="font-normal">{connectionDetails.profile.firstName}</span></p>
                              <p>Last Name: <span className="font-normal">{connectionDetails.profile.lastName}</span></p>
                              <p>Middle Name: <span className="font-normal">{connectionDetails.profile.middleName || 'N/A'}</span></p>
                              <p>Phone Numbers: <span className="font-normal">{connectionDetails.profile.phoneNumbers.join(', ')}</span></p>
                              <p>Email Addresses: <span className="font-normal">{connectionDetails.profile.emailAddresses.join(', ')}</span></p>
                              <div>
                                <h5 className="text-md font-semibold">Physical Addresses</h5>
                                {connectionDetails.profile.physicalAddresses.map((address: any, index: number) => (
                                  <div key={index} className="space-y-1">
                                    <p>Address Line 1: <span className="font-normal">{address.addressLine1}</span></p>
                                    <p>Address Line 2: <span className="font-normal">{address.addressLine2 || 'N/A'}</span></p>
                                    <p>Address Line 3: <span className="font-normal">{address.addressLine3 || 'N/A'}</span></p>
                                    <p>Postcode: <span className="font-normal">{address.postcode}</span></p>
                                    <p>City: <span className="font-normal">{address.city}</span></p>
                                    <p>State: <span className="font-normal">{address.state}</span></p>
                                    <p>Country: <span className="font-normal">{address.country}</span></p>
                                    <p>Country Code: <span className="font-normal">{address.countryCode}</span></p>
                                    <p>Formatted Address: <span className="font-normal">{address.formattedAddress}</span></p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold">Institution</h4>
                              <p>Institution ID: <span className="font-normal">{connectionDetails.institution.id}</span></p>
                              <p>Institution Name: <span className="font-normal">{institutionName || 'Loading...'}</span></p>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold">Accounts</h4>
                              {connectionDetails.accounts.data.length > 0 ? (
                                <ul className="space-y-4">
                                  {connectionDetails.accounts.data.map((account: any) => (
                                    <li key={account.id} className="p-4 border rounded-md shadow-md space-y-2">
                                      <p className="font-semibold">Account ID: <span className="font-normal">{account.id}</span></p>
                                      <p>Account Number: <span className="font-normal">{account.accountNo}</span></p>
                                      <p>Name: <span className="font-normal">{account.name}</span></p>
                                      <p>Currency: <span className="font-normal">{account.currency}</span></p>
                                      <p>Class: <span className="font-normal">{account.class.product}</span></p>
                                      <p>Balance: <span className="font-normal">{account.balance}</span></p>
                                      <p>Available Funds: <span className="font-normal">{account.availableFunds}</span></p>
                                      <p>Last Updated: <span className="font-normal">{new Date(account.lastUpdated).toLocaleString()}</span></p>
                                      <p>Status: <span className="font-normal">{account.status}</span></p>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p>No accounts found</p>
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No connections found</p>
                )}
              </div>
            </div>
          ) : (
            <p>No user details found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersList;
