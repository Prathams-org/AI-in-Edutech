"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCollaborationRequests,
  sendCollaborationRequest,
  acceptCollaborationRequest,
  rejectCollaborationRequest,
  cancelCollaborationRequest,
  addTeacherDirectly,
  getTeacherByEmail,
  CollaborationRequest,
  Classroom,
} from "@/lib/auth";
import {
  Loader2,
  UserPlus,
  Check,
  X,
  Mail,
  Clock,
  Users,
  Bell,
  BookOpen,
} from "lucide-react";

interface CollaborateProps {
  userId: string;
  classrooms: Classroom[];
  onUpdate: () => void;
}

export default function Collaborate({ userId, classrooms, onUpdate }: CollaborateProps) {
  const [mode, setMode] = useState<"add" | "request">("request");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [allRequests, setAllRequests] = useState<CollaborationRequest[]>([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadAllRequests();
  }, [classrooms]);

  const loadAllRequests = async () => {
    try {
      setRequestsLoading(true);
      const requestsPromises = classrooms.map((classroom) =>
        getCollaborationRequests(classroom.slug)
      );
      const results = await Promise.all(requestsPromises);
      
      const combined: CollaborationRequest[] = [];
      results.forEach((result) => {
        if (result.success && result.requests) {
          combined.push(...result.requests);
        }
      });
      
      setAllRequests(combined);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!teacherEmail.trim()) {
      setMessage({ type: "error", text: "Please enter a teacher's email" });
      return;
    }

    if (!selectedClassroom) {
      setMessage({ type: "error", text: "Please select a classroom" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      // Check if teacher exists
      const teacherResult = await getTeacherByEmail(teacherEmail.trim());
      if (!teacherResult.success || !teacherResult.teacher) {
        setMessage({ type: "error", text: "Teacher not found with this email" });
        return;
      }

      // Check if trying to add/request yourself
      if (teacherResult.teacher.uid === userId) {
        setMessage({ type: "error", text: "You cannot add or request yourself" });
        return;
      }

      let result;
      if (mode === "add") {
        result = await addTeacherDirectly(
          selectedClassroom,
          teacherResult.teacher.uid
        );
      } else {
        result = await sendCollaborationRequest(
          selectedClassroom,
          teacherResult.teacher.uid,
          userId
        );
      }

      if (result.success) {
        setMessage({
          type: "success",
          text: mode === "add" ? "Teacher added successfully!" : "Request sent successfully!",
        });
        setTeacherEmail("");
        setSelectedClassroom("");
        loadAllRequests();
        onUpdate();
      } else {
        setMessage({ type: "error", text: result.error || `Failed to ${mode} teacher` });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || `Failed to ${mode} teacher` });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (classroomSlug: string, requestId: string, requesterId: string) => {
    try {
      setLoading(true);
      const result = await acceptCollaborationRequest(
        classroomSlug,
        requestId,
        requesterId
      );

      if (result.success) {
        setMessage({ type: "success", text: "Request accepted!" });
        loadAllRequests();
        onUpdate();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to accept request" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to accept request" });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (classroomSlug: string, requestId: string) => {
    try {
      setLoading(true);
      const result = await rejectCollaborationRequest(classroomSlug, requestId);

      if (result.success) {
        setMessage({ type: "success", text: "Request rejected" });
        loadAllRequests();
        onUpdate();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to reject request" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to reject request" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (classroomSlug: string, requestId: string) => {
    try {
      setLoading(true);
      const result = await cancelCollaborationRequest(classroomSlug, requestId);

      if (result.success) {
        setMessage({ type: "success", text: "Request cancelled" });
        loadAllRequests();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to cancel request" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to cancel request" });
    } finally {
      setLoading(false);
    }
  };

  // Separate requests by type
  const myRequests = allRequests.filter((r) => r.requesterId === userId && r.status === "pending");
  const receivedRequests = allRequests.filter((r) => {
    const classroom = classrooms.find((c) => c.slug === r.classroomSlug);
    return classroom && classroom.teacherId === userId && r.status === "pending";
  });
  const acceptedRequests = allRequests.filter((r) => r.status === "accepted");

  const getClassroomName = (slug: string) => {
    const classroom = classrooms.find((c) => c.slug === slug);
    return classroom?.name || slug;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 rounded-lg">
          <Users className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Collaborate</h2>
          <p className="text-gray-600">Share classroom access with other teachers</p>
        </div>
        {receivedRequests.length > 0 && (
          <Badge variant="destructive" className="ml-auto">
            {receivedRequests.length} pending
          </Badge>
        )}
      </div>

      {/* Add/Request Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-600" />
            {mode === "add" ? "Add Teacher Directly" : "Request Classroom Access"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setMode("request")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                mode === "request"
                  ? "bg-white text-purple-600 shadow"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Request Access
            </button>
            <button
              onClick={() => setMode("add")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                mode === "add"
                  ? "bg-white text-purple-600 shadow"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Add Directly
            </button>
          </div>

          <p className="text-sm text-gray-600">
            {mode === "add" 
              ? "Add a teacher to your classroom without approval"
              : "Send a request to join another teacher's classroom"}
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classroom">Select Classroom</Label>
              <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a classroom" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.slug} value={classroom.slug}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {classroom.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacherEmail">Teacher's Email</Label>
              <div className="flex gap-2">
                <Input
                  id="teacherEmail"
                  type="email"
                  placeholder="teacher@example.com"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  disabled={loading}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !teacherEmail.trim() || !selectedClassroom}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      {mode === "add" ? "Add" : "Request"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {message.text && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="received" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Received ({receivedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Sent ({myRequests.length})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Collaborators ({acceptedRequests.length})
              </TabsTrigger>
            </TabsList>

            {/* Received Requests Tab */}
            <TabsContent value="received" className="space-y-4 mt-4">
              {requestsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : receivedRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No requests received</p>
                </div>
              ) : (
                receivedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {request.requesterName}
                        </p>
                        <p className="text-sm text-gray-600">{request.requesterEmail}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Wants access to: <span className="font-medium">{getClassroomName(request.classroomSlug)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcceptRequest(request.classroomSlug, request.id, request.requesterId)}
                        disabled={loading}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.classroomSlug, request.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Sent Requests Tab */}
            <TabsContent value="sent" className="space-y-4 mt-4">
              {requestsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : myRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending requests sent</p>
                </div>
              ) : (
                myRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Request to: {getClassroomName(request.classroomSlug)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Sent on {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelRequest(request.classroomSlug, request.id)}
                      disabled={loading}
                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Accepted Collaborators Tab */}
            <TabsContent value="accepted" className="space-y-4 mt-4">
              {requestsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : acceptedRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No collaborators yet</p>
                </div>
              ) : (
                acceptedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {request.requesterName}
                        </p>
                        <p className="text-sm text-gray-600">{request.requesterEmail}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Classroom: <span className="font-medium">{getClassroomName(request.classroomSlug)}</span>
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      Active
                    </Badge>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
