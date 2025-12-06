"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function AnimatedBlob() {
  return (
    <>
      <div className="blob blob-1" aria-hidden />
      <div className="blob blob-2" aria-hidden />
    </>
  );
}

function LoginButton({ role, to, color = "from-indigo-500 to-cyan-400" }: { role: string; to: string; color?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    // micro-interaction: short delay to show animation, then navigate
    setTimeout(() => {
      router.push(to);
    }, 650);
  }

  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={handleClick} className={`inline-flex items-center gap-3 px-5 py-3 rounded-full text-white font-semibold btn-animated shadow-lg bg-linear-to-r ${color}`}>
      {loading ? <span className="spinner" /> : <svg className="w-5 h-5 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M5 5l7 7-7 7"/></svg>}
      <span>{loading ? `Loading ${role}…` : `Login as ${role}`}</span>
    </motion.button>
  );
}

export default function Home() {
  const [theme, setTheme] = useState("theme-ocean");

  return (
    <div className={`${theme} min-h-screen relative overflow-hidden`}>
      <AnimatedBlob />

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-24">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/35 flex items-center justify-center glass-card">AI</div>
            <div>
              <div className="text-sm text-gray-800/70">Welcome to</div>
              <div className="font-bold">AI in Edutech</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select aria-label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)} className="px-3 py-2 rounded-md glass-card">
              <option value="theme-ocean">Ocean</option>
              <option value="theme-sunset">Sunset</option>
              <option value="theme-aurora">Aurora</option>
            </select>
            <a className="text-sm text-gray-700/80">Docs</a>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .6 }} className="text-5xl md:text-6xl font-extrabold mb-4 gradient-text">Make learning delightful with AI</motion.h1>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .12, duration: .6 }} className="text-lg text-gray-800/85 max-w-xl mb-6">Personalized study paths, interactive tests, and instant feedback — all wrapped in a beautiful, fast experience.</motion.p>

            <div className="flex gap-4 items-center">
              <LoginButton role="Student" to="/login/student" color="from-sky-500 to-indigo-600" />
              <LoginButton role="Teacher" to="/login/teacher" color="from-pink-500 to-rose-500" />
            </div>
          </div>

          <div className="relative">
            <motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: .6 }} className="p-6 rounded-3xl glass-card shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-800/70">Live Demo</div>
                <div className="text-xs text-gray-600/80">AI Preview</div>
              </div>

              <div className="w-full h-64 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
                {/* Animated SVG / GIF stand-in */}
                <svg className="w-56 h-56" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="g1" x1="0%" x2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <motion.g animate={{ rotate: [0,15,-12,0] }} transition={{ repeat: Infinity, duration: 8, repeatType: 'loop' }} style={{ originX: 0.5, originY: 0.5 }}>
                    <motion.circle cx="100" cy="100" r="68" fill="url(#g1)" opacity="0.9" />
                    <motion.path d="M40 120 C70 40, 130 40, 160 120" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" animate={{ pathLength: [0,1,0] }} transition={{ duration: 6, repeat: Infinity, repeatType: 'loop' }} />
                  </motion.g>
                </svg>
              </div>
            </motion.div>
          </div>
        </main>

        <section className="mt-12 text-center">
          <h3 className="text-2xl font-bold mb-6">Why Choose Us?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl glass-card">
              <div className="text-4xl mb-3">🤖</div>
              <h5 className="font-semibold mb-2">AI-Powered</h5>
              <p className="text-sm text-gray-700">Adaptive recommendations and smart study summaries.</p>
            </div>
            <div className="p-6 rounded-xl glass-card">
              <div className="text-4xl mb-3">📊</div>
              <h5 className="font-semibold mb-2">Insights</h5>
              <p className="text-sm text-gray-700">Visual analytics to measure improvements and gaps.</p>
            </div>
            <div className="p-6 rounded-xl glass-card">
              <div className="text-4xl mb-3">⚡</div>
              <h5 className="font-semibold mb-2">Interactive</h5>
              <p className="text-sm text-gray-700">Engaging activities, timers and instant feedback loops.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
