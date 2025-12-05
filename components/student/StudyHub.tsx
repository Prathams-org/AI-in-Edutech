"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Upload, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Loader2,
  Users,
  Plus,
  CheckSquare,
  Square,
  MinusSquare,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { parseDocument } from "@/lib/documentParser";

interface Topic {
  id: string;
  title: string;
  content?: string;
}

interface ContentTree {
  subjects: {
    [subjectTitle: string]: {
      chapters: {
        [chapterTitle: string]: Topic[];
      };
    };
  };
}

type ContentSource = "student" | "teacher-import" | null;

export default function StudyHub() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [contentTree, setContentTree] = useState<ContentTree>({ subjects: {} });
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  
  // Selection state
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  
  // UI states
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [topicInputValue, setTopicInputValue] = useState("");
  const [showTeacherContent, setShowTeacherContent] = useState(false);
  const [teacherContentTree, setTeacherContentTree] = useState<ContentTree>({ subjects: {} });
  const [availableClassrooms, setAvailableClassrooms] = useState<Array<{slug: string, name: string, teacherName: string}>>([]);
  const [selectedClassroomSlug, setSelectedClassroomSlug] = useState<string>("");
  
  useEffect(() => {
    loadStudentContent();
  }, [user]);

  const loadStudentContent = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const studentRef = doc(db, "students", user.uid);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        const data = studentDoc.data();
        setContentTree(data.contentTree || { subjects: {} });
        
        // Load all joined classrooms
        const classrooms = data.classrooms || [];
        const joinedClassrooms = classrooms.filter((c: any) => c.status === "joined");
        
        // Fetch classroom names
        const classroomDetails = await Promise.all(
          joinedClassrooms.map(async (c: any) => {
            try {
              const classroomRef = doc(db, "classrooms", c.slug);
              const classroomDoc = await getDoc(classroomRef);
              if (classroomDoc.exists()) {
                const classroomData = classroomDoc.data();
                return {
                  slug: c.slug,
                  name: classroomData.name,
                  teacherName: classroomData.teacherName
                };
              }
            } catch (err) {
              console.error(`Error loading classroom ${c.slug}:`, err);
            }
            return null;
          })
        );
        
        const validClassrooms = classroomDetails.filter(c => c !== null) as Array<{slug: string, name: string, teacherName: string}>;
        setAvailableClassrooms(validClassrooms);
        
        // Set first classroom as default
        if (validClassrooms.length > 0 && !selectedClassroomSlug) {
          setSelectedClassroomSlug(validClassrooms[0].slug);
        }
      }
    } catch (error) {
      console.error("Error loading student content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setParsing(true);
      
      // Parse document
      const extractedText = await parseDocument(file);
      
      // Send to AI for structuring
      const response = await fetch("/api/parse-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) throw new Error("Failed to parse content");
      
      const parsed = await response.json();
      
      // Save to student's document
      await saveStudentContent(parsed);
      
      // Reload content
      await loadStudentContent();
      
      alert("Content uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      setParsing(false);
      event.target.value = "";
    }
  };

  const saveStudentContent = async (parsedContent: any) => {
    if (!user) return;
    
    try {
      const studentRef = doc(db, "students", user.uid);
      const studentDoc = await getDoc(studentRef);
      
      const existingTree: ContentTree = studentDoc.exists() 
        ? (studentDoc.data().contentTree || { subjects: {} })
        : { subjects: {} };
      
      // Process and merge new content
      for (const subject of parsedContent.subjects) {
        const subjectTitle = subject.title;
        
        if (!existingTree.subjects[subjectTitle]) {
          existingTree.subjects[subjectTitle] = { chapters: {} };
        }
        
        for (const chapter of subject.chapters) {
          const chapterTitle = chapter.title;
          
          if (!existingTree.subjects[subjectTitle].chapters[chapterTitle]) {
            existingTree.subjects[subjectTitle].chapters[chapterTitle] = [];
          }
          
          for (const topic of chapter.topics) {
            // Create topic document in subcollection
            const contentRef = doc(collection(db, "students", user.uid, "content"));
            await setDoc(contentRef, {
              subject: subjectTitle,
              chapter: chapterTitle,
              topic: topic.title,
              content: topic.content,
              createdAt: serverTimestamp(),
            });
            
            // Add to tree
            existingTree.subjects[subjectTitle].chapters[chapterTitle].push({
              id: contentRef.id,
              title: topic.title,
            });
          }
        }
      }
      
      // Update student document
      await setDoc(studentRef, { contentTree: existingTree }, { merge: true });
    } catch (error) {
      console.error("Error saving student content:", error);
      throw error;
    }
  };

  const toggleSubject = (subject: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subject)) newExpanded.delete(subject);
    else newExpanded.add(subject);
    setExpandedSubjects(newExpanded);
  };

  const toggleChapter = (key: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(key)) newExpanded.delete(key);
    else newExpanded.add(key);
    setExpandedChapters(newExpanded);
  };

  const handleChapterCheckbox = (chapterKey: string, subject: string, chapter: string, tree: ContentTree) => {
    const topics = tree.subjects[subject]?.chapters[chapter] || [];
    const newSelectedChapters = new Set(selectedChapters);
    const newSelectedTopics = new Set(selectedTopics);
    
    if (newSelectedChapters.has(chapterKey)) {
      // Unselect chapter and all its topics
      newSelectedChapters.delete(chapterKey);
      topics.forEach(topic => newSelectedTopics.delete(topic.id));
    } else {
      // Select chapter and all its topics
      newSelectedChapters.add(chapterKey);
      topics.forEach(topic => newSelectedTopics.add(topic.id));
    }
    
    setSelectedChapters(newSelectedChapters);
    setSelectedTopics(newSelectedTopics);
  };

  const handleTopicCheckbox = (topicId: string, chapterKey: string, subject: string, chapter: string, tree: ContentTree) => {
    const newSelectedTopics = new Set(selectedTopics);
    const newSelectedChapters = new Set(selectedChapters);
    
    if (newSelectedTopics.has(topicId)) {
      newSelectedTopics.delete(topicId);
      // Check if chapter should be deselected or partially selected
      const topics = tree.subjects[subject]?.chapters[chapter] || [];
      const selectedCount = topics.filter(t => newSelectedTopics.has(t.id)).length;
      if (selectedCount === 0) {
        newSelectedChapters.delete(chapterKey);
      }
    } else {
      newSelectedTopics.add(topicId);
      // Check if all topics in chapter are now selected
      const topics = tree.subjects[subject]?.chapters[chapter] || [];
      const allSelected = topics.every(t => newSelectedTopics.has(t.id) || t.id === topicId);
      if (allSelected) {
        newSelectedChapters.add(chapterKey);
      }
    }
    
    setSelectedTopics(newSelectedTopics);
    setSelectedChapters(newSelectedChapters);
  };

  const getChapterCheckboxState = (chapterKey: string, subject: string, chapter: string, tree: ContentTree): "all" | "partial" | "none" => {
    const topics = tree.subjects[subject]?.chapters[chapter] || [];
    const selectedCount = topics.filter(t => selectedTopics.has(t.id)).length;
    
    if (selectedCount === 0) return "none";
    if (selectedCount === topics.length) return "all";
    return "partial";
  };

  const handleStartLearning = async (source: ContentSource) => {
    if (!user) return;
    
    if (selectedTopics.size === 0 && !showTopicInput) {
      alert("Please select at least one topic or enter a topic name");
      return;
    }
    
    try {
      setLoading(true);
      
      // Create new chat document
      const chatRef = doc(collection(db, "students", user.uid, "chats"));
      const now = Date.now();
      
      let chatTitle = "";
      let chatMetadata: any = {};
      
      if (showTopicInput && topicInputValue.trim()) {
        chatTitle = topicInputValue.trim();
        chatMetadata = {
          mode: "user-topic",
          topicName: topicInputValue.trim(),
          source: "manual",
          progress: 0,
          timeGiven: 0,
          createdAt: serverTimestamp(),
        };
        
        // Just create document with flag, no content
        await setDoc(chatRef, chatMetadata);
        
        // Save chat metadata to student doc
        const studentRef = doc(db, "students", user.uid);
        const studentDoc = await getDoc(studentRef);
        const existingChats = studentDoc.exists() ? (studentDoc.data().chats || []) : [];
        await setDoc(studentRef, {
          chats: [...existingChats, {
            chatId: chatRef.id,
            title: chatTitle,
            mode: "user-topic",
            progress: 0,
            timeGiven: 0,
            createdAt: now
          }]
        }, { merge: true });
        
        // Navigate with flag
        router.push(`/student/chat/${chatRef.id}#create_new_workspace`);
      } else {
        // Clone selected topics
        const selectedData: any[] = [];
        const subjects = new Set<string>();
        const chapters = new Set<string>();
        
        const currentTree = source === "teacher-import" ? teacherContentTree : contentTree;
        
        for (const [subject, subjectData] of Object.entries(currentTree.subjects)) {
          for (const [chapter, topics] of Object.entries(subjectData.chapters)) {
            for (const topic of topics) {
              if (selectedTopics.has(topic.id)) {
                subjects.add(subject);
                chapters.add(chapter);
                
                // Fetch full content
                const contentRef = source === "teacher-import"
                  ? doc(db, "classrooms", selectedClassroomSlug, "content", topic.id)
                  : doc(db, "students", user.uid, "content", topic.id);
                  
                const contentDoc = await getDoc(contentRef);
                if (contentDoc.exists()) {
                  selectedData.push({
                    ...contentDoc.data(),
                    topicId: topic.id,
                  });
                }
              }
            }
          }
        }
        
        // Create title from subjects and chapters
        chatTitle = `${Array.from(subjects).join(", ")} - ${Array.from(chapters).join(", ")}`;
        
        chatMetadata = {
          mode: source === "teacher-import" ? "teacher-content" : "student-content",
          source: source,
          topics: selectedData,
          teacherSync: source === "teacher-import",
          teacherClassroomSlug: source === "teacher-import" ? selectedClassroomSlug : null,
          progress: 0,
          timeGiven: 0,
          createdAt: serverTimestamp(),
        };
        
        // Save to chat document
        await setDoc(chatRef, chatMetadata);
        
        // Save chat metadata to student doc
        const studentRef = doc(db, "students", user.uid);
        const studentDoc = await getDoc(studentRef);
        const existingChats = studentDoc.exists() ? (studentDoc.data().chats || []) : [];
        await setDoc(studentRef, {
          chats: [...existingChats, {
            chatId: chatRef.id,
            title: chatTitle,
            mode: source === "teacher-import" ? "teacher-content" : "student-content",
            subjects: Array.from(subjects),
            chapters: Array.from(chapters),
            progress: 0,
            timeGiven: 0,
            createdAt: now
          }]
        }, { merge: true });
        
        // Navigate to chat
        router.push(`/student/chat/${chatRef.id}`);
      }
    } catch (error) {
      console.error("Error starting learning:", error);
      alert("Failed to start learning. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherContent = async () => {
    if (availableClassrooms.length === 0) {
      alert("No classroom found. Please join a classroom first.");
      return;
    }
    
    setShowTeacherContent(true);
    
    // Load content for the selected or first classroom
    const classroomSlug = selectedClassroomSlug || availableClassrooms[0].slug;
    if (!selectedClassroomSlug) {
      setSelectedClassroomSlug(classroomSlug);
    }
    
    await loadClassroomContent(classroomSlug);
  };
  
  const loadClassroomContent = async (classroomSlug: string) => {
    try {
      setLoading(true);
      const classroomRef = doc(db, "classrooms", classroomSlug);
      const classroomDoc = await getDoc(classroomRef);
      
      if (classroomDoc.exists()) {
        setTeacherContentTree(classroomDoc.data().contentTree || { subjects: {} });
        // Reset selections
        setSelectedChapters(new Set());
        setSelectedTopics(new Set());
      }
    } catch (error) {
      console.error("Error loading teacher content:", error);
      alert("Failed to load teacher content.");
    } finally {
      setLoading(false);
    }
  };

  const renderContentTree = (tree: ContentTree, source: ContentSource) => {
    const hasContent = Object.keys(tree.subjects || {}).length > 0;
    
    if (!hasContent) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Content Available</h3>
          <p className="text-gray-600">
            {source === "teacher-import" 
              ? "Your teacher hasn't uploaded any content yet"
              : "Upload your first document or enter a topic to get started"}
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {Object.entries(tree.subjects).map(([subjectTitle, subjectData]) => (
          <div key={subjectTitle} className="border rounded-lg overflow-hidden">
            {/* Subject */}
            <button
              onClick={() => toggleSubject(subjectTitle)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedSubjects.has(subjectTitle) ? (
                  <ChevronDown className="w-5 h-5 text-purple-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-purple-600" />
                )}
                <span className="font-semibold text-lg">📖 {subjectTitle}</span>
              </div>
              <span className="text-sm text-gray-600">
                {Object.keys(subjectData.chapters).length} chapters
              </span>
            </button>

            {/* Chapters */}
            {expandedSubjects.has(subjectTitle) && (
              <div className="bg-gray-50 px-4 py-2">
                {Object.entries(subjectData.chapters).map(([chapterTitle, topics]) => {
                  const chapterKey = `${subjectTitle}-${chapterTitle}`;
                  const checkboxState = getChapterCheckboxState(chapterKey, subjectTitle, chapterTitle, tree);
                  
                  return (
                    <div key={chapterKey} className="mb-2">
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg hover:shadow-md transition-all">
                        {/* Chapter Checkbox */}
                        <button
                          onClick={() => handleChapterCheckbox(chapterKey, subjectTitle, chapterTitle, tree)}
                          className="flex-shrink-0"
                        >
                          {checkboxState === "all" ? (
                            <CheckSquare className="w-5 h-5 text-green-600" />
                          ) : checkboxState === "partial" ? (
                            <MinusSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => toggleChapter(chapterKey)}
                          className="flex-1 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {expandedChapters.has(chapterKey) ? (
                              <ChevronDown className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-indigo-600" />
                            )}
                            <span className="font-medium">📑 {chapterTitle}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {topics.length} topics
                          </span>
                        </button>
                      </div>

                      {/* Topics */}
                      {expandedChapters.has(chapterKey) && (
                        <div className="ml-6 mt-2 space-y-1">
                          {topics.map((topic) => (
                            <div
                              key={topic.id}
                              className="flex items-center gap-2 p-2 bg-white rounded hover:bg-gray-50 transition-colors"
                            >
                              <button
                                onClick={() => handleTopicCheckbox(topic.id, chapterKey, subjectTitle, chapterTitle, tree)}
                                className="flex-shrink-0"
                              >
                                {selectedTopics.has(topic.id) ? (
                                  <CheckSquare className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                              <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="text-sm">{topic.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading && !showTeacherContent) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (showTeacherContent) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Import Teacher's Content</h2>
            <p className="text-gray-600">Select topics from your teacher's uploaded content</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowTeacherContent(false);
              setSelectedChapters(new Set());
              setSelectedTopics(new Set());
            }}
          >
            Back to My Content
          </Button>
        </div>

        {/* Classroom Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Classroom</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Choose a classroom to import content from:</label>
              <select
                value={selectedClassroomSlug}
                onChange={(e) => {
                  setSelectedClassroomSlug(e.target.value);
                  loadClassroomContent(e.target.value);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-800"
              >
                {availableClassrooms.map((classroom) => (
                  <option key={classroom.slug} value={classroom.slug}>
                    {classroom.name} - {classroom.teacherName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teacher's Content Library</CardTitle>
          </CardHeader>
          <CardContent>
            {renderContentTree(teacherContentTree, "teacher-import")}
          </CardContent>
        </Card>

        {selectedTopics.size > 0 && (
          <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-lg p-4 border-2 border-purple-500">
            <p className="text-sm text-gray-600 mb-2">
              {selectedTopics.size} topic(s) selected
            </p>
            <Button 
              onClick={() => handleStartLearning("teacher-import")}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Learning
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Study Hub</h2>
          <p className="text-gray-600">Your personal learning center</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => document.getElementById("file-upload")?.click()}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Upload className="w-12 h-12 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-2">Upload PDF</h3>
              <p className="text-sm text-gray-600">AI extracts and structures your content</p>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => {
            setShowTopicInput(!showTopicInput);
            setTopicInputValue("");
          }}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Plus className="w-12 h-12 text-green-600 mb-3" />
              <h3 className="font-semibold mb-2">Enter Topic</h3>
              <p className="text-sm text-gray-600">AI generates explanation and tests</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={loadTeacherContent}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Users className="w-12 h-12 text-purple-600 mb-3" />
              <h3 className="font-semibold mb-2">Teacher's Content</h3>
              <p className="text-sm text-gray-600">Import from classroom materials</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topic Input */}
      {showTopicInput && (
        <Card className="border-2 border-green-500">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Enter Topic Name</label>
                <Input
                  placeholder="e.g., Photosynthesis, Quadratic Equations, World War II"
                  value={topicInputValue}
                  onChange={(e) => setTopicInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && topicInputValue.trim()) {
                      handleStartLearning(null);
                    }
                  }}
                />
              </div>
              <Button 
                onClick={() => handleStartLearning(null)}
                disabled={!topicInputValue.trim()}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Learning Materials
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploading State */}
      {uploading && (
        <Card className="border-2 border-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-700">
                {parsing ? "AI is analyzing your document..." : "Uploading file..."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Tree */}
      <Card>
        <CardHeader>
          <CardTitle>My Content Library</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContentTree(contentTree, "student")}
        </CardContent>
      </Card>

      {/* Start Learning Button */}
      {selectedTopics.size > 0 && (
        <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-lg p-4 border-2 border-blue-500">
          <p className="text-sm text-gray-600 mb-2">
            {selectedTopics.size} topic(s) selected
          </p>
          <Button 
            onClick={() => handleStartLearning("student")}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Learning
          </Button>
        </div>
      )}
    </div>
  );
}
