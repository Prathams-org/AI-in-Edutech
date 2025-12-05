"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    if (tabParam && ["overview", "timetable", "students", "content", "exam"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* soft blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="backdrop-blur-2xl bg-white/5 border border-white/20 rounded-2xl px-10 py-8 flex flex-col items-center shadow-2xl shadow-cyan-500/10">
          <div className="h-14 w-14 rounded-full border-4 border-white/20 border-t-cyan-300 animate-spin mb-4" />
          <p className="text-slate-100/90 text-sm tracking-wide">
            Loading classroom…
          </p>
        </div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center relative overflow-hidden px-4">
        {/* soft blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 backdrop-blur-3xl bg-white/5 border border-white/15 rounded-3xl px-8 py-10 text-center max-w-md shadow-[0_22px_55px_rgba(15,23,42,0.85)]">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white/95 mb-2">Error</h2>
          <p className="text-slate-300/80 mb-8">{error || "Classroom not found"}</p>
          <button
            onClick={() => router.push("/teacher")}
            className="inline-flex px-6 py-3 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 text-slate-900 rounded-full font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/70 transform hover:-translate-y-0.5 transition-all"
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
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 overflow-hidden relative">
      {/* background glass blobs */}
      <div className="pointer-events-none absolute -top-32 -left-16 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } backdrop-blur-2xl bg-slate-900/30 border-r border-white/10 transition-all duration-300 flex flex-col`}
      >
        {/* Logo/Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="font-bold text-white/95 truncate">{classroom.name}</h2>
                {classroom.school && (
                  <p className="text-xs text-slate-400 truncate">{classroom.school}</p>
                )}
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <svg
                className={`w-5 h-5 text-slate-300 transition-transform ${
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
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-cyan-400/20 to-indigo-400/20 text-cyan-300 font-semibold border border-cyan-400/40"
                  : "text-slate-300 hover:bg-white/10 hover:border-white/15 border border-transparent"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Back Button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => router.push("/teacher")}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-white/10 hover:text-slate-100 rounded-lg transition-all border border-transparent hover:border-white/15"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {sidebarOpen && <span className="text-sm">Back to Classrooms</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="backdrop-blur-2xl bg-slate-900/30 border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-slate-50">
                {menuItems.find((item) => item.id === activeTab)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300/80">Teacher: {classroom.teacherName}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-500/20 border border-rose-400/40 text-rose-300 rounded-lg hover:bg-rose-500/30 transition-all text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 relative z-10">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
