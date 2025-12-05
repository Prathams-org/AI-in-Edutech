"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, Users, Trophy, Clock, Calendar } from "lucide-react";
import CreateTestForm from "./CreateTestForm";
import TestAnalyticsDialog from "./TestAnalyticsDialog";
import WalkingAnimation from "@/components/ui/GlassLoadingAnimation";

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
  attempts: number;
}

export default function Tests() {
  const params = useParams();
  const classroomSlug = params.slug as string;
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    loadTests();
  }, [classroomSlug]);

  const loadTests = async () => {
    try {
      setLoading(true);
      const testsRef = collection(db, "classrooms", classroomSlug, "tests");
      const testsSnapshot = await getDocs(testsRef);
      const testsData = testsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Test[];
      
      // Sort by creation date, newest first
      testsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setTests(testsData);
    } catch (error) {
      console.error("Error loading tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestClick = (test: Test) => {
    setSelectedTest(test);
    setShowAnalytics(true);
  };

  const handleTestCreated = () => {
    setShowCreateForm(false);
    loadTests(); // Reload tests after creation
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WalkingAnimation />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white/95">Tests</h2>
          <p className="text-slate-300/70 mt-1">Create and manage tests for your classroom</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-cyan-400 to-indigo-400 text-slate-900 hover:shadow-lg hover:shadow-cyan-500/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Tests Grid */}
      {tests.length === 0 ? (
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <FileText className="w-16 h-16 text-slate-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white/90 mb-2">No tests yet</h3>
          <p className="text-slate-300/70 mb-6">Create your first test to get started</p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-cyan-400 to-indigo-400 text-slate-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Test
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => (
            <div
              key={test.id}
              onClick={() => handleTestClick(test)}
              className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-white/10 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white/95 mb-2 line-clamp-2">
                    {test.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-300/70">
                    <FileText className="w-4 h-4" />
                    <span>{test.questions?.length || 0} questions</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-300/80">
                  <Clock className="w-4 h-4" />
                  <span>{test.timePerQuestion}s per question</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300/80">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {new Date(test.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {test.subjects.map((subject, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-cyan-400/20 text-cyan-300 text-xs rounded-full border border-cyan-400/30"
                  >
                    {subject}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm text-slate-300/70">
                  <Users className="w-4 h-4" />
                  <span>{test.attempts || 0} attempts</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-300 text-sm font-medium">
                  View Analytics
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Test Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white/95">Create New Test</DialogTitle>
          </DialogHeader>
          <CreateTestForm
            classroomSlug={classroomSlug}
            onTestCreated={handleTestCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Test Analytics Dialog */}
      {selectedTest && (
        <TestAnalyticsDialog
          open={showAnalytics}
          onOpenChange={setShowAnalytics}
          test={selectedTest}
          classroomSlug={classroomSlug}
        />
      )}
    </div>
  );
}
