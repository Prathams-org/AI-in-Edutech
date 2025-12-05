"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  Clock,
  Target,
  Award,
  Filter,
  Trash2,
  BookOpen,
  MessageSquare,
  Play,
} from "lucide-react";
// Assuming useAuth, db, doc, getDoc, updateDoc, setDoc, Button, and useRouter are correctly imported
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button"; // Replace with your actual Button path
import { useRouter } from "next/navigation";

// --- Type Definitions for Strict TypeScript ---

/**
 * Defines the strict structure of a Task object.
 * 'difficultyLevel' is strictly one of the specified literals.
 */
interface Task {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  topics: string[];
  topicIds: string[];
  estimatedDuration: string; // e.g., "60 min"
  difficultyLevel: "easy" | "medium" | "hard";
  relatedExam: string;
  completed?: boolean;
  priority?: "high" | "medium" | "low";
  chatId?: string;
}

// Ensure the props interface is correct, though it's optional here.
interface TasksProps {
  tasks?: Task[]; // If tasks are passed as props, though current implementation loads from Firestore
}

// --- Helper Functions (Memoized for Efficiency) ---

/**
 * Provides Tailwind classes based on difficulty level.
 * @param difficulty - The difficulty level string.
 * @returns Tailwind CSS classes for background, text, and border.
 */
const getDifficultyColor = (difficulty: Task["difficultyLevel"] | undefined) => {
  if (!difficulty) return "bg-gray-100 text-gray-700 border-gray-300";
  switch (difficulty) {
    case "easy":
      return "bg-green-100 text-green-700 border-green-300";
    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "hard":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      // Fallback for unexpected string values, satisfying TypeScript exhaustive check if 'difficulty' was just 'string'
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

/**
 * Provides an emoji icon based on difficulty level.
 * @param difficulty - The difficulty level string.
 * @returns An emoji string.
 */
const getDifficultyIcon = (difficulty: Task["difficultyLevel"] | undefined) => {
  if (!difficulty) return "📚"; // Default icon for undefined
  switch (difficulty) {
    case "easy":
      return "🌱";
    case "medium":
      return "⚡";
    case "hard":
      return "🔥";
    default:
      return "📚";
  }
};

// --- Main Component ---

export default function Tasks({ tasks: initialTasks }: TasksProps) {
  const { user } = useAuth(); // Assuming useAuth handles loading state or user is present for initial load
  const router = useRouter();
  const [todayTasks, setTodayTasks] = useState<Task[]>(initialTasks || []);
  const [loading, setLoading] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState<"all" | Task["difficultyLevel"]>("all");
  const [filterCompleted, setFilterCompleted] = useState<"all" | "completed" | "pending">("all");
  const [creatingChat, setCreatingChat] = useState<string | null>(null);

  // Memoized function for loading tasks to be used inside useEffect
  const loadTasks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const studentDoc = await getDoc(doc(db, "students", user.uid));

      if (studentDoc.exists()) {
        const data = studentDoc.data();
        // Ensure data.todayTasks is treated as an array of Task[] or an empty array
        const tasksFromDb: Task[] = (data.todayTasks as Task[]) || [];
        setTodayTasks(tasksFromDb);
      } else {
        setTodayTasks([]);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      // Optional: Show an error message to the user
    } finally {
      setLoading(false);
    }
  }, [user]); // Dependency on user ensures re-run when user changes

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // --- Filtering Logic ---
  const filteredTasks = todayTasks.filter((task) => {
    // Check difficulty level. Use optional chaining with nullish coalescing for safety
    if (filterDifficulty !== "all" && (task.difficultyLevel ?? "medium") !== filterDifficulty) return false;
    
    // Check completion status
    const isCompleted = task.completed ?? false; // Default to false if undefined
    if (filterCompleted === "completed" && !isCompleted) return false;
    if (filterCompleted === "pending" && isCompleted) return false;
    
    return true;
  });

  // --- Stats Calculation ---
  const stats = {
    total: todayTasks.length,
    completed: todayTasks.filter((t) => t.completed).length,
    pending: todayTasks.filter((t) => !t.completed).length,
    easy: todayTasks.filter((t) => t.difficultyLevel === "easy").length,
    medium: todayTasks.filter((t) => t.difficultyLevel === "medium").length,
    hard: todayTasks.filter((t) => t.difficultyLevel === "hard").length,
  };

  const calculateTotalTime = (tasks: Task[], condition: (task: Task) => boolean = () => true): number => {
    return tasks
      .filter(condition)
      .reduce((acc, task) => {
        // Safely parse duration. Assumes format is always "N min" or "N hours" etc.
        const durationMatch = task.estimatedDuration?.match(/(\d+)/);
        const duration = durationMatch ? parseInt(durationMatch[1]) : 0;
        return acc + duration;
      }, 0);
  };
  
  const totalEstimatedTime = calculateTotalTime(todayTasks);
  const completedTime = calculateTotalTime(todayTasks, (t) => t.completed ?? false);

  const progressPercentage = totalEstimatedTime > 0
    ? Math.round((completedTime / totalEstimatedTime) * 100)
    : 0;

  // --- Task Operations ---
  
  const updateTaskInDb = async (updatedTasks: Task[]) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "students", user.uid), {
        todayTasks: updatedTasks,
      });
      setTodayTasks(updatedTasks);
    } catch (error) {
      console.error("Error updating tasks in DB:", error);
      alert("Failed to update task status in the database.");
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const updatedTasks = todayTasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: !(task.completed ?? false), // Toggle and default to false
        };
      }
      return task;
    });
    await updateTaskInDb(updatedTasks);
  };

  const createChatFromTask = async (task: Task) => {
    if (!user) return;

    try {
      setCreatingChat(task.id);

      // Load student data to get classroom information
      const studentDoc = await getDoc(doc(db, "students", user.uid));
      if (!studentDoc.exists()) {
        throw new Error("Student data not found");
      }

      const studentData = studentDoc.data();
      const classrooms = studentData.classrooms || [];

      // Find the classroom that has this task's exam
      let classroomSlug = "";
      let teacherId = "";

      for (const classroom of classrooms) {
        const slug = typeof classroom === "string" ? classroom : classroom.slug;
        const status = typeof classroom === "string" ? "joined" : classroom.status;
        
        if (status === "joined") {
          const classroomDoc = await getDoc(doc(db, "classrooms", slug));
          
          if (classroomDoc.exists()) {
            const classroomData = classroomDoc.data();
            const templates = classroomData.examTemplates || [];
            
            // Check if this classroom has the task's exam
            const hasExam = templates.some((template: any) => 
              template.entries?.some((entry: any) => 
                entry.subject === task.subject && 
                entry.syllabus?.some((s: any) => s.chapter === task.chapter)
              )
            );
            
            if (hasExam) {
              classroomSlug = slug;
              teacherId = classroomData.teacherId || classroomData.createdBy;
              break;
            }
          }
        }
      }

      // Create a new chat for this task
      const chatId = `task-${task.id}-${Date.now()}`;
      const chatRef = doc(db, "students", user.uid, "chats", chatId);
      
      const chatData = {
        mode: "task" as const,
        taskId: task.id,
        subject: task.subject || "",
        chapter: task.chapter || "",
        topics: task.topics || [],
        topicIds: task.topicIds || [],
        classroomSlug: classroomSlug || "",
        teacherId: teacherId || "",
        source: "task",
        teacherSync: true, // This is classroom data that should be tracked
        createdAt: new Date().toISOString(),
        studentId: user.uid,
        studentName: user.displayName || user.email || "Student",
      };

      await setDoc(chatRef, chatData);

      // Track this activity in the teacher's dashboard if we have classroom and teacher info
      if (classroomSlug && teacherId) {
        try {
          const activityRef = doc(
            db, 
            "classrooms", 
            classroomSlug, 
            "studentActivity", 
            `${user.uid}_${chatId}`
          );
          
          await setDoc(activityRef, {
            studentId: user.uid,
            studentName: user.displayName || user.email || "Student",
            chatId: chatId,
            activityType: "task-learning",
            taskId: task.id,
            taskTitle: task.title,
            subject: task.subject,
            chapter: task.chapter,
            topics: task.topics || [],
            startedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            status: "in-progress",
          });
        } catch (activityError) {
          console.error("Error tracking activity:", activityError);
          // Don't fail the entire operation if activity tracking fails
        }
      }

      // Update task with chatId
      const updatedTasks = todayTasks.map((t) => {
        if (t.id === task.id) {
          return { ...t, chatId };
        }
        return t;
      });
      await updateTaskInDb(updatedTasks);
      
      // Navigate to chat
      router.push(`/student/chat/${chatId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Failed to create chat: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setCreatingChat(null);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    if (!confirm("Are you sure you want to delete this task?")) return;

    const updatedTasks = todayTasks.filter((task) => task.id !== taskId);
    await updateTaskInDb(updatedTasks);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Today's Study Tasks
            </h1>
          </div>
          <p className="text-gray-600 text-lg ml-14">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          {/* Total Tasks */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500 opacity-30" />
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-30" />
            </div>
          </div>

          {/* Easy Tasks */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium">Easy</p>
                <p className="text-2xl font-bold text-green-600">{stats.easy}</p>
              </div>
              <span className="text-2xl">🌱</span>
            </div>
          </div>

          {/* Medium Tasks */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium">Medium</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
              </div>
              <span className="text-2xl">⚡</span>
            </div>
          </div>

          {/* Hard Tasks */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium">Hard</p>
                <p className="text-2xl font-bold text-red-600">{stats.hard}</p>
              </div>
              <span className="text-2xl">🔥</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                <span className="font-bold text-gray-800 text-lg">Today's Progress</span>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 transition-all duration-700 rounded-full shadow-lg"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-3 font-medium">
              <span>✅ {completedTime} min done</span>
              <span>🎯 {totalEstimatedTime} min total</span>
            </div>
          </div>
        )}

        {/* Filters */}
        {stats.total > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-4 mb-6 border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 mb-2">Filter by Status</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterCompleted("all")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterCompleted === "all"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterCompleted("pending")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterCompleted === "pending"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Pending ({stats.pending})
                  </button>
                  <button
                    onClick={() => setFilterCompleted("completed")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterCompleted === "completed"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Completed ({stats.completed})
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 mb-2">Filter by Difficulty</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterDifficulty("all")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterDifficulty === "all"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterDifficulty("easy")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterDifficulty === "easy"
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-300"
                    }`}
                  >
                    🌱 Easy
                  </button>
                  <button
                    onClick={() => setFilterDifficulty("medium")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterDifficulty === "medium"
                        ? "bg-yellow-600 text-white shadow-md"
                        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-300"
                    }`}
                  >
                    ⚡ Medium
                  </button>
                  <button
                    onClick={() => setFilterDifficulty("hard")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterDifficulty === "hard"
                        ? "bg-red-600 text-white shadow-md"
                        : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-300"
                    }`}
                  >
                    🔥 Hard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {filteredTasks.length === 0 && stats.total === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Tasks Yet</h2>
            <p className="text-gray-600 mb-6">
              Generate your personalized AI study tasks from Exam Corner
            </p>
            <Button
              onClick={() => router.push("/exam-corner")} // Assuming /exam-corner route exists
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
            >
              Go to Exam Corner
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              // Ensure task.difficultyLevel exists before calling helper functions
              const difficulty: Task["difficultyLevel"] | undefined = task.difficultyLevel;
              const difficultyColor = getDifficultyColor(difficulty);
              const difficultyIcon = getDifficultyIcon(difficulty);

              return (
                <div
                  key={task.id}
                  className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-2 ${task.completed ? "border-green-300 opacity-75" : difficultyColor.includes("green") ? "border-green-200" : difficultyColor.includes("yellow") ? "border-yellow-200" : "border-red-200"}`}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Checkbox and Task Info */}
                    <div className="flex gap-4 flex-1">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={task.completed || false}
                          onChange={() => toggleTaskCompletion(task.id)}
                          className="w-6 h-6 rounded-md border-2 border-gray-300 text-green-600 focus:ring-2 focus:ring-purple-500 cursor-pointer transition-all"
                        />
                      </div>

                      {/* Task Details */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${difficultyColor} border-2`}>
                            <span className="text-lg">{difficultyIcon}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className={`text-xl font-bold mb-1 ${task.completed ? "text-gray-500 line-through" : "text-gray-800"}`}>
                              {task.title}
                            </h3>
                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              {task.subject} • {task.chapter}
                            </p>
                          </div>
                        </div>

                        {/* Topics */}
                        {task.topics && task.topics.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">📚 Topics to cover:</p>
                            <div className="flex flex-wrap gap-2">
                              {task.topics.map((topic, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 text-sm rounded-lg font-medium border border-purple-200"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags and Details */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {/* FIX: Use optional chaining (?.) and nullish coalescing (??) to prevent the toUpperCase error */}
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${difficultyColor}`}>
                            {difficultyIcon} {task.difficultyLevel?.toUpperCase() ?? "UNKNOWN"} 
                          </span>
                          
                          {task.estimatedDuration && (
                            <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-indigo-200">
                              <Clock className="w-3 h-3" />
                              {task.estimatedDuration}
                            </span>
                          )}

                          {task.relatedExam && (
                            <span className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg border border-orange-200">
                              🎯 {task.relatedExam}
                            </span>
                          )}

                          {task.completed && (
                            <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-green-200">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                          {task.chatId ? (
                            <Button
                              onClick={() => router.push(`/student/chat/${task.chatId}`)}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                              size="sm"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Continue Learning
                            </Button>
                          ) : (
                            <Button
                              onClick={() => createChatFromTask(task)}
                              disabled={creatingChat === task.id}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md"
                              size="sm"
                            >
                              {creatingChat === task.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Start Learning
                                </>
                              )}
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => deleteTask(task.id)}
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State for Filtered Results */}
        {filteredTasks.length === 0 && stats.total > 0 && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200">
            <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              No Tasks Match Filters
            </h2>
            <p className="text-gray-600">
              Try adjusting your filters to see more tasks
            </p>
          </div>
        )}
      </div>
    </div>
  );
}