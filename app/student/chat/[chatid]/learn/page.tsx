"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { doc, getDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DesktopLearnMode from "@/components/student/learn/DesktopLearnMode";
import MobileLearnMode from "@/components/student/learn/MobileLearnMode";
import LoadingScreen from "@/components/student/learn/LoadingScreen";

export default function LearnModePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const chatId = params.chatid as string;
  
  const [loading, setLoading] = useState(true);
  const [chatData, setChatData] = useState<any>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [generatingContent, setGeneratingContent] = useState(false);

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
        
        // Check if learning content already exists
        if (data.learningContent) {
          // Load from cache
          setFlashcards(data.learningContent.flashcards || []);
        } else {
          // Generate all content at once
          await generateAllLearningContent(data, chatRef);
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

  const generateAllLearningContent = async (chatData: any, chatRef: any) => {
    setGeneratingContent(true);
    
    try {
      // Prepare content context
      let contentContext = "";
      if (chatData.mode === "user-topic") {
        contentContext = `Topic: ${chatData.topicName}`;
      } else if (chatData.topics && chatData.topics.length > 0) {
        contentContext = chatData.topics
          .map((t: any) => `Topic: ${t.topic}\nSubject: ${t.subject || ""}\nChapter: ${t.chapter || ""}\nContent: ${t.content}`)
          .join("\n\n");
      }

      // Single API call to generate all content
      const response = await fetch("/api/generate-all-learning-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contentContext,
          chatData: {
            mode: chatData.mode,
            topicName: chatData.topicName,
            source: chatData.source
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate content: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Save everything to database
      const learningContent = {
        flashcards: result.flashcards || [],
        summary: result.summary || null,
        testData: result.testData || null,
        generatedAt: Date.now()
      };

      await updateDoc(chatRef, {
        learningContent,
        lastUpdated: Date.now()
      });

      setFlashcards(learningContent.flashcards);
    } catch (error) {
      console.error("Error generating learning content:", error);
      alert("Failed to generate learning content. Please try again.");
      router.push(`/student/chat/${chatId}`);
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleFlashcardsGenerated = async (generatedCards: any[]) => {
    setFlashcards(generatedCards);
  };

  const handleProgressUpdate = async (cardIndex: number, timeSpent: number) => {
    if (!user || !chatId) return;
    
    try {
      const chatRef = doc(db, "students", user.uid, "chats", chatId);
      const studentRef = doc(db, "students", user.uid);
      
      const progress = Math.round(((cardIndex + 1) / flashcards.length) * 100);
      
      await updateDoc(chatRef, {
        progress,
        timeGiven: increment(timeSpent),
        lastViewedCard: cardIndex,
        analytics: arrayUnion({
          cardIndex,
          timestamp: Date.now(),
          timeSpent
        })
      });
      
      // Update student's chats array
      const studentDoc = await getDoc(studentRef);
      if (studentDoc.exists()) {
        const chats = studentDoc.data().chats || [];
        const chatIndex = chats.findIndex((c: any) => c.chatId === chatId);
        if (chatIndex !== -1) {
          chats[chatIndex].progress = progress;
          chats[chatIndex].timeGiven = (chats[chatIndex].timeGiven || 0) + timeSpent;
          await updateDoc(studentRef, { chats });
        }
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  if (loading || generatingContent) {
    return <LoadingScreen />;
  }

  if (!chatData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Chat not found</p>
          <button 
            onClick={() => router.push("/student")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <MobileLearnMode
          chatId={chatId}
          chatData={chatData}
          flashcards={flashcards}
          onFlashcardsGenerated={handleFlashcardsGenerated}
          onProgressUpdate={handleProgressUpdate}
        />
      ) : (
        <DesktopLearnMode
          chatId={chatId}
          chatData={chatData}
          flashcards={flashcards}
          onFlashcardsGenerated={handleFlashcardsGenerated}
          onProgressUpdate={handleProgressUpdate}
        />
      )}
    </>
  );
}
