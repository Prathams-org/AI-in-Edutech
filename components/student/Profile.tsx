"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Book, Calendar, Edit2, Save, X, School } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getStudentProfile, updateStudentProfile, StudentData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    std: "",
    div: "",
    rollNo: "",
    school: "",
    parentsNo: "",
    parentEmail: "",
    gender: "",
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    const result = await getStudentProfile(user.uid);

    if (result.success && result.student) {
      setStudentData(result.student);
      setFormData({
        name: result.student.name,
        std: result.student.std,
        div: result.student.div,
        rollNo: result.student.rollNo,
        school: result.student.school,
        parentsNo: result.student.parentsNo,
        parentEmail: result.student.parentEmail,
        gender: result.student.gender,
      });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to load profile" });
    }
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage(null);
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage(null);
    setErrors({});
    // Reset form data to original values
    if (studentData) {
      setFormData({
        name: studentData.name,
        std: studentData.std,
        div: studentData.div,
        rollNo: studentData.rollNo,
        school: studentData.school,
        parentsNo: studentData.parentsNo,
        parentEmail: studentData.parentEmail,
        gender: studentData.gender,
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setErrors({});
    setMessage(null);
    setIsSaving(true);

    const result = await updateStudentProfile(user.uid, formData);

    if (result.success) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
      await loadProfile();
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update profile" });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">Failed to load profile data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-10 pt-8">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        {/* Profile Form Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Header with video */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 rounded-full shadow-lg overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover rounded-full"
                  style={{ minWidth: '100%', minHeight: '100%' }}
                >
                  <source src="/mascotbg1.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-full"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-1">My Profile</h1>
                <p className="text-gray-600">Manage your personal information</p>
              </div>
            </div>
            {!isEditing ? (
              <Button
                onClick={handleEdit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-gray-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-600" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 text-gray-800"
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="gender" className="text-gray-700 font-medium">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-800 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Book className="w-5 h-5 mr-2 text-indigo-600" />
                Academic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="std" className="text-gray-700 font-medium">
                    Standard/Class <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="std"
                    name="std"
                    value={formData.std}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 text-gray-800"
                    placeholder="e.g., 10"
                  />
                  {errors.std && <p className="mt-1 text-sm text-red-600">{errors.std}</p>}
                </div>

                <div>
                  <Label htmlFor="div" className="text-gray-700 font-medium">
                    Division <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="div"
                    name="div"
                    value={formData.div}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 text-gray-800"
                    placeholder="e.g., A"
                  />
                  {errors.div && <p className="mt-1 text-sm text-red-600">{errors.div}</p>}
                </div>

                <div>
                  <Label htmlFor="rollNo" className="text-gray-700 font-medium">
                    Roll Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="rollNo"
                    name="rollNo"
                    value={formData.rollNo}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 text-gray-800"
                    placeholder="Enter roll number"
                  />
                  {errors.rollNo && <p className="mt-1 text-sm text-red-600">{errors.rollNo}</p>}
                </div>

                <div className="md:col-span-3">
                  <Label htmlFor="school" className="text-gray-700 font-medium">
                    School Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="school"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="mt-1 text-gray-800"
                    placeholder="Enter your school name"
                  />
                  {errors.school && <p className="mt-1 text-sm text-red-600">{errors.school}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-indigo-600" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentEmail" className="text-gray-700 font-medium">
                    Parent's Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="parentEmail"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    disabled={true}
                    className="mt-1 text-gray-800 bg-gray-100 cursor-not-allowed"
                    placeholder="parent@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  {errors.parentEmail && <p className="mt-1 text-sm text-red-600">{errors.parentEmail}</p>}
                </div>

                <div>
                  <Label htmlFor="parentsNo" className="text-gray-700 font-medium">
                    Parent's Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    id="parentsNo"
                    name="parentsNo"
                    value={formData.parentsNo}
                    onChange={handleChange}
                    disabled={!isEditing}
                    maxLength={10}
                    className="mt-1 text-gray-800"
                    placeholder="10-digit mobile number"
                  />
                  {errors.parentsNo && <p className="mt-1 text-sm text-red-600">{errors.parentsNo}</p>}
                </div>
              </div>
            </div>

            {/* Account Created */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Account created: {studentData.createdAt ? new Date(studentData.createdAt.toDate()).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Video Section */}

      </div>
    </div>
  );
}


