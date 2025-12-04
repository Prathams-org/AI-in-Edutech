"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  searchClassrooms,
  joinClassroom,
  withdrawClassroomRequest,
  getStudentClassrooms,
  Classroom as ClassroomType,
} from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Clock,
  BookOpen,
  Search,
  School,
  Check,
  X,
  Loader2,
  UserCheck,
  AlertCircle,
} from "lucide-react";

interface ClassroomWithStatus extends ClassroomType {
  status?: string;
  joinedAt?: any;
}

export default function Classroom() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"my-classes" | "search">("my-classes");
  const [myClassrooms, setMyClassrooms] = useState<ClassroomWithStatus[]>([]);
  const [searchResults, setSearchResults] = useState<ClassroomType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [joiningClassroom, setJoiningClassroom] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) {
      loadMyClassrooms();
    }
  }, [user]);

  const loadMyClassrooms = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const result = await getStudentClassrooms(user.uid);
      if (result.success) {
        setMyClassrooms(result.classrooms || []);
      }
    } catch (error) {
      console.error("Error loading classrooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage({ type: "error", text: "Please enter a search term" });
      return;
    }

    try {
      setSearching(true);
      setMessage({ type: "", text: "" });
      
      const result = await searchClassrooms(searchQuery.trim());
      if (result.success) {
        setSearchResults(result.classrooms || []);
        if (result.classrooms?.length === 0) {
          setMessage({ type: "info", text: "No classrooms found matching your search" });
        }
      } else {
        setMessage({ type: "error", text: result.error || "Failed to search" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to search" });
    } finally {
      setSearching(false);
    }
  };

  const handleJoinClassroom = async (classroomSlug: string) => {
    if (!user) return;

    try {
      setJoiningClassroom(classroomSlug);
      setMessage({ type: "", text: "" });

      const result = await joinClassroom(user.uid, classroomSlug);
      
      if (result.success) {
        const classroom = searchResults.find(c => c.slug === classroomSlug);
        const message = classroom?.requiresPermission 
          ? "Request sent successfully! Waiting for teacher approval."
          : "Successfully joined classroom!";
        setMessage({ type: "success", text: message });
        await loadMyClassrooms();
        setActiveTab("my-classes");
        setSearchQuery("");
        setSearchResults([]);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to join classroom" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to join classroom" });
    } finally {
      setJoiningClassroom(null);
    }
  };

  const handleWithdrawRequest = async (classroomSlug: string) => {
    if (!user) return;

    try {
      setJoiningClassroom(classroomSlug);
      const result = await withdrawClassroomRequest(user.uid, classroomSlug);
      
      if (result.success) {
        setMessage({ type: "success", text: "Request withdrawn successfully" });
        await loadMyClassrooms();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to withdraw request" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to withdraw request" });
    } finally {
      setJoiningClassroom(null);
    }
  };

  const isAlreadyInClassroom = (classroomSlug: string) => {
    return myClassrooms.some((c) => c.slug === classroomSlug);
  };

  const joinedClassrooms = myClassrooms.filter((c) => c.status === "joined");
  const pendingClassrooms = myClassrooms.filter((c) => c.status === "pending");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Classrooms</h1>
          <p className="text-gray-600">Join and manage your enrolled classes</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            <AlertCircle className="w-5 h-5" />
            <span>{message.text}</span>
            <button
              onClick={() => setMessage({ type: "", text: "" })}
              className="ml-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white p-1 rounded-lg shadow">
            <TabsTrigger
              value="my-classes"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BookOpen className="w-4 h-4" />
              My Classes ({myClassrooms.length})
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Search className="w-4 h-4" />
              Find Classes
            </TabsTrigger>
          </TabsList>

          {/* My Classes Tab */}
          <TabsContent value="my-classes" className="space-y-6">
            {/* Subtabs for Joined and Pending */}
            <Tabs defaultValue="joined">
              <TabsList className="bg-white">
                <TabsTrigger value="joined" className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Joined ({joinedClassrooms.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending ({pendingClassrooms.length})
                </TabsTrigger>
              </TabsList>

              {/* Joined Classes */}
              <TabsContent value="joined" className="mt-6">
                {joinedClassrooms.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Classes Yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Search and join a classroom to get started
                      </p>
                      <Button onClick={() => setActiveTab("search")}>
                        <Search className="w-4 h-4 mr-2" />
                        Find Classes
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {joinedClassrooms.map((classroom) => (
                      <Card key={classroom.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{classroom.name}</CardTitle>
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              <Check className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserCheck className="w-4 h-4 text-blue-600" />
                            <span>Teacher: {classroom.teacherName}</span>
                          </div>
                          {classroom.school && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <School className="w-4 h-4 text-purple-600" />
                              <span>{classroom.school}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span>
                              Joined: {classroom.joinedAt ? new Date(classroom.joinedAt.seconds * 1000).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                          <Button className="w-full mt-4" variant="outline">
                            View Materials
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Pending Classes */}
              <TabsContent value="pending" className="mt-6">
                {pendingClassrooms.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Pending Requests
                      </h3>
                      <p className="text-gray-600">
                        Your classroom join requests will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingClassrooms.map((classroom) => (
                      <Card key={classroom.id} className="border-yellow-200 bg-yellow-50">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{classroom.name}</CardTitle>
                            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserCheck className="w-4 h-4 text-blue-600" />
                            <span>Teacher: {classroom.teacherName}</span>
                          </div>
                          {classroom.school && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <School className="w-4 h-4 text-purple-600" />
                              <span>{classroom.school}</span>
                            </div>
                          )}
                          <p className="text-sm text-gray-600">
                            Waiting for teacher approval
                          </p>
                          <Button
                            className="w-full mt-4"
                            variant="outline"
                            onClick={() => handleWithdrawRequest(classroom.slug)}
                            disabled={joiningClassroom === classroom.slug}
                          >
                            {joiningClassroom === classroom.slug ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Withdraw Request
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search for Classrooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by classroom name, school, or teacher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={searching}>
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((classroom) => {
                  const alreadyJoined = isAlreadyInClassroom(classroom.slug);
                  
                  return (
                    <Card key={classroom.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{classroom.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <UserCheck className="w-4 h-4 text-blue-600" />
                          <span>Teacher: {classroom.teacherName}</span>
                        </div>
                        {classroom.school && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <School className="w-4 h-4 text-purple-600" />
                            <span>{classroom.school}</span>
                          </div>
                        )}
                        {classroom.requiresPermission && (
                          <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                            <AlertCircle className="w-4 h-4" />
                            <span>Requires teacher approval</span>
                          </div>
                        )}
                        <Button
                          className="w-full mt-4"
                          onClick={() => handleJoinClassroom(classroom.slug)}
                          disabled={alreadyJoined || joiningClassroom === classroom.slug}
                        >
                          {joiningClassroom === classroom.slug ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : alreadyJoined ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Already Joined
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              {classroom.requiresPermission ? "Request to Join" : "Join Now"}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
