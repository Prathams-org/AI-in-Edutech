"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getClassroomStudents,
  updateClassroomPermission,
  acceptStudentRequest,
  rejectStudentRequest,
  StudentInClassroom,
} from "@/lib/auth";
import {
  Loader2,
  Users,
  Clock,
  Check,
  X,
  Mail,
  Shield,
  ShieldOff,
} from "lucide-react";

export default function Students() {
  const params = useParams();
  const classroomSlug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentInClassroom[]>([]);
  const [requiresPermission, setRequiresPermission] = useState(false);
  const [updatingPermission, setUpdatingPermission] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [classroomSlug]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const result = await getClassroomStudents(classroomSlug);
      if (result.success) {
        setStudents(result.students || []);
        setRequiresPermission(result.requiresPermission || false);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = async (checked: boolean) => {
    try {
      setUpdatingPermission(true);
      const result = await updateClassroomPermission(classroomSlug, checked);
      if (result.success) {
        setRequiresPermission(checked);
      } else {
        alert(result.error || "Failed to update permission setting");
      }
    } catch (error: any) {
      alert(error.message || "Failed to update permission setting");
    } finally {
      setUpdatingPermission(false);
    }
  };

  const handleAcceptStudent = async (studentId: string) => {
    try {
      const result = await acceptStudentRequest(classroomSlug, studentId);
      if (result.success) {
        loadStudents();
      } else {
        alert(result.error || "Failed to accept student");
      }
    } catch (error: any) {
      alert(error.message || "Failed to accept student");
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    try {
      const result = await rejectStudentRequest(classroomSlug, studentId);
      if (result.success) {
        loadStudents();
      } else {
        alert(result.error || "Failed to reject student");
      }
    } catch (error: any) {
      alert(error.message || "Failed to reject student");
    }
  };

  const joinedStudents = students.filter((s) => s.status === "joined");
  const pendingStudents = students.filter((s) => s.status === "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="backdrop-blur-2xl bg-white/5 border border-white/15 rounded-2xl px-8 py-6 flex items-center gap-3 shadow-lg shadow-slate-900/70">
          <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-cyan-300 animate-spin" />
          <p className="text-slate-100/90 text-sm">Loading students…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white/95 tracking-tight">
          Students
        </h2>
        <p className="text-slate-300/70 text-xs sm:text-sm mt-1">
          Manage enrolled students and permissions
        </p>
      </div>

      {/* Permission Toggle Card */}
      <div className="rounded-3xl backdrop-blur-3xl bg-white/7 border border-white/15 shadow-[0_22px_55px_rgba(15,23,42,0.85)] px-6 sm:px-8 py-6 sm:py-7 overflow-hidden">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {requiresPermission ? (
              <div className="p-2.5 rounded-full bg-sky-400/20 border border-sky-400/40">
                <Shield className="w-5 h-5 text-sky-300" />
              </div>
            ) : (
              <div className="p-2.5 rounded-full bg-slate-400/20 border border-slate-400/40">
                <ShieldOff className="w-5 h-5 text-slate-300" />
              </div>
            )}
            <div className="flex flex-col">
              <Label htmlFor="permission-toggle" className="text-sm font-semibold text-slate-100 cursor-pointer">
                Require Permission
              </Label>
              <p className="text-xs text-slate-400">
                {requiresPermission
                  ? "Students need approval to join"
                  : "Students can join freely"}
              </p>
            </div>
          </div>
          <Switch
            id="permission-toggle"
            checked={requiresPermission}
            onCheckedChange={handlePermissionToggle}
            disabled={updatingPermission}
          />
        </div>
      </div>

      {/* Students Tabs */}
      <div className="rounded-3xl backdrop-blur-3xl bg-white/7 border border-white/15 shadow-[0_22px_55px_rgba(15,23,42,0.85)] overflow-hidden">
        <Tabs defaultValue="joined" className="w-full">
          <TabsList className="w-full flex justify-start gap-0 bg-white/5 border-b border-white/10 rounded-none">
            <TabsTrigger value="joined" className="flex items-center gap-2 rounded-none border-b-2 data-[state=active]:border-cyan-300 data-[state=active]:bg-transparent text-slate-300 data-[state=active]:text-cyan-300 px-6 py-3 text-sm sm:text-base">
              <Users className="w-4 h-4" />
              <span>Joined ({joinedStudents.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="flex items-center gap-2 rounded-none border-b-2 data-[state=active]:border-cyan-300 data-[state=active]:bg-transparent text-slate-300 data-[state=active]:text-cyan-300 px-6 py-3 text-sm sm:text-base"
              disabled={!requiresPermission}
            >
              <Clock className="w-4 h-4" />
              <span>Pending ({pendingStudents.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Joined Students Tab */}
          <TabsContent value="joined" className="space-y-3 p-6">
            {joinedStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-400/50 mx-auto mb-4" />
                <p className="text-slate-400">No students have joined yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {joinedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/8 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-400/20 border border-cyan-400/40 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-cyan-300" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-100">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.email}</p>
                        <div className="flex gap-2 mt-1">
                          {student.std && (
                            <span className="text-xs text-slate-500">
                              Class: {student.std}-{student.div}
                            </span>
                          )}
                          {student.rollNo && (
                            <span className="text-xs text-slate-500">
                              Roll: {student.rollNo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 border border-green-400/40 text-green-300 text-xs">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Students Tab */}
          <TabsContent value="pending" className="space-y-3 p-6">
            {!requiresPermission ? (
              <div className="text-center py-12">
                <ShieldOff className="w-12 h-12 text-slate-400/50 mx-auto mb-4" />
                <p className="text-slate-300">Permission approval is disabled</p>
                <p className="text-xs text-slate-500 mt-2">
                  Enable "Require Permission" to review student requests
                </p>
              </div>
            ) : pendingStudents.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-400/50 mx-auto mb-4" />
                <p className="text-slate-400">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-2xl hover:bg-yellow-500/15 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-400/20 border border-yellow-400/40 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-300" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-100">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.email}</p>
                        <div className="flex gap-2 mt-1">
                          {student.std && (
                            <span className="text-xs text-slate-500">
                              Class: {student.std}-{student.div}
                            </span>
                          )}
                          {student.rollNo && (
                            <span className="text-xs text-slate-500">
                              Roll: {student.rollNo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptStudent(student.id)}
                        className="text-xs bg-green-500/20 border border-green-400/40 text-green-300 hover:bg-green-500/30 rounded-lg"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRejectStudent(student.id)}
                        className="text-xs bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30 rounded-lg"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
