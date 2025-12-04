"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getClassroomBySlug, Classroom, logout } from "@/lib/auth";
import Overview from "@/components/teacher/Overview";
import Timetable from "@/components/teacher/Timetable";
import Students from "@/components/teacher/Students";
import Content from "@/components/teacher/Content";
import ExamCorner from "@/components/teacher/ExamCorner";

type TabType = "overview" | "timetable" | "students" | "content" | "exam";

export default function ClassroomDashboard() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && user && slug) {
      loadClassroom();
    }
  }, [authLoading, user, slug]);

  const loadClassroom = async () => {
    setLoading(true);
    const result = await getClassroomBySlug(slug);
    
    if (result.success && result.classroom) {
      // Verify the teacher owns this classroom
      if (result.classroom.teacherId !== user?.uid) {
        setError("You don't have access to this classroom");
        setClassroom(null);
      } else {
        setClassroom(result.classroom);
      }
    } else {
      setError(result.error || "Classroom not found");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || "Classroom not found"}</p>
          <button
            onClick={() => router.push("/teacher")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
          >
            Back to Classrooms
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: "overview" as TabType, label: "Overview", icon: "📊" },
    { id: "timetable" as TabType, label: "Timetable", icon: "📅" },
    { id: "students" as TabType, label: "Students", icon: "👥" },
    { id: "content" as TabType, label: "Content", icon: "📚" },
    { id: "exam" as TabType, label: "Exam Corner", icon: "📝" },
  ];

  const renderContent = () => {
    if (!classroom) return null;
    
    switch (activeTab) {
      case "overview":
        return <Overview classroom={classroom} />;
      case "timetable":
        return <Timetable />;
      case "students":
        return <Students />;
      case "content":
        return <Content />;
      case "exam":
        return <ExamCorner />;
      default:
        return <Overview classroom={classroom} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo/Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="font-bold text-gray-800 truncate">{classroom.name}</h2>
                {classroom.school && (
                  <p className="text-xs text-gray-600 truncate">{classroom.school}</p>
                )}
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  !sidebarOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                activeTab === item.id
                  ? "bg-purple-100 text-purple-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Back Button */}
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={() => router.push("/teacher")}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {sidebarOpen && <span>Back to Classrooms</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800">
                {menuItems.find((item) => item.id === activeTab)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Teacher: {classroom.teacherName}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
