"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Classroom } from "@/lib/auth";
import GlassLoadingAnimation from "@/components/ui/GlassLoadingAnimation";

interface OverviewProps {
  classroom: Classroom;
}

export default function Overview({ classroom }: OverviewProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Total Students", value: 0, icon: null as any, color: "" },
    { label: "Assignments", value: "0", icon: null as any, color: "" },
    { label: "Attendance", value: "0%", icon: null as any, color: "" },
    { label: "Exams", value: "0", icon: null as any, color: "" },
  ]);

  useEffect(() => {
    // Simulate a brief loading for smoothness or data processing
    const timer = setTimeout(() => {
      calculateStats();
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [classroom]);

  const calculateStats = () => {
    // robustly calculate students
    let studentCount = 0;
    if (classroom.students && Array.isArray(classroom.students)) {
      studentCount = classroom.students.filter(s => 
        typeof s === 'string' ? true : (s.status === "joined" || s.status === undefined)
      ).length;
    }

    setStats([
      { 
        label: "Total Students", 
        value: studentCount, 
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
    ]);
  };

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <GlassLoadingAnimation />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-slate-100 mb-2">Overview</h2>
        <p className="text-slate-400">Welcome back! Here's what's happening in your classroom.</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <span className="text-xs font-medium text-slate-400 bg-white/5 px-2 py-1 rounded-full border border-white/5">Last 30 days</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-100">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classroom Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/10"
        >
          <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <span className="text-2xl">🏫</span> Classroom Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Classroom Name</p>
              <p className="text-lg font-semibold text-slate-200">{classroom.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">School</p>
              <p className="text-lg font-semibold text-slate-200">{classroom.school || "Not specified"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Teacher</p>
              <p className="text-lg font-semibold text-slate-200">{classroom.teacherName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Created At</p>
              <p className="text-lg font-semibold text-slate-200">
                {classroom.createdAt?.seconds 
                  ? new Date(classroom.createdAt.seconds * 1000).toLocaleDateString() 
                  : "Unknown"}
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-indigo-300 mb-1">Quick Tip</h4>
                <p className="text-sm text-indigo-200/70">
                  You can manage your students and their permissions from the "Students" tab. 
                  Create new content and assignments in the "Content" tab.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity (Placeholder) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/10"
        >
          <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <span className="text-2xl">🕒</span> Recent Activity
          </h3>
          
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-2 h-2 mt-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
              <div>
                <p className="text-slate-300 text-sm">Classroom created</p>
                <p className="text-slate-500 text-xs mt-1">Just now</p>
              </div>
            </div>
            {/* Add more activity items here */}
            <div className="text-center pt-4">
              <p className="text-slate-500 text-sm italic">No more recent activity</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
