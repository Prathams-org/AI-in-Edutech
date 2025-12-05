"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { logout } from "@/lib/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Home,
  Users,
  BookOpen,
  Brain,
  FileText,
  CheckSquare,
  LogOut,
  Menu,
  X,
  Clock,
  Plus,
  Utensils,
  Coffee,
} from "lucide-react";
import Link from "next/link";
import Profile from "@/components/student/Profile";
import Classroom from "@/components/student/Classroom";
import StudyHub from "@/components/student/StudyHub";
import AILearnPage from "@/components/student/AILearnPage";
import ExamCorner from "@/components/student/ExamCorner";
import Tasks from "@/components/student/Tasks";
import TestsPage from "@/components/student/TestsPage";

type PageType = "dashboard" | "profile" | "classroom" | "study-hub" | "ai-learn" | "exam-corner" | "tasks" | "tests";

export default function StudentDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");

  useEffect(() => {
    if (!authLoading && user) {
      loadStudentData();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#aipage") {
      setCurrentPage("ai-learn");
    }
  }, []);

  const loadStudentData = async () => {
    if (!user) return;
    
    const studentDoc = await getDoc(doc(db, "students", user.uid));
    if (studentDoc.exists()) {
      setStudentData(studentDoc.data());
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const navItems = [
    { name: "Profile", id: "profile", icon: <Home className="w-5 h-5" /> },
    { name: "Classroom", id: "classroom", icon: <Users className="w-5 h-5" /> },
    { name: "Study Hub", id: "study-hub", icon: <BookOpen className="w-5 h-5" /> },
    { name: "AI Learn Page", id: "ai-learn", icon: <Brain className="w-5 h-5" /> },
    { name: "Tests", id: "tests", icon: <FileText className="w-5 h-5" /> },
    { name: "Exam Corner", id: "exam-corner", icon: <FileText className="w-5 h-5" /> },
    { name: "Tasks", id: "tasks", icon: <CheckSquare className="w-5 h-5" /> },
  ];

  const renderPageContent = () => {
    switch (currentPage) {
      case "profile":
        return <Profile />;
      case "classroom":
        return <Classroom />;
      case "study-hub":
        return <StudyHub />;
      case "ai-learn":
        return <AILearnPage />;
      case "tests":
        return <TestsPage />;
      case "exam-corner":
        return <ExamCorner />;
      case "tasks":
        return <Tasks setActiveTab={(tabName) => {
          // Map Exam Corner tab name to exam-corner page id
          const pageId = tabName === "Exam Corner" ? "exam-corner" : tabName.toLowerCase().replace(/\s+/g, "-") as PageType;
          setCurrentPage(pageId);
        }} />;
      case "dashboard":
      default:
        return <DashboardContent studentData={studentData} />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-blue-600 text-white p-2 rounded-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-lg transform transition-transform duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-blue-500">
          <h1 className="text-2xl font-bold">AI-in-edutech</h1>
          <p className="text-blue-200 text-sm mt-1">Student Portal</p>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2 mt-6">
          {/* Dashboard Button */}
          <button
            onClick={() => {
              setCurrentPage("dashboard");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentPage === "dashboard"
                ? "bg-blue-500 text-white shadow-lg"
                : "text-blue-100 hover:bg-blue-700 hover:text-white"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id as PageType);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                currentPage === item.id
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <button
            onClick={() => {
              setSidebarOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 text-white font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 overflow-auto">
        {renderPageContent()}
      </div>
    </div>
  );
}

// --- Timetable Components ---
type TimeSlot = {
  id: string;
  start: { hour: string; min: string; period: "AM" | "PM" };
  end: { hour: string; min: string; period: "AM" | "PM" };
};

type CellType = "period" | "lunch" | "shortbreak";

type CellData = {
  type: CellType;
  subject?: string;
};

type WeeklySchedule = Record<string, Record<string, CellData>>;

type TimetableData = {
  slots: TimeSlot[];
  schedule: WeeklySchedule;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function TimetablePanel({ studentData }: { studentData: any }) {
  const [classrooms, setClassrooms] = useState<Array<{ slug: string; name?: string; timetable?: TimetableData }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassIdx, setSelectedClassIdx] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  useEffect(() => {
    // UPDATED: This now forces Monday (Index 0) on every refresh/load
    // instead of calculating the current day.
    setSelectedDayIdx(0); 
  }, []);

  useEffect(() => {
    if (!studentData) return;

    const fetchClassrooms = async () => {
      setLoading(true);
      const raw = studentData.classrooms || [];
      // raw can be array of strings or objects {slug,status}
      const slugs: string[] = raw
        .map((c: any) => (typeof c === "string" ? c : c?.slug))
        .filter(Boolean);

      const promises = slugs.map(async (slug: string) => {
        try {
          const cdoc = await getDoc(doc(db, "classrooms", slug));
          if (cdoc.exists()) {
            const data: any = cdoc.data();
            return { slug, name: data.name || slug, timetable: data.timetable || null };
          }
        } catch (e) {
          console.error("Failed to load classroom", slug, e);
        }
        return null;
      });

      const results = await Promise.all(promises);
      setClassrooms(results.filter((r) => r !== null) as any);
      setLoading(false);
    };

    fetchClassrooms();
  }, [studentData]);

  const goPrevDay = () => setSelectedDayIdx((d) => (d <= 0 ? DAYS.length - 1 : d - 1));
  const goNextDay = () => setSelectedDayIdx((d) => (d >= DAYS.length - 1 ? 0 : d + 1));

  return (
    <div className="mt-6 bg-gray-50 border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-800">Your Class Timetables</h4>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="hidden sm:inline">View by class</span>
        </div>
      </div>

      {loading && <div className="p-6 text-gray-500">Loading timetables...</div>}

      {!loading && classrooms.length === 0 && (
        <div className="p-6 text-gray-500">You have not joined any classes yet.</div>
      )}

      {!loading && classrooms.length > 0 && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Class:</label>
              <select
                value={selectedClassIdx}
                onChange={(e) => setSelectedClassIdx(parseInt(e.target.value, 10))}
                className="px-3 py-2 border rounded-md"
              >
                {classrooms.map((c, i) => (
                  <option key={c.slug} value={i}>{c.name || c.slug}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={goPrevDay} className="px-3 py-2 bg-white border rounded-md">Prev</button>
              <div className="px-4 py-2 bg-white border rounded-md font-medium">{DAYS[selectedDayIdx]}</div>
              <button onClick={goNextDay} className="px-3 py-2 bg-white border rounded-md">Next</button>
            </div>
          </div>

          <TimetableGrid timetable={classrooms[selectedClassIdx]?.timetable} day={DAYS[selectedDayIdx]} />
        </div>
      )}
    </div>
  );
}

function TimetableGrid({ timetable, day }: { timetable?: TimetableData | null; day: string }) {
  if (!timetable) {
    return <div className="p-6 text-gray-500">No timetable available for this class.</div>;
  }

  const slots = timetable.slots || [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] bg-white rounded">
        <thead>
          <tr className="text-left text-sm text-gray-600 border-b">
            <th className="p-3 w-40">Time</th>
            <th className="p-3">{day}</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => {
            const cell = timetable.schedule?.[day]?.[slot.id];
            return (
              <tr key={slot.id} className="border-b hover:bg-gray-50">
                <td className="p-3 align-top text-sm text-gray-700 font-mono">
                  <div>{slot.start.hour}:{slot.start.min} {slot.start.period}</div>
                  <div className="text-xs text-gray-400">to</div>
                  <div>{slot.end.hour}:{slot.end.min} {slot.end.period}</div>
                </td>
                <td className="p-3 align-top">
                  {cell ? <CellDisplay data={cell} /> : (
                    <div className="text-gray-400 italic">No entry</div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CellDisplay({ data }: { data: CellData }) {
  if (data.type === "lunch") {
    return (
      <div className="flex items-center gap-3 text-orange-700">
        <Utensils className="w-5 h-5" />
        <span className="font-semibold">Lunch</span>
      </div>
    );
  }
  if (data.type === "shortbreak") {
    return (
      <div className="flex items-center gap-3 text-yellow-700">
        <Coffee className="w-5 h-5" />
        <span className="font-semibold">Break</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <BookOpen className="w-5 h-5 text-blue-600" />
      <div>
        <div className="text-sm font-semibold">{data.subject || "Class"}</div>
        <div className="text-xs text-gray-500">Period</div>
      </div>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent({ studentData }: { studentData: any }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
            {studentData && (
              <p className="text-gray-600 mt-1">Welcome back, {studentData.name}!</p>
            )}
          </div>
          
          {studentData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Your Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Class:</span> {studentData.std} - {studentData.div}</p>
                  <p><span className="font-semibold">Roll No:</span> {studentData.rollNo}</p>
                  <p><span className="font-semibold">School:</span> {studentData.school}</p>
                  <p><span className="font-semibold">Parent Email:</span> {studentData.parentEmail}</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Enrolled Classes:</span> 0</p>
                  <p><span className="font-semibold">Assignments:</span> 0</p>
                  <p><span className="font-semibold">Attendance:</span> 0%</p>
                </div>
              </div>
            </div>
          )}

          {/* Timetable Panel - shows timetables for joined classrooms */}
          {studentData && <TimetablePanel studentData={studentData} />}

          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Welcome to Your Learning Hub
            </h2>
            <p className="text-gray-600">
              Use the sidebar to navigate to your classes, assignments, and track your progress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}