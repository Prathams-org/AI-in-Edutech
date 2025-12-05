"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getClassroomStudents,
  updateClassroomPermission,
  acceptStudentRequest,
  rejectStudentRequest,
  StudentInClassroom,
} from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import {
  Loader2,
  Users,
  Clock,
  Check,
  X,
  Mail,
  Shield,
  ShieldOff,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  BookOpen,
  Calendar,
  BarChart3,
  Activity,
  CheckCircle,
} from "lucide-react";
import GlassLoadingAnimation from "@/components/ui/GlassLoadingAnimation";

interface ChatSession {
  id: string;
  mode: string;
  taskId?: string;
  taskTitle?: string;
  subject?: string;
  chapter?: string;
  topics?: Array<string | { topic?: string; name?: string; [key: string]: any }>;
  topicIds?: string[];
  classroomSlug?: string;
  teacherId?: string;
  source?: string;
  teacherSync?: boolean;
  createdAt: any;
  studentId?: string;
  studentName?: string;
  testHistory?: Array<{
    score: number;
    timeTaken?: number;
    timestamp: number;
    attemptNumber: number;
    analysis?: any;
    answers?: any[];
  }>;
  lastTestScore?: number;
  lastTestDate?: number;
  progress?: number;
  lastViewedCard?: number;
  analytics?: Array<{
    timestamp: number;
    timeSpent: number;
    cardIndex: number;
  }>;
  learningContent?: {
    flashcards?: any[];
    testData?: any;
    summary?: any;
    generatedAt?: number;
  };
  testQuestions?: any[];
  timeGiven?: number;
}

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  parentEmail?: string;
  std?: string;
  div?: string;
  rollNo?: string;
  school?: string;
  parentsNo?: string;
  gender?: string;
  classrooms?: any[];
  createdAt: any;
}

interface ChatAnalytics {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  totalTests: number;
  strongTopics: string[];
  weakTopics: string[];
  progressOverTime: Array<{
    date: string;
    score: number;
  }>;
}

export default function Students() {
  const params = useParams();
  const classroomSlug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentInClassroom[]>([]);
  const [requiresPermission, setRequiresPermission] = useState(false);
  const [updatingPermission, setUpdatingPermission] = useState(false);
  
  // Dialog states
  const [selectedStudent, setSelectedStudent] = useState<StudentInClassroom | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [chatAnalyticsOpen, setChatAnalyticsOpen] = useState(false);
  const [chatAnalytics, setChatAnalytics] = useState<ChatAnalytics | null>(null);

  // Helper: normalize a stored test score to a percentage (0-100).
  // Some records store raw correct counts (e.g., 9 out of 15), others store a percentage (e.g., 60).
  // If the stored score is <= totalQuestions we treat it as a count; otherwise treat as percent.
  const toPercent = (score: number | undefined, total: number) => {
    if (typeof score !== "number" || isNaN(score)) return 0;
    if (score <= total) {
      return Math.round((score / total) * 100);
    }
    // If score appears to already be a percent, clamp it to 0-100
    return Math.round(Math.max(0, Math.min(100, score)));
  };

  const correctCountFromStored = (score: number | undefined, total: number) => {
    if (typeof score !== "number" || isNaN(score)) return 0;
    if (score <= total) return score;
    // If stored as percent, convert back to count for display
    return Math.round((score / 100) * total);
  };

  useEffect(() => {
    loadStudents();
  }, [classroomSlug]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const result = await getClassroomStudents(classroomSlug);
      if (result.success) {
        setStudents(result.students || []);
        setRequiresPermission(result.requiresPermission || false);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = async (checked: boolean) => {
    try {
      setUpdatingPermission(true);
      const result = await updateClassroomPermission(classroomSlug, checked);
      if (result.success) {
        setRequiresPermission(checked);
      } else {
        alert(result.error || "Failed to update permission setting");
      }
    } catch (error: any) {
      alert(error.message || "Failed to update permission setting");
    } finally {
      setUpdatingPermission(false);
    }
  };

  const handleAcceptStudent = async (studentId: string) => {
    try {
      const result = await acceptStudentRequest(classroomSlug, studentId);
      if (result.success) {
        loadStudents();
      } else {
        alert(result.error || "Failed to accept student");
      }
    } catch (error: any) {
      alert(error.message || "Failed to accept student");
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    try {
      const result = await rejectStudentRequest(classroomSlug, studentId);
      if (result.success) {
        loadStudents();
      } else {
        alert(result.error || "Failed to reject student");
      }
    } catch (error: any) {
      alert(error.message || "Failed to reject student");
    }
  };

  const handleStudentClick = async (student: StudentInClassroom) => {
    setSelectedStudent(student);
    setDialogOpen(true);
    await loadStudentData(student.id);
  };

  const loadStudentData = async (studentId: string) => {
    try {
      setAnalyticsLoading(true);
      
      // Load full student profile
      const studentDoc = await getDoc(doc(db, "students", studentId));
      if (studentDoc.exists()) {
        setStudentProfile({ 
          id: studentId, 
          ...studentDoc.data() 
        } as StudentProfile);
      }

      // Query all chats from the student's chats subcollection
      const chatsRef = collection(db, "students", studentId, "chats");
      const chatsSnapshot = await getDocs(chatsRef);
      
      const taskSessions: ChatSession[] = [];
      const syncedSessions: ChatSession[] = [];
      
      chatsSnapshot.forEach((chatDoc) => {
        const chatData = chatDoc.data();
        
        // Convert Firestore timestamp to Date if needed
        let createdAtValue = chatData.createdAt;
        if (chatData.createdAt && typeof chatData.createdAt.toDate === 'function') {
          createdAtValue = chatData.createdAt.toDate().toISOString();
        } else if (chatData.createdAt && chatData.createdAt.seconds) {
          createdAtValue = new Date(chatData.createdAt.seconds * 1000).toISOString();
        }
        
        const session: ChatSession = {
          id: chatDoc.id,
          mode: chatData.mode || "unknown",
          taskId: chatData.taskId,
          subject: chatData.subject,
          chapter: chatData.chapter,
          topics: chatData.topics || [],
          topicIds: chatData.topicIds,
          classroomSlug: chatData.classroomSlug || chatData.teacherClassroomSlug,
          teacherId: chatData.teacherId,
          source: chatData.source,
          teacherSync: chatData.teacherSync,
          createdAt: createdAtValue,
          testHistory: chatData.testHistory || [],
          lastTestScore: chatData.lastTestScore,
          lastTestDate: chatData.lastTestDate,
          progress: chatData.progress,
          lastViewedCard: chatData.lastViewedCard,
          analytics: chatData.analytics || [],
          learningContent: chatData.learningContent,
          testQuestions: chatData.testQuestions,
          timeGiven: chatData.timeGiven,
        };
        
        // Use taskId as task identifier
        if (chatData.mode === "task") {
          session.taskTitle = chatData.taskId || `Task ${chatDoc.id}`;
        }
        
        // Separate task mode and teacherSync chats
        if (chatData.mode === "task") {
          taskSessions.push(session);
        } else if (chatData.teacherSync === true) {
          syncedSessions.push(session);
        }
      });

      // Sort both by most recent
      const getTimestamp = (session: ChatSession) => {
        if (!session.createdAt) return 0;
        if (typeof session.createdAt === 'string') return new Date(session.createdAt).getTime();
        if (session.createdAt.seconds) return session.createdAt.seconds * 1000;
        return 0;
      };
      
      const allSessions = [
        ...taskSessions.sort((a, b) => getTimestamp(b) - getTimestamp(a)),
        ...syncedSessions.sort((a, b) => getTimestamp(b) - getTimestamp(a))
      ];

      setChatSessions(allSessions);
    } catch (error) {
      console.error("Error loading student data:", error);
      setStudentProfile(null);
      setChatSessions([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleChatClick = (chat: ChatSession) => {
    setSelectedChat(chat);
    analyzeChatSession(chat);
    setChatAnalyticsOpen(true);
  };

  const analyzeChatSession = (chat: ChatSession) => {
    try {
      // Helper: normalize a stored test score to a percentage (0-100).
      // Some records store raw correct counts (e.g., 9 out of 15), others store a percentage (e.g., 60).
      // If the stored score is <= totalQuestions we treat it as a count; otherwise treat as percent.
      const toPercent = (score: number | undefined, total: number) => {
        if (typeof score !== "number" || isNaN(score)) return 0;
        if (score <= total) {
          return Math.round((score / total) * 100);
        }
        // If score appears to already be a percent, clamp it to 0-100
        return Math.round(Math.max(0, Math.min(100, score)));
      };

      const correctCountFromStored = (score: number | undefined, total: number) => {
        if (typeof score !== "number" || isNaN(score)) return 0;
        if (score <= total) return score;
        // If stored as percent, convert back to count for display
        return Math.round((score / 100) * total);
      };

      const testHistory = chat.testHistory || [];
      const totalTests = testHistory.length;
      const totalQuestions = chat.testQuestions?.length || 14; // Default based on data
      
      // Calculate average score
      const scoresArray = testHistory
        .map(t => toPercent(t.score as any, totalQuestions))
        .filter(s => !isNaN(s));
      const averageScore = scoresArray.length > 0 
        ? scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length 
        : 0;

      // Analyze answers to find strong and weak topics
      const topicPerformance = new Map<string, { correct: number; total: number }>();
      
      testHistory.forEach(test => {
        if (test.answers && Array.isArray(test.answers)) {
          test.answers.forEach((answer: any) => {
            // Get topic from the question or use a default
            const topic = answer.topic || answer.question?.split(':')[0] || "General";
            if (!topicPerformance.has(topic)) {
              topicPerformance.set(topic, { correct: 0, total: 0 });
            }
            const perf = topicPerformance.get(topic)!;
            perf.total += 1;
            if (answer.isCorrect) {
              perf.correct += 1;
            }
          });
        }
      });

      const topicScores = Array.from(topicPerformance.entries())
        .map(([topic, data]) => ({
          topic,
          percentage: (data.correct / data.total) * 100,
        }))
        .filter(t => t.percentage !== undefined && !isNaN(t.percentage));

      topicScores.sort((a, b) => b.percentage - a.percentage);
      const strongTopics = topicScores.slice(0, 3).map(t => t.topic);
      const weakTopics = topicScores.length > 0 
        ? topicScores.slice(-3).reverse().map(t => t.topic)
        : [];

      // Progress over time
      const progressOverTime = testHistory.map(test => ({
        date: new Date(test.timestamp).toISOString(),
        score: toPercent(test.score as any, totalQuestions),
      }));

      // Calculate if completed based on progress percentage or lastViewedCard
      const totalCards = chat.learningContent?.flashcards?.length || 0;
      const viewedCards = (chat.lastViewedCard || 0) + 1;
      const isCompleted = chat.progress === 100 || (totalCards > 0 && viewedCards >= totalCards);

      setChatAnalytics({
        totalSessions: 1,
        completedSessions: isCompleted ? 1 : 0,
        averageScore: Math.round(averageScore),
        totalTests,
        strongTopics,
        weakTopics,
        progressOverTime,
      });
    } catch (error) {
      console.error("Error analyzing chat session:", error);
      setChatAnalytics(null);
    }
  };

  const joinedStudents = students.filter((s) => s.status === "joined");
  const pendingStudents = students.filter((s) => s.status === "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <GlassLoadingAnimation />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Students</h2>
          <p className="text-slate-400">Manage enrolled students and permissions</p>
        </div>

        {/* Permission Toggle */}
        <Card className="w-auto backdrop-blur-xl bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {requiresPermission ? (
                <Shield className="w-5 h-5 text-purple-400" />
              ) : (
                <ShieldOff className="w-5 h-5 text-slate-500" />
              )}
              <div className="flex flex-col">
                <Label htmlFor="permission-toggle" className="cursor-pointer font-medium text-slate-200">
                  Require Permission
                </Label>
                <p className="text-xs text-slate-400">
                  {requiresPermission
                    ? "Students need approval to join"
                    : "Students can join freely"}
                </p>
              </div>
              <Switch
                id="permission-toggle"
                checked={requiresPermission}
                onCheckedChange={handlePermissionToggle}
                disabled={updatingPermission}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Tabs */}
      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
        <CardContent className="pt-6">
          <Tabs defaultValue="joined" className="w-full">
<TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
  <TabsTrigger
    value="joined"
    className="flex items-center gap-2 text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
  >
    <Users className="w-4 h-4" />
    Joined ({joinedStudents.length})
  </TabsTrigger>

  <TabsTrigger
    value="pending"
    className="flex items-center gap-2 text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
    disabled={!requiresPermission}
  >
    <Clock className="w-4 h-4" />
    Pending ({pendingStudents.length})
  </TabsTrigger>
</TabsList>


            {/* Joined Students Tab */}
            <TabsContent value="joined" className="space-y-4 mt-4">
              {joinedStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No students have joined yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {joinedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                      onClick={() => handleStudentClick(student)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{student.name}</p>
                          <p className="text-sm text-slate-400">{student.email}</p>
                          <div className="flex gap-2 mt-1">
                            {student.std && (
                              <span className="text-xs text-slate-500">
                                Class: {student.std}-{student.div}
                              </span>
                            )}
                            {student.rollNo && (
                              <span className="text-xs text-slate-500">
                                Roll: {student.rollNo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Pending Students Tab */}
            <TabsContent value="pending" className="space-y-4 mt-4">
              {!requiresPermission ? (
                <div className="text-center py-12">
                  <ShieldOff className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    Permission approval is disabled
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Enable "Require Permission" to review student requests
                  </p>
                </div>
              ) : pendingStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{student.name}</p>
                          <p className="text-sm text-slate-400">{student.email}</p>
                          <div className="flex gap-2 mt-1">
                            {student.std && (
                              <span className="text-xs text-slate-500">
                                Class: {student.std}-{student.div}
                              </span>
                            )}
                            {student.rollNo && (
                              <span className="text-xs text-slate-500">
                                Roll: {student.rollNo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcceptStudent(student.id)}
                          className="text-emerald-400 border-emerald-400/30 hover:text-emerald-300 hover:bg-emerald-400/10"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectStudent(student.id)}
                          className="text-rose-400 border-rose-400/30 hover:text-rose-300 hover:bg-rose-400/10"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[90vw] max-w-7xl h-[85vh] flex flex-col bg-slate-900/95 backdrop-blur-xl border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Student Details</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <Tabs defaultValue="profile" className="w-full flex-1 flex flex-col overflow-hidden">
<TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
  <TabsTrigger
    value="profile"
    className="text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
  >
    Profile
  </TabsTrigger>

  <TabsTrigger
    value="analytics"
    className="text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100"
  >
    Analytics
  </TabsTrigger>
</TabsList>


              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-4 flex-1 overflow-y-auto pr-2">
                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <GlassLoadingAnimation />
                  </div>
                ) : studentProfile ? (
                  <>
                    <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-white/10">
                      <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Users className="w-10 h-10 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-slate-100">{studentProfile.name}</h3>
                        <p className="text-slate-400">{studentProfile.email}</p>
                        <div className="flex gap-3 mt-2">
                          <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10">
                            Active Student
                          </Badge>
                          {studentProfile.gender && (
                            <Badge variant="outline" className="text-slate-300 border-slate-700">
                              {studentProfile.gender}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-sm text-slate-300">Student Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {studentProfile.std && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Class:</span>
                              <span className="font-medium text-slate-200">{studentProfile.std}-{studentProfile.div}</span>
                            </div>
                          )}
                          {studentProfile.rollNo && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Roll Number:</span>
                              <span className="font-medium text-slate-200">{studentProfile.rollNo}</span>
                            </div>
                          )}
                          {studentProfile.school && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">School:</span>
                              <span className="font-medium text-right text-slate-200">{studentProfile.school}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400">Status:</span>
                            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
                              {selectedStudent.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-sm text-slate-300">Contact Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Student Email</p>
                            <p className="text-sm font-medium break-all text-slate-200">{studentProfile.email}</p>
                          </div>
                          {studentProfile.parentEmail && (
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Parent Email</p>
                              <p className="text-sm font-medium break-all text-slate-200">{studentProfile.parentEmail}</p>
                            </div>
                          )}
                          {studentProfile.parentsNo && (
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Parent Phone</p>
                              <p className="text-sm font-medium text-slate-200">{studentProfile.parentsNo}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Classrooms */}
                    {studentProfile.classrooms && studentProfile.classrooms.length > 0 && (
                      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-sm text-slate-300">Enrolled Classrooms</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {studentProfile.classrooms.map((classroom: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-slate-300 border-slate-700">
                                {typeof classroom === "string" ? classroom : classroom.slug}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Unable to load student profile</p>
                  </div>
                )}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4 mt-4 flex-1 overflow-y-auto pr-2">
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                  </div>
                ) : chatSessions.length > 0 ? (
                  <>
                    {/* Overview Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center text-center">
                            <Activity className="w-8 h-8 text-blue-400 mb-2" />
                            <p className="text-2xl font-bold text-slate-100">{chatSessions.length}</p>
                            <p className="text-xs text-slate-400">Learning Sessions</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center text-center">
                            <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                            <p className="text-2xl font-bold text-slate-100">
                              {chatSessions.filter(c => c.progress === 100 || (c.learningContent?.flashcards && c.lastViewedCard !== undefined && c.lastViewedCard >= (c.learningContent.flashcards.length - 1))).length}
                            </p>
                            <p className="text-xs text-slate-400">Completed</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center text-center">
                            <Target className="w-8 h-8 text-purple-400 mb-2" />
                            <p className="text-2xl font-bold text-slate-100">
                              {chatSessions.reduce((acc, c) => acc + (c.testHistory?.length || 0), 0)}
                            </p>
                            <p className="text-xs text-slate-400">Tests Taken</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Task-Based Learning Sessions */}
                    {chatSessions.filter(c => c.mode === "task").length > 0 && (
                      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2 text-slate-200">
                            <Target className="w-4 h-4 text-purple-400" />
                            Study Tasks
                            <Badge variant="outline" className="ml-auto text-purple-400 border-purple-400/30 bg-purple-400/10">
                              {chatSessions.filter(c => c.mode === "task").length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {chatSessions.filter(c => c.mode === "task").map((chat) => {
                              const totalQuestions = chat.testQuestions?.length || 14;
                              const avgScore = chat.testHistory && chat.testHistory.length > 0
                                ? Math.round(chat.testHistory.reduce((acc, t) => acc + toPercent(t.score as any, totalQuestions), 0) / chat.testHistory.length)
                                : 0;
                              const totalCards = chat.learningContent?.flashcards?.length || 0;
                              const currentCard = (chat.lastViewedCard || 0) + 1;
                              const progressPercent = totalCards > 0
                                ? Math.round((currentCard / totalCards) * 100)
                                : (chat.progress || 0);
                              
                              return (
                                <div
                                  key={chat.id}
                                  className="group p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-400/50 hover:bg-white/10 cursor-pointer transition-all overflow-hidden"
                                  onClick={() => handleChatClick(chat)}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></div>
                                        <h4 className="font-semibold text-slate-100 text-sm group-hover:text-purple-300 transition-colors truncate">
                                          {chat.taskId || `Task ${new Date(chat.createdAt).toLocaleDateString()}`}
                                        </h4>
                                      </div>
                                      <p className="text-xs text-slate-400 ml-4">
                                        {chat.subject && chat.chapter ? `${chat.subject} • ${chat.chapter}` : (chat.subject || 'Study Task')}
                                      </p>
                                    </div>
                                    {chat.progress === 100 || (totalCards > 0 && currentCard >= totalCards) ? (
                                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                                    ) : (
                                      <Clock className="w-5 h-5 text-orange-400 shrink-0" />
                                    )}
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-slate-400">Progress</span>
                                      <span className="text-xs font-medium text-purple-400">
                                        {totalCards > 0 ? `${currentCard}/${totalCards}` : `${progressPercent}%`} ({progressPercent}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-purple-500/20 rounded-full h-2">
                                      <div
                                        className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all"
                                        style={{ width: `${progressPercent}%` }}
                                      ></div>
                                    </div>
                                  </div>

                                  {/* Stats */}
                                  <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {chat.createdAt ? new Date(chat.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                    {chat.testHistory && chat.testHistory.length > 0 && (
                                      <span className="flex items-center gap-1 text-purple-400 font-medium">
                                        <Award className="w-3 h-3" />
                                        {chat.testHistory.length} test{chat.testHistory.length > 1 ? 's' : ''} · {avgScore}% avg
                                      </span>
                                    )}
                                    {chat.lastTestScore !== undefined && (
                                      <span className="flex items-center gap-1 text-emerald-400">
                                        Latest: {chat.lastTestScore}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Teacher-Synced Content Sessions */}
                    {chatSessions.filter(c => c.teacherSync && c.mode !== "task").length > 0 && (
                      <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2 text-slate-200">
                            <BookOpen className="w-4 h-4 text-blue-400" />
                            Content Learning
                            <Badge variant="outline" className="ml-auto text-blue-400 border-blue-400/30 bg-blue-400/10">
                              {chatSessions.filter(c => c.teacherSync && c.mode !== "task").length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {chatSessions.filter(c => c.teacherSync && c.mode !== "task").map((chat) => {
                              const chatName = chat.subject || 'Learning Content';
                              const totalQuestions = chat.testQuestions?.length || 14;
                              const avgScore = chat.testHistory && chat.testHistory.length > 0
                                ? Math.round(chat.testHistory.reduce((acc, t) => acc + toPercent(t.score as any, totalQuestions), 0) / chat.testHistory.length)
                                : 0;
                              const totalCards = chat.learningContent?.flashcards?.length || 0;
                              const currentCard = (chat.lastViewedCard || 0) + 1;
                              const progressPercent = totalCards > 0
                                ? Math.round((currentCard / totalCards) * 100)
                                : (chat.progress || 0);
                              
                              return (
                                <div
                                  key={chat.id}
                                  className="group p-4 bg-white/5 rounded-xl border border-white/10 hover:border-blue-400/50 hover:bg-white/10 cursor-pointer transition-all overflow-hidden"
                                  onClick={() => handleChatClick(chat)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shrink-0">
                                      <BookOpen className="w-5 h-5 text-slate-900" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-semibold text-slate-100 text-sm group-hover:text-blue-300 transition-colors truncate">
                                            {chatName}
                                          </h4>
                                          <p className="text-xs text-slate-400 mt-0.5 truncate">{chat.chapter || 'Content Session'}</p>
                                        </div>
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs ml-2 shrink-0 text-slate-300 border-slate-700"
                                        >
                                          {chat.source || chat.mode}
                                        </Badge>
                                      </div>

                                      {/* Progress Bar */}
                                      <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs text-slate-400">Progress</span>
                                          <span className="text-xs font-medium text-blue-400">
                                            {totalCards > 0 ? `${currentCard}/${totalCards}` : `${progressPercent}%`} ({progressPercent}%)
                                          </span>
                                        </div>
                                        <div className="w-full bg-blue-500/20 rounded-full h-2">
                                          <div
                                            className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all"
                                            style={{ width: `${progressPercent}%` }}
                                          ></div>
                                        </div>
                                      </div>

                                      {/* Stats */}
                                      <div className="flex items-center gap-3 text-xs text-slate-400">
                                        {chat.testHistory && chat.testHistory.length > 0 && (
                                          <span className="flex items-center gap-1 text-blue-400 font-medium">
                                            <Award className="w-3 h-3" />
                                            {chat.testHistory.length} test{chat.testHistory.length > 1 ? 's' : ''} · {avgScore}% avg
                                          </span>
                                        )}
                                        {chat.lastTestScore !== undefined && (
                                          <span className="flex items-center gap-1 text-emerald-400">
                                            Latest: {chat.lastTestScore}%
                                          </span>
                                        )}
                                        {(chat.progress === 100 || (totalCards > 0 && currentCard >= totalCards)) && (
                                          <span className="flex items-center gap-1 text-emerald-400">
                                            <CheckCircle className="w-3 h-3" />
                                            Complete
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No analytics data available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Analytics Dialog */}
      <Dialog open={chatAnalyticsOpen} onOpenChange={setChatAnalyticsOpen}>
        <DialogContent className="max-w-[80vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Analytics</DialogTitle>
          </DialogHeader>

          {selectedChat && chatAnalytics && (
            <div className="space-y-4">
              {/* Session Header */}
              <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-800 truncate">
                      {selectedChat.subject || 'Learning Session'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {selectedChat.chapter || selectedChat.taskId || 'Content'}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className="text-purple-700 border-purple-300">
                        {selectedChat.mode}
                      </Badge>
                      {selectedChat.source && (
                        <Badge variant="outline">
                          {selectedChat.source}
                        </Badge>
                      )}
                      {selectedChat.teacherSync && (
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          Synced
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Started</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedChat.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <Target className="w-8 h-8 text-blue-600 mb-2" />
                      <p className="text-2xl font-bold">{chatAnalytics.totalTests}</p>
                      <p className="text-xs text-gray-600">Tests Taken</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <Award className="w-8 h-8 text-purple-600 mb-2" />
                      <p className="text-2xl font-bold">{chatAnalytics.averageScore}%</p>
                      <p className="text-xs text-gray-600">Average Score</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <Activity className="w-8 h-8 text-green-600 mb-2" />
                      <p className="text-2xl font-bold">
                        {(() => {
                          const totalCards = selectedChat.learningContent?.flashcards?.length || 0;
                          const currentCard = (selectedChat.lastViewedCard || 0) + 1;
                          return totalCards > 0 ? `${currentCard}/${totalCards}` : `${selectedChat.progress || 0}%`;
                        })()}
                      </p>
                      <p className="text-xs text-gray-600">Progress</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                      <p className="text-2xl font-bold">
                        {(() => {
                          const totalCards = selectedChat.learningContent?.flashcards?.length || 0;
                          const currentCard = (selectedChat.lastViewedCard || 0) + 1;
                          const isCompleted = selectedChat.progress === 100 || (totalCards > 0 && currentCard >= totalCards);
                          return isCompleted ? "✓" : "○";
                        })()}
                      </p>
                      <p className="text-xs text-gray-600">Completion</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Strong and Weak Topics */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      Strong Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chatAnalytics.strongTopics.length > 0 ? (
                      <div className="space-y-2">
                        {chatAnalytics.strongTopics.map((topic, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">{topic}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No test data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      Needs Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chatAnalytics.weakTopics.length > 0 ? (
                      <div className="space-y-2">
                        {chatAnalytics.weakTopics.map((topic, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm">{topic}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No test data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Test History */}
              {selectedChat.testHistory && selectedChat.testHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      Test History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedChat.testHistory.map((test, idx) => {
                        const totalQuestions = selectedChat.testQuestions?.length || 14;
                        const percentage = toPercent(test.score as any, totalQuestions);
                        return (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">Attempt #{test.attemptNumber || (idx + 1)}</p>
                                <p className="text-xs text-gray-600">
                                  {new Date(test.timestamp).toLocaleString()}
                                </p>
                                {test.timeTaken && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Time: {Math.floor(test.timeTaken / 60)}:{(test.timeTaken % 60).toString().padStart(2, '0')}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-purple-600">{percentage}%</p>
                                <p className="text-xs text-gray-600">
                                  {correctCountFromStored(test.score as any, totalQuestions)}/{totalQuestions} correct
                                </p>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  percentage >= 75
                                    ? "bg-green-500"
                                    : percentage >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progress Over Time */}
              {chatAnalytics.progressOverTime.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Progress Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {chatAnalytics.progressOverTime.map((progress, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-32">
                            {new Date(progress.date).toLocaleDateString()}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                              style={{ width: `${progress.score}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium w-12 text-right">
                            {Math.round(progress.score)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
