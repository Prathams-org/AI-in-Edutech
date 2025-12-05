"use client";

import React, { useState, useEffect } from "react";
import { FileText, Calendar, Clock, AlertCircle, CheckCircle, Eye, Download, Settings, Sparkles, BookOpen, Edit } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState as useReactState } from "react";
import { Input } from "@/components/ui/input";
import LoadingScreen from "./LoadingScreen";
import { useRouter } from "next/navigation";

type ExamTemplate = {
  id: string;
  title: string;
  entries: Array<{
    subject: string;
    date: string;
    time: string;
    syllabus: Array<{
      chapter: string;
      topics: string[];
    }>;
  }>;
};

type TimeAvailability = {
  Monday: { hours: string; mins: string };
  Tuesday: { hours: string; mins: string };
  Wednesday: { hours: string; mins: string };
  Thursday: { hours: string; mins: string };
  Friday: { hours: string; mins: string };
  Saturday: { hours: string; mins: string };
  Sunday: { hours: string; mins: string };
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ExamCorner() {
  const { user } = useAuth();
  const router = useRouter();
  const [examTemplates, setExamTemplates] = useState<ExamTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeAvailability, setTimeAvailability] = useState<TimeAvailability>({
    Monday: { hours: "", mins: "" },
    Tuesday: { hours: "", mins: "" },
    Wednesday: { hours: "", mins: "" },
    Thursday: { hours: "", mins: "" },
    Friday: { hours: "", mins: "" },
    Saturday: { hours: "", mins: "" },
    Sunday: { hours: "", mins: "" },
  });
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogWarning, setDialogWarning] = useState("");
  const [hasSetTime, setHasSetTime] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);

  useEffect(() => {
    if (user) {
      loadExamTemplates();
      loadTimeAvailability();
    }
  }, [user]);

  const loadExamTemplates = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const studentDoc = await getDoc(doc(db, "students", user.uid));
      
      if (!studentDoc.exists()) {
        setLoading(false);
        return;
      }

      const studentData = studentDoc.data();
      const classrooms = studentData.classrooms || [];
      
      // Get all exam templates from joined classrooms
      const allTemplates: ExamTemplate[] = [];
      
      for (const classroom of classrooms) {
        const slug = typeof classroom === "string" ? classroom : classroom.slug;
        const status = typeof classroom === "string" ? "joined" : classroom.status;
        
        if (status === "joined") {
          const classroomDoc = await getDoc(doc(db, "classrooms", slug));
          
          if (classroomDoc.exists()) {
            const classroomData = classroomDoc.data();
            const templates = classroomData.examTemplates || [];
            
            // Add classroom name to each template for reference
            templates.forEach((template: any) => {
              allTemplates.push({
                ...template,
                classroomName: classroomData.name || slug,
              });
            });
          }
        }
      }
      
      // Sort templates by closest exam date
      allTemplates.sort((a, b) => {
        const aDate = a.entries[0]?.date || "9999-12-31";
        const bDate = b.entries[0]?.date || "9999-12-31";
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      });
      
      setExamTemplates(allTemplates);
    } catch (error) {
      console.error("Error loading exam templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeAvailability = async () => {
    if (!user) return;
    
    try {
      const studentDoc = await getDoc(doc(db, "students", user.uid));
      
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        if (data.timeAvailability) {
          // Backward compatibility: if string, convert to {hours, mins}
          const ta = data.timeAvailability;
          const newTA: TimeAvailability = { ...timeAvailability };
          for (const day of DAYS) {
            const val = ta[day];
            if (typeof val === "string") {
              const [h, m] = val.split(":");
              newTA[day as keyof TimeAvailability] = { hours: h || "", mins: m || "" };
            } else if (val && typeof val === "object") {
              newTA[day as keyof TimeAvailability] = { hours: val.hours || "", mins: val.mins || "" };
            } else {
              newTA[day as keyof TimeAvailability] = { hours: "", mins: "" };
            }
          }
          setTimeAvailability(newTA);
          setHasSetTime(true);
        }
      }
    } catch (error) {
      console.error("Error loading time availability:", error);
    }
  };

  const saveTimeAvailability = async () => {
    if (!user) return;
    setDialogLoading(true);
    setDialogWarning("");
    // Validate all days
    for (const day of DAYS) {
      const { hours, mins } = timeAvailability[day as keyof TimeAvailability];
      const h = parseInt(hours || "0");
      if (h > 16) {
        setDialogWarning(`You cannot set more than 16 hours for ${day}. It has been reset to 0.`);
        setTimeAvailability(prev => ({
          ...prev,
          [day]: { hours: "0", mins: "00" },
        }));
        setDialogLoading(false);
        return;
      }
    }
    try {
      await updateDoc(doc(db, "students", user.uid), {
        timeAvailability: timeAvailability,
      });
      setHasSetTime(true);
      setShowTimeDialog(false);
    } catch (error) {
      console.error("Error saving time availability:", error);
      alert("Failed to save time availability");
    } finally {
      setDialogLoading(false);
    }
  };

  const generateTasksForToday = async () => {
    if (!user) return;
    
    // Check if exam templates are loaded
    if (!examTemplates || examTemplates.length === 0) {
      alert("No exam templates found. Please ensure you have joined classrooms with exams scheduled.");
      return;
    }
    
    // Check if time availability is set
    if (!hasSetTime) {
      alert("Please set your time availability first!");
      setShowTimeDialog(true);
      return;
    }
    
    const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const todayTime = timeAvailability[today as keyof TimeAvailability];
    if (!todayTime || (!todayTime.hours && !todayTime.mins)) {
      alert(`You haven't set any study time for ${today}. Please update your time availability.`);
      setShowTimeDialog(true);
      return;
    }
    
    try {
      setGeneratingTasks(true);
      
      const response = await fetch("/api/generate-study-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examTemplates,
          timeAvailability,
          currentDay: today,
          userId: user.uid,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate tasks");
      }
      
      const { tasks } = data;
      
      // Save tasks to student document
      await updateDoc(doc(db, "students", user.uid), {
        todayTasks: tasks,
        lastTaskGeneration: new Date().toISOString(),
      });
      
      // Navigate to tasks page
      router.push("/student#tasks");
      window.location.reload();
    } catch (error: any) {
      console.error("Error generating tasks:", error);
      alert(error.message || "Failed to generate tasks. Please try again.");
    } finally {
      setGeneratingTasks(false);
    }
  };

  const getDaysUntilExam = (examDate: string) => {
    const today = new Date();
    const exam = new Date(examDate);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return "text-gray-500";
    if (daysUntil <= 3) return "text-red-600";
    if (daysUntil <= 7) return "text-orange-600";
    if (daysUntil <= 14) return "text-yellow-600";
    return "text-green-600";
  };

  const getUrgencyBg = (daysUntil: number) => {
    if (daysUntil < 0) return "bg-gray-100";
    if (daysUntil <= 3) return "bg-red-50 border-red-200";
    if (daysUntil <= 7) return "bg-orange-50 border-orange-200";
    if (daysUntil <= 14) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {generatingTasks && <LoadingScreen />}
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Exam Corner</h1>
            <p className="text-gray-600 mt-1">View your upcoming exams and generate study tasks</p>
          </div>
          
          <Button
            onClick={() => setShowTimeDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {hasSetTime ? "Edit" : "Set"} Study Time
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Button
            onClick={generateTasksForToday}
            disabled={!hasSetTime || examTemplates.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="w-5 h-5" />
            Generate Today's Study Tasks
          </Button>
          
          {!hasSetTime && (
            <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              Please set your study time availability first
            </div>
          )}
        </div>

        {/* Exam Templates */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading exams...</p>
          </div>
        ) : examTemplates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Upcoming Exams</h2>
            <p className="text-gray-600">
              Your teachers haven't created any exam schedules yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {examTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{template.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {(template as any).classroomName && `Class: ${(template as any).classroomName}`}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {template.entries.length} {template.entries.length === 1 ? "Subject" : "Subjects"}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {template.entries.map((entry, idx) => {
                    const daysUntil = getDaysUntilExam(entry.date);
                    
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${getUrgencyBg(daysUntil)}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold text-gray-800">{entry.subject}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(entry.date).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {entry.time}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className={`text-right ${getUrgencyColor(daysUntil)}`}>
                            <div className="font-bold text-lg">
                              {daysUntil < 0
                                ? "Past"
                                : daysUntil === 0
                                ? "Today!"
                                : daysUntil === 1
                                ? "Tomorrow"
                                : `${daysUntil} days`}
                            </div>
                            {daysUntil >= 0 && (
                              <div className="text-xs">
                                {daysUntil <= 3 ? "Urgent" : daysUntil <= 7 ? "Soon" : ""}
                              </div>
                            )}
                          </div>
                        </div>

                        {entry.syllabus && entry.syllabus.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-600 mb-2">Syllabus:</div>
                            <div className="space-y-1">
                              {entry.syllabus.map((syl, sylIdx) => (
                                <div key={sylIdx} className="text-sm">
                                  <span className="font-medium text-gray-700">{syl.chapter}:</span>
                                  <span className="text-gray-600 ml-1">
                                    {syl.topics.join(", ")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Time Availability Dialog */}
        <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
          <DialogContent className="max-w-md w-full p-4 overflow-hidden">
            <div className="rounded-lg bg-white shadow-md">
              <DialogHeader className="px-4 pt-4 pb-2">
                <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Set Study Time
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-gray-500">
                  Set your daily study time availability.
                </DialogDescription>
              </DialogHeader>
              <div className="px-4 pb-2 pt-2">
                <div className="h-64 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-3">
                    {DAYS.map((day) => (
                      <div key={day} className="flex items-center gap-2">
                        <span className="w-20 text-sm font-medium text-gray-700">{day}</span>
                        <Input
                          type="number"
                          min="0"
                          max="16"
                          value={timeAvailability[day as keyof TimeAvailability].hours}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, "");
                            if (val === "") val = "0";
                            let num = parseInt(val);
                            if (num > 16) {
                              setDialogWarning(`Max 16 hours for ${day}. Reset to 0.`);
                              setTimeAvailability((prev) => ({
                                ...prev,
                                [day]: { ...prev[day as keyof TimeAvailability], hours: "0", mins: "00" },
                              }));
                              return;
                            }
                            setDialogWarning("");
                            setTimeAvailability((prev) => ({
                              ...prev,
                              [day]: { ...prev[day as keyof TimeAvailability], hours: val, mins: prev[day as keyof TimeAvailability].mins || "00" },
                            }));
                          }}
                          placeholder="Hours"
                          className="w-16 text-sm"
                        />
                        <span className="text-gray-500">h</span>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={timeAvailability[day as keyof TimeAvailability].mins || "00"}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, "");
                            if (val === "") val = "00";
                            if (parseInt(val) > 59) val = "59";
                            setTimeAvailability((prev) => ({
                              ...prev,
                              [day]: { ...prev[day as keyof TimeAvailability], mins: val.padStart(2, "0") },
                            }));
                          }}
                          placeholder="Mins"
                          className="w-16 text-sm"
                        />
                        <span className="text-gray-500">min</span>
                      </div>
                    ))}
                  </div>
                </div>
                {dialogWarning && (
                  <div className="mt-3 text-xs text-orange-700 bg-orange-100 rounded-lg px-3 py-2 text-center">
                    {dialogWarning}
                  </div>
                )}
                {dialogLoading && (
                  <div className="flex justify-center items-center mt-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              <DialogFooter className="flex gap-2 justify-end px-4 pb-4">
                <Button variant="outline" onClick={() => setShowTimeDialog(false)} disabled={dialogLoading} className="text-sm">
                  Cancel
                </Button>
                <Button onClick={saveTimeAvailability} disabled={dialogLoading} className="text-sm">
                  Save
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
