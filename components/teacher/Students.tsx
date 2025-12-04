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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Students</h2>
          <p className="text-gray-600">Manage enrolled students and permissions</p>
        </div>

        {/* Permission Toggle */}
        <Card className="w-auto">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {requiresPermission ? (
                <Shield className="w-5 h-5 text-purple-600" />
              ) : (
                <ShieldOff className="w-5 h-5 text-gray-400" />
              )}
              <div className="flex flex-col">
                <Label htmlFor="permission-toggle" className="cursor-pointer font-medium">
                  Require Permission
                </Label>
                <p className="text-xs text-gray-500">
                  {requiresPermission
                    ? "Students need approval to join"
                    : "Students can join freely"}
                </p>
              </div>
              <Switch
                id="permission-toggle"
                checked={requiresPermission}
                onCheckedChange={handlePermissionToggle}
                disabled={updatingPermission}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="joined" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="joined" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Joined ({joinedStudents.length})
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="flex items-center gap-2"
                disabled={!requiresPermission}
              >
                <Clock className="w-4 h-4" />
                Pending ({pendingStudents.length})
              </TabsTrigger>
            </TabsList>

            {/* Joined Students Tab */}
            <TabsContent value="joined" className="space-y-4 mt-4">
              {joinedStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No students have joined yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {joinedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{student.name}</p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <div className="flex gap-2 mt-1">
                            {student.std && (
                              <span className="text-xs text-gray-500">
                                Class: {student.std}-{student.div}
                              </span>
                            )}
                            {student.rollNo && (
                              <span className="text-xs text-gray-500">
                                Roll: {student.rollNo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Pending Students Tab */}
            <TabsContent value="pending" className="space-y-4 mt-4">
              {!requiresPermission ? (
                <div className="text-center py-12">
                  <ShieldOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Permission approval is disabled
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Enable "Require Permission" to review student requests
                  </p>
                </div>
              ) : pendingStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{student.name}</p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <div className="flex gap-2 mt-1">
                            {student.std && (
                              <span className="text-xs text-gray-500">
                                Class: {student.std}-{student.div}
                              </span>
                            )}
                            {student.rollNo && (
                              <span className="text-xs text-gray-500">
                                Roll: {student.rollNo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcceptStudent(student.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectStudent(student.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </CardContent>
      </Card>
    </div>
  );
}
