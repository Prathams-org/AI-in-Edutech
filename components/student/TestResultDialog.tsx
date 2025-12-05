"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";
import WalkingAnimation from "@/components/ui/GlassLoadingAnimation";

interface Test {
  id: string;
  title: string;
  questions: any[];
  timePerQuestion: number;
}

interface StudentAttempt {
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  responses: {
    questionIndex: number;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
  }[];
  submittedAt: any;
}

interface TestResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: Test;
  classroomSlug: string;
}

export default function TestResultDialog({ open, onOpenChange, test, classroomSlug }: TestResultDialogProps) {
  const { user } = useAuth();
  const [myAttempt, setMyAttempt] = useState<StudentAttempt | null>(null);
  const [leaderboard, setLeaderboard] = useState<StudentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(0);

  useEffect(() => {
    if (open) {
      loadResults();
    }
  }, [open, test.id]);

  const loadResults = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load my attempt
      const myAttemptDoc = await getDoc(
        doc(db, "classrooms", classroomSlug, "tests", test.id, "attempts", user.uid)
      );
      
      if (myAttemptDoc.exists()) {
        setMyAttempt({
          ...myAttemptDoc.data()
        } as StudentAttempt);
      }

      // Load all attempts for leaderboard
      const attemptsRef = collection(db, "classrooms", classroomSlug, "tests", test.id, "attempts");
      const attemptsSnapshot = await getDocs(attemptsRef);
      const attemptsData = attemptsSnapshot.docs.map(doc => ({
        ...doc.data()
      })) as StudentAttempt[];

      // Sort by score (descending), then by time (ascending)
      attemptsData.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.timeTaken - b.timeTaken;
      });

      setLeaderboard(attemptsData);

      // Find my rank
      const rank = attemptsData.findIndex(a => a.studentId === user.uid) + 1;
      setMyRank(rank);
    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (score: number, total: number) => {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center min-h-[400px]">
            <WalkingAnimation />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!myAttempt) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>No Results Found</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">You haven't attempted this test yet.</p>
        </DialogContent>
      </Dialog>
    );
  }

  const percentage = getPercentage(myAttempt.score, myAttempt.totalQuestions);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{test.title} - Results</DialogTitle>
        </DialogHeader>

        {/* Score Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {myAttempt.score}/{myAttempt.totalQuestions}
            </div>
            <div className="text-2xl font-semibold text-gray-700">{percentage}%</div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600 text-sm mb-1">
                <Trophy className="w-4 h-4" />
                Rank
              </div>
              <div className="text-xl font-bold text-gray-900">#{myRank}</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Time Taken
              </div>
              <div className="text-xl font-bold text-gray-900">{myAttempt.timeTaken}s</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Performance
              </div>
              <div className={`text-xl font-bold ${
                percentage >= 80 ? "text-green-600" :
                percentage >= 60 ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {percentage >= 80 ? "Excellent" :
                 percentage >= 60 ? "Good" :
                 "Needs Work"}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance">My Performance</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-3 mt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Question-wise Performance</h3>
            {myAttempt.responses.map((response, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                  response.isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  response.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {response.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Question {idx + 1}</div>
                  <div className="text-sm text-gray-600">
                    Time: {response.timeSpent}s {response.isCorrect ? "• Correct" : "• Incorrect"}
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  response.isCorrect ? "text-green-600" : "text-red-600"
                }`}>
                  {response.isCorrect ? "+1" : "0"}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-2 mt-4">
            {leaderboard.map((attempt, index) => {
              const isMe = attempt.studentId === user?.uid;
              return (
                <div
                  key={attempt.studentId}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                    isMe
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${isMe ? 'text-blue-900' : 'text-gray-900'}`}>
                      {attempt.studentName} {isMe && "(You)"}
                    </div>
                    <div className="text-sm text-gray-600">
                      Time: {attempt.timeTaken}s
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {attempt.score}/{attempt.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getPercentage(attempt.score, attempt.totalQuestions)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
