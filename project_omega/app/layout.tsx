import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import "./main.css";
import { ProgressProvider } from "./contexts/ProgressContext";
import ProfileHeader from "./components/ProfileHeader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-noto-sans-jp" });

export const metadata: Metadata = {
  title: "Project Omega | 数学可視化プラットフォーム",
  description: "日本の高校数学を直感的に学ぶためのインタラクティブな学習プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased bg-[#F5F5F7] text-[#1d1d1f]`}>
        
        <ProgressProvider>
          {/* Sticky Header with Glassmorphism - Global */}
          <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/70 backdrop-blur-xl border-b border-white/20 supports-[backdrop-filter]:bg-white/60">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-600 shadow-inner flex items-center justify-center transition-transform group-hover:scale-105">
                  <span className="text-white font-bold text-lg">Ω</span>
                </div>
                <span className="text-xl font-semibold tracking-tight text-[#1d1d1f]">Project Omega</span>
              </Link>
              
              <div className="flex items-center gap-6">
                <nav className="hidden md:flex items-center space-x-6 text-[14px] font-medium text-[#1d1d1f]/80">
                  <Link href="/overview" className="hover:text-[#0071e3] transition-colors">Overview</Link>
                  <Link href="/" className="hover:text-[#0071e3] transition-colors">Curriculum</Link>
                </nav>
                <ProfileHeader />
              </div>
            </div>
          </header>

          <main className="pt-24 min-h-screen">
            {children}
          </main>

          <footer className="bg-white border-t border-gray-200 py-12 mt-20">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
              <p className="text-[#86868b] text-xs">Copyright © 2026 Project Omega. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0 text-[#86868b] text-xs font-medium">
                <Link href="#" className="hover:text-[#1d1d1f]">プライバシーポリシー</Link>
                <Link href="#" className="hover:text-[#1d1d1f]">利用規約</Link>
                <Link href="#" className="hover:text-[#1d1d1f]">販売法に基づく表記</Link>
              </div>
            </div>
          </footer>
        </ProgressProvider>

      </body>
    </html>
  );
}
