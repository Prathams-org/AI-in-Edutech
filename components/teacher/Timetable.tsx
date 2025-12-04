"use client";

import React from "react";

export default function Timetable() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Timetable</h2>
        <p className="text-gray-600">Manage class schedule and timing</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Timetable Feature</h3>
          <p className="text-gray-600">Create and manage your class timetable here</p>
        </div>
      </div>
    </div>
  );
}
