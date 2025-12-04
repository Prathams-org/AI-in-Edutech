"use client";

import React from "react";

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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Overview</h2>
        <p className="text-gray-600">Classroom statistics and quick insights</p>
      </div>

      {/* Stats Cards */}


      {/* Classroom Info */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Classroom Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Classroom Code</p>
            <p className="text-lg font-semibold text-purple-600 font-mono">{classroom.slug}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Join Permission</p>
            <p className="text-lg font-semibold">{classroom.requiresPermission ? "Required" : "Open"}</p>
          </div>
          {classroom.school && (
            <div>
              <p className="text-sm text-gray-600">School</p>
              <p className="text-lg font-semibold">{classroom.school}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Teacher</p>
            <p className="text-lg font-semibold">{classroom.teacherName}</p>
          </div>
        </div>
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
