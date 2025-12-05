"use client";

import React from "react";
import { motion } from "framer-motion";
import { Classroom } from "@/lib/auth";

interface OverviewProps {
  classroom: Classroom;
}

export default function Overview({ classroom }: OverviewProps) {
  const totalStudents = classroom.students?.filter(s => s.status === "joined").length || 0;

  const stats = [
    { 
      label: "Total Students", 
      value: totalStudents, 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: "from-purple-500 to-indigo-500"
    },
    { 
      label: "Assignments", 
      value: "0", 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "from-pink-500 to-rose-500"
    },
    { 
      label: "Attendance", 
      value: "0%", 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: "from-blue-500 to-cyan-500"
    },
    { 
      label: "Exams", 
      value: "0", 
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-emerald-500 to-teal-500"
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Overview</h2>
        <p className="text-gray-500">Welcome back! Here's what's happening in your classroom.</p>
      </motion.div>

<<<<<<< HEAD
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <StatCard
          label="Students"
          value="0"
          icon={Users}
          glow="bg-cyan-300/90 shadow-cyan-500/40"
        />
        <StatCard
          label="Assignments"
          value="0"
          icon={ClipboardList}
          glow="bg-pink-300/90 shadow-pink-500/40"
        />
        <StatCard
          label="Attendance"
          value="0%"
          icon={CheckCircle}
          glow="bg-indigo-300/90 shadow-indigo-500/40"
        />
        <StatCard
          label="Exams"
          value="0"
          icon={Trophy}
          glow="bg-green-300/90 shadow-green-500/40"
        />
      </div>
=======
      {/* Stats Cards */}
<<<<<<< HEAD
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg shadow-gray-100 p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-md`}>
                {stat.icon}
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Last 30 days</span>
            </div>
=======

>>>>>>> cc3e1ae4249e9998d3bbfc02f8b7f8e359fa8542

      {/* Classroom Info */}
      <div className="rounded-3xl backdrop-blur-3xl bg-white/7 border border-white/15 shadow-[0_22px_55px_rgba(15,23,42,0.85)] px-6 sm:px-8 py-8 sm:py-10 overflow-hidden relative group">
        {/* top glossy strip */}
        <div className="pointer-events-none absolute inset-x-4 -top-1 h-9 bg-gradient-to-b from-white/35 via-white/0 to-transparent opacity-70 rounded-t-[22px]" />
        
        <div className="relative z-10">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">
            Classroom Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] sm:text-xs text-slate-300/80 uppercase tracking-[0.1em]">Class Code</p>
              <p className="text-lg sm:text-xl font-semibold text-cyan-300 font-mono mt-2">
                {classroom.slug}
              </p>
            </div>

            <div>
              <p className="text-[11px] sm:text-xs text-slate-300/80 uppercase tracking-[0.1em]">Permission</p>
              <p className="text-lg sm:text-xl font-semibold text-rose-300 mt-2">
                {classroom.requiresPermission ? "Required" : "Open"}
              </p>
            </div>

            {classroom.school && (
              <div>
                <p className="text-[11px] sm:text-xs text-slate-300/80 uppercase tracking-[0.1em]">School</p>
                <p className="text-base sm:text-lg font-semibold text-white/90 mt-2">
                  {classroom.school}
                </p>
              </div>
            )}

            <div>
              <p className="text-[11px] sm:text-xs text-slate-300/80 uppercase tracking-[0.1em]">Teacher</p>
              <p className="text-base sm:text-lg font-semibold text-white/90 mt-2">
                {classroom.teacherName}
              </p>
            </div>
          </div>
        </div>

        {/* subtle hover glow */}
        <div className="pointer-events-none absolute -inset-1 rounded-[26px] bg-gradient-to-br from-cyan-400/0 via-cyan-400/0 to-indigo-500/0 opacity-0 group-hover:opacity-30 blur-2xl transition-opacity" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
>>>>>>> 64b4d2b532b74ae83c85e3d9a941237768e6915e
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
<<<<<<< HEAD
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classroom Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-3xl shadow-lg shadow-gray-100 p-8 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
            Classroom Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
              <p className="text-sm font-medium text-purple-600 mb-2">Classroom Code</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-gray-800 font-mono tracking-wider">{classroom.slug}</p>
                <button 
                  onClick={() => navigator.clipboard.writeText(classroom.slug)}
                  className="p-2 hover:bg-purple-100 rounded-lg text-purple-600 transition-colors"
                  title="Copy Code"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500">Join Permission</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${classroom.requiresPermission ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                  {classroom.requiresPermission ? "Required" : "Open"}
                </span>
              </div>
              {classroom.school && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">School</span>
                  <span className="font-medium text-gray-800">{classroom.school}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500">Teacher</span>
                <span className="font-medium text-gray-800">{classroom.teacherName}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity Placeholder */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-3xl shadow-lg shadow-gray-100 p-8 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-pink-500 rounded-full"></span>
            Recent Activity
          </h3>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">New updates will appear here</p>
          </div>
        </motion.div>
      </div>
=======
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>


      </div>

>>>>>>> 64b4d2b532b74ae83c85e3d9a941237768e6915e
    </div>
  );
}
