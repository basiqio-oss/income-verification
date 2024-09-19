import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_URL
      ? `${process.env.APP_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3000}`
  ),
  title: "Income Verification App",
  description:
    "An income verification app using the Reports API from Basiq. Built with Next.js, it allows generating income reports for financial use cases.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Income Verification App",
    description:
      "An income verification app using the Reports API from Basiq. Built with Next.js, it allows generating income reports for financial use cases.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Income Verification App",
    description:
      "An income verification app using the Reports API from Basiq. Built with Next.js, it allows generating income reports for financial use cases.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
