"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  BookOpen, 
  FileText, 
  Brain, 
  Loader2,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LearningMode = "learn" | "summary" | "test";

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
  const [currentMode, setCurrentMode] = useState<LearningMode>("learn");
  const [isNewWorkspace, setIsNewWorkspace] = useState(false);
  
  // AI Generated content states
  const [generating, setGenerating] = useState(false);
  const [learnContent, setLearnContent] = useState<any>(null);
  const [summaryContent, setSummaryContent] = useState<any>(null);
  const [testContent, setTestContent] = useState<any>(null);

  useEffect(() => {
    // Check if URL has #create_new_workspace flag
    if (window.location.hash === "#create_new_workspace") {
      setIsNewWorkspace(true);
      // Remove hash from URL
      window.history.replaceState(null, "", window.location.pathname);
    }
    
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
        
        // If it's a user-topic mode or new workspace, generate content
        if (data.mode === "user-topic" || isNewWorkspace) {
          generateContentForTopic(data.topicName || "");
        }
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

  const generateContentForTopic = async (topicName: string) => {
    if (!topicName) return;
    
    setGenerating(true);
    try {
      // TODO: Call AI API to generate learning materials
      // For now, we'll set placeholder content
      console.log("Generating content for:", topicName);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLearnContent({
        topic: topicName,
        explanation: "AI-generated explanation will appear here...",
        examples: [],
        flashcards: []
      });
      
      setSummaryContent({
        topic: topicName,
        keyPoints: [],
        definitions: []
      });
      
      setTestContent({
        topic: topicName,
        questions: []
      });
      
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const renderLearnMode = () => {
    if (!chatData) return null;
    
    if (chatData.mode === "user-topic" || isNewWorkspace) {
      if (generating) {
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">AI is generating learning materials...</p>
          </div>
        );
      }
      
      if (!learnContent) {
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">No content generated yet</p>
          </div>
        );
      }
      
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{learnContent.explanation}</p>
            </CardContent>
          </Card>
          
          {/* Add more sections for examples, flashcards, etc. */}
        </div>
      );
    }
    
    // For student-content or teacher-content mode
    if (!chatData.topics || chatData.topics.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">No topics selected</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {chatData.topics.map((topic, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {topic.topic}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {topic.subject} • {topic.chapter}
              </p>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{topic.content}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderSummaryMode = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Quick Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Key Points</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Summary feature coming soon...</li>
                  <li>AI will extract key concepts</li>
                  <li>Important definitions highlighted</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Important Definitions</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-700">Definitions will appear here...</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTestMode = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-orange-600" />
              Practice Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Test Mode</h3>
              <p className="text-gray-600 mb-6">
                Interactive tests with adaptive difficulty
              </p>
              <div className="space-y-2">
                <Button className="w-full max-w-md" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  MCQ Test
                </Button>
                <Button className="w-full max-w-md" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Short Answer Test
                </Button>
                <Button className="w-full max-w-md" variant="outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Long Answer Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/student")}
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
                Results synced to teacher
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={currentMode} onValueChange={(v) => setCurrentMode(v as LearningMode)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="learn" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Learn Mode
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Summary Mode
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Test Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="mt-0">
            {renderLearnMode()}
          </TabsContent>

          <TabsContent value="summary" className="mt-0">
            {renderSummaryMode()}
          </TabsContent>

          <TabsContent value="test" className="mt-0">
            {renderTestMode()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
