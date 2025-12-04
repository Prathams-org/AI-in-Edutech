"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContentTree, ContentTree } from "@/lib/contentStorage";
import { Loader2, Upload, ChevronRight, ChevronDown, FileText } from "lucide-react";

export default function Content() {
  const params = useParams();
  const router = useRouter();
  const classroomSlug = params.slug as string;

  const [contentTree, setContentTree] = useState<ContentTree>({ subjects: {} });
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

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
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    router.push(`/teacher/${classroomSlug}/dashboard/upload`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const hasContent = Object.keys(contentTree.subjects || {}).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Content Library</h2>
          <p className="text-gray-600">Manage study materials and resources</p>
        </div>
        <Button onClick={handleUploadClick}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Content
        </Button>
      </div>

      {!hasContent ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Content Yet</h3>
              <p className="text-gray-600 mb-6">
                Upload your first document to get started
              </p>
              <Button onClick={handleUploadClick}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Content Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(contentTree.subjects).map(([subjectTitle, subjectData]) => (
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
                        return (
                          <div key={chapterKey} className="mb-2">
                            <button
                              onClick={() => toggleChapter(chapterKey)}
                              className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-all"
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

                            {/* Topics */}
                            {expandedChapters.has(chapterKey) && (
                              <div className="ml-6 mt-2 space-y-1">
                                {topics.map((topic) => (
                                  <div
                                    key={topic.id}
                                    className="flex items-center gap-2 p-2 bg-white rounded hover:bg-gray-50 transition-colors"
                                  >
                                    <FileText className="w-4 h-4 text-green-600" />
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
