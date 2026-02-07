"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

// Types
type CellType = "WALL" | "PATH" | "VISITED_GEN" | "SOLUTION" | "WATER";
type Point = { x: number; y: number };

const CELL_WALL = 0;
const CELL_PATH = 1;
// VISITED_GEN is transient during generation, usually just PATH
const CELL_WATER = 2; // Visited during solve
const CELL_SOLUTION = 3;

export default function MazeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridSize, setGridSize] = useState<number>(50); // Default 50
  const [status, setStatus] = useState<"idle" | "generating" | "solving" | "solved">("idle");
  
  // We use Refs for data that changes rapidly to avoid React render cycle overhead
  const gridRef = useRef<Uint8Array | null>(null);
  const widthRef = useRef<number>(0);
  const heightRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  // Constants for rendering
  const CANVAS_SIZE = 800; // Fixed canvas size, scales content

  // Initialize/Reset Grid
  const initGrid = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    // Calculate actual array dimensions
    // For a maze of N cells, we need 2N+1 array slots to handle walls between cells
    const dim = gridSize * 2 + 1;
    const totalSize = dim * dim;
    
    const newGrid = new Uint8Array(totalSize);
    newGrid.fill(CELL_WALL); // Start with all walls
    
    gridRef.current = newGrid;
    widthRef.current = dim;
    heightRef.current = dim;
    
    // Draw initial state
    draw();
    setStatus("idle");
  }, [gridSize]);

  // Initial load
  useEffect(() => {
    initGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount, initGrid handles updates via button

  // Draw Function
  const draw = () => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dim = widthRef.current;
    const cellSize = CANVAS_SIZE / dim;

    // Clear background (Black = Walls)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // To optimize, we can access the pixel data directly, but for 500x500 (1000x1000 array)
    // 1M drawRect calls might be heavy.
    // Optimization: ImageData.
    
    const imageData = ctx.createImageData(dim, dim);
    const data = imageData.data;
    
    for (let i = 0; i < grid.length; i++) {
      const val = grid[i];
      const idx = i * 4;
      
      if (val === CELL_WALL) {
        data[idx] = 0; data[idx+1] = 0; data[idx+2] = 0; data[idx+3] = 255;
      } else if (val === CELL_PATH) {
        data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255; data[idx+3] = 255;
      } else if (val === CELL_WATER) {
        data[idx] = 0; data[idx+1] = 191; data[idx+2] = 255; data[idx+3] = 255; // Deep Sky Blue
      } else if (val === CELL_SOLUTION) {
        data[idx] = 255; data[idx+1] = 215; data[idx+2] = 0; data[idx+3] = 255; // Gold
      }
    }
    
    // Scale up the ImageData to canvas size
    // Using createBitmap or just turning off smoothing might be better
    // But putImageData puts it 1:1. We want to scale.
    // Best approach for performance: 
    // 1. Create a small offscreen canvas matching grid dimensions.
    // 2. PutImageData there.
    // 3. Draw that offscreen canvas scaled up to the main canvas.
    
    createImageBitmap(imageData).then((bitmap) => {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bitmap, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    });
  };

  // Generate Maze (DFS Iterative)
  const generateMaze = async () => {
    if (status === "generating") return;
    initGrid();
    setStatus("generating");

    const grid = gridRef.current;
    if (!grid) return;
    const width = widthRef.current;

    // Helper to get index
    const getIdx = (x: number, y: number) => y * width + x;

    // Start at (1,1)
    const stack: Point[] = [{ x: 1, y: 1 }];
    grid[getIdx(1, 1)] = CELL_PATH;

    // Directions: Up, Right, Down, Left (dx, dy)
    // Move 2 steps to jump over walls
    const dirs = [
      { dx: 0, dy: -2 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 }
    ];

    // Speed control based on size. Large grid = faster steps per frame.
    const stepsPerFrame = gridSize > 100 ? 500 : 50;
    
    const step = () => {
      for (let k = 0; k < stepsPerFrame; k++) {
        if (stack.length === 0) {
            draw();
            setStatus("idle");
            return;
        }

        const current = stack[stack.length - 1];
        const { x, y } = current;

        // Shuffle directions
        const shuffledDirs = [...dirs].sort(() => Math.random() - 0.5);
        let found = false;

        for (const { dx, dy } of shuffledDirs) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx > 0 && nx < width - 1 && ny > 0 && ny < width - 1) {
             if (grid[getIdx(nx, ny)] === CELL_WALL) {
                // Carve path
                grid[getIdx(nx, ny)] = CELL_PATH;
                // Carve wall between
                grid[getIdx(x + dx/2, y + dy/2)] = CELL_PATH;
                
                stack.push({ x: nx, y: ny });
                found = true;
                break;
             }
          }
        }

        if (!found) {
            stack.pop();
        }
      }
      
      draw();
      animationRef.current = requestAnimationFrame(step);
    };

    step();
  };

  // Solve Maze (BFS - Water Fill)
  const solveMaze = () => {
    if (status !== "idle" && status !== "solved") return;
    
    // Clear previous solution/water if any
    const grid = gridRef.current;
    if (!grid) return;
    const width = widthRef.current;
    for(let i=0; i<grid.length; i++) {
        if (grid[i] === CELL_WATER || grid[i] === CELL_SOLUTION) {
            grid[i] = CELL_PATH;
        }
    }

    setStatus("solving");

    const start = { x: 1, y: 1 };
    const end = { x: width - 2, y: width - 2 }; // Bottom-right
    
    const queue: Point[] = [start];
    let queueHead = 0; // Optimization: Use pointer instead of shift() to avoid O(n) re-indexing
    
    // We need to track parents to reconstruct path: Map<index, parentIndex>
    // Using Int32Array for parent map is faster than Map object for large sets
    const parentMap = new Int32Array(grid.length).fill(-1);
    
    grid[start.y * width + start.x] = CELL_WATER;

    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }
    ];

    const stepsPerFrame = gridSize > 100 ? 1000 : 100;

    const step = () => {
        let foundEnd = false;
        
        for (let k = 0; k < stepsPerFrame; k++) {
            if (queueHead >= queue.length) break;
            
            const current = queue[queueHead++]; // BFS Optimized
            const { x, y } = current;
            
            if (x === end.x && y === end.y) {
                foundEnd = true;
                break;
            }
            
            const cIdx = y * width + x;

            for (const { dx, dy } of dirs) {
                const nx = x + dx;
                const ny = y + dy;
                const nIdx = ny * width + nx;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < width) {
                    if (grid[nIdx] === CELL_PATH) {
                        grid[nIdx] = CELL_WATER;
                        parentMap[nIdx] = cIdx;
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }
        
        draw();
        
        if (foundEnd) {
            // Reconstruct path
            let currIdx = end.y * width + end.x;
            const startIdx = start.y * width + start.x;
            
            while (currIdx !== -1 && currIdx !== startIdx) {
                grid[currIdx] = CELL_SOLUTION;
                currIdx = parentMap[currIdx];
            }
            grid[startIdx] = CELL_SOLUTION;
            draw();
            setStatus("solved");
            return;
        }
        
        if (queueHead >= queue.length) {
            // No path found
            setStatus("idle");
            return;
        }

        animationRef.current = requestAnimationFrame(step);
    };

    step();
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="flex flex-col gap-4 w-full max-w-lg">
        <div className="flex items-center justify-between">
            <label className="font-bold text-gray-200">Grid Size: {gridSize}</label>
            <input 
                type="range" 
                min="10" 
                max="500" 
                value={gridSize} 
                onChange={(e) => {
                    setGridSize(Number(e.target.value));
                    // Don't auto-init here, wait for effect or user action? 
                    // Effect handles it, but better to debounce if needed. 
                    // For now, React state update triggers effect -> initGrid.
                }}
                disabled={status === "generating" || status === "solving"}
                className="w-48 accent-blue-500"
            />
        </div>
        
        <div className="flex gap-4 justify-center">
            <button 
                onClick={generateMaze}
                disabled={status === "generating" || status === "solving"}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded font-bold text-white transition"
            >
                {status === "generating" ? "Generating..." : "Generate Maze"}
            </button>
            <button 
                onClick={solveMaze}
                disabled={status === "generating" || status === "solving" || !gridRef.current}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded font-bold text-white transition"
            >
                {status === "solving" ? "Solving..." : "Solve"}
            </button>
        </div>
      </div>

      <div className="relative border-4 border-gray-700 rounded-lg shadow-2xl bg-black">
        <canvas 
            ref={canvasRef} 
            width={CANVAS_SIZE} 
            height={CANVAS_SIZE}
            className="block"
        />
        {/* Overlay info if needed */}
      </div>
    </div>
  );
}
