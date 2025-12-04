"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Sparkles, 
  MessageCircle, 
  FileText, 
  CheckCircle2,
  Loader2,
  X,
  Send,
  BookOpen,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface Flashcard {
  id: number;
  title: string;
  content: string;
  explanation: string;
  imageUrl?: string;
  keyPoints: string[];
}

interface DoubtMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Props {
  chatId: string;
  chatData: any;
  flashcards: Flashcard[];
  onFlashcardsGenerated: (cards: Flashcard[]) => void;
  onProgressUpdate: (cardIndex: number, timeSpent: number) => void;
}

export default function MobileLearnMode({
  chatId,
  chatData,
  flashcards,
  onFlashcardsGenerated,
  onProgressUpdate
}: Props) {
  const router = useRouter();
  const [currentCard, setCurrentCard] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDoubtBox, setShowDoubtBox] = useState(false);
  const [doubtMessages, setDoubtMessages] = useState<DoubtMessage[]>([]);
  const [doubtInput, setDoubtInput] = useState("");
  const [sendingDoubt, setSendingDoubt] = useState(false);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    setCardStartTime(Date.now());
  }, [currentCard]);

  const handleSwipe = () => {
    const minSwipeDistance = 50;
    const distance = touchStart - touchEnd;
    
    if (distance > minSwipeDistance && currentCard < flashcards.length - 1) {
      // Swipe left - next card
      handleNext();
    } else if (distance < -minSwipeDistance && currentCard > 0) {
      // Swipe right - previous card
      handlePrevious();
    }
  };

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      const timeSpent = Math.floor((Date.now() - cardStartTime) / 1000);
      onProgressUpdate(currentCard, timeSpent);
      setCurrentCard(currentCard + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      const timeSpent = Math.floor((Date.now() - cardStartTime) / 1000);
      onProgressUpdate(currentCard, timeSpent);
      setCurrentCard(currentCard - 1);
    }
  };

  const handleAskDoubt = async () => {
    if (!doubtInput.trim() || sendingDoubt) return;

    const userMessage: DoubtMessage = {
      role: "user",
      content: doubtInput,
      timestamp: Date.now()
    };

    setDoubtMessages([...doubtMessages, userMessage]);
    setDoubtInput("");
    setSendingDoubt(true);

    try {
      const response = await fetch("/api/ask-doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          cardIndex: currentCard,
          question: doubtInput,
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
    } catch (error) {
      console.error("Error asking doubt:", error);
      alert("Failed to get answer");
    } finally {
      setSendingDoubt(false);
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <p>No flashcards available</p>
      </div>
    );
  }

  const card = flashcards[currentCard];
  const progress = ((currentCard + 1) / flashcards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-md sticky top-0 z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push(`/student/chat/${chatId}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-sm font-bold text-gray-800">Learn Mode</h1>
              <p className="text-xs text-gray-600">
                {currentCard + 1} / {flashcards.length}
              </p>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content - Swipeable */}
      <div 
        className="px-4 py-4 pb-24"
        onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
        onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
        onTouchEnd={handleSwipe}
      >
        <Card className="shadow-xl border-0 overflow-hidden">
          {card.imageUrl && (
            <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
              <img
                src={card.imageUrl}
                alt={card.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          <CardContent className="p-5">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {card.title}
              </h2>
              <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
            </div>

            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {card.content}
              </p>
            </div>

            {/* Explanation Section */}
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-blue-900">AI Explanation</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{card.explanation}</p>
            </div>

            {/* Key Points */}
            {card.keyPoints && card.keyPoints.length > 0 && (
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-sm text-purple-900">Key Points</h3>
                </div>
                <ul className="space-y-2">
                  {card.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-700 flex-1">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Swipe Hint */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Swipe left/right to navigate
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-lg border-t border-gray-200 p-4 z-20">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Button
            onClick={handlePrevious}
            disabled={currentCard === 0}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => setShowDoubtBox(true)}
            variant="outline"
            size="sm"
            className="flex-1 bg-yellow-50 border-yellow-300"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Ask
          </Button>

          <Button
            onClick={handleNext}
            disabled={currentCard === flashcards.length - 1}
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/student/chat/${chatId}/summary`)}
            className="flex-1"
          >
            <FileText className="w-3 h-3 mr-1" />
            Summary
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/student/chat/${chatId}/test`)}
            className="flex-1"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Test
          </Button>
        </div>
      </div>

      {/* Doubt Chat Box - Full Screen on Mobile */}
      {showDoubtBox && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2 text-white">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-bold">Ask Your Doubt</h3>
            </div>
            <button
              onClick={() => setShowDoubtBox(false)}
              className="text-white hover:bg-white/20 rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {doubtMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Ask any question about this topic</p>
              </div>
            ) : (
              doubtMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {sendingDoubt && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <Textarea
                value={doubtInput}
                onChange={(e) => setDoubtInput(e.target.value)}
                placeholder="Type your question..."
                className="resize-none"
                rows={2}
              />
              <Button
                onClick={handleAskDoubt}
                disabled={!doubtInput.trim() || sendingDoubt}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
