"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from 'axios'; // Import Axios

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleVerifyIncome = async () => {
    setLoading(true);
    setError("");

    // Simple email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      // Fetch the token from the API using Axios
      const response = await axios.post('/api/generate-token');

      // Store the token in local storage
      localStorage.setItem("BASI_Q_TOKEN", response.data.token);

      // Store the email in local storage
      localStorage.setItem("USER_EMAIL", email);

      // Redirect to dashboard after storing the email
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to verify income");
      console.error(err); // Log the error for debugging
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100">
      <main className="flex flex-col items-center bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Verify Income</h1>
        <div className="w-full mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="mt-1"
          />
        </div>
        <Button
          onClick={handleVerifyIncome}
          variant="default"
          className="w-full mt-4"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify Income"}
        </Button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </main>
      <footer className="mt-4 text-gray-600">
        <p>This is a demo app</p>
      </footer>
    </div>
  );
}
