import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#F9FAFB] text-gray-900 font-sans selection:bg-blue-100">
      <div className="max-w-5xl w-full text-center space-y-10">
        <div className="space-y-4">
          <h1 className="text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">
            Project Omega
          </h1>
          <p className="text-xl text-gray-500 font-medium">
            数式を見るだけでなく、触れて理解する。<br />
            <span className="text-base font-normal text-gray-400 mt-2 block">日本の高校数学・次世代学習プラットフォーム</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 text-left">
          
          {/* Math I: Quadratics */}
          <Link href="/quadratics" className="group relative block p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                数学I
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">二次関数</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              放物線の形状や軸の移動をパラメータで制御。<br/>
              頂点、軸の方程式をリアルタイムに可視化します。
            </p>
            <div className="flex items-center text-blue-600 text-sm font-medium opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              学習を始める <span className="ml-1">→</span>
            </div>
          </Link>

          {/* Math B: Vectors */}
          <Link href="/vectors" className="group relative block p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
             <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                数学C / B
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">ベクトル</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              空間ベクトルの内積・外積を3Dで操作。<br/>
              幾何学的な意味を視覚的に理解できます。
            </p>
            <div className="flex items-center text-purple-600 text-sm font-medium opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              学習を始める <span className="ml-1">→</span>
            </div>
          </Link>

          {/* Math III: Calculus */}
          <Link href="/calculus" className="group relative block p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
             <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                数学III
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">微分積分</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              接線の傾きや面積の変化を動的に観察。<br/>
              極限の概念をグラフで確認できます。
            </p>
            <div className="flex items-center text-red-600 text-sm font-medium opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              学習を始める <span className="ml-1">→</span>
            </div>
          </Link>

          {/* Math A: Probability */}
          <Link href="/probability" className="group relative block p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
             <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-yellow-50 rounded-xl group-hover:bg-yellow-100 transition-colors">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800">
                数学A / B
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">確率・統計</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              確率分布やデータの散らばりをシミュレーション。<br/>
              正規分布、二項分布を直感的に学びます。
            </p>
            <div className="flex items-center text-yellow-600 text-sm font-medium opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              学習を始める <span className="ml-1">→</span>
            </div>
          </Link>

        </div>
      </div>
    </main>
  );
}
