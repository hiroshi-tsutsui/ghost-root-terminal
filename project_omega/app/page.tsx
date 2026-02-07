import Link from 'next/link';

export default function Home() {
  const modules = [
    {
      id: 'quadratics',
      title: '二次関数',
      desc: '放物線の形状や軸の移動をパラメータで制御。\n頂点、軸の方程式をリアルタイムに可視化。',
      colorClass: 'text-blue-600 bg-blue-50 group-hover:bg-blue-100',
      level: '数学 I',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'trig',
      title: '三角比',
      desc: '単位円と波形の同期アニメーション。\nsin, cos, tan の定義を動的に理解。',
      colorClass: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100',
      level: '数学 I',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'data',
      title: 'データの分析',
      desc: '散布図と相関係数をリアルタイム計算。\n回帰直線や分散の意味を視覚化。',
      colorClass: 'text-teal-600 bg-teal-50 group-hover:bg-teal-100',
      level: '数学 I',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'vectors',
      title: 'ベクトル',
      desc: '空間ベクトルの内積・外積を3D操作。\n直線の方程式や平面の法線を視覚化。',
      colorClass: 'text-purple-600 bg-purple-50 group-hover:bg-purple-100',
      level: '数学 B/C',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      id: 'sequences',
      title: '数列',
      desc: '等差・等比数列の成長をグラフ比較。\n漸化式の挙動や極限をシミュレート。',
      colorClass: 'text-green-600 bg-green-50 group-hover:bg-green-100',
      level: '数学 B',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    {
      id: 'probability',
      title: '確率・統計',
      desc: '正規分布や条件付き確率を実験。\n大数の法則や信頼区間を体感。',
      colorClass: 'text-orange-600 bg-orange-50 group-hover:bg-orange-100',
      level: '数学 A/B',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      )
    },
    {
      id: 'calculus',
      title: '微分積分',
      desc: '接線の傾きや面積の変化を動的に観察。\n回転体の体積や極限をグラフで確認。',
      colorClass: 'text-red-600 bg-red-50 group-hover:bg-red-100',
      level: '数学 III',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      id: 'complex',
      title: '複素数平面',
      desc: '複素数の積による回転・拡大を可視化。\nド・モアブルの定理や極形式を直感的に。',
      colorClass: 'text-cyan-600 bg-cyan-50 group-hover:bg-cyan-100',
      level: '数学 III',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'logs',
      title: '指数・対数',
      desc: '指数関数の爆発的増加と対数スケール。\n底の変換や逆関数の関係を確認。',
      colorClass: 'text-pink-600 bg-pink-50 group-hover:bg-pink-100',
      level: '数学 II',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900 font-sans selection:bg-blue-500/30">
      
      <div className="flex flex-col items-center justify-center pt-16 pb-16 px-6">
        <div className="max-w-7xl w-full text-center space-y-12">
          
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginTop: '4rem' }} className="space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
              数式を、<br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">体験する。</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 font-normal max-w-2xl mx-auto leading-relaxed">
              日本の高校数学を再定義するインタラクティブ・プラットフォーム。<br/>
              <span className="block text-base text-gray-400 mt-2">Project Omega v4: Curriculum Expansion</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 text-left">
            {modules.map((m) => (
                <Link key={m.id} href={`/${m.id}`} className="group relative block p-8 bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl transition-colors ${m.colorClass}`}>
                       {m.icon}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase ${m.colorClass.split(' ').slice(0, 2).join(' ')}`}>
                        {m.level}
                        </span>
                        {(m.id === 'quadratics' || m.id === 'vectors' || m.id === 'calculus' || m.id === 'probability') && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 animate-pulse">
                            Sensei Mode 🎓
                            </span>
                        )}
                    </div>
                </div>
                <h2 className={`text-2xl font-bold text-gray-900 mb-2 transition-colors ${m.colorClass.split(' ')[0].replace('text-', 'group-hover:text-')}`}>{m.title}</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed whitespace-pre-line">
                    {m.desc}
                </p>
                <div className={`flex items-center text-sm font-semibold opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all ${m.colorClass.split(' ')[0]}`}>
                    アプリを開く <span className="ml-1">→</span>
                </div>
                </Link>
            ))}
          </div>
          
           {/* Mastery Quiz Link */}
           <div className="mt-16 pt-8 border-t border-gray-200">
                <Link href="/quiz" className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                    🏆 Mastery Quiz に挑戦する
                </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
