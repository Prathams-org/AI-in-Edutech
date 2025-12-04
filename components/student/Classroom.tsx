"use client";

import React, { useState } from "react";
import { Users, Plus, Clock, BookOpen, Link2, Settings } from "lucide-react";

interface Classroom {
  id: string;
  name: string;
  teacher: string;
  code: string;
  subject: string;
  students: number;
  joinedDate: string;
  status: "active" | "archived";
}

interface ClassroomProps {
  classrooms?: Classroom[];
}

export default function Classroom({ classrooms }: ClassroomProps) {
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [classCode, setClassCode] = useState("");

  const defaultClassrooms: Classroom[] = [
    {
      id: "1",
      name: "Mathematics 101",
      teacher: "Mr. Kumar",
      code: "MATH101",
      subject: "Mathematics",
      students: 35,
      joinedDate: "2024-01-15",
      status: "active",
    },
    {
      id: "2",
      name: "English Literature",
      teacher: "Mrs. Sharma",
      code: "ENG202",
      subject: "English",
      students: 28,
      joinedDate: "2024-01-20",
      status: "active",
    },
    {
      id: "3",
      name: "Science Lab",
      teacher: "Dr. Patel",
      code: "SCI303",
      subject: "Science",
      students: 42,
      joinedDate: "2024-02-01",
      status: "active",
    },
  ];

  const rooms = classrooms || defaultClassrooms;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Classrooms</h1>
            <p className="text-gray-600 mt-1">Manage your enrolled classes</p>
          </div>
          <button
            onClick={() => setShowJoinDialog(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Join Class
          </button>
        </div>

        {/* Join Class Dialog */}
        {showJoinDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Join a Classroom</h2>
              <p className="text-gray-600 mb-6">Enter the classroom code provided by your teacher</p>
              
              <input
                type="text"
                placeholder="Enter classroom code"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowJoinDialog(false);
                    setClassCode("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowJoinDialog(false);
                    setClassCode("");
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Classrooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((classroom) => (
            <div
              key={classroom.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{classroom.name}</h3>
                  <p className="text-sm text-gray-600">Code: {classroom.code}</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6 py-4 border-t border-b border-gray-200">
                <div className="flex items-center gap-3 text-sm">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">
                    <strong>Subject:</strong> {classroom.subject}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">
                    <strong>Students:</strong> {classroom.students}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-700">
                    <strong>Joined:</strong> {new Date(classroom.joinedDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Link2 className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-700">
                    <strong>Teacher:</strong> {classroom.teacher}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-semibold text-sm">
                  View
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-semibold text-sm">
                  Materials
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {rooms.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Classrooms Yet</h2>
            <p className="text-gray-600 mb-6">Join a classroom to get started</p>
            <button
              onClick={() => setShowJoinDialog(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Join Your First Class
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
