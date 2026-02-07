import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./main.css";
import { ProgressProvider } from "./contexts/ProgressContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-noto-sans-jp" });

export const metadata: Metadata = {
  title: "Project Omega | The Simulation",
  description: "Synchronize with the source code of reality. Welcome to the Omega Protocol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased bg-black text-white`}>
        <ProgressProvider>
          {/* Global Layout - Minimal. Header handled by individual pages for specific protocols. */}
          <main className="min-h-screen">
            {children}
          </main>
        </ProgressProvider>
      </body>
    </html>
  );
}
