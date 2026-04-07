import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TLC Platform — Streamline Teaching Loads & Ensure Compliance",
  description: "The Teaching Load & Compliance Platform helps institutions manage academic workloads, enforce policies, and maintain compliance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
