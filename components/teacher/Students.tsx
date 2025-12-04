"use client";

import React from "react";

export default function Students() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Students</h2>
        <p className="text-gray-600">Manage enrolled students and permissions</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Student Management</h3>
          <p className="text-gray-600">View and manage students enrolled in your classroom</p>
        </div>
      </div>
    </div>
  );
}
