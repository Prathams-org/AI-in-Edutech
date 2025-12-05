"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Clock, Calendar, Trophy, CheckCircle2, AlertTriangle } from "lucide-react";
import WalkingAnimation from "@/components/ui/GlassLoadingAnimation";
import TestResultDialog from "./TestResultDialog";

interface Test {
  id: string;
  title: string;
  subjects: string[];
  chapters: string[];
  topics: string[];
  timePerQuestion: number;
  deadline: string;
  createdAt: any;
  questions: any[];
  classroomSlug: string;
  classroomName: string;
}

interface Classroom {
  slug: string;
  name: string;
}

export default function TestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [attemptedTests, setAttemptedTests] = useState<Set<string>>(new Set());
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedTestForResult, setSelectedTestForResult] = useState<Test | null>(null);

  useEffect(() => {
    loadClassrooms();
  }, [user]);

  useEffect(() => {
    if (selectedClassroom) {
      loadTests(selectedClassroom);
      loadAttemptedTests(selectedClassroom);
    } else {
      setTests([]);
    }
  }, [selectedClassroom]);

  const loadClassrooms = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const studentDoc = await getDoc(doc(db, "students", user.uid));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        // Use joined classrooms only, as in Classroom.tsx
        const joinedClassrooms = (data.classrooms || []).filter((c: any) => c.status === "joined");
        // Fetch classroom details
        const classroomPromises = joinedClassrooms.map(async (c: any) => {
          const classroomDoc = await getDoc(doc(db, "classrooms", c.slug));
          if (classroomDoc.exists()) {
            return {
              slug: c.slug,
              name: classroomDoc.data().name
            };
          }
          return null;
        });
        const classroomData = (await Promise.all(classroomPromises)).filter(c => c !== null) as Classroom[];
        setClassrooms(classroomData);
        // Auto-select first classroom
        if (classroomData.length > 0) {
          setSelectedClassroom(classroomData[0].slug);
        }
      }
    } catch (error) {
      console.error("Error loading classrooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async (classroomSlug: string) => {
    try {
      setLoading(true);
      const testsRef = collection(db, "classrooms", classroomSlug, "tests");
      const testsSnapshot = await getDocs(testsRef);
      const testsData = testsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        classroomSlug,
        classroomName: classrooms.find(c => c.slug === classroomSlug)?.name || ""
      })) as Test[];
      
      // Sort by deadline
      testsData.sort((a, b) => {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
      
      setTests(testsData);
    } catch (error) {
      console.error("Error loading tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttemptedTests = async (classroomSlug: string) => {
    if (!user) return;
    
    try {
      const studentDoc = await getDoc(doc(db, "students", user.uid));
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        const testAttempts = data.testAttempts || {};
        const attempted = new Set(Object.keys(testAttempts[classroomSlug] || {}));
        setAttemptedTests(attempted);
      }
    } catch (error) {
      console.error("Error loading attempted tests:", error);
    }
  };

  const handleTestClick = (test: Test) => {
    const hasAttempted = attemptedTests.has(test.id);
    
    if (hasAttempted) {
      // Show result dialog
      setSelectedTestForResult(test);
      setShowResultDialog(true);
    } else {
      // Show disclaimer dialog
      setSelectedTest(test);
      setShowDisclaimer(true);
    }
  };

  const handleStartTest = () => {
    if (selectedTest) {
      setShowDisclaimer(false);
      router.push(`/student/test/${selectedTest.classroomSlug}/${selectedTest.id}`);
    }
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WalkingAnimation />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tests</h1>
          <p className="text-gray-600 mt-1">Take tests and view your results</p>
        </div>
      </div>

      {/* Classroom Selector */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Classroom
        </label>
        <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Choose a classroom" />
          </SelectTrigger>
          <SelectContent>
            {classrooms.map((classroom) => (
              <SelectItem key={classroom.slug} value={classroom.slug}>
                {classroom.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tests Grid */}
      {!selectedClassroom ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a classroom</h3>
          <p className="text-gray-600">Choose a classroom to view available tests</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tests available</h3>
          <p className="text-gray-600">Your teacher hasn't created any tests yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => {
            const hasAttempted = attemptedTests.has(test.id);
            const overdue = isOverdue(test.deadline);
            
            return (
              <div
                key={test.id}
                onClick={() => handleTestClick(test)}
                className={`bg-white rounded-lg shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
                  hasAttempted
                    ? "border-green-500 hover:border-green-600"
                    : overdue
                    ? "border-red-300 opacity-70"
                    : "border-blue-200 hover:border-blue-400"
                }`}
              >
                {/* Status Badge */}
                {hasAttempted && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </div>
                )}
                {overdue && !hasAttempted && (
                  <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    Overdue
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                  {test.title}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{test.questions?.length || 0} questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{test.timePerQuestion}s per question</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(test.deadline).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {test.subjects.slice(0, 2).map((subject, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {subject}
                    </span>
                  ))}
                  {test.subjects.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{test.subjects.length - 2} more
                    </span>
                  )}
                </div>

                <Button
                  className={`w-full ${
                    hasAttempted
                      ? "bg-green-600 hover:bg-green-700"
                      : overdue
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestClick(test);
                  }}
                >
                  {hasAttempted ? "View Results" : overdue ? "Deadline Passed" : "Start Test"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer Dialog */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Test Instructions</DialogTitle>
            <DialogDescription>Please read carefully before starting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Important Information</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>You will have <strong>{selectedTest?.timePerQuestion} seconds</strong> to answer each question</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Total questions: <strong>{selectedTest?.questions?.length || 0}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>You can only attempt this test <strong>once</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>The timer will start as soon as you begin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Make sure you have a stable internet connection</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDisclaimer(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartTest}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Start Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      {selectedTestForResult && (
        <TestResultDialog
          open={showResultDialog}
          onOpenChange={setShowResultDialog}
          test={selectedTestForResult}
          classroomSlug={selectedTestForResult.classroomSlug}
        />
      )}
    </div>
  );
}
