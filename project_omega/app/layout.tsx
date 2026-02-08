import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./main.css";
import { ProgressProvider } from "./contexts/ProgressContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import XPBar from "./components/XPBar";

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
          <LanguageProvider>
            {/* Global Layout - Minimal. Header handled by individual pages for specific protocols. */}
            <main className="min-h-screen pb-20">
              {children}
            </main>
            <XPBar />
          </LanguageProvider>
        </ProgressProvider>
      </body>
    </html>
  );
}
