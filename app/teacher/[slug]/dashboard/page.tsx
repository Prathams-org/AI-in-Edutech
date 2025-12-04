"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getClassroomBySlug, Classroom, logout } from "@/lib/auth";

export default function ClassroomDashboard() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/teacher")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                title="Back to classrooms"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
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
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{classroom.name}</h1>
                {classroom.school && (
                  <p className="text-sm text-gray-600">🏫 {classroom.school}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-purple-600">0</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Assignments</p>
                <p className="text-3xl font-bold text-pink-600">0</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-pink-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Announcements</p>
                <p className="text-3xl font-bold text-indigo-600">0</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Classroom Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Classroom Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Classroom Code:</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg font-mono">
                {classroom.slug}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Join Permission:</span>
              <span
                className={`px-3 py-1 rounded-lg ${
                  classroom.requiresPermission
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {classroom.requiresPermission ? "Required" : "Open to all"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] text-left">
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-semibold text-gray-800">Create Assignment</h3>
            <p className="text-sm text-gray-600">Add new homework</p>
          </button>

          <button className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] text-left">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold text-gray-800">Manage Students</h3>
            <p className="text-sm text-gray-600">View and organize</p>
          </button>

          <button className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] text-left">
            <div className="text-3xl mb-2">📢</div>
            <h3 className="font-semibold text-gray-800">Post Announcement</h3>
            <p className="text-sm text-gray-600">Notify students</p>
          </button>

          <button className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] text-left">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-800">View Analytics</h3>
            <p className="text-sm text-gray-600">Performance stats</p>
          </button>
        </div>

        {/* Demo Notice */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
          <p className="text-blue-800 font-semibold">
            🎉 This is a demo dashboard. Full features coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
