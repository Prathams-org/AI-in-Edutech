"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, FileText, Loader2, Sparkles, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SummaryModePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const chatId = params.chatid as string;
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [chatData, setChatData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

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
        const data = chatDoc.data();
        setChatData(data);
        
        // Check if summary exists in learningContent cache first
        if (data.learningContent?.summary) {
          setSummary(data.learningContent.summary);
        } else if (data.summary) {
          // Fallback to old summary field
          setSummary(data.summary);
        } else {
          // No summary available - redirect to learn mode to generate all content
          alert("Learning content not generated yet. Redirecting to learn mode...");
          router.push(`/student/chat/${chatId}/learn`);
        }
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push(`/student/chat/${chatId}`)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-green-600" />
                  Summary Mode
                </h1>
                <p className="text-sm text-gray-600">Quick overview and key concepts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {summary ? (
          <div className="space-y-6">
            {/* Key Points */}
            {summary.keyPoints && summary.keyPoints.length > 0 && (
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Sparkles className="w-5 h-5" />
                    Key Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {summary.keyPoints.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <p className="text-gray-700 flex-1">{point}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Definitions */}
            {summary.definitions && summary.definitions.length > 0 && (
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <BookOpen className="w-5 h-5" />
                    Important Definitions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary.definitions.map((def: any, idx: number) => (
                      <div key={idx} className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-bold text-purple-900 mb-2">{def.term}</h4>
                        <p className="text-gray-700">{def.definition}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Important Concepts */}
            {summary.concepts && summary.concepts.length > 0 && (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Lightbulb className="w-5 h-5" />
                    Core Concepts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.concepts.map((concept: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2" />
                        <p className="text-gray-700 flex-1">{concept}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No summary available</p>
          </div>
        )}
      </div>
    </div>
  );
}
