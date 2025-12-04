"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Brain, 
  FileText, 
  CheckCircle2, 
  Loader2,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ChatData {
  mode: "student-content" | "teacher-content" | "user-topic";
  source: "student" | "teacher-import" | "manual";
  topicName?: string;
  topics?: any[];
  teacherSync?: boolean;
  teacherClassroomSlug?: string;
  createdAt: any;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const chatId = params.chatid as string;
  
  const [loading, setLoading] = useState(true);
  const [chatData, setChatData] = useState<ChatData | null>(null);

  useEffect(() => {
    loadChatData();
  }, [chatId, user]);

  const loadChatData = async () => {
    if (!user || !chatId) return;
    
    try {
      setLoading(true);
      const chatRef = doc(db, "students", user.uid, "chats", chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const data = chatDoc.data() as ChatData;
        setChatData(data);
      } else {
        alert("Chat not found");
        router.push("/student");
      }
    } catch (error) {
      console.error("Error loading chat:", error);
      alert("Failed to load chat data");
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (mode: "learn" | "summary" | "test") => {
    router.push(`/student/chat/${chatId}/${mode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Chat not found</p>
          <Button onClick={() => router.push("/student")}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/student")}
                className="hover:bg-white/60"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {chatData.mode === "user-topic" 
                    ? chatData.topicName 
                    : `${chatData.topics?.length || 0} Topics Selected`}
                </h1>
                <p className="text-sm text-gray-600">
                  {chatData.source === "teacher-import" && "📚 Teacher's Content"}
                  {chatData.source === "student" && "📖 My Content"}
                  {chatData.source === "manual" && "✨ AI Generated"}
                </p>
              </div>
            </div>
            
            {chatData.teacherSync && (
              <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                <Sparkles className="w-4 h-4" />
                Synced
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Choose Your Learning Mode
          </h2>
          <p className="text-gray-600 text-lg">
            Select how you want to learn today
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Learn Mode */}
          <Card 
            className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100"
            onClick={() => handleModeSelect("learn")}
          >
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Brain className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Learn Mode</h3>
              <p className="text-gray-600 mb-6">
                Interactive flashcards with AI explanations and visual aids
              </p>
              <ul className="text-sm text-gray-700 space-y-2 text-left mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Slide-based learning</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Ask doubts anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Visual explanations</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                Start Learning
              </Button>
            </CardContent>
          </Card>

          {/* Summary Mode */}
          <Card 
            className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-green-500 bg-gradient-to-br from-green-50 to-green-100"
            onClick={() => handleModeSelect("summary")}
          >
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Summary Mode</h3>
              <p className="text-gray-600 mb-6">
                Quick revision with key points and definitions
              </p>
              <ul className="text-sm text-gray-700 space-y-2 text-left mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Concise key points</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Important definitions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Core concepts</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                View Summary
              </Button>
            </CardContent>
          </Card>

          {/* Test Mode */}
          <Card 
            className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100"
            onClick={() => handleModeSelect("test")}
          >
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Test Mode</h3>
              <p className="text-gray-600 mb-6">
                Challenge yourself with AI-generated questions
              </p>
              <ul className="text-sm text-gray-700 space-y-2 text-left mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Multiple choice questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Instant feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span>Track your progress</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800">
                Take Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
