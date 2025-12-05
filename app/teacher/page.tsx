"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  getTeacherClassrooms,
  createClassroom,
  Classroom,
  logout,
} from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Collaborate from "@/components/teacher/Collaborate";
import { BookOpen, Users, LogOut, Menu, X } from "lucide-react";

export default function TeacherClassroomsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"classrooms" | "collaborate">(
    "classrooms"
  );
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    school: "",
    requiresPermission: false,
  });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [teacherName, setTeacherName] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      loadTeacherData();
      loadClassrooms();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const loadTeacherData = async () => {
    if (!user) return;
    const { doc: docRef, getDoc: getDocFunc } = await import(
      "firebase/firestore"
    );
    const { db } = await import("@/lib/firebase");
    const teacherDoc = await getDocFunc(docRef(db, "teachers", user.uid));
    if (teacherDoc.exists()) {
      setTeacherName(teacherDoc.data().name || "");
    }
  };

  const loadClassrooms = async () => {
    if (!user) return;
    setLoading(true);
    const result = await getTeacherClassrooms(user.uid);
    if (result.success && result.classrooms) {
      setClassrooms(result.classrooms);
    }
    setLoading(false);
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Classroom name is required");
      return;
    }
    if (!user) return;

    setCreating(true);
    const result = await createClassroom(
      user.uid,
      teacherName,
      formData.name,
      formData.school,
      formData.requiresPermission
    );

    if (result.success && result.slug) {
      setShowModal(false);
      setFormData({
        name: "",
        school: "",
        requiresPermission: false,
      });
      await loadClassrooms();
    } else {
      setError(result.error || "Failed to create classroom");
    }
    setCreating(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Loading state with glass spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* soft blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="backdrop-blur-2xl bg-white/5 border border-white/20 rounded-2xl px-10 py-8 flex flex-col items-center shadow-2xl shadow-cyan-500/10">
          <div className="h-14 w-14 rounded-full border-4 border-white/20 border-t-cyan-300 animate-spin mb-4" />
          <p className="text-slate-100/90 text-sm tracking-wide">
            Preparing your smart dashboard…
          </p>
        </div>
      </div>
    );
  }

  // If not logged in redirect to teacher login
  if (!user) {
    router.push("/login/teacher");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50 relative overflow-hidden flex flex-col">
      {/* background glass blobs */}
      <div className="pointer-events-none absolute -top-32 -left-16 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-30">
        <div className="backdrop-blur-2xl bg-slate-900/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileMenu((s) => !s)}
                className="md:hidden text-slate-100/80 hover:text-white transition"
              >
                {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
              </button>

              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 flex items-center justify-center font-bold text-slate-900 shadow-lg shadow-cyan-500/40">
                S
              </div>

              <div>
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-50">
                  Teacher Dashboard
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-300/70">
                  {teacherName || "Welcome"} • Smart-Tutoring Studio
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-100 hover:bg-white/10 hover:border-white/25 transition-all backdrop-blur-xl shadow-sm shadow-slate-900/60"
            >
              <LogOut size={16} className="opacity-80" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          {/* Mobile nav buttons */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-white/10 px-4 pb-3 pt-2 bg-slate-900/60 backdrop-blur-xl">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTab("classrooms");
                    setShowMobileMenu(false);
                  }}
                  className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === "classrooms"
                      ? "bg-white/20 text-white shadow-lg border border-white/30"
                      : "bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  My Classrooms
                </button>
                <button
                  onClick={() => {
                    setActiveTab("collaborate");
                    setShowMobileMenu(false);
                  }}
                  className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === "collaborate"
                      ? "bg-white/20 text-white shadow-lg border border-white/30"
                      : "bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  Collaborate
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-10 sm:py-14 lg:py-16">
          {/* Space above hero */}
          <div className="h-10 sm:h-16" />

          {/* Hero / Heading panel */}
          <section className="relative mb-10 sm:mb-14">
            <div className="backdrop-blur-3xl bg-white/5 border border-white/15 rounded-3xl px-6 sm:px-10 py-10 sm:py-12 shadow-[0_18px_60px_rgba(15,23,42,0.55)] overflow-hidden">
              {/* subtle highlight line */}
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent opacity-60" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <p className="inline-flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-[0.18em] text-cyan-100/80 mb-3">
                  <span className="h-1 w-1 rounded-full bg-cyan-300" />
                  AI-ASSISTED LEARNING SPACE
                  <span className="h-1 w-1 rounded-full bg-indigo-300" />
                </p>

                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold sm:font-bold leading-tight text-slate-50 drop-shadow-[0_4px_25px_rgba(15,23,42,0.9)]">
                  Learn with AI-Powered
                </h2>
                <h3 className="mt-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300">
                  Smart-Tutoring Classrooms
                </h3>

                <p className="mt-4 max-w-2xl text-sm sm:text-base text-slate-200/80">
                  Create rich, interactive classrooms, generate tests, and let AI
                  guide every student with personalized feedback and insights.
                </p>
              </div>

              {/* decorative blurred chips */}
              <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-cyan-300/15 blur-2xl" />
              <div className="pointer-events-none absolute right-4 -top-8 h-28 w-28 rounded-full bg-sky-400/15 blur-2xl" />
            </div>
          </section>

          {/* Tabs under hero */}
          <nav className="flex justify-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/40 px-1 py-1 backdrop-blur-2xl shadow-lg shadow-slate-900/60">
              <button
                onClick={() => setActiveTab("classrooms")}
                className={`flex items-center gap-2 rounded-full px-5 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "classrooms"
                    ? "bg-white/20 text-slate-50 shadow-[0_10px_35px_rgba(8,47,73,0.75)]"
                    : "text-slate-200/80 hover:bg-white/10"
                }`}
              >
                <BookOpen size={18} className="opacity-90" />
                My Classrooms
              </button>
              <button
                onClick={() => setActiveTab("collaborate")}
                className={`flex items-center gap-2 rounded-full px-5 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "collaborate"
                    ? "bg-white/20 text-slate-50 shadow-[0_10px_35px_rgba(8,47,73,0.75)]"
                    : "text-slate-200/80 hover:bg-white/10"
                }`}
              >
                <Users size={18} className="opacity-90" />
                Collaborate
              </button>
            </div>
          </nav>

          {/* Content panels */}
          <section className="relative">
            {/* Classrooms Tab */}
            {activeTab === "classrooms" && (
              <>
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="backdrop-blur-2xl bg-white/5 border border-white/15 rounded-2xl px-8 py-6 flex items-center gap-3 shadow-lg shadow-slate-900/70">
                      <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-cyan-300 animate-spin" />
                      <p className="text-slate-100/90 text-sm">
                        Fetching your classrooms…
                      </p>
                    </div>
                  </div>
                ) : classrooms.length === 0 ? (
                  <div className="backdrop-blur-3xl bg-white/5 border border-white/15 rounded-3xl px-8 sm:px-10 py-12 sm:py-16 text-center shadow-[0_24px_80px_rgba(15,23,42,0.85)]">
                    <div className="text-5xl mb-4">📚</div>
                    <h3 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">
                      No Classrooms Yet
                    </h3>
                    <p className="text-sm sm:text-base text-slate-200/85 max-w-xl mx-auto mb-8">
                      Start by creating your first classroom. Set permissions,
                      invite students, and let AI help you design better tests
                      and practice sets.
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 px-8 py-3 text-sm sm:text-base font-semibold text-slate-900 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/70 transform hover:-translate-y-0.5 transition-all"
                    >
                      + Create Classroom
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="
                      grid gap-7 sm:gap-8 justify-center mx-auto
                      grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                    "
                    >
                      {classrooms.map((classroom) => (
                        <button
                          key={classroom.id}
                          onClick={() =>
                            router.push(`/teacher/${classroom.slug}/dashboard`)
                          }
                          className="group relative text-left w-full max-w-md backdrop-blur-3xl bg-white/7 border border-white/15 rounded-3xl px-5 sm:px-6 py-5 sm:py-6 shadow-[0_22px_55px_rgba(15,23,42,0.85)] hover:shadow-[0_30px_70px_rgba(8,47,73,0.95)] hover:border-white/25 transition-all duration-200 overflow-hidden"
                        >
                          {/* top glossy strip */}
                          <div className="pointer-events-none absolute inset-x-4 -top-1 h-9 bg-gradient-to-b from-white/35 via-white/0 to-transparent opacity-70 rounded-t-[22px]" />

                          <div className="relative flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-300/90 via-sky-300 to-indigo-400 flex items-center justify-center shadow-md shadow-cyan-400/60">
                                <BookOpen
                                  size={22}
                                  className="text-slate-900/90"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs uppercase tracking-[0.18em] text-slate-200/70">
                                  Classroom
                                </span>
                                <h4 className="text-lg font-semibold text-slate-50">
                                  {classroom.name}
                                </h4>
                              </div>
                            </div>

                            {classroom.requiresPermission && (
                              <span className="inline-flex items-center rounded-full bg-sky-400/90 text-slate-900 text-[10px] font-semibold px-3 py-1 shadow-md shadow-sky-500/40 whitespace-nowrap">
                                Permission Required
                              </span>
                            )}
                          </div>

                          {classroom.school && (
                            <p className="relative text-sm text-slate-100/85 mb-1 flex items-center gap-2">
                              <span className="text-lg leading-none">🏫</span>
                              <span>{classroom.school}</span>
                            </p>
                          )}

                          <p className="relative text-xs sm:text-sm text-slate-300/85">
                            Click to open dashboard and manage tests, notes, and
                            AI insights.
                          </p>

                          {/* subtle hover glow */}
                          <div className="pointer-events-none absolute -inset-1 rounded-[26px] bg-gradient-to-br from-cyan-400/0 via-cyan-400/0 to-indigo-500/0 opacity-0 group-hover:opacity-30 blur-2xl transition-opacity" />
                        </button>
                      ))}
                    </div>

                    <div className="text-center mt-10">
                      <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center rounded-full bg-white/8 border border-white/20 px-7 py-2.5 text-sm font-medium text-slate-50 hover:bg-white/15 hover:border-white/35 backdrop-blur-2xl shadow-md shadow-slate-900/70 transition-all"
                      >
                        + Create another classroom
                      </button>
                    </div>

                    {/* Benefits Section */}
                    <div className="mt-20 pt-16 border-t border-white/10">
                      <h3 className="text-center text-2xl sm:text-3xl font-bold text-white/95 mb-4">
                        Why Smart-Tutoring Works
                      </h3>
                      <p className="text-center text-slate-300/70 text-sm sm:text-base mb-12 max-w-2xl mx-auto">
                        Empower your teaching with AI-assisted personalized learning
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Personalized Learning */}
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-300/90 via-rose-300 to-orange-300 flex items-center justify-center shadow-lg shadow-rose-500/40">
                              🎯
                            </div>
                          </div>
                          <h4 className="text-lg sm:text-xl font-semibold text-white mb-3">
                            Personalized Learning
                          </h4>
                          <p className="text-slate-300/85 text-sm leading-relaxed">
                            Students practice at their own pace, first filling in gaps in their understanding and then accelerating their learning.
                          </p>
                        </div>

                        {/* Trusted Content */}
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-300/90 via-teal-300 to-cyan-300 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                              🏛️
                            </div>
                          </div>
                          <h4 className="text-lg sm:text-xl font-semibold text-white mb-3">
                            Trusted Content
                          </h4>
                          <p className="text-slate-300/85 text-sm leading-relaxed">
                            Created by experts. It's all free for learners and teachers.
                          </p>
                        </div>

                        {/* Empower Teachers */}
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300/90 via-orange-300 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/40">
                              ⚡
                            </div>
                          </div>
                          <h4 className="text-lg sm:text-xl font-semibold text-white mb-3">
                            Tools to Empower Teachers
                          </h4>
                          <p className="text-slate-300/85 text-sm leading-relaxed">
                            With Smart-Tutoring, teachers can identify gaps in their students' understanding, tailor instruction, and meet the needs of every student.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Collaborate Tab */}
          <Collaborate
  userId={user.uid}
  classrooms={classrooms}
  onUpdate={loadClassrooms}
  open={activeTab === "collaborate"}
  onClose={() => setActiveTab("classrooms")}
/>

          </section>
        </div>
      </main>

      {/* Create Classroom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          {/* dark glass overlay */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
            onClick={() => setShowModal(false)}
          />
          <div className="relative max-w-md w-full backdrop-blur-3xl bg-slate-900/60 border border-white/15 rounded-3xl px-6 sm:px-8 py-7 sm:py-8 shadow-[0_32px_90px_rgba(0,0,0,0.95)]">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-50">
                  Create New Classroom
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-300/80">
                  Name your classroom and set how students can join.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full p-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200/80"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateClassroom} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-slate-200/90 mb-1.5"
                >
                  Classroom Name <span className="text-rose-300">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-slate-50 placeholder:text-slate-400/70 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 focus:border-cyan-200/80 shadow-inner shadow-slate-900/70"
                  placeholder="e.g., Grade 10 - Algebra"
                />
              </div>

              <div>
                <label
                  htmlFor="school"
                  className="block text-xs font-medium text-slate-200/90 mb-1.5"
                >
                  School Name{" "}
                  <span className="text-slate-400 text-[11px]">(optional)</span>
                </label>
                <input
                  id="school"
                  type="text"
                  value={formData.school}
                  onChange={(e) =>
                    setFormData({ ...formData, school: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-slate-50 placeholder:text-slate-400/70 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 focus:border-cyan-200/80 shadow-inner shadow-slate-900/70"
                  placeholder="e.g., Loyola High School"
                />
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/15 px-3 py-2.5">
                <Checkbox
                  id="permission"
                  checked={formData.requiresPermission}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      requiresPermission: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor="permission"
                  className="text-xs sm:text-sm text-slate-100/90 cursor-pointer"
                >
                  Students must request permission to join this classroom.
                </Label>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 shadow-inner shadow-rose-950/40">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                    setFormData({
                      name: "",
                      school: "",
                      requiresPermission: false,
                    });
                  }}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/60 hover:shadow-cyan-400/80 disabled:opacity-60 disabled:shadow-none transition-all"
                >
                  {creating ? "Creating..." : "Create Classroom"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
