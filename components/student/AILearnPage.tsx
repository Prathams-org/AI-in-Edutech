"use client";

import React, { useState, useEffect } from "react";
import { Brain, Zap, CheckCircle, Clock, Trophy, Play, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ChatMetadata {
  chatId: string;
  title: string;
  testsCompleted: number;
  mode: "user-topic" | "student-content" | "teacher-content";
  subjects?: string[];
  chapters?: string[];
  progress: number;
  timeGiven: number;
  createdAt: number;
}

export default function AILearnPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<string>("all");

  useEffect(() => {
    loadChats();
  }, [user]);

  const loadChats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const studentRef = doc(db, "students", user.uid);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        const chatList = data.chats || [];
        // Sort by most recent first
        chatList.sort((a: ChatMetadata, b: ChatMetadata) => b.createdAt - a.createdAt);
        setChats(chatList);
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (progress: number): "completed" | "in_progress" | "not_started" => {
    if (progress === 100) return "completed";
    if (progress > 0) return "in_progress";
    return "not_started";
  };

  const getModeLabel = (mode: string): string => {
    switch (mode) {
      case "user-topic": return "AI Generated";
      case "student-content": return "My Content";
      case "teacher-content": return "Teacher Content";
      default: return "Unknown";
    }
  };

  const modes = ["all", "user-topic", "student-content", "teacher-content"];

  const filteredChats = chats.filter(
    (chat) => selectedMode === "all" || chat.mode === selectedMode
  );

  const stats = {
    completed: chats.filter((c) => getStatus(c.progress) === "completed").length,
    inProgress: chats.filter((c) => getStatus(c.progress) === "in_progress").length,
    totalTime: chats.reduce((sum, c) => sum + c.timeGiven, 0),
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/student/chat/${chatId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 text-sm font-semibold">Completed</p>
                <p className="text-4xl font-bold text-green-600 mt-1">{stats.completed}</p>
                <p className="text-xs text-green-600 mt-1">Learning sessions</p>
              </div>
              <CheckCircle className="w-14 h-14 text-green-500 opacity-30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 text-sm font-semibold">In Progress</p>
                <p className="text-4xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
                <p className="text-xs text-blue-600 mt-1">Active sessions</p>
              </div>
              <Zap className="w-14 h-14 text-blue-500 opacity-30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-800 text-sm font-semibold">Total Time</p>
                <p className="text-4xl font-bold text-purple-600 mt-1">{stats.totalTime}</p>
                <p className="text-xs text-purple-600 mt-1">Minutes learned</p>
              </div>
              <Clock className="w-14 h-14 text-purple-500 opacity-30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-800 text-sm font-semibold">Total Sessions</p>
                <p className="text-4xl font-bold text-orange-600 mt-1">{chats.length}</p>
                <p className="text-xs text-orange-600 mt-1">All workspaces</p>
              </div>
              <Trophy className="w-14 h-14 text-orange-500 opacity-30" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {modes.map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedMode === mode
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {mode === "all" && "All Sessions"}
                {mode === "user-topic" && "AI Generated"}
                {mode === "student-content" && "My Content"}
                {mode === "teacher-content" && "Teacher Content"}
              </button>
            ))}
          </div>
        </div>

        {/* Chats */}
        <div className="space-y-4">
          {filteredChats.map((chat) => {
            const status = getStatus(chat.progress);
            const createdDate = new Date(chat.createdAt).toLocaleDateString();
            
            return (
              <div
                key={chat.chatId}
                onClick={() => handleChatClick(chat.chatId)}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 cursor-pointer hover:scale-[1.01]"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{chat.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            {getModeLabel(chat.mode)}
                          </span>
                          {chat.subjects && chat.subjects.length > 0 && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                              {chat.subjects.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {chat.chapters && chat.chapters.length > 0 && (
                      <p className="text-gray-600 text-sm mb-4">
                        Chapters: {chat.chapters.join(", ")}
                      </p>
                    )}

                    {/* Progress Bar */}
                    {chat.progress > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-gray-600">Progress</span>
                          <span className="text-xs font-bold text-gray-700">{chat.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                            style={{ width: `${chat.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {chat.timeGiven > 0 ? `${chat.timeGiven} min learned` : "Not started"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {createdDate}
                      </div>
                      {chat.testsCompleted > 0 && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Trophy className="w-4 h-4" />
                          {chat.testsCompleted} test{chat.testsCompleted > 1 ? 's' : ''} completed
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Section - Button */}
                  <div className="flex items-center">
                    <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-semibold h-fit">
                      <Play className="w-4 h-4" />
                      {status === "completed"
                        ? "Review"
                        : status === "in_progress"
                        ? "Continue"
                        : "Continue"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredChats.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Learning Sessions Found</h2>
            <p className="text-gray-600">
              {chats.length === 0 
                ? "Create your first learning session in the Study Hub" 
                : "Try selecting a different filter"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
