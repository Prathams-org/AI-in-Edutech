"use client";

import React, { useState } from "react";
import { Brain, Zap, CheckCircle, Clock, Trophy, Play } from "lucide-react";

interface AILesson {
  id: string;
  title: string;
  subject: string;
  level: string;
  duration: string;
  progress: number;
  aiSummary: string;
  status: "completed" | "in_progress" | "not_started";
  estimatedTime: string;
}

interface AILearnPageProps {
  lessons?: AILesson[];
}

export default function AILearnPage({ lessons }: AILearnPageProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const defaultLessons: AILesson[] = [
    {
      id: "1",
      title: "Introduction to Calculus",
      subject: "Mathematics",
      level: "Intermediate",
      duration: "45 min",
      progress: 75,
      aiSummary: "Learn the fundamentals of calculus with AI-powered personalized explanations",
      status: "in_progress",
      estimatedTime: "12 min remaining",
    },
    {
      id: "2",
      title: "Photosynthesis Deep Dive",
      subject: "Biology",
      level: "Beginner",
      duration: "30 min",
      progress: 100,
      aiSummary: "Master photosynthesis with interactive AI simulations and detailed breakdowns",
      status: "completed",
      estimatedTime: "Completed",
    },
    {
      id: "3",
      title: "World War II: A Historical Analysis",
      subject: "History",
      level: "Advanced",
      duration: "60 min",
      progress: 0,
      aiSummary: "Comprehensive AI-analyzed timeline of WWII with key events and consequences",
      status: "not_started",
      estimatedTime: "60 min to complete",
    },
    {
      id: "4",
      title: "Shakespearean Literature",
      subject: "English",
      level: "Intermediate",
      duration: "50 min",
      progress: 45,
      aiSummary: "Analyze Shakespeare with AI-powered literary analysis and context building",
      status: "in_progress",
      estimatedTime: "28 min remaining",
    },
  ];

  const allLessons = lessons || defaultLessons;
  const levels = ["all", ...new Set(allLessons.map((l) => l.level))];

  const filteredLessons = allLessons.filter(
    (lesson) => selectedLevel === "all" || lesson.level === selectedLevel
  );

  const stats = {
    completed: allLessons.filter((l) => l.status === "completed").length,
    inProgress: allLessons.filter((l) => l.status === "in_progress").length,
    totalTime: allLessons.reduce((sum, l) => {
      const minutes = parseInt(l.duration);
      return sum + minutes;
    }, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">AI Learn Page</h1>
          </div>
          <p className="text-gray-600">Personalized learning with AI-powered insights</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Learning</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalTime} min</p>
              </div>
              <Trophy className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-700 font-semibold mr-4">Difficulty Level:</span>
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                  selectedLevel === level
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Lessons */}
        <div className="space-y-4">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{lesson.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {lesson.subject}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                          {lesson.level}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        lesson.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : lesson.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {lesson.status === "completed"
                        ? "Completed"
                        : lesson.status === "in_progress"
                        ? "In Progress"
                        : "Not Started"}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{lesson.aiSummary}</p>

                  {/* Progress Bar */}
                  {lesson.progress > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-gray-600">Progress</span>
                        <span className="text-xs font-bold text-gray-700">{lesson.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {lesson.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {lesson.estimatedTime}
                    </div>
                  </div>
                </div>

                {/* Right Section - Button */}
                <div className="flex items-center">
                  <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-semibold h-fit">
                    <Play className="w-4 h-4" />
                    {lesson.status === "completed"
                      ? "Review"
                      : lesson.status === "in_progress"
                      ? "Continue"
                      : "Start"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredLessons.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Lessons Found</h2>
            <p className="text-gray-600">Try selecting a different difficulty level</p>
          </div>
        )}
      </div>
    </div>
  );
}
