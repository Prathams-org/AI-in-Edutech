"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Brain, Sparkles, Zap } from "lucide-react";

export default function LoadingScreen({ message = "Generating your personalized study plan..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center z-50">
      <div className="text-center px-4">
        {/* Animated Icons */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Center Brain Icon */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
              <Brain className="w-16 h-16 text-white" />
            </div>
          </motion.div>

          {/* Orbiting Icons */}
          {[0, 120, 240].map((rotation, index) => (
            <motion.div
              key={index}
              className="absolute inset-0"
              animate={{
                rotate: [rotation, rotation + 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="relative w-full h-full">
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                  {index === 0 && (
                    <BookOpen className="w-6 h-6 text-yellow-300" />
                  )}
                  {index === 1 && (
                    <Sparkles className="w-6 h-6 text-pink-300" />
                  )}
                  {index === 2 && (
                    <Zap className="w-6 h-6 text-green-300" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Loading Text */}
        <motion.h2
          className="text-2xl md:text-3xl font-bold text-white mb-4"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {message}
        </motion.h2>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-3 h-3 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </div>

        {/* Subtitle */}
        <motion.p
          className="text-white/80 text-sm md:text-base max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          AI is analyzing your exam schedule and creating optimal study tasks for today
        </motion.p>

        {/* Progress Bar */}
        <div className="mt-8 max-w-xs mx-auto">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
