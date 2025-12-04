"use client";

import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Book, Calendar, Edit2 } from "lucide-react";

interface StudentProfile {
  name: string;
  email: string;
  phone: string;
  std: string;
  div: string;
  rollNo: string;
  school: string;
  parentEmail: string;
  joinDate: string;
  profileImage?: string;
}

interface ProfileProps {
  data?: StudentProfile;
  onEdit?: () => void;
}

export default function Profile({ data, onEdit }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);

  const defaultData: StudentProfile = {
    name: "Student Name",
    email: "student@example.com",
    phone: "+91 XXXXXXXXXX",
    std: "12",
    div: "A",
    rollNo: "001",
    school: "ABC School",
    parentEmail: "parent@example.com",
    joinDate: "2024-01-15",
  };

  const profile = data || defaultData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
              <p className="text-gray-600 mt-1">Manage your profile information</p>
            </div>
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                onEdit?.();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          {/* Profile Card */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white mb-4">
                <User className="w-16 h-16" />
              </div>
              {isEditing && (
                <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors text-sm">
                  Change Photo
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  readOnly={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isEditing
                      ? "border-blue-300 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : "border-gray-300 bg-gray-50 text-gray-700"
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  readOnly={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isEditing
                      ? "border-blue-300 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : "border-gray-300 bg-gray-50 text-gray-700"
                  }`}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  readOnly={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isEditing
                      ? "border-blue-300 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : "border-gray-300 bg-gray-50 text-gray-700"
                  }`}
                />
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Book className="w-4 h-4" />
                  Class
                </label>
                <input
                  type="text"
                  value={`${profile.std}-${profile.div}`}
                  readOnly={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isEditing
                      ? "border-blue-300 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : "border-gray-300 bg-gray-50 text-gray-700"
                  }`}
                />
              </div>

              {/* Roll No */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={profile.rollNo}
                  readOnly={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isEditing
                      ? "border-blue-300 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : "border-gray-300 bg-gray-50 text-gray-700"
                  }`}
                />
              </div>

              {/* School */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  School
                </label>
                <input
                  type="text"
                  value={profile.school}
                  readOnly={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isEditing
                      ? "border-blue-300 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : "border-gray-300 bg-gray-50 text-gray-700"
                  }`}
                />
              </div>

              {/* Parent Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parent Email
                </label>
                <input
                  type="email"
                  value={profile.parentEmail}
                  readOnly={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isEditing
                      ? "border-blue-300 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : "border-gray-300 bg-gray-50 text-gray-700"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Join Date */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Joined on {new Date(profile.joinDate).toLocaleDateString()}</span>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors font-semibold"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold">
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
