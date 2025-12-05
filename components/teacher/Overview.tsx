"use client";

import React from "react";
import { Users, ClipboardList, CheckCircle, Trophy } from "lucide-react";

interface OverviewProps {
  classroom: {
    name: string;
    school?: string;
    slug: string;
    requiresPermission: boolean;
    teacherName: string;
  };
}

export default function Overview({ classroom }: OverviewProps) {
  const StatCard = ({
    label,
    value,
    icon: Icon,
    glow,
  }: {
    label: string;
    value: string | number;
    icon: any;
    glow: string;
  }) => (
    <div className="relative rounded-3xl backdrop-blur-3xl bg-white/7 border border-white/15 shadow-[0_22px_55px_rgba(15,23,42,0.85)] px-6 py-6 flex items-center justify-between hover:bg-white/12 hover:border-white/25 transition-all duration-200 group overflow-hidden">
      {/* top glossy strip */}
      <div className="pointer-events-none absolute inset-x-4 -top-1 h-9 bg-gradient-to-b from-white/35 via-white/0 to-transparent opacity-70 rounded-t-[22px]" />
      
      <div className="relative z-10">
        <p className="text-xs sm:text-sm text-slate-200/70">{label}</p>
        <p className="text-3xl sm:text-4xl font-semibold text-white mt-1">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl shadow-lg border border-white/15 ${glow} relative z-10`}>
        <Icon size={28} className="text-slate-900" />
      </div>
      
      {/* subtle hover glow */}
      <div className="pointer-events-none absolute -inset-1 rounded-[26px] bg-gradient-to-br from-cyan-400/0 via-cyan-400/0 to-indigo-500/0 opacity-0 group-hover:opacity-30 blur-2xl transition-opacity" />
    </div>
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Heading */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white/95 tracking-tight">
          Overview
        </h2>
        <p className="text-slate-300/70 text-xs sm:text-sm mt-1">
          Quick insights & classroom intelligence
        </p>
      </div>

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
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-800">0</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>


      </div>

    </div>
  );
}
