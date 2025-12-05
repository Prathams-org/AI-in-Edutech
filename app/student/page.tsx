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
  Sparkles,
  TrendingUp,
  Award,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import GlassLoadingAnimation from "@/components/ui/GlassLoadingAnimation";
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
        return <Tasks />;
      case "dashboard":
      default:
        return <DashboardContent studentData={studentData} />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-slate-50 flex items-center justify-center">
        <GlassLoadingAnimation />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-slate-100 overflow-hidden">
      {/* Mobile Toggle Button */}
      <motion.button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden backdrop-blur-xl bg-white/90 text-blue-700 p-3 rounded-2xl shadow-xl border border-blue-200/50"
        whileHover={{ scale: 1.05, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <AnimatePresence mode="wait">
          {sidebarOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Sidebar Backdrop for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen || window.innerWidth >= 768 ? 0 : "-100%",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="fixed left-0 top-0 h-screen w-72 backdrop-blur-2xl bg-linear-to-br from-blue-900/95 via-indigo-900/95 to-blue-800/95 text-white shadow-2xl z-40 border-r border-blue-400/20"
      >
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 100, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ top: "-5%", left: "-10%" }}
          />
          <motion.div
            className="absolute w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl"
            animate={{
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ bottom: "10%", right: "-5%" }}
          />
        </div>

        {/* Logo/Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative p-6 border-b border-blue-400/30"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 bg-blue-500/30 rounded-xl backdrop-blur-sm border border-blue-300/30"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Sparkles className="w-6 h-6 text-blue-100" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI-in-edutech</h1>
              <p className="text-blue-200 text-sm font-medium">Student Portal</p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Items */}
        <nav className="relative p-4 space-y-2 mt-6 overflow-y-auto h-[calc(100vh-220px)] custom-scrollbar">
          {/* Dashboard Button */}
          <NavButton
            onClick={() => {
              setCurrentPage("dashboard");
              setSidebarOpen(false);
            }}
            active={currentPage === "dashboard"}
            icon={<Home className="w-5 h-5" />}
            label="Dashboard"
            delay={0}
          />

          {navItems.map((item, index) => (
            <NavButton
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id as PageType);
                setSidebarOpen(false);
              }}
              active={currentPage === item.id}
              icon={item.icon}
              label={item.name}
              delay={0.05 * (index + 1)}
            />
          ))}
        </nav>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-6 left-0 right-0 px-4"
        >
          <motion.button
            onClick={() => {
              setSidebarOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-2xl transition-all duration-300 text-white font-semibold shadow-lg group backdrop-blur-sm border border-red-400/30"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="group-hover:rotate-180 transition-transform duration-300"
            >
              <LogOut className="w-5 h-5" />
            </motion.div>
            <span>Logout</span>
          </motion.button>
        </motion.div>
      </motion.aside>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 ml-0 md:ml-72 overflow-auto custom-scrollbar"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderPageContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}

// Navigation Button Component with Animations
function NavButton({
  onClick,
  active,
  icon,
  label,
  delay,
}: {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  delay: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left overflow-hidden group ${
        active
          ? "bg-blue-500/30 text-white shadow-lg backdrop-blur-sm border border-blue-400/40"
          : "text-blue-100 hover:bg-blue-500/20 hover:text-white hover:border hover:border-blue-400/30"
      }`}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-blue-500/30 backdrop-blur-sm rounded-xl border border-blue-400/40"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <motion.div
        className="relative z-10"
        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <span className="relative z-10 font-semibold">{label}</span>
      {!active && (
        <motion.div
          className="absolute right-4 opacity-0 group-hover:opacity-100"
          initial={{ x: -10 }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-1.5 h-1.5 bg-blue-300 rounded-full shadow-lg" />
        </motion.div>
      )}
    </motion.button>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mt-6 backdrop-blur-xl bg-white/60 border border-blue-200/40 rounded-3xl p-6 shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="p-3 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            <Clock className="w-5 h-5 text-white" />
          </motion.div>
          <h4 className="font-bold text-xl bg-linear-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Your Class Timetables
          </h4>
        </motion.div>
        <motion.div
          className="flex items-center gap-2 text-sm text-blue-700"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline font-semibold">Weekly Schedule</span>
        </motion.div>
      </div>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-12 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-300 border-t-blue-700 rounded-full mx-auto"
          />
          <p className="mt-4 text-blue-700 font-semibold">Loading timetables...</p>
        </motion.div>
      )}

      {!loading && classrooms.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-12 text-center backdrop-blur-sm bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-200"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Calendar className="w-16 h-16 text-blue-300 mx-auto" />
          </motion.div>
          <p className="mt-4 text-blue-700 font-semibold">You have not joined any classes yet.</p>
        </motion.div>
      )}

      {!loading && classrooms.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <label className="text-sm text-blue-800 font-semibold">Class:</label>
              <motion.select
                value={selectedClassIdx}
                onChange={(e) => setSelectedClassIdx(parseInt(e.target.value, 10))}
                className="px-4 py-2 backdrop-blur-xl bg-white/80 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md font-semibold text-blue-900"
                whileFocus={{ scale: 1.02 }}
              >
                {classrooms.map((c, i) => (
                  <option key={c.slug} value={i}>{c.name || c.slug}</option>
                ))}
              </motion.select>
            </motion.div>

            <div className="flex items-center gap-3">
              <motion.button
                onClick={goPrevDay}
                className="px-4 py-2 backdrop-blur-xl bg-white/80 border-2 border-blue-200 rounded-xl font-semibold text-blue-800 shadow-sm hover:shadow-lg transition-all hover:bg-blue-50"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Prev
              </motion.button>
              <motion.div
                key={selectedDayIdx}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg min-w-[120px] text-center"
              >
                {DAYS[selectedDayIdx]}
              </motion.div>
              <motion.button
                onClick={goNextDay}
                className="px-4 py-2 backdrop-blur-xl bg-white/80 border-2 border-blue-200 rounded-xl font-semibold text-blue-800 shadow-sm hover:shadow-lg transition-all hover:bg-blue-50"
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.95 }}
              >
                Next →
              </motion.button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedClassIdx}-${selectedDayIdx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TimetableGrid timetable={classrooms[selectedClassIdx]?.timetable} day={DAYS[selectedDayIdx]} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

function TimetableGrid({ timetable, day }: { timetable?: TimetableData | null; day: string }) {
  if (!timetable) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-12 text-center backdrop-blur-sm bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-200"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <BookOpen className="w-16 h-16 text-blue-300 mx-auto" />
        </motion.div>
        <p className="mt-4 text-blue-700 font-semibold">No timetable available for this class.</p>
      </motion.div>
    );
  }

  const slots = timetable.slots || [];

  return (
    <div className="overflow-x-auto rounded-2xl backdrop-blur-xl bg-white/50 border border-blue-200/50 shadow-lg">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="text-left text-sm backdrop-blur-xl bg-linear-to-r from-blue-100 to-indigo-100 border-b-2 border-blue-200">
            <th className="p-4 w-40 font-bold text-blue-900 rounded-tl-2xl">Time</th>
            <th className="p-4 font-bold text-blue-900">{day}</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, index) => {
            const cell = timetable.schedule?.[day]?.[slot.id];
            return (
              <motion.tr
                key={slot.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-blue-100 hover:bg-white/70 transition-all duration-300"
                whileHover={{ scale: 1.01 }}
              >
                <td className="p-4 align-top text-sm font-mono bg-linear-to-r from-blue-50/50 to-transparent">
                  <motion.div
                    className="space-y-1"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="font-bold text-blue-900">
                      {slot.start.hour}:{slot.start.min} {slot.start.period}
                    </div>
                    <div className="text-xs text-blue-400 font-semibold">to</div>
                    <div className="font-bold text-blue-900">
                      {slot.end.hour}:{slot.end.min} {slot.end.period}
                    </div>
                  </motion.div>
                </td>
                <td className="p-4 align-top">
                  {cell ? (
                    <CellDisplay data={cell} />
                  ) : (
                    <motion.div
                      className="text-blue-300 italic font-medium"
                      whileHover={{ scale: 1.05 }}
                    >
                      No entry
                    </motion.div>
                  )}
                </td>
              </motion.tr>
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
      <motion.div
        className="flex items-center gap-3 p-3 rounded-xl bg-linear-to-r from-orange-100 to-yellow-100 border-2 border-orange-300"
        whileHover={{ scale: 1.05, x: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <motion.div
          whileHover={{ rotate: [0, -15, 15, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Utensils className="w-5 h-5 text-orange-700" />
        </motion.div>
        <span className="font-bold text-orange-800">Lunch Break</span>
      </motion.div>
    );
  }
  if (data.type === "shortbreak") {
    return (
      <motion.div
        className="flex items-center gap-3 p-3 rounded-xl bg-linear-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300"
        whileHover={{ scale: 1.05, x: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Coffee className="w-5 h-5 text-amber-700" />
        </motion.div>
        <span className="font-bold text-amber-800">Short Break</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-xl bg-linear-to-r from-blue-100 to-indigo-100 border-2 border-blue-300"
      whileHover={{ scale: 1.05, x: 5 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        <BookOpen className="w-5 h-5 text-blue-700" />
      </motion.div>
      <div>
        <div className="text-sm font-bold text-blue-900">{data.subject || "Class"}</div>
        <div className="text-xs text-blue-600 font-semibold">Period</div>
      </div>
    </motion.div>
  );
}

// Dashboard Content Component
function DashboardContent({ studentData }: { studentData: any }) {
  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-blue-300/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "10%", left: "5%" }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-indigo-300/30 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ bottom: "10%", right: "10%" }}
        />
        <motion.div
          className="absolute w-72 h-72 bg-blue-400/30 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -70, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "50%", right: "20%" }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-2xl bg-white/70 rounded-3xl shadow-2xl p-6 md:p-10 border border-blue-200/40"
        >
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-4 mb-3">
              <motion.div
                className="p-4 bg-linear-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-2xl shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.8 }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-800 via-indigo-700 to-blue-900 bg-clip-text text-transparent">
                  Student Dashboard
                </h1>
                {studentData && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-blue-700 mt-2 text-lg font-semibold"
                  >
                    Welcome back, <span className="font-bold">{studentData.name}</span>! ✨
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Info Cards Grid */}
          {studentData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="backdrop-blur-xl bg-linear-to-br from-blue-50/80 to-indigo-100/80 rounded-3xl p-6 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <motion.div
                    className="p-3 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Users className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 className="font-bold text-xl text-blue-900">Your Information</h3>
                </div>
                <div className="space-y-3">
                  <InfoRow icon="🎓" label="Class" value={`${studentData.std} - ${studentData.div}`} />
                  <InfoRow icon="🎯" label="Roll No" value={studentData.rollNo} />
                  <InfoRow icon="🏫" label="School" value={studentData.school} />
                  <InfoRow icon="📧" label="Parent Email" value={studentData.parentEmail} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="backdrop-blur-xl bg-linear-to-br from-indigo-50/80 to-blue-100/80 rounded-3xl p-6 border-2 border-indigo-200 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <motion.div
                    className="p-3 bg-linear-to-br from-indigo-600 to-blue-600 rounded-xl shadow-lg"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <TrendingUp className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 className="font-bold text-xl text-indigo-900">Quick Stats</h3>
                </div>
                <div className="space-y-3">
                  <StatRow icon="📚" label="Enrolled Classes" value="0" color="from-blue-600 to-indigo-600" />
                  <StatRow icon="📝" label="Assignments" value="0" color="from-indigo-600 to-blue-700" />
                  <StatRow icon="📊" label="Attendance" value="0%" color="from-blue-700 to-indigo-700" />
                </div>
              </motion.div>
            </div>
          )}

          {/* Timetable Panel */}
          {studentData && <TimetablePanel studentData={studentData} />}

          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center py-16 mt-10 backdrop-blur-xl bg-linear-to-br from-blue-50/60 via-indigo-50/60 to-slate-50/60 rounded-3xl border-2 border-blue-200/50"
          >
            <motion.div
              className="text-8xl mb-6"
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              🎓
            </motion.div>
            <motion.h2
              className="text-3xl font-bold bg-linear-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Welcome to Your Learning Hub
            </motion.h2>
            <motion.p
              className="text-blue-700 text-lg max-w-2xl mx-auto font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Use the sidebar to navigate to your classes, assignments, and track your progress
            </motion.p>
            
            {/* Floating Action Hints */}
            <motion.div
              className="flex flex-wrap justify-center gap-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <motion.div
                className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg"
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Brain className="w-5 h-5" />
                <span className="font-semibold">AI Learn</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-blue-700 text-white rounded-2xl shadow-lg"
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold">Study Hub</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-700 to-indigo-700 text-white rounded-2xl shadow-lg"
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <CheckSquare className="w-5 h-5" />
                <span className="font-semibold">Tasks</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Info Row Component with Animations
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <motion.div
      className="flex items-center gap-3 p-3 backdrop-blur-sm bg-white/60 rounded-xl border border-blue-200 hover:border-blue-400 transition-all duration-300"
      whileHover={{ x: 5, scale: 1.02 }}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <span className="font-bold text-blue-800 text-sm">{label}:</span>
        <span className="ml-2 text-blue-900 font-semibold">{value}</span>
      </div>
    </motion.div>
  );
}

// Stat Row Component with Animations
function StatRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <motion.div
      className="flex items-center gap-3 p-3 backdrop-blur-sm bg-white/60 rounded-xl border border-indigo-200 hover:border-indigo-400 transition-all duration-300 group"
      whileHover={{ x: 5, scale: 1.02 }}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 flex items-center justify-between">
        <span className="font-bold text-indigo-800 text-sm">{label}:</span>
        <motion.span
          className={`ml-2 px-4 py-1 bg-linear-to-r ${color} text-white font-bold rounded-full text-sm shadow-md`}
          whileHover={{ scale: 1.1 }}
        >
          {value}
        </motion.span>
      </div>
    </motion.div>
  );
}