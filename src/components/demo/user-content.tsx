'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const UsersList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const USERS_PER_PAGE = 5;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');

      const token = localStorage.getItem("BASI_Q_TOKEN");

      if (!token) {
        setError('Token not found');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`https://au-api.basiq.io/users?limit=${USERS_PER_PAGE}`, {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${token}`,
          },
        });

        if (response.data && response.data.data) {
          setUsers(response.data.data);
        } else {
          setError('No users found');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Users List</h2>
        </CardHeader>
        <CardContent className="p-6">
          {loading && <p className="text-blue-500">Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {users.length > 0 ? (
            <ul>
              {users.map((user: any) => (
                <li key={user.id} className="py-2 border-b">
                  <p className="font-semibold">{user.email}</p>
                  <p>User ID: {user.id}</p>
                  <p>Created Time: {new Date(user.createdTime).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No users found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersList;
