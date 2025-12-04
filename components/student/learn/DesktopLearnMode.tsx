"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  MessageCircle, 
  FileText, 
  CheckCircle2,
  Loader2,
  X,
  Send,
  BookOpen,
  Clock,
  Trophy,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface Flashcard {
  id: number;
  title: string;
  content: string;
  explanation: string;
  keyPoints: string[];
}

interface DoubtMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: "easy" | "medium" | "hard";
}

interface Props {
  chatId: string;
  chatData: any;
  flashcards: Flashcard[];
  onFlashcardsGenerated: (cards: Flashcard[]) => void;
  onProgressUpdate: (cardIndex: number, timeSpent: number) => void;
}

export default function DesktopLearnMode({
  chatId,
  chatData,
  flashcards,
  onFlashcardsGenerated,
  onProgressUpdate
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Learning State
  const [currentCard, setCurrentCard] = useState(0);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [direction, setDirection] = useState(0);
  
  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [doubtMessages, setDoubtMessages] = useState<DoubtMessage[]>([]);
  const [doubtInput, setDoubtInput] = useState("");
  const [sendingDoubt, setSendingDoubt] = useState(false);
  
  // Test State
  const [isTestMode, setIsTestMode] = useState(false);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testAnswers, setTestAnswers] = useState<any[]>([]);
  const [questionTimer, setQuestionTimer] = useState(10);
  const [testAnalysis, setTestAnalysis] = useState<any>(null);
  const [analyzingTest, setAnalyzingTest] = useState(false);
  const [showTestIntro, setShowTestIntro] = useState(false);

  useEffect(() => {
    setCardStartTime(Date.now());
  }, [currentCard]);

  // Timer for Test
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTestMode && !showTestIntro && !testAnalysis && testQuestions.length > 0) {
      interval = setInterval(() => {
        setQuestionTimer((prev) => {
          if (prev <= 1) {
            handleAnswerTimeout();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTestMode, showTestIntro, testAnalysis, currentQuestionIndex, testQuestions]);

  const handleNext = async () => {
    // Record time for current card (max 120s)
    const timeSpent = Math.min(Math.floor((Date.now() - cardStartTime) / 1000), 120);
    onProgressUpdate(currentCard, timeSpent);

    if (currentCard < flashcards.length - 1) {
      setDirection(1);
      setCurrentCard(currentCard + 1);
    } else {
      // Reached the end, suggest test
      setShowTestIntro(true);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setDirection(-1);
      setCurrentCard(currentCard - 1);
    }
  };

  const handleAskDoubt = async () => {
    if (!doubtInput.trim() || sendingDoubt || !user) return;

    const userMessage: DoubtMessage = {
      role: "user",
      content: doubtInput,
      timestamp: Date.now()
    };

    setDoubtMessages([...doubtMessages, userMessage]);
    setDoubtInput("");
    setSendingDoubt(true);

    try {
      // Save to Firestore
      const chatRef = doc(db, "students", user.uid, "chats", chatId);
      await updateDoc(chatRef, {
        doubtHistory: arrayUnion(userMessage)
      });

      const response = await fetch("/api/ask-doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          cardIndex: currentCard,
          question: userMessage.content,
          context: flashcards[currentCard]
        })
      });

      if (!response.ok) throw new Error("Failed to get answer");

      const result = await response.json();
      const assistantMessage: DoubtMessage = {
        role: "assistant",
        content: result.answer,
        timestamp: Date.now()
      };

      setDoubtMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant response
      await updateDoc(chatRef, {
        doubtHistory: arrayUnion(assistantMessage)
      });

    } catch (error) {
      console.error("Error asking doubt:", error);
      alert("Failed to get answer");
    } finally {
      setSendingDoubt(false);
    }
  };

  const startTest = async () => {
    setGeneratingTest(true);
    try {
      // Prepare context for test generation
      const contentContext = flashcards.map(f => 
        `Title: ${f.title}\nContent: ${f.content}\nKey Points: ${f.keyPoints.join(", ")}`
      ).join("\n\n");

      const response = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentContext })
      });

      if (!response.ok) throw new Error("Failed to generate test");

      const data = await response.json();
      setTestQuestions(data.questions || data.testData.questions);
      setIsTestMode(true);
      setShowTestIntro(false);
      setQuestionTimer(10);
    } catch (error) {
      console.error("Error starting test:", error);
      alert("Failed to start test. Please try again.");
    } finally {
      setGeneratingTest(false);
    }
  };

  const handleAnswerTimeout = () => {
    handleAnswer(null); // Null means unanswered/timeout
  };

  const handleAnswer = (selectedOption: string | null) => {
    const currentQ = testQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQ.correctAnswer;
    const timeTaken = 10 - questionTimer;

    const answerData = {
      questionId: currentQ.id,
      question: currentQ.question,
      selectedOption,
      correctAnswer: currentQ.correctAnswer,
      isCorrect,
      timeTaken,
      difficulty: currentQ.difficulty
    };

    setTestAnswers(prev => [...prev, answerData]);

    if (currentQuestionIndex < testQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionTimer(10);
    } else {
      submitTest([...testAnswers, answerData]);
    }
  };

  const submitTest = async (finalAnswers: any[]) => {
    setAnalyzingTest(true);
    try {
      const response = await fetch("/api/analyze-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: finalAnswers,
          questions: testQuestions
        })
      });

      if (!response.ok) throw new Error("Failed to analyze test");

      const analysis = await response.json();
      setTestAnalysis(analysis);

      // Save results
      if (user) {
        const chatRef = doc(db, "students", user.uid, "chats", chatId);
        await updateDoc(chatRef, {
          testResults: {
            answers: finalAnswers,
            analysis,
            timestamp: Date.now()
          }
        });

        // If linked to teacher, save to classroom (logic would go here or via API)
      }

    } catch (error) {
      console.error("Error analyzing test:", error);
      alert("Failed to analyze test results");
    } finally {
      setAnalyzingTest(false);
    }
  };

  if (generatingTest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Generating Your Test...</h2>
        <p className="text-gray-500">Preparing questions based on your learning session</p>
      </div>
    );
  }

  if (isTestMode) {
    if (analyzingTest) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Analyzing Performance...</h2>
          <p className="text-gray-500">AI is reviewing your answers and response times</p>
        </div>
      );
    }

    if (testAnalysis) {
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8 border-t-4 border-t-purple-600">
              <CardContent className="p-8 text-center">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Test Complete!</h1>
                <p className="text-gray-600 text-lg mb-6">{testAnalysis.pickupLine}</p>
                
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-blue-700">{testAnalysis.score}%</div>
                    <div className="text-sm text-blue-600">Score</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-green-700">{testAnalysis.strongPoints?.length || 0}</div>
                    <div className="text-sm text-green-600">Strong Areas</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-red-700">{testAnalysis.weakPoints?.length || 0}</div>
                    <div className="text-sm text-red-600">Areas to Improve</div>
                  </div>
                </div>

                <div className="text-left space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" /> Strong Points
                    </h3>
                    <ul className="list-disc list-inside text-gray-600 ml-2">
                      {testAnalysis.strongPoints?.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" /> Weak Points
                    </h3>
                    <ul className="list-disc list-inside text-gray-600 ml-2">
                      {testAnalysis.weakPoints?.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-600" /> Suggestions
                    </h3>
                    <ul className="list-disc list-inside text-gray-600 ml-2">
                      {testAnalysis.suggestions?.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Button 
                  onClick={() => router.push("/student#aipage")}
                  className="mt-8 bg-blue-600 hover:bg-blue-700"
                >
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="mb-6 flex justify-between items-center">
            <div className="text-sm font-medium text-gray-500">
              Question {currentQuestionIndex + 1} of {testQuestions.length}
            </div>
            <div className="flex items-center gap-2 text-orange-600 font-bold">
              <Clock className="w-5 h-5" />
              {questionTimer}s
            </div>
          </div>

          <Card className="shadow-xl">
            <CardContent className="p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {testQuestions[currentQuestionIndex].question}
              </h2>

              <div className="space-y-3">
                {testQuestions[currentQuestionIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showTestIntro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready for a Challenge?</h2>
          <p className="text-gray-600 mb-6">
            You've completed the learning material. Let's test your knowledge with a quick quiz.
          </p>
          <div className="bg-yellow-50 p-4 rounded-lg text-left mb-6 text-sm text-yellow-800">
            <p className="font-bold mb-1">Disclaimer:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>10 seconds per question</li>
              <li>Questions adapt to your level</li>
              <li>AI analysis after completion</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowTestIntro(false)}
            >
              Review More
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={startTest}
            >
              Start Test
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const card = flashcards[currentCard];
  const progress = ((currentCard + 1) / flashcards.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push("/student#aipage")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="font-semibold text-gray-800 truncate max-w-md">
            {card.title}
          </h1>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {currentCard + 1} / {flashcards.length}
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Content */}
        <div className="space-y-6">
          <Card className="h-full shadow-sm border-gray-200">
            <CardContent className="p-8 h-full overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">{card.title}</h2>
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                  {card.content}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: AI Insights */}
        <div className="space-y-6 flex flex-col">
          <Card className="flex-1 shadow-sm border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-8 h-full overflow-y-auto">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-blue-900 text-lg">AI Explanation</h3>
                </div>
                <p className="text-gray-700 leading-relaxed bg-white/50 p-4 rounded-xl border border-blue-100">
                  {card.explanation}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-purple-900 text-lg">Key Points</h3>
                </div>
                <ul className="space-y-3">
                  {card.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-white/50 p-3 rounded-lg border border-purple-100">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Chat Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {showChat ? (
              <div className="flex flex-col h-96">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> AI Tutor
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowChat(false)}
                    className="h-8 text-xs"
                  >
                    Close Chat
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {doubtMessages.length === 0 && (
                    <div className="text-center text-gray-400 py-8 text-sm">
                      Ask a question about this card...
                    </div>
                  )}
                  {doubtMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {sendingDoubt && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl px-4 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <div className="flex gap-2">
                    <Textarea
                      value={doubtInput}
                      onChange={(e) => setDoubtInput(e.target.value)}
                      placeholder="Ask a doubt..."
                      className="min-h-[40px] h-[40px] resize-none py-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAskDoubt();
                        }
                      }}
                    />
                    <Button 
                      size="icon"
                      onClick={handleAskDoubt}
                      disabled={!doubtInput.trim() || sendingDoubt}
                      className="h-[40px] w-[40px] bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                variant="ghost"
                className="w-full py-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-2"
                onClick={() => setShowChat(true)}
              >
                <MessageCircle className="w-5 h-5" />
                Ask Doubt
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentCard === 0}
            variant="outline"
            className="w-32"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>

          <div className="flex-1 mx-8">
            <Progress value={progress} className="h-2" />
          </div>

          <Button
            onClick={handleNext}
            className="w-32 bg-blue-600 hover:bg-blue-700"
          >
            {currentCard === flashcards.length - 1 ? "Finish" : "Next"} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
