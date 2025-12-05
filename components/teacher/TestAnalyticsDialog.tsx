"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Clock, CheckCircle2, XCircle } from "lucide-react";
import WalkingAnimation from "@/components/ui/GlassLoadingAnimation";

interface Test {
  id: string;
  title: string;
  questions: any[];
  timePerQuestion: number;
}

interface StudentAttempt {
  id: string;
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

interface TestAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: Test;
  classroomSlug: string;
}

export default function TestAnalyticsDialog({ open, onOpenChange, test, classroomSlug }: TestAnalyticsDialogProps) {
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentAttempt | null>(null);

  useEffect(() => {
    if (open) {
      loadAttempts();
    }
  }, [open, test.id]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const attemptsRef = collection(db, "classrooms", classroomSlug, "tests", test.id, "attempts");
      const attemptsSnapshot = await getDocs(attemptsRef);
      const attemptsData = attemptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentAttempt[];

      // Sort by score (descending) for leaderboard
      attemptsData.sort((a, b) => b.score - a.score);
      setAttempts(attemptsData);
    } catch (error) {
      console.error("Error loading attempts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (score: number, total: number) => {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  const getAverageScore = () => {
    if (attempts.length === 0) return 0;
    const total = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    return Math.round((total / attempts.length) * 100) / 100;
  };

  const getAverageTime = () => {
    if (attempts.length === 0) return 0;
    const total = attempts.reduce((sum, attempt) => sum + attempt.timeTaken, 0);
    return Math.round(total / attempts.length);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-white/20">
          <div className="flex items-center justify-center min-h-[400px]">
            <WalkingAnimation />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white/95">{test.title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-cyan-400/20">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-cyan-400/20">
              <Users className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
          </TabsList>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 my-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-300/70 text-sm mb-1">
                <Users className="w-4 h-4" />
                Total Attempts
              </div>
              <div className="text-2xl font-bold text-white/95">{attempts.length}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-300/70 text-sm mb-1">
                <Trophy className="w-4 h-4" />
                Average Score
              </div>
              <div className="text-2xl font-bold text-white/95">
                {getAverageScore()}/{test.questions.length}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-300/70 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Average Time
              </div>
              <div className="text-2xl font-bold text-white/95">{getAverageTime()}s</div>
            </div>
          </div>

          <TabsContent value="leaderboard" className="space-y-2 mt-4">
            {attempts.length === 0 ? (
              <div className="text-center py-12 text-slate-300/70">
                No attempts yet
              </div>
            ) : (
              attempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-300 border-2 border-yellow-500/50' :
                    index === 1 ? 'bg-gray-400/20 text-gray-300 border-2 border-gray-400/50' :
                    index === 2 ? 'bg-orange-600/20 text-orange-300 border-2 border-orange-600/50' :
                    'bg-white/10 text-white/70'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white/90">{attempt.studentName}</div>
                    <div className="text-sm text-slate-300/70">
                      Submitted {new Date(attempt.submittedAt?.toDate?.()).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-300">
                      {attempt.score}/{attempt.totalQuestions}
                    </div>
                    <div className="text-sm text-slate-300/70">
                      {getPercentage(attempt.score, attempt.totalQuestions)}%
                    </div>
                  </div>
                  <div className="text-sm text-slate-300/70">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {attempt.timeTaken}s
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-2 mt-4">
            {attempts.length === 0 ? (
              <div className="text-center py-12 text-slate-300/70">
                No attempts yet
              </div>
            ) : selectedStudent ? (
              <div className="space-y-4">
                <Button
                  onClick={() => setSelectedStudent(null)}
                  variant="outline"
                  className="mb-4 border-white/20 text-white/90"
                >
                  ← Back to Students
                </Button>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white/95 mb-4">
                    {selectedStudent.studentName}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="text-sm text-slate-300/70">Score</div>
                      <div className="text-2xl font-bold text-cyan-300">
                        {selectedStudent.score}/{selectedStudent.totalQuestions}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-300/70">Total Time</div>
                      <div className="text-2xl font-bold text-white/95">
                        {selectedStudent.timeTaken}s
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-white/90">Question-wise Performance</h4>
                    {selectedStudent.responses.map((response, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          response.isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {response.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-white/90">Question {idx + 1}</div>
                          <div className="text-xs text-slate-300/70">
                            Time: {response.timeSpent}s
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  onClick={() => setSelectedStudent(attempt)}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="font-medium text-white/90">{attempt.studentName}</div>
                    <div className="text-sm text-slate-300/70">
                      {attempt.score}/{attempt.totalQuestions} correct
                    </div>
                  </div>
                  <div className="text-cyan-300 text-sm">View Details →</div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
