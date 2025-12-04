"use client";

import React, { useState } from "react";
import { FileText, Calendar, Clock, AlertCircle, CheckCircle, Eye, Download } from "lucide-react";

interface Exam {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  totalQuestions: number;
  status: "upcoming" | "ongoing" | "completed";
  score?: number;
  totalScore?: number;
  description: string;
}

interface ExamCornerProps {
  exams?: Exam[];
}

export default function ExamCorner({ exams }: ExamCornerProps) {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "ongoing" | "completed">(
    "all"
  );

  const defaultExams: Exam[] = [
    {
      id: "1",
      title: "Mathematics Final Exam",
      subject: "Mathematics",
      date: "2024-12-15",
      time: "10:00 AM",
      duration: "2 hours",
      totalQuestions: 50,
      status: "upcoming",
      description: "Comprehensive exam covering algebra, geometry, and calculus",
    },
    {
      id: "2",
      title: "English Literature Quiz",
      subject: "English",
      date: "2024-12-10",
      time: "2:00 PM",
      duration: "1 hour",
      totalQuestions: 30,
      status: "upcoming",
      description: "Test on Shakespeare and contemporary literature",
    },
    {
      id: "3",
      title: "Science Midterm",
      subject: "Science",
      date: "2024-12-05",
      time: "1:00 PM",
      duration: "1.5 hours",
      totalQuestions: 40,
      status: "completed",
      score: 85,
      totalScore: 100,
      description: "Physics, Chemistry, and Biology concepts",
    },
    {
      id: "4",
      title: "History Exam",
      subject: "History",
      date: "2024-12-08",
      time: "3:00 PM",
      duration: "2 hours",
      totalQuestions: 35,
      status: "completed",
      score: 78,
      totalScore: 100,
      description: "Ancient to modern world history",
    },
  ];

  const allExams = exams || defaultExams;

  const filteredExams = allExams.filter((exam) =>
    filterStatus === "all" ? true : exam.status === filterStatus
  );

  const stats = {
    upcoming: allExams.filter((e) => e.status === "upcoming").length,
    completed: allExams.filter((e) => e.status === "completed").length,
    avgScore:
      allExams
        .filter((e) => e.status === "completed" && e.score)
        .reduce((sum, e) => sum + (e.score || 0), 0) / allExams.filter((e) => e.status === "completed").length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Exam Corner</h1>
          <p className="text-gray-600 mt-1">Manage your exams and track your performance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Upcoming Exams</p>
                <p className="text-3xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Completed Exams</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Average Score</p>
                <p className="text-3xl font-bold text-purple-600">{stats.avgScore.toFixed(1)}%</p>
              </div>
              <FileText className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                filterStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("upcoming")}
              className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                filterStatus === "upcoming"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                filterStatus === "completed"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Exams Grid */}
        <div className="space-y-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
            >
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{exam.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{exam.description}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                        exam.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : exam.status === "ongoing"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {exam.status === "completed"
                        ? "Completed"
                        : exam.status === "ongoing"
                        ? "Ongoing"
                        : "Upcoming"}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">Subject</p>
                      <p className="text-sm text-gray-800">{exam.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Date
                      </p>
                      <p className="text-sm text-gray-800">
                        {new Date(exam.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Time
                      </p>
                      <p className="text-sm text-gray-800">{exam.time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">Duration</p>
                      <p className="text-sm text-gray-800">{exam.duration}</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      <strong>Questions:</strong> {exam.totalQuestions}
                    </span>
                    {exam.status === "completed" && exam.score !== undefined && (
                      <span className="font-semibold">
                        <strong>Score:</strong>{" "}
                        <span className="text-green-600">
                          {exam.score}/{exam.totalScore}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Section - Buttons */}
                <div className="flex flex-col gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setSelectedExam(exam)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-semibold text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </button>
                  {exam.status === "completed" && (
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors font-semibold text-sm">
                      <Download className="w-4 h-4" />
                      Result
                    </button>
                  )}
                  {exam.status === "upcoming" && (
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors font-semibold text-sm">
                      <FileText className="w-4 h-4" />
                      Start Exam
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredExams.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Exams Found</h2>
            <p className="text-gray-600">Check back later for upcoming exams</p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedExam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedExam.title}</h2>
              <div className="space-y-3 mb-6">
                <p className="text-gray-600">{selectedExam.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Date:</strong>{" "}
                      {new Date(selectedExam.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Time:</strong> {selectedExam.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Duration:</strong> {selectedExam.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Questions:</strong> {selectedExam.totalQuestions}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedExam(null)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
