"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertCircle } from "lucide-react";
import WalkingAnimation from "@/components/ui/WalkingAnimation";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: string;
  topic?: string;
}

interface Test {
  id: string;
  title: string;
  questions: Question[];
  timePerQuestion: number;
  deadline: string;
}

export default function TakeTestPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const classroomSlug = params.classroomSlug as string;
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTest();
  }, [classroomSlug, testId]);

  useEffect(() => {
    if (test && test.timePerQuestion > 0) {
      setTimeLeft(test.timePerQuestion);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, test]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && test) {
      // Auto-submit when time runs out
      handleNext();
    }
  }, [timeLeft, test]);

  const loadTest = async () => {
    try {
      setLoading(true);
      
      // Check if student already attempted this test
      if (user) {
        const studentDoc = await getDoc(doc(db, "students", user.uid));
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          const testAttempts = data.testAttempts || {};
          if (testAttempts[classroomSlug]?.[testId]) {
            // Already attempted
            router.push("/student");
            return;
          }
        }
      }

      // Load test
      const testDoc = await getDoc(doc(db, "classrooms", classroomSlug, "tests", testId));
      if (testDoc.exists()) {
        const testData = {
          id: testDoc.id,
          ...testDoc.data()
        } as Test;
        
        // Check deadline
        if (new Date(testData.deadline) < new Date()) {
          alert("This test deadline has passed");
          router.push("/student");
          return;
        }
        
        setTest(testData);
      } else {
        alert("Test not found");
        router.push("/student");
      }
    } catch (error) {
      console.error("Error loading test:", error);
      alert("Failed to load test");
      router.push("/student");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!test) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const currentQuestion = test.questions[currentQuestionIndex];
    
    // Record response
    const response = {
      questionIndex: currentQuestionIndex,
      selectedAnswer: selectedAnswer,
      isCorrect: selectedAnswer === currentQuestion.correctAnswer,
      timeSpent: timeSpent
    };
    
    const newResponses = [...responses, response];
    setResponses(newResponses);

    // Move to next question or submit
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Submit test
      submitTest(newResponses);
    }
  };

  const submitTest = async (finalResponses: any[]) => {
    if (!user || !test) return;

    try {
      setSubmitting(true);

      // Calculate score
      const score = finalResponses.filter(r => r.isCorrect).length;
      const totalTime = finalResponses.reduce((sum, r) => sum + r.timeSpent, 0);

      // Get student name
      const studentDoc = await getDoc(doc(db, "students", user.uid));
      const studentName = studentDoc.exists() ? studentDoc.data().name : "Unknown";

      // Save attempt to test collection
      const attemptRef = doc(db, "classrooms", classroomSlug, "tests", testId, "attempts", user.uid);
      await setDoc(attemptRef, {
        studentId: user.uid,
        studentName,
        score,
        totalQuestions: test.questions.length,
        timeTaken: totalTime,
        responses: finalResponses,
        submittedAt: serverTimestamp()
      });

      // Update test attempts count
      const testRef = doc(db, "classrooms", classroomSlug, "tests", testId);
      await updateDoc(testRef, {
        attempts: increment(1)
      });

      // Update student document
      const studentRef = doc(db, "students", user.uid);
      await updateDoc(studentRef, {
        [`testAttempts.${classroomSlug}.${testId}`]: {
          score,
          totalQuestions: test.questions.length,
          percentage: Math.round((score / test.questions.length) * 100),
          submittedAt: serverTimestamp()
        }
      });

      // Redirect to student dashboard
      router.push("/student?tab=tests");
    } catch (error) {
      console.error("Error submitting test:", error);
      alert("Failed to submit test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <WalkingAnimation />
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <WalkingAnimation />
          <p className="mt-4 text-lg text-gray-700">Submitting your test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return null;
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {test.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${timeLeft <= 5 ? "text-red-600" : "text-blue-600"}`} />
              <span className={`text-2xl font-bold ${timeLeft <= 5 ? "text-red-600" : "text-gray-900"}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                {currentQuestionIndex + 1}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 flex-1">
                {currentQuestion.question}
              </h2>
            </div>

            {timeLeft <= 5 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700 font-medium">Time is running out!</span>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === index
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedAnswer === index && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end mt-8">
            <Button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentQuestionIndex < test.questions.length - 1 ? "Next Question" : "Submit Test"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
