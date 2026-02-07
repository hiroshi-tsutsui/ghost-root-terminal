import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900 font-sans selection:bg-blue-500/30">
      {/* Apple-style Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-md border-b border-gray-200/50 transition-all duration-300">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg shadow-sm flex items-center justify-center text-white font-bold text-lg">
            Ω
          </div>
          <span className="text-xl font-semibold tracking-tight text-gray-900">Project Omega</span>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
          <a href="https://github.com/hiroshi-tsutsui/math-viz-japan" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">GitHub</a>
        </nav>
      </header>

      <main className="flex flex-col items-center justify-center pt-32 pb-16 px-6">
        <div className="max-w-5xl w-full text-center space-y-12">
          
          {/* Hero Section */}
          <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
              Math, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Reimagined.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 font-normal max-w-2xl mx-auto leading-relaxed">
              Interactive visualizations for Japanese High School Mathematics.
              <span className="block text-base text-gray-400 mt-2">見て、触れて、理解する。次世代の数学学習体験。</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 text-left">
            
            {/* Math I: Quadratics */}
            <Link href="/quadratics" className="group relative block p-8 bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50/50 rounded-2xl group-hover:bg-blue-100/50 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-blue-50 text-blue-600">
                  Math I
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">二次関数</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Parabola visualization, vertex control, and axis symmetry.
                <br/>放物線の動きを直感的に理解。
              </p>
              <div className="flex items-center text-blue-600 text-sm font-semibold opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                Open App <span className="ml-1">→</span>
              </div>
            </Link>

            {/* Math B: Vectors */}
            <Link href="/vectors" className="group relative block p-8 bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
               <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-50/50 rounded-2xl group-hover:bg-purple-100/50 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-purple-50 text-purple-600">
                  Math B
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">ベクトル</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                3D vector operations, dot/cross products, and spatial logic.
                <br/>空間ベクトルの幾何学的意味。
              </p>
              <div className="flex items-center text-purple-600 text-sm font-semibold opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                 Open App <span className="ml-1">→</span>
              </div>
            </Link>

            {/* Math III: Calculus */}
            <Link href="/calculus" className="group relative block p-8 bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
               <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-50/50 rounded-2xl group-hover:bg-red-100/50 transition-colors">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-red-50 text-red-600">
                  Math III
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">微分積分</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Differentiation, integration, and limits in motion.
                <br/>極限と変化の動的視覚化。
              </p>
              <div className="flex items-center text-red-600 text-sm font-semibold opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                 Open App <span className="ml-1">→</span>
              </div>
            </Link>

            {/* Math A: Probability */}
            <Link href="/probability" className="group relative block p-8 bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
               <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-yellow-50/50 rounded-2xl group-hover:bg-yellow-100/50 transition-colors">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-yellow-50 text-yellow-800">
                  Math A
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">確率・統計</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Distributions, combinations, and data analysis.
                <br/>データの分布と確率の法則。
              </p>
              <div className="flex items-center text-yellow-600 text-sm font-semibold opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                 Open App <span className="ml-1">→</span>
              </div>
            </Link>

          </div>
        </div>
      </main>
    </div>
  );
}