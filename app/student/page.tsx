"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { logout } from "@/lib/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function StudentDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadStudentData();
    }
  }, [authLoading, user]);

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
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
              {studentData && (
                <p className="text-gray-600 mt-1">Welcome back, {studentData.name}!</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              Logout
            </button>
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

          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Your Learning Hub
            </h2>
            <p className="text-gray-600 mb-6">
              Join classrooms, complete assignments, and track your progress
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <button className="bg-white border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
                <div className="text-3xl mb-2">📚</div>
                <h3 className="font-semibold text-gray-800">My Classes</h3>
              </button>
              
              <button className="bg-white border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
                <div className="text-3xl mb-2">✏️</div>
                <h3 className="font-semibold text-gray-800">Assignments</h3>
              </button>
              
              <button className="bg-white border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-800">Progress</h3>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
