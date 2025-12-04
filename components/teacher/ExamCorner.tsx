"use client";

import React from "react";

export default function ExamCorner() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Exam Corner</h2>
        <p className="text-gray-600">Create and manage exams and assessments</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Examination Hub</h3>
          <p className="text-gray-600">Create tests, quizzes, and track student performance</p>
        </div>
      </div>
    </div>
  );
}
