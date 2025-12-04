"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getTeacherClassrooms, createClassroom, Classroom, logout } from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Collaborate from "@/components/teacher/Collaborate";
import { BookOpen, Users } from "lucide-react";

export default function TeacherClassroomsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
    }
  }, [authLoading, user]);

  const loadTeacherData = async () => {
    if (!user) return;
    const { doc: docRef, getDoc: getDocFunc } = await import("firebase/firestore");
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
      setFormData({ name: "", school: "", requiresPermission: false });
      await loadClassrooms();
      // Optionally redirect to the new classroom
      // router.push(`/teacher/${result.slug}/dashboard`);
    } else {
      setError(result.error || "Failed to create classroom");
    }
    setCreating(false);
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
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your classrooms and collaborate</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="classrooms" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white p-1 rounded-lg shadow">
            <TabsTrigger value="classrooms" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4" />
              My Classrooms
            </TabsTrigger>
            <TabsTrigger value="collaborate" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Users className="w-4 h-4" />
              Collaborate
            </TabsTrigger>
          </TabsList>

          {/* Classrooms Tab */}
          <TabsContent value="classrooms" className="space-y-6">

        {classrooms.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Classrooms Yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first classroom to start teaching and managing students
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-3 bg-linear-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            >
              Create Classroom
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  onClick={() => router.push(`/teacher/${classroom.slug}/dashboard`)}
                  className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-linear-to-r from-purple-500 to-pink-600 rounded-lg">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    {classroom.requiresPermission && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Permission Required
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{classroom.name}</h3>
                  {classroom.school && (
                    <p className="text-gray-600 text-sm mb-2">🏫 {classroom.school}</p>
                  )}
                  <p className="text-gray-500 text-sm">Click to open dashboard</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-3 bg-linear-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg"
              >
                + Create New Classroom
              </button>
            </div>
          </>
        )}
          </TabsContent>

          {/* Collaborate Tab */}
          <TabsContent value="collaborate">
            {user && (
              <Collaborate 
                userId={user.uid} 
                classrooms={classrooms} 
                onUpdate={loadClassrooms}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Create Classroom Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Classroom</h2>
              
              <form onSubmit={handleCreateClassroom} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Classroom Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-gray-800"
                    placeholder="e.g., Mathematics 10-A"
                  />
                </div>

                <div>
                  <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                    School Name <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="school"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-gray-800"
                    placeholder="e.g., St. Mary's High School"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="permission"
                    checked={formData.requiresPermission}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiresPermission: checked as boolean })
                    }
                  />
                  <Label htmlFor="permission" className="text-sm text-gray-700 cursor-pointer">
                    Students need permission to join
                  </Label>
                </div>

                {error && (
                  <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">{error}</div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setError("");
                      setFormData({ name: "", school: "", requiresPermission: false });
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-3 bg-linear-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
