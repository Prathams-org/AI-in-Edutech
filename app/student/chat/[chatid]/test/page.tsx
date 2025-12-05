"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, CheckCircle2, Loader2, Trophy, Clock, AlertCircle, TrendingUp, Target, Brain, Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingScreen from "@/components/student/learn/LoadingScreen";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

interface TestAttempt {
  attemptNumber: number;
  score: number;
  timestamp: number;
  answers: any[];
  analysis: any;
  timeTaken: number;
}

export default function TestModePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const chatId = params.chatid as string;
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [chatData, setChatData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [questionTimer, setQuestionTimer] = useState(10);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showResult, setShowResult] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [testAnalysis, setTestAnalysis] = useState<any>(null);
  const [testHistory, setTestHistory] = useState<TestAttempt[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [testStartTime, setTestStartTime] = useState(0);

  useEffect(() => {
    loadChatData();
  }, [chatId, user]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testStarted && !showResult && !analyzing) {
      interval = setInterval(() => {
        setQuestionTimer((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted, currentQuestionIndex, showResult, analyzing]);

  useEffect(() => {
    if (testStarted && !showResult) {
      setQuestionStartTime(Date.now());
      setQuestionTimer(10);
    }
  }, [currentQuestionIndex]);

  const loadChatData = async () => {
    if (!user || !chatId) return;
    
    try {
      setLoading(true);
      const chatRef = doc(db, "students", user.uid, "chats", chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        setChatData(data);
        
        // Load test history
        if (data.testHistory && data.testHistory.length > 0) {
          setTestHistory(data.testHistory);
          setShowResult(true);
          setTestAnalysis(data.testHistory[data.testHistory.length - 1].analysis);
        }
        
        // Load existing questions or fetch new ones
        if (data.testQuestions && data.testQuestions.length > 0) {
          setQuestions(data.testQuestions);
        } else {
          await generateTestQuestions(data);
        }
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateTestQuestions = async (chatData: any) => {
    setGenerating(true);
    try {
      // Prepare context from flashcards
      const contentContext = chatData.learningContent?.flashcards
        ?.map((f: any) => `Title: ${f.title}\nContent: ${f.content}\nKey Points: ${f.keyPoints?.join(", ") || ""}`)
        .join("\n\n") || "";

      if (!contentContext) {
        alert("No learning content found. Please complete the learning mode first.");
        router.push(`/student/chat/${chatId}/learn`);
        return;
      }

      const response = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentContext })
      });

      if (!response.ok) throw new Error("Failed to generate test");

      const data = await response.json();
      const generatedQuestions = data.questions || [];
      
      setQuestions(generatedQuestions);
      
      // Save questions to database
      const chatRef = doc(db, "students", user!.uid, "chats", chatId);
      await updateDoc(chatRef, {
        testQuestions: generatedQuestions,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error("Error generating test:", error);
      alert("Failed to generate test questions");
    } finally {
      setGenerating(false);
    }
  };

  const handleStartTest = () => {
    setShowDisclaimer(true);
  };

  const handleConfirmStart = () => {
    setShowDisclaimer(false);
    setTestStarted(true);
    setTestStartTime(Date.now());
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setQuestionTimer(10);
    setShowResult(false);
  };

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswer(option);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) return;
    
    const responseTime = 10 - questionTimer;
    recordAnswer(selectedAnswer, responseTime);
  };

  const handleTimeout = () => {
    recordAnswer(null, 10); // Max time
  };

  const recordAnswer = (answer: string | null, responseTime: number) => {
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = answer === currentQ.correctAnswer;
    
    const answerData = {
      questionId: currentQ.id,
      question: currentQ.question,
      selectedAnswer: answer,
      correctAnswer: currentQ.correctAnswer,
      isCorrect,
      responseTime,
      difficulty: currentQ.difficulty,
      timestamp: Date.now()
    };
    
    const updatedAnswers = [...answers, answerData];
    setAnswers(updatedAnswers);
    setSelectedAnswer(null);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishTest(updatedAnswers);
    }
  };

  const finishTest = async (finalAnswers: any[]) => {
    setAnalyzing(true);
    
    try {
      const totalTimeTaken = Math.floor((Date.now() - testStartTime) / 1000);
      
      // Analyze with AI
      const analysisResponse = await fetch("/api/analyze-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: finalAnswers,
          questions: questions
        })
      });

      if (!analysisResponse.ok) throw new Error("Failed to analyze test");

      const analysis = await analysisResponse.json();
      setTestAnalysis(analysis);
      
      // Calculate score
      const correctCount = finalAnswers.filter(a => a.isCorrect).length;
      const score = Math.round((correctCount / questions.length) * 100);
      
      // Create test attempt record
      const attempt: TestAttempt = {
        attemptNumber: testHistory.length + 1,
        score,
        timestamp: Date.now(),
        answers: finalAnswers,
        analysis,
        timeTaken: totalTimeTaken
      };
      
      const updatedHistory = [...testHistory, attempt];
      setTestHistory(updatedHistory);
      
      // Save to database
      const chatRef = doc(db, "students", user!.uid, "chats", chatId);
      await updateDoc(chatRef, {
        testHistory: updatedHistory,
        lastTestScore: score,
        lastTestDate: Date.now()
      });
      
      // If teacher synced, save to classroom
      if (chatData.teacherSync && chatData.teacherClassroomSlug) {
        try {
          const classroomRef = doc(db, "teachers", chatData.teacherId, "classrooms", chatData.teacherClassroomSlug);
          const classroomDoc = await getDoc(classroomRef);
          
          if (classroomDoc.exists()) {
            const studentTestData = {
              studentId: user!.uid,
              chatId,
              score,
              timestamp: Date.now(),
              analysis: analysis
            };
            
            await updateDoc(classroomRef, {
              [`studentTestResults.${user!.uid}`]: arrayUnion(studentTestData)
            });
          }
        } catch (error) {
          console.error("Error saving to classroom:", error);
        }
      }
      
      setShowResult(true);
    } catch (error) {
      console.error("Error finishing test:", error);
      alert("Failed to complete test analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRetakeTest = async () => {
    setGenerating(true);
    await generateTestQuestions(chatData);
    setGenerating(false);
    setShowResult(false);
    setTestAnalysis(null);
    handleStartTest();
  };

  if (loading || generating) {
    return <LoadingScreen />;
  }

  if (analyzing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Analyzing Your Performance...</h2>
        <p className="text-gray-500">AI is reviewing your answers and response times</p>
      </div>
    );
  }

  if (showDisclaimer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              Test Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">📝 Test Format</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• {questions.length} Multiple Choice Questions</li>
                  <li>• Mixed difficulty (Easy, Medium, Hard)</li>
                  <li>• Questions appear in random order</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-bold text-orange-900 mb-2">⏱️ Timing Rules</h3>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• 10 seconds per question</li>
                  <li>• Auto-advances when time expires</li>
                  <li>• You can answer before timer ends</li>
                  <li>• Response time is recorded for analysis</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-bold text-purple-900 mb-2">🎯 After Completion</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• AI analyzes your performance</li>
                  <li>• Get personalized feedback</li>
                  <li>• View strong & weak areas</li>
                  <li>• Track progress over attempts</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push(`/student/chat/${chatId}`)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleConfirmStart}
              >
                Start Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResult && testAnalysis) {
    const latestAttempt = testHistory[testHistory.length - 1];
    const showGraph = testHistory.length > 1;
    
    const chartData = testHistory.map(attempt => ({
      attempt: `Attempt ${attempt.attemptNumber}`,
      score: attempt.score
    }));
    
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/student#aipage")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="font-semibold text-gray-800">Test Results</h1>
            <div className="w-24" />
          </div>
        </header>

        <main className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Score Card */}
          <Card className="border-t-4 border-t-purple-600">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Test Complete!</h1>
              <p className="text-gray-600 text-lg mb-6">{testAnalysis.pickupLine}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="text-3xl font-bold text-blue-700">{latestAttempt.score}%</div>
                  <div className="text-sm text-blue-600">Your Score</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="text-3xl font-bold text-green-700">{answers.filter(a => a.isCorrect).length}/{questions.length}</div>
                  <div className="text-sm text-green-600">Correct</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl">
                  <div className="text-3xl font-bold text-orange-700">{Math.floor(latestAttempt.timeTaken / 60)}:{(latestAttempt.timeTaken % 60).toString().padStart(2, '0')}</div>
                  <div className="text-sm text-orange-600">Time Taken</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="text-3xl font-bold text-purple-700">{testHistory.length}</div>
                  <div className="text-sm text-purple-600">Attempts</div>
                </div>
              </div>

              {showGraph && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Progress Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="attempt" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <div className="text-left space-y-6">
                <div>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" /> Strong Points
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                    {testAnalysis.strongPoints?.map((p: string, i: number) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" /> Areas to Improve
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                    {testAnalysis.weakPoints?.map((p: string, i: number) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" /> Suggestions
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                    {testAnalysis.suggestions?.map((p: string, i: number) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button 
                  onClick={() => router.push("/student#aipage")}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Dashboard
                </Button>
                <Button 
                  onClick={handleRetakeTest}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Attempt Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (testStarted) {
    const currentQ = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <div className="flex items-center gap-2 text-orange-600 font-bold text-lg">
                <Clock className="w-5 h-5" />
                {questionTimer}s
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full shadow-xl">
            <CardContent className="p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {currentQ.question}
              </h2>

              <div className="space-y-3 mb-6">
                {currentQ.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={selectedAnswer !== null}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedAnswer === option
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm"
                    } ${selectedAnswer !== null ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
                  </button>
                ))}
              </div>

              <Button 
                onClick={handleNextQuestion} 
                disabled={!selectedAnswer}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Test"}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/student/chat/${chatId}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Test Mode</h1>
            <p className="text-sm text-gray-600">Test your knowledge</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <Card className="text-center">
          <CardContent className="py-16">
            <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Test Your Knowledge?</h2>
            <p className="text-gray-600 mb-2">
              {questions.length} questions waiting for you
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Each question has 10 seconds • Mixed difficulty
            </p>
            <Button onClick={handleStartTest} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
              <CheckCircle2 className="w-5 h-5" />
              Start Test
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
