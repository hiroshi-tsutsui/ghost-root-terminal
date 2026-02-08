'use client';

import dynamic from 'next/dynamic';

const WebTerminal = dynamic(() => import('@/components/Terminal'), { 
  ssr: false,
  loading: () => <div className="w-full h-screen bg-black text-green-500 font-mono p-4">Initializing recovery mode...</div>
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <WebTerminal />
    </main>
  );
}
