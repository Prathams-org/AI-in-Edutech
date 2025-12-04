"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, CheckCircle2, Loader2, Trophy, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestModePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const chatId = params.chatid as string;
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [chatData, setChatData] = useState<any>(null);
  const [testData, setTestData] = useState<any>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

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
        
        // Check if test data exists in learningContent cache first
        if (data.learningContent?.testData) {
          setTestData(data.learningContent.testData);
        } else if (data.testData) {
          // Fallback to old testData field
          setTestData(data.testData);
        } else {
          // No test data available - redirect to learn mode to generate all content
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

  const handleStartTest = () => {
    setTestStarted(true);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer) {
      setAnswers([...answers, selectedAnswer]);
      setSelectedAnswer(null);
      
      if (currentQuestion < testData.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        finishTest();
      }
    }
  };

  const finishTest = async () => {
    setShowResult(true);
    
    // Calculate score
    const correctAnswers = answers.filter((ans, idx) => 
      ans === testData.questions[idx].correctAnswer
    ).length;
    
    const score = Math.round((correctAnswers / testData.questions.length) * 100);
    
    // Save results
    if (user && chatId) {
      try {
        const chatRef = doc(db, "students", user.uid, "chats", chatId);
        await updateDoc(chatRef, {
          testResults: {
            score,
            answers,
            completedAt: Date.now()
          },
          testsCompleted: increment(1)
        });
      } catch (error) {
        console.error("Error saving test results:", error);
      }
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
                  <CheckCircle2 className="w-6 h-6 text-orange-600" />
                  Test Mode
                </h1>
                <p className="text-sm text-gray-600">Test your knowledge</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {!testStarted ? (
          <Card className="text-center">
            <CardContent className="py-16">
              <Trophy className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Test Your Knowledge?</h2>
              <p className="text-gray-600 mb-8">
                {testData?.questions?.length || 0} questions waiting for you
              </p>
              <Button onClick={handleStartTest} size="lg" className="gap-2">
                <Play className="w-5 h-5" />
                Start Test
              </Button>
            </CardContent>
          </Card>
        ) : showResult ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Test Complete!</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <p className="text-4xl font-bold text-gray-800 mb-2">
                {Math.round((answers.filter((ans, idx) => ans === testData.questions[idx].correctAnswer).length / testData.questions.length) * 100)}%
              </p>
              <p className="text-gray-600 mb-8">
                {answers.filter((ans, idx) => ans === testData.questions[idx].correctAnswer).length} out of {testData.questions.length} correct
              </p>
              <Button onClick={() => router.push(`/student/chat/${chatId}`)}>
                Back to Chat
              </Button>
            </CardContent>
          </Card>
        ) : testData?.questions && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Question {currentQuestion + 1} of {testData.questions.length}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {currentQuestion + 1}/{testData.questions.length}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestion + 1) / testData.questions.length) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-800 mb-6">
                {testData.questions[currentQuestion].question}
              </p>
              <div className="space-y-3 mb-6">
                {testData.questions[currentQuestion].options.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedAnswer === option
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <Button 
                onClick={handleNextQuestion} 
                disabled={!selectedAnswer}
                className="w-full"
                size="lg"
              >
                {currentQuestion < testData.questions.length - 1 ? "Next Question" : "Finish Test"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
