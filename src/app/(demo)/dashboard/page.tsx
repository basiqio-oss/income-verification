// app/demo/dashboard/page.tsx

"use client"; // Add this line at the top

import Link from "next/link";
import PlaceholderContent from "@/components/demo/placeholder-content";
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

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve the email from local storage on the client side
    const email = localStorage.getItem("USER_EMAIL");
    setUserEmail(email);
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
        {/* Instructions for using the income verification feature */}
        <div className="mt-6 p-4">
          <h2 className="text-xl font-semibold mb-2">Income Verification Instructions</h2>
          <p className="mb-2">
            To use the income verification feature with our reports endpoint, follow these steps:
          </p>
          <ol className="list-decimal list-inside">
            <li>Navigate to the <strong>Users</strong> tab to obtain the necessary user IDs.</li>
            <li>Go to the <strong>Account</strong> tab to get the account IDs.</li>
            <li>Use these IDs to create the report.</li>
          </ol>
        </div>
        </div>
        <PlaceholderContent />
        
       
    </ContentLayout>
  );
}
