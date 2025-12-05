"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getContentTree, ContentTree } from "@/lib/contentStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import WalkingAnimation from "@/components/ui/GlassLoadingAnimation";

interface CreateTestFormProps {
  classroomSlug: string;
  onTestCreated: () => void;
  onCancel: () => void;
}

export default function CreateTestForm({ classroomSlug, onTestCreated, onCancel }: CreateTestFormProps) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  // Calculate min date for deadline (tomorrow)
  const today = new Date();
  const minDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const minDateStr = minDate.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [contentTree, setContentTree] = useState<ContentTree>({ subjects: {} });
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadContentTree();
  }, [classroomSlug]);

  const loadContentTree = async () => {
    try {
      setLoading(true);
      const tree = await getContentTree(classroomSlug);
      setContentTree(tree);
    } catch (error) {
      console.error("Error loading content tree:", error);
      setError("Failed to load content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Selection logic (adapted from StudyHub)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Please enter a test title");
      return;
    }
    
    if (!deadline) {
      setError("Please select a deadline");
      return;
    }
    // Only allow deadline after today
    const selectedDate = new Date(deadline);
    if (selectedDate <= today) {
      setError("Deadline must be after today.");
      return;
    }
    
    if (selectedTopics.size === 0) {
      setError("Please select at least one topic");
      return;
    }

    try {
      setGenerating(true);
      setError("");

      // Get content for selected topics
      const topicContents = await Promise.all(
        Array.from(selectedTopics).map(async (topicId) => {
          const contentRef = doc(db, "classrooms", classroomSlug, "content", topicId);
          const contentDoc = await getDoc(contentRef);
          if (contentDoc.exists()) {
            return {
              id: topicId,
              ...contentDoc.data()
            };
          }
          return null;
        })
      );

      const validContents = topicContents.filter((c): c is any => c !== null);

      // Prepare data for AI generation
      const generatePayload = {
        topics: validContents.map((c: any) => ({
          subject: c.subject,
          chapter: c.chapter,
          topic: c.topic,
          content: c.content
        }))
      };

      // Call API to generate test questions
      const response = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatePayload)
      });

      if (!response.ok) {
        throw new Error("Failed to generate test");
      }

      const { questions } = await response.json();

      // Extract unique subjects, chapters, topics
      const subjects = [...new Set(validContents.map((c: any) => c.subject))];
      const chapters = [...new Set(validContents.map((c: any) => c.chapter))];
      const topics = [...new Set(validContents.map((c: any) => c.topic))];

      // Save test to Firestore
      const testsRef = collection(db, "classrooms", classroomSlug, "tests");
      await addDoc(testsRef, {
        title: title.trim(),
        subjects,
        chapters,
        topics,
        timePerQuestion,
        deadline,
        questions,
        createdAt: serverTimestamp(),
        attempts: 0
      });

      onTestCreated();
    } catch (error: any) {
      console.error("Error creating test:", error);
      setError(error.message || "Failed to create test. Please try again.");
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WalkingAnimation />
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <WalkingAnimation />
        <p className="text-slate-300 text-lg">Generating test questions with AI...</p>
        <p className="text-slate-400 text-sm">This may take a moment</p>
      </div>
    );
  }

  const hasContent = Object.keys(contentTree.subjects || {}).length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-500/20 border border-rose-400/40 rounded-lg text-rose-300">
          {error}
        </div>
      )}

      {/* Test Details */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-white/90">Test Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chapter 1-3 Quiz"
            className="mt-2 bg-white/5 border-white/10 text-white/90"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="deadline" className="text-white/90">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              min={minDateStr}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-2 bg-white/5 border-white/10 text-white/90"
            />
          </div>

          <div>
            <Label htmlFor="timePerQuestion" className="text-white/90">
              Time per Question (seconds)
            </Label>
            <Input
              id="timePerQuestion"
              type="number"
              min="10"
              max="300"
              value={timePerQuestion}
              onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
              className="mt-2 bg-white/5 border-white/10 text-white/90"
            />
          </div>
        </div>
      </div>

      {/* Content Selection - StudyHub style */}
      <div>
        <Label className="text-white/90 mb-3 block">Select Topics</Label>
        {!hasContent ? (
          <div className="p-8 text-center bg-white/5 border border-white/10 rounded-lg">
            <p className="text-slate-300/70">No content available. Please upload content first.</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
            {Object.entries(contentTree.subjects).map(([subjectTitle, subjectData]) => (
              <div key={subjectTitle} className="border rounded-lg overflow-hidden">
                {/* Subject */}
                <button
                  type="button"
                  onClick={() => toggleSubject(subjectTitle)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-white/90 hover:bg-white/10 rounded-lg transition-all"
                >
                  {expandedSubjects.has(subjectTitle) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span className="font-semibold">{subjectTitle}</span>
                  <span className="ml-auto text-xs text-white/60">{Object.keys(subjectData.chapters).length} chapters</span>
                </button>

                {/* Chapters */}
                {expandedSubjects.has(subjectTitle) && (
                  <div className="bg-white/5 px-4 py-2">
                    {Object.entries(subjectData.chapters).map(([chapterTitle, topics]) => {
                      const chapterKey = `${subjectTitle}-${chapterTitle}`;
                      const checkboxState = getChapterCheckboxState(chapterKey, subjectTitle, chapterTitle, contentTree);
                      return (
                        <div key={chapterKey} className="mb-2">
                          <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:shadow-md transition-all">
                            {/* Chapter Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleChapterCheckbox(chapterKey, subjectTitle, chapterTitle, contentTree)}
                              className="flex-shrink-0"
                            >
                              {checkboxState === "all" ? (
                                <span className="inline-block w-5 h-5 rounded bg-cyan-400 border-2 border-cyan-600 flex items-center justify-center">
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </span>
                              ) : checkboxState === "partial" ? (
                                <span className="inline-block w-5 h-5 rounded bg-indigo-400 border-2 border-indigo-600 flex items-center justify-center">
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="2" rx="1" fill="#fff"/></svg>
                                </span>
                              ) : (
                                <span className="inline-block w-5 h-5 rounded border-2 border-white/30 bg-white/10"></span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleChapter(chapterKey)}
                              className="flex-1 flex items-center justify-between"
                            >
                              <span className="font-medium text-white/80">{chapterTitle}</span>
                              <span className="text-xs text-white/60">{topics.length} topics</span>
                            </button>
                          </div>
                          {/* Topics */}
                          {expandedChapters.has(chapterKey) && (
                            <div className="ml-6 mt-2 space-y-1">
                              {topics.map((topic) => (
                                <div
                                  key={topic.id}
                                  className="flex items-center gap-2 p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleTopicCheckbox(topic.id, chapterKey, subjectTitle, chapterTitle, contentTree)}
                                    className="flex-shrink-0"
                                  >
                                    {selectedTopics.has(topic.id) ? (
                                      <span className="inline-block w-4 h-4 rounded bg-cyan-400 border-2 border-cyan-600 flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      </span>
                                    ) : (
                                      <span className="inline-block w-4 h-4 rounded border-2 border-white/30 bg-white/10"></span>
                                    )}
                                  </button>
                                  <label
                                    className="text-sm text-white/70 cursor-pointer flex-1"
                                  >
                                    {topic.title}
                                  </label>
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
        )}
        {selectedTopics.size > 0 && (
          <p className="text-sm text-cyan-300 mt-2">
            {selectedTopics.size} topic{selectedTopics.size !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="border border-white/30 text-white/90 bg-white/5 hover:bg-white/10 hover:border-cyan-400 transition-colors"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!title.trim() || !deadline || selectedTopics.size === 0}
          className="bg-gradient-to-r from-cyan-400 to-indigo-400 text-slate-900"
        >
          Generate Test
        </Button>
      </div>
    </form>
  );
}
