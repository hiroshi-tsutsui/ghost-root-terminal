import MazeCanvas from "@/components/MazeCanvas";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
        Maze Creator v2.0
      </h1>
      <p className="text-gray-400 mb-8">High Performance Canvas Rendering</p>
      
      <MazeCanvas />
    </main>
  );
}
