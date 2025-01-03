import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "snippet.today - A Clean, Distraction-Free Writing Environment",
  description: "Experience focused writing with AI assistance. Create, edit, and improve your documents with a minimalist interface and intelligent suggestions.",
  keywords: ["writing app", "markdown editor", "AI writing assistant", "distraction-free writing", "minimalist editor"],
  authors: [{ name: "Shubhankit Jain", url: "https://x.com/shubhcodes" }],
  creator: "Shubhankit Jain",
  publisher: "snippet.today",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://snippet.today",
    siteName: "snippet.today",
    title: "snippet.today - A Clean, Distraction-Free Writing Environment",
    description: "Experience focused writing with AI assistance. Create, edit, and improve your documents with a minimalist interface and intelligent suggestions.",
    // images: [
    //   {
    //     url: "/og-image.png",
    //     width: 1200,
    //     height: 630,
    //     alt: "snippet.today preview",
    //   },
    // ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@shubhcodes",
    creator: "@shubhcodes",
    title: "snippet.today - A Clean, Distraction-Free Writing Environment",
    description: "Experience focused writing with AI assistance. Create, edit, and improve your documents with a minimalist interface and intelligent suggestions.",
    // images: ["/og-image.png"], 
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: "your-google-site-verification-code", // Add your Google verification code
  },
  alternates: {
    canonical: "https://snippet.today",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
