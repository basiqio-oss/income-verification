'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaUser, FaPhone, FaEnvelope, FaBusinessTime, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="">
    {children}
  </div>
);

const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

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
        <CardContent className="p-6">
          {loading && <p className="text-blue-500">Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {user ? (
            <div className="space-y-6">
              {/* User Details */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <FaUser className="mr-2" /> User Information
                </h3>
                <table className="min-w-full">
                  <tbody>
                    <tr>
                      <td className="p-2 font-semibold">Type:</td>
                      <td className="p-2">{user.type}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">User ID:</td>
                      <td className="p-2">{user.id}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Email:</td>
                      <td className="p-2">{user.email} <FaEnvelope className="inline ml-2 text-gray-600" /></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Mobile:</td>
                      <td className="p-2">{user.mobile || 'N/A'} <FaPhone className="inline ml-2 text-gray-600" /></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">First Name:</td>
                      <td className="p-2">{user.firstName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Middle Name:</td>
                      <td className="p-2">{user.middleName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Last Name:</td>
                      <td className="p-2">{user.lastName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Business Name:</td>
                      <td className="p-2">{user.businessName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Business ID No:</td>
                      <td className="p-2">{user.businessIdNo || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Business ID No Type:</td>
                      <td className="p-2">{user.businessIdNoType || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Business Address:</td>
                      <td className="p-2">{user.businessAddress || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Verification Status:</td>
                      <td className="p-2">
                        {user.verificationStatus
                          ? <span className="text-green-500">Verified <FaCheckCircle className="inline ml-2" /></span>
                          : <span className="text-red-500">Not Verified <FaTimesCircle className="inline ml-2" /></span>}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Verification Date:</td>
                      <td className="p-2">{user.verificationDate || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold">Name:</td>
                      <td className="p-2">{user.name || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Connections */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <FaBusinessTime className="mr-2" /> Connections
                </h3>
                <p>Total Connections: {user.connections.count}</p>
                {user.connections && user.connections.data.length > 0 ? (
                  <ul className="space-y-4 mt-4">
                    {user.connections.data.map((connection: any) => (
                      <li key={connection.id}>
                        <h4 className="text-lg font-semibold mb-4">Connection {connection.id}</h4>
                        <table className="w-full mb-4">
                          <tbody>
                            <tr>
                              <td className="p-2 font-semibold">Connection ID:</td>
                              <td className="p-2">{connection.id}</td>
                            </tr>
                            {connectionDetails && connectionDetails.id === connection.id && (
                              <>
                                <tr>
                                  <td className="p-2 font-semibold">Status:</td>
                                  <td className="p-2">{connectionDetails.status}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">Created Date:</td>
                                  <td className="p-2">{new Date(connectionDetails.createdDate).toLocaleString()}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">Last Used:</td>
                                  <td className="p-2">{new Date(connectionDetails.lastUsed).toLocaleString()}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">MFA Enabled:</td>
                                  <td className="p-2">{connectionDetails.mfaEnabled ? 'Yes' : 'No'}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">Method:</td>
                                  <td className="p-2">{connectionDetails.method}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">Expiry Date:</td>
                                  <td className="p-2">{connectionDetails.expiryDate || 'N/A'}</td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>

                        {/* Profile */}
                        {connectionDetails && connectionDetails.id === connection.id && (
                          <div>
                            <h4 className="text-lg font-semibold mb-4">Profile</h4>
                            <table className="w-full mb-4">
                              <tbody>
                                <tr>
                                  <td className="p-2 font-semibold">Full Name:</td>
                                  <td className="p-2">{connectionDetails.profile.fullName}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">First Name:</td>
                                  <td className="p-2">{connectionDetails.profile.firstName}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">Last Name:</td>
                                  <td className="p-2">{connectionDetails.profile.lastName}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">Middle Name:</td>
                                  <td className="p-2">{connectionDetails.profile.middleName || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">Phone Numbers:</td>
                                  <td className="p-2">{connectionDetails.profile.phoneNumbers.join(', ')}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">Email Addresses:</td>
                                  <td className="p-2">{connectionDetails.profile.emailAddresses.join(', ')}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">Physical Addresses:</td>
                                  <td className="p-2">
                                    {connectionDetails.profile.physicalAddresses.map((address: any, index: number) => (
                                      <div key={index} className="space-y-1">
                                        <p><span className="font-semibold">Address Line 1:</span> {address.addressLine1}</p>
                                        <p><span className="font-semibold">Address Line 2:</span> {address.addressLine2 || 'N/A'}</p>
                                        <p><span className="font-semibold">Address Line 3:</span> {address.addressLine3 || 'N/A'}</p>
                                        <p><span className="font-semibold">Postcode:</span> {address.postcode}</p>
                                        <p><span className="font-semibold">City:</span> {address.city}</p>
                                        <p><span className="font-semibold">State:</span> {address.state}</p>
                                        <p><span className="font-semibold">Country:</span> {address.country}</p>
                                        <p><span className="font-semibold">Country Code:</span> {address.countryCode}</p>
                                        <p><span className="font-semibold">Formatted Address:</span> {address.formattedAddress}</p>
                                      </div>
                                    ))}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Institution */}
                        {connectionDetails && connectionDetails.id === connection.id && (
                          <div>
                            <h4 className="text-lg font-semibold mb-4">Institution</h4>
                            <table className="w-full mb-4">
                              <tbody>
                                <tr>
                                  <td className="p-2 font-semibold">Institution ID:</td>
                                  <td className="p-2">{connectionDetails.institution.id}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-semibold">Institution Name:</td>
                                  <td className="p-2">{institutionName || 'Loading...'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Accounts */}
                        {connectionDetails && connectionDetails.id === connection.id && (
                          <div>
                            <h4 className="text-lg font-semibold mb-4">Accounts</h4>
                            {connectionDetails.accounts.data.length > 0 ? (
                              <ul className="space-y-4">
                                {connectionDetails.accounts.data.map((account: any) => (
                                  <li key={account.id} className="border rounded-md mb-4">
                                    <table className="w-full">
                                      <tbody>
                                        <tr>
                                          <td className="p-2 font-semibold">Account ID:</td>
                                          <td className="p-2">{account.id}</td>
                                        </tr>
                                        <tr>
                                          <td className="p-2 font-semibold">Account Number:</td>
                                          <td className="p-2">{account.accountNo}</td>
                                        </tr>
                                        <tr>
                                          <td className="p-2 font-semibold">Name:</td>
                                          <td className="p-2">{account.name}</td>
                                        </tr>
                                        <tr>
                                          <td className="p-2 font-semibold">Currency:</td>
                                          <td className="p-2">{account.currency}</td>
                                        </tr>
                                        <tr>
                                          <td className="p-2 font-semibold">Class:</td>
                                          <td className="p-2">{account.class.product}</td>
                                        </tr>
                                        <tr>
                                          <td className="p-2 font-semibold">Balance:</td>
                                          <td className="p-2">{account.balance}</td>
                                        </tr>
                                        <tr>
                                          <td className="p-2 font-semibold">Available Funds:</td>
                                          <td className="p-2">{account.availableFunds}</td>
                                        </tr>
                                        <tr>
                                          <td className="p-2 font-semibold">Last Updated:</td>
                                          <td className="p-2">{new Date(account.lastUpdated).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                          <td className="p-2 font-semibold">Status:</td>
                                          <td className="p-2">{account.status}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>No accounts found</p>
                            )}
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
