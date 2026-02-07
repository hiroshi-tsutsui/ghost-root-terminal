import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 text-black font-sans">
      <div className="max-w-5xl w-full text-center space-y-8">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Project Omega
        </h1>
        <p className="text-xl text-gray-600">
          Interactive Japanese High School Mathematics Visualization Platform
          <br/>
          <span className="text-sm text-gray-500">（日本の高校数学可視化プロジェクト）</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-12 text-left">
          
          {/* Math I: Quadratics */}
          <Link href="/quadratics" className="group block p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition hover:border-blue-400">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold group-hover:text-blue-600">二次関数</h2>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Math I</span>
            </div>
            <p className="text-gray-600 mb-4">Quadratic Functions</p>
            <ul className="text-sm text-gray-500 list-disc list-inside">
              <li>Parabola Visualization</li>
              <li>Vertex & Axis of Symmetry</li>
              <li>Parameter (a, b, c) controls</li>
            </ul>
          </Link>

          {/* Math B: Vectors */}
          <Link href="/vectors" className="group block p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition hover:border-purple-400 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl">NEW</div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold group-hover:text-purple-600">ベクトル</h2>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Math B</span>
            </div>
            <p className="text-gray-600 mb-4">Vectors (Spatial)</p>
            <ul className="text-sm text-gray-500 list-disc list-inside">
              <li>3D Vector Visualization</li>
              <li>Dot Product (内積)</li>
              <li>Cross Product (外積)</li>
            </ul>
          </Link>

          {/* Math III: Calculus */}
          <Link href="/calculus" className="group block p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition hover:border-red-400 opacity-90">
             <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold group-hover:text-red-600">微積分</h2>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Math III</span>
            </div>
            <p className="text-gray-600 mb-4">Calculus</p>
             <ul className="text-sm text-gray-500 list-disc list-inside">
              <li>Differentiation (Tangent lines)</li>
              <li>Integration (Area)</li>
              <li>Limits</li>
            </ul>
          </Link>

          {/* Math A: Probability */}
          <Link href="/probability" className="group block p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition hover:border-yellow-400 opacity-90">
             <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold group-hover:text-yellow-600">確率・統計</h2>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Math A/B</span>
            </div>
            <p className="text-gray-600 mb-4">Probability & Statistics</p>
             <ul className="text-sm text-gray-500 list-disc list-inside">
              <li>Distributions (Normal, Binomial)</li>
              <li>Combinations & Permutations</li>
              <li>Data Visualization</li>
            </ul>
          </Link>

        </div>
      </div>
    </main>
  );
}
