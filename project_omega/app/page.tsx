import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto mb-20 mt-12 space-y-8 fade-in-up">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm mb-4">
          <span className="flex h-2 w-2 relative mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0071e3]"></span>
          </span>
          <span className="text-xs font-semibold tracking-wide uppercase text-gray-500">v2.0 Now Available</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-[#1d1d1f] leading-[1.1]">
          数式を、<br className="md:hidden" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1d1d1f] via-[#434344] to-[#1d1d1f]">
            手で触れる体験へ。
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-[#86868b] font-medium max-w-2xl mx-auto leading-relaxed">
          Project Omegaは、日本の高校数学を再定義します。<br className="hidden md:block"/>
          美しいビジュアルと直感的な操作で、本質的な理解を。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button className="btn-apple text-lg px-8 py-3 w-full sm:w-auto shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40">
            学習をスタート
          </button>
          <button className="btn-secondary text-lg px-8 py-3 w-full sm:w-auto bg-white hover:bg-gray-50 border border-gray-200">
            デモを見る
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pb-12">
        
        {/* Card 1: Quadratics */}
        <Link href="/quadratics" className="group apple-card p-8 md:p-10 fade-in-up delay-100 hover:ring-4 hover:ring-[#0071e3]/10 relative">
          <div className="absolute top-0 right-0 p-6 opacity-50 group-hover:opacity-100 transition-opacity">
             <svg className="w-6 h-6 text-gray-400 group-hover:text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
             </svg>
          </div>
          <div className="flex flex-col h-full justify-between space-y-20">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#86868b] uppercase mb-2 block">Math I</span>
              <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-3 group-hover:text-[#0071e3] transition-colors">二次関数</h2>
              <p className="text-[#86868b] font-medium leading-relaxed max-w-sm">
                放物線の形状や軸の移動をパラメータで制御。<br/>
                頂点、軸の方程式をリアルタイムに可視化。
              </p>
            </div>
            <div className="relative h-32 w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group-hover:border-blue-100 transition-colors">
              {/* Abstract visualization placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-full h-24 text-blue-500/20" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <path d="M0,50 Q50,0 100,50" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Card 2: Vectors */}
        <Link href="/vectors" className="group apple-card p-8 md:p-10 fade-in-up delay-200 hover:ring-4 hover:ring-purple-500/10 relative">
          <div className="absolute top-0 right-0 p-6 opacity-50 group-hover:opacity-100 transition-opacity">
             <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
             </svg>
          </div>
          <div className="flex flex-col h-full justify-between space-y-20">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#86868b] uppercase mb-2 block">Math B / C</span>
              <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-3 group-hover:text-purple-600 transition-colors">ベクトル</h2>
              <p className="text-[#86868b] font-medium leading-relaxed max-w-sm">
                空間ベクトルの内積・外積を3Dで操作。<br/>
                幾何学的な意味を視覚的に理解できます。
              </p>
            </div>
            <div className="relative h-32 w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group-hover:border-purple-100 transition-colors">
               <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-24 h-24 text-purple-500/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Card 3: Calculus */}
        <Link href="/calculus" className="group apple-card p-8 md:p-10 fade-in-up delay-300 hover:ring-4 hover:ring-red-500/10 relative">
           <div className="absolute top-0 right-0 p-6 opacity-50 group-hover:opacity-100 transition-opacity">
             <svg className="w-6 h-6 text-gray-400 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
             </svg>
          </div>
          <div className="flex flex-col h-full justify-between space-y-20">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#86868b] uppercase mb-2 block">Math III</span>
              <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-3 group-hover:text-red-600 transition-colors">微分積分</h2>
              <p className="text-[#86868b] font-medium leading-relaxed max-w-sm">
                接線の傾きや面積の変化を動的に観察。<br/>
                極限の概念をグラフで確認できます。
              </p>
            </div>
            <div className="relative h-32 w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group-hover:border-red-100 transition-colors">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-24 h-24 text-red-500/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Card 4: Probability */}
        <Link href="/probability" className="group apple-card p-8 md:p-10 fade-in-up delay-100 hover:ring-4 hover:ring-yellow-500/10 relative">
           <div className="absolute top-0 right-0 p-6 opacity-50 group-hover:opacity-100 transition-opacity">
             <svg className="w-6 h-6 text-gray-400 group-hover:text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
             </svg>
          </div>
          <div className="flex flex-col h-full justify-between space-y-20">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#86868b] uppercase mb-2 block">Math A</span>
              <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-3 group-hover:text-yellow-600 transition-colors">確率・統計</h2>
              <p className="text-[#86868b] font-medium leading-relaxed max-w-sm">
                確率分布やデータの散らばりをシミュレーション。<br/>
                正規分布、二項分布を直感的に学びます。
              </p>
            </div>
            <div className="relative h-32 w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group-hover:border-yellow-100 transition-colors">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-24 h-24 text-yellow-500/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
              </div>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
