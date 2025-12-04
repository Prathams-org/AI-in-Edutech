"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Zap, Target, BookOpen, Lightbulb } from "lucide-react";

const loadingSteps = [
  {
    icon: Brain,
    text: "Analyzing your learning content...",
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    icon: Sparkles,
    text: "Building your personalized environment...",
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  {
    icon: Lightbulb,
    text: "Creating interactive flashcards...",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100"
  },
  {
    icon: Target,
    text: "Optimizing for best performance...",
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    icon: BookOpen,
    text: "Preparing your learning journey...",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100"
  },
  {
    icon: Zap,
    text: "Almost ready! Finalizing...",
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  }
];

export default function LoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const step = loadingSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4">
        {/* Animated Icon Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="mb-8"
          >
            <div className={`w-32 h-32 mx-auto ${step.bgColor} rounded-full flex items-center justify-center shadow-2xl`}>
              <Icon className={`w-16 h-16 ${step.color}`} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Loading Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${currentStep}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              {step.text}
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto mb-8">
          <div className="h-2 bg-white/50 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
        </div>

        {/* Floating Particles */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              animate={{
                y: [0, -20, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Step Indicators */}
        <div className="mt-8 flex justify-center gap-2">
          {loadingSteps.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-gradient-to-r from-blue-500 to-purple-500"
                  : "w-2 bg-gray-300"
              }`}
              animate={{
                scale: index === currentStep ? 1.2 : 1,
              }}
            />
          ))}
        </div>

        {/* Encouraging Message */}
        <motion.p
          className="mt-8 text-gray-600 text-sm md:text-base"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          This will only take a moment...
        </motion.p>
      </div>

      {/* Sparkle Effects */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        >
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </motion.div>
      ))}
    </div>
  );
}
