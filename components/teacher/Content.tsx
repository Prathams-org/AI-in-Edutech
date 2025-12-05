"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Upload, ChevronRight, ChevronDown, FileText } from "lucide-react";
import { getContentTree, ContentTree } from "@/lib/contentStorage";
import { Button } from "@/components/ui/button";

export default function Content() {
  const params = useParams();
  const router = useRouter();
  const classroomSlug = params.slug as string;

  const [contentTree, setContentTree] = useState<ContentTree>({ subjects: {} });
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  useEffect(() => { loadContentTree(); }, [classroomSlug]);

  const loadContentTree = async () => {
    try {
      setLoading(true);
      const tree = await getContentTree(classroomSlug);
      setContentTree(tree);
    } catch (error) {
      console.error("Content loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    router.push(`/teacher/${classroomSlug}/dashboard/upload`);
  };

  const toggleSubject = (subject: string) => {
    const copy = new Set(expandedSubjects);
    copy.has(subject) ? copy.delete(subject) : copy.add(subject);
    setExpandedSubjects(copy);
  };

  const toggleChapter = (key: string) => {
    const copy = new Set(expandedChapters);
    copy.has(key) ? copy.delete(key) : copy.add(key);
    setExpandedChapters(copy);
  };

  const hasContent = Object.keys(contentTree.subjects || {}).length > 0;

  return (
    <div className="relative px-4 sm:px-6 py-8 sm:py-10 text-slate-200">
      {/* Heading */}
      <div className="mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-white/95 tracking-tight">
          Content Library
        </h2>
        <p className="text-slate-300/70 text-xs sm:text-sm mt-1">
          Upload & organize curriculum content beautifully
        </p>
      </div>

      {/* Loading Screen */}
      {loading && (
        <div className="flex items-center justify-center py-28">
          <div className="backdrop-blur-2xl bg-white/5 border border-white/15 px-10 py-8 rounded-2xl shadow-xl flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-300 mb-3" />
            <p className="text-slate-200 text-sm">Retrieving library data…</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !hasContent && (
        <div className="max-w-2xl mx-auto text-center backdrop-blur-3xl bg-white/7 border border-white/15 rounded-3xl py-16 px-6 shadow-[0_22px_55px_rgba(15,23,42,0.85)]">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
            No content yet
          </h3>
          <p className="text-slate-300/80 text-sm sm:text-base mb-8">
            Upload study materials to build a structured learning experience.
          </p>

          <button
            onClick={handleUploadClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 text-slate-900 font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/70 transform hover:-translate-y-0.5 transition-all"
          >
            <Upload className="w-5 h-5" />
            Upload Content
          </button>
        </div>
      )}

      {/* Content Tree */}
      {!loading && hasContent && (
        <div className="space-y-5">
          {/* Upload Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={handleUploadClick}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400 text-slate-900 font-semibold text-sm shadow-lg shadow-cyan-500/40 hover:shadow-cyan-400/60 transform hover:-translate-y-0.5 transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
          </div>

          {Object.entries(contentTree.subjects).map(([subjectTitle, subjectData]) => (
            <div
              key={subjectTitle}
              className="rounded-3xl border border-white/15 backdrop-blur-3xl bg-white/7 shadow-[0_22px_55px_rgba(15,23,42,0.85)] overflow-hidden group hover:border-white/25 transition-all"
            >
              {/* Subject */}
              <button
                onClick={() => toggleSubject(subjectTitle)}
                className="w-full flex items-center justify-between px-5 sm:px-6 py-4
                  hover:bg-white/10 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  {expandedSubjects.has(subjectTitle)
                    ? <ChevronDown className="text-cyan-300" size={20} />
                    : <ChevronRight className="text-cyan-300" size={20} />}
                  <span className="text-base sm:text-lg font-semibold text-slate-50">
                    📖 {subjectTitle}
                  </span>
                </div>
                <span className="text-xs bg-slate-800/50 border border-white/10 px-3 py-1 rounded-full text-slate-300">
                  {Object.keys(subjectData.chapters).length} chapters
                </span>
              </button>

              {/* Chapters */}
              {expandedSubjects.has(subjectTitle) && (
                <div className="px-6 pb-4 pt-2 space-y-3 bg-white/5 border-t border-white/10">
                  {Object.entries(subjectData.chapters).map(([chapterTitle, topics]) => {
                    const key = `${subjectTitle}-${chapterTitle}`;
                    return (
                      <div key={key}>
                        {/* Chapter */}
                        <button
                          onClick={() => toggleChapter(key)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10
                            hover:bg-white/10 hover:border-cyan-300/40 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            {expandedChapters.has(key)
                              ? <ChevronDown className="text-indigo-300" size={18} />
                              : <ChevronRight className="text-indigo-300" size={18} />}
                            <span className="font-medium text-slate-200 text-sm sm:text-base">
                              📑 {chapterTitle}
                            </span>
                          </div>

                          <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded">
                            {topics.length} topics
                          </span>
                        </button>

                        {/* Topics */}
                        {expandedChapters.has(key) && (
                          <div className="ml-6 sm:ml-8 mt-2 space-y-2 pb-2">
                            {topics.map((topic) => (
                              <div
                                key={topic.id}
                                className="flex items-center gap-2 text-sm 
                                  px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 
                                  hover:bg-cyan-400/15 hover:border-cyan-400/40 transition"
                              >
                                <FileText className="text-green-400 w-4 h-4 flex-shrink-0" />
                                <span className="text-slate-100">{topic.title}</span>
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
    </div>
  );
}
