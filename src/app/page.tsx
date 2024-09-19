"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import Link from "next/link";
import { PanelsRightBottom } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ModeToggle } from "@/components/mode-toggle";
import '../styles/global.css';

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false); // New state for redirect
  const router = useRouter();

  const handleVerifyIncome = async () => {
    setLoading(true);
    setError("");

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

      // Store the email in localStorage
    localStorage.setItem("USER_EMAIL", email);


    try {
      const tokenResponse = await axios.post("/api/generate-token");
      const basiQToken = tokenResponse.data.token;

      localStorage.setItem("BASI_Q_TOKEN", basiQToken);

      const userResponse = await axios.post(
        "/api/server",
        { email },
        {
          headers: {
            Authorization: `Bearer ${basiQToken}`,
          },
        }
      );

      const { consentUrl, userId } = userResponse.data;
      console.log(consentUrl, userId);

      if (userId) {
        localStorage.setItem("USER_ID", userId);
      }

      if (consentUrl) {
        setRedirecting(true); // Set redirect state to true
        setTimeout(() => {
          window.location.href = consentUrl;
        }, 500); // Delay redirect to show spinner
      } else {
        setError("Failed to get the consent URL.");
      }
    } catch (err) {
      setError("Failed to verify income.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="z-[50] sticky top-0 w-full bg-background/95 border-b backdrop-blur-sm dark:bg-black/[0.6] border-border/40">
        <div className="container h-14 flex items-center">
          <Link
            href="/"
            className="flex justify-start items-center hover:opacity-85 transition-opacity duration-300"
          >
            <PanelsRightBottom className="w-6 h-6 mr-3" />
            <span className="font-bold">BASIQ</span>
            <span className="sr-only">BASIQ</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-8 h-8 bg-background"
              asChild
            >
              <Link href="https://github.com/basiqio-oss/income-verification">
                <GitHubLogoIcon className="h-[1.2rem] w-[1.2rem]" />
              </Link>
            </Button>
            <ModeToggle />
          </nav>
        </div>
      </header>
      <main className="min-h-[calc(100vh-57px-97px)] flex-1">
        <div className="container relative pb-10">
          <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-6">
            <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
              Income Verification through BASIQ API
            </h1>
            <span className="max-w-[750px] text-center text-lg font-light text-foreground">
              Allows businesses and lenders to verify an individual’s income from various financial sources, ensuring accurate and reliable income data.
            </span>
          </section>

          {/* Income Verification Section */}
          <div className="flex flex-col items-center p-8 rounded-lg shadow-lg w-full max-w-sm mx-auto">
            <h1 className="text-2xl font-bold mb-4">Connect my Bank Account</h1>
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
              className="w-full"
              disabled={loading}
            >
              {loading ? "Connecting..." : "Connect"}
            </Button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {redirecting && (
              <div className="flex justify-center items-center mt-4">
                <div className="spinner"></div>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="py-6 md:py-0 border-t border-border/40">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground">
            This is a demo app.
          </p>
        </div>
      </footer>
    </div>
  );
}