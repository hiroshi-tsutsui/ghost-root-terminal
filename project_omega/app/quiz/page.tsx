// @ts-nocheck
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const questions = [
  {
    id: 1,
    category: "微分積分 (Calculus)",
    question: "関数 f(x) = x² の導関数（微分）は？",
    options: ["x", "2x", "x²", "2"],
    answer: "2x",
    explanation: "x^n の微分は n*x^(n-1) です。したがって x^2 は 2x になります。"
  },
  {
    id: 2,
    category: "確率・統計 (Probability)",
    question: "正規分布において、標準偏差（σ）が表すものは？",
    options: ["データの中心", "データの個数", "データの散らばり", "データの最大値"],
    answer: "データの散らばり",
    explanation: "標準偏差は、データが平均値からどれくらい散らばっているか（分布の広がり）を表します。"
  },
  {
    id: 3,
    category: "二次関数 (Quadratics)",
    question: "y = (x - 2)² + 1 の頂点の座標は？",
    options: ["(2, 1)", "(-2, 1)", "(2, -1)", "(-2, -1)"],
    answer: "(2, 1)",
    explanation: "基本形 y = a(x - p)² + q の頂点は (p, q) です。"
  },
  {
    id: 4,
    category: "ベクトル (Vectors)",
    question: "2つのベクトルが垂直であるとき、その内積は？",
    options: ["1", "-1", "0", "無限大"],
    answer: "0",
    explanation: "直交する（垂直な）ベクトルの内積は常に0になります (cos90° = 0)。"
  }
];

export default function MasteryQuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);

  const handleOptionClick = (option: string) => {
    if (selectedOption) return; // Prevent multiple clicks
    setSelectedOption(option);

    if (option === questions[currentQuestion].answer) {
      setScore(score + 1);
      setFeedback("correct");
    } else {
      setFeedback("incorrect");
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        setShowResult(true);
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setFeedback(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/40 h-16 flex items-center px-6 sticky top-0 z-50">
         <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
             <Link href="/" className="text-sm font-medium text-[#86868b] hover:text-[#0071e3] transition-colors">
               ← ホームに戻る
             </Link>
             <h1 className="font-bold tracking-tight text-[#1d1d1f]">Mastery Quiz 🏆</h1>
             <div className="w-20"></div> {/* Spacer */}
         </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
            
            <AnimatePresence mode='wait'>
                {!showResult ? (
                    <motion.div 
                        key={currentQuestion}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="apple-card p-8 bg-white shadow-xl relative overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#86868b]">{questions[currentQuestion].category}</span>
                            <span className="text-xs font-mono text-[#86868b]">Q{currentQuestion + 1} / {questions.length}</span>
                        </div>

                        <h2 className="text-2xl font-bold mb-8 text-[#1d1d1f]">{questions[currentQuestion].question}</h2>

                        <div className="space-y-3">
                            {questions[currentQuestion].options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleOptionClick(option)}
                                    disabled={selectedOption !== null}
                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 font-medium
                                        ${selectedOption === option 
                                            ? option === questions[currentQuestion].answer 
                                                ? 'bg-[#34c759]/10 border-[#34c759] text-[#34c759]' 
                                                : 'bg-[#ff3b30]/10 border-[#ff3b30] text-[#ff3b30]'
                                            : 'bg-white border-gray-200 hover:border-[#0071e3] hover:bg-blue-50/50 text-[#1d1d1f]'
                                        }
                                        ${selectedOption !== null && option === questions[currentQuestion].answer && selectedOption !== option ? 'border-[#34c759] text-[#34c759] bg-[#34c759]/5' : ''}
                                    `}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {feedback && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-6 p-4 rounded-xl text-sm ${feedback === 'correct' ? 'bg-[#34c759]/10 text-[#34c759]' : 'bg-[#ff3b30]/10 text-[#ff3b30]'}`}
                            >
                                <p className="font-bold mb-1">
                                    {feedback === 'correct' ? '正解！ 🎉' : '残念... 😢'}
                                </p>
                                <p className="text-gray-600">{questions[currentQuestion].explanation}</p>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="apple-card p-12 bg-white shadow-xl text-center"
                    >
                        <div className="text-6xl mb-4">
                            {score === questions.length ? '🏆' : score >= questions.length / 2 ? '👍' : '💪'}
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
                        <p className="text-gray-500 mb-8">
                            あなたのスコアは... <span className="text-4xl font-bold text-[#0071e3] mx-2">{score}</span> / {questions.length}
                        </p>

                        <div className="flex justify-center gap-4">
                            <button onClick={resetQuiz} className="btn-apple-secondary">
                                もう一度挑戦
                            </button>
                            <Link href="/" className="btn-apple-primary">
                                ホームに戻る
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
