import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GeistSans } from 'geist/font/sans';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Math Tactix Evolution",
  description: "Advanced Math Learning Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
