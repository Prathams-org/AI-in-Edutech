"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getContentTree, ContentTree } from "@/lib/contentStorage";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, onSnapshot, getDoc } from "firebase/firestore";

type SyllabusSelection = {
  chapter: string;
  topics: string[];
  topicIds?: string[]; // Document IDs for topics
};

type Entry = {
  id: string;
  subject: string;
  date: string; // yyyy-mm-dd
  time: string; // hh:mm
  syllabus: SyllabusSelection[];
};

// Type for the saved template object
type ExamTemplate = {
  id: string;
  title: string;
  entries: Entry[];
};

export default function ExamCorner() {
  const params = useParams();
  const classroomSlug = params?.slug as string;

  const [contentTree, setContentTree] = useState<ContentTree>({ subjects: {} });
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);

  // New State for Exam Title and Saved Templates
  const [examTitle, setExamTitle] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<ExamTemplate[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!classroomSlug) return;
    loadContentTree();

    // Listen to classroom document for real-time updates of examTemplates
    const unsub = onSnapshot(doc(db, "classrooms", classroomSlug), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSavedTemplates(data.examTemplates || []);
      }
    });

    return () => unsub();
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

  const handleOpen = () => {
    // Reset title and initialize with one empty entry
    setEditingTemplateId(null);
    setExamTitle(""); 
    setEntries([
      { id: String(Date.now()), subject: "", date: "", time: "", syllabus: [] },
    ]);
    setOpen(true);
  };

  const handleEdit = (template: ExamTemplate) => {
    setEditingTemplateId(template.id);
    setExamTitle(template.title || "");
    // prefill entries; add unique ids for UI elements
    const pre = (template.entries || []).map((e) => ({ ...e, id: String(Date.now() + Math.random()) }));
    setEntries(pre);
    setOpen(true);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!classroomSlug) return;
    if (!confirm("Are you sure you want to delete this exam template? This cannot be undone.")) return;
    try {
      const classroomRef = doc(db, "classrooms", classroomSlug);
      const snap = await getDoc(classroomRef);
      if (!snap.exists()) return;
      const data = snap.data();
      const existing: any[] = data.examTemplates || [];
      const newArray = existing.filter((t) => t.id !== templateId);
      await updateDoc(classroomRef, { examTemplates: newArray });
      setSavedTemplates(newArray as ExamTemplate[]);
      // if we were editing this template, close modal
      if (editingTemplateId === templateId) {
        setOpen(false);
        setEditingTemplateId(null);
      }
    } catch (e) {
      console.error("Error deleting template:", e);
      alert("Failed to delete template. See console for details.");
    }
  };

  const removeDuplicateSubjects = () => {
    // remove duplicate entries by subject name, keeping first occurrence
    const seen = new Set<string>();
    const deduped = entries.filter((e) => {
      if (!e.subject) return true; // keep empty subjects for user to fill
      const key = e.subject.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setEntries(deduped);
  };

  // Validation: date must be strictly after today's date (local)
  const getLocalYMD = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const validateEntries = () => {
    const errors: string[] = [];
    const today = getLocalYMD();
    if (!entries || entries.length === 0) {
      errors.push("Add at least one subject entry.");
      return errors;
    }

    entries.forEach((e, idx) => {
      const n = idx + 1;
      if (!e.subject || !e.subject.trim()) errors.push(`Entry ${n}: Subject is required.`);
      if (!e.date || !e.date.trim()) errors.push(`Entry ${n}: Date is required.`);
      else if (e.date <= today) errors.push(`Entry ${n}: Date must be after today.`);
      if (!e.time || !e.time.trim()) errors.push(`Entry ${n}: Time is required.`);
    });

    return errors;
  };

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    // validate when entries or examTitle change
    const errs: string[] = [];
    if (!examTitle || !examTitle.trim()) errs.push("Exam name is required.");
    const entryErrs = validateEntries();
    setValidationErrors([...errs, ...entryErrs]);
    setIsFormValid(errs.length + entryErrs.length === 0);
  }, [entries, examTitle]);

  const addEntry = () => {
    setEntries((s) => [
      ...s,
      { id: String(Date.now() + Math.random()), subject: "", date: "", time: "", syllabus: [] },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((s) => s.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, patch: Partial<Entry>) => {
    setEntries((s) => s.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const toggleChapterTopic = (entryId: string, chapter: string, topic: string, topicId: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e;
        const sel = [...e.syllabus];
        let chapterSel = sel.find((c) => c.chapter === chapter);
        if (!chapterSel) {
          // add chapter with this topic
          sel.push({ chapter, topics: [topic], topicIds: [topicId] });
        } else {
          const ix = chapterSel.topics.indexOf(topic);
          if (ix === -1) {
            chapterSel.topics = [...chapterSel.topics, topic];
            chapterSel.topicIds = [...(chapterSel.topicIds || []), topicId];
          } else {
            chapterSel.topics = chapterSel.topics.filter((t) => t !== topic);
            chapterSel.topicIds = (chapterSel.topicIds || []).filter((id) => id !== topicId);
          }
          // remove chapter if no topics left
          if (chapterSel.topics.length === 0) {
            return { ...e, syllabus: sel.filter((c) => c.chapter !== chapter) };
          }
        }
        return { ...e, syllabus: sel.map((c) => ({ ...c })) };
      })
    );
  };

  const toggleChapterSelect = (entryId: string, chapter: string, allTopics: Array<{id: string, title: string}>) => {
    // if all topics are selected -> unselect chapter, otherwise select all topics
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e;
        const sel = [...e.syllabus];
        const chapterSel = sel.find((c) => c.chapter === chapter);
        const allTopicTitles = allTopics.map(t => t.title);
        const allTopicIds = allTopics.map(t => t.id);
        if (chapterSel) {
          const selectedCount = chapterSel.topics.length;
          if (selectedCount === allTopics.length) {
            // unselect entire chapter
            return { ...e, syllabus: sel.filter((c) => c.chapter !== chapter) };
          }
          // otherwise select all topics
          const updated = sel.map((c) => (c.chapter === chapter ? { chapter, topics: [...allTopicTitles], topicIds: [...allTopicIds] } : c));
          return { ...e, syllabus: updated };
        }
        // not present -> add with all topics
        sel.push({ chapter, topics: [...allTopicTitles], topicIds: [...allTopicIds] });
        return { ...e, syllabus: sel };
      })
    );
  };

  const saveTemplate = async () => {
    if (!classroomSlug) return;
    // run validation
    const errs: string[] = [];
    if (!examTitle.trim()) errs.push("Please enter a name for this exam template.");
    const entryErrs = validateEntries();
    if (entryErrs.length) errs.push(...entryErrs);
    if (errs.length) {
      setValidationErrors(errs);
      // focus remains in modal; show alert as well
      alert("Please fix validation errors before saving.");
      return;
    }

    setSaving(true);
    try {
      const classroomRef = doc(db, "classrooms", classroomSlug);

      const payloadEntries = entries.map((e) => ({ subject: e.subject, date: e.date, time: e.time, syllabus: e.syllabus }));

      if (editingTemplateId) {
        // update existing template by replacing it in the array
        const snap = await getDoc(classroomRef);
        if (!snap.exists()) throw new Error("Classroom not found");
        const data = snap.data();
        const existing: any[] = data.examTemplates || [];
        const idx = existing.findIndex((t) => t.id === editingTemplateId);
        if (idx === -1) throw new Error("Template not found");

        const updatedTemplate = { id: editingTemplateId, title: examTitle, entries: payloadEntries };
        const newArray = [...existing];
        newArray[idx] = updatedTemplate;
        await updateDoc(classroomRef, { examTemplates: newArray });
        // update local copy; onSnapshot will also update but update local to be immediate
        setSavedTemplates(newArray as ExamTemplate[]);
      } else {
        // create new
        const payload = { id: String(Date.now()), title: examTitle, entries: payloadEntries };
        await updateDoc(classroomRef, { examTemplates: arrayUnion(payload) });
      }

      setOpen(false);
      setEditingTemplateId(null);
    } catch (error) {
      console.error("Error saving exam template:", error);
      alert("Failed to save exam template. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white/95 tracking-tight">
          Exam Corner
        </h2>
        <p className="text-slate-300/70 text-xs sm:text-sm mt-1">
          Create and manage exams, tests, and assessments
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl backdrop-blur-3xl bg-white/7 border border-white/15 shadow-[0_22px_55px_rgba(15,23,42,0.85)] p-6 sm:p-8 overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">Examination Hub</h3>
              <p className="text-slate-300/80 text-xs sm:text-sm">Create tests, quizzes, and track student performance</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button
                  onClick={handleOpen}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 text-slate-900 font-semibold text-sm shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/70 transform hover:-translate-y-0.5 transition-all"
                >
                  + Create Exam Template
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-3xl backdrop-blur-3xl bg-slate-900/90 border border-white/20 text-slate-200">
                <DialogHeader>
                  <DialogTitle className="text-white text-lg">Create Exam Template</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Name your exam, select subjects, set date & time and choose syllabus.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4 max-h-[70vh] overflow-auto pr-2">
                  
                  {/* Exam Name Input */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/15">
                    <label className="block text-sm font-medium mb-2 text-slate-200">Exam Name</label>
                    <Input 
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="e.g. Unit Test 1, Mid-Term Exam"
                      className="bg-white/10 border border-white/20 text-slate-100 placeholder:text-slate-500 focus:ring-cyan-300/70"
                    />
                  </div>

                  {entries.map((entry) => (
                    <div key={entry.id} className="border border-white/15 rounded-2xl p-4 bg-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <strong className="text-slate-200 text-sm">Subject entry</strong>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeEntry(entry.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="text-xs mb-1.5 block text-slate-300">Subject</label>
                          <select
                            value={entry.subject}
                            onChange={(e) => updateEntry(entry.id, { subject: e.target.value })}
                            className="border border-white/15 rounded-lg px-3 py-2 w-full bg-white/5 text-slate-100 text-sm focus:ring-2 focus:ring-cyan-300/70"
                          >

                            <option value="">Select subject</option>
                            {Object.keys(contentTree.subjects || {}).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs mb-1.5 block text-slate-300">Date</label>
                          <Input
                            type="date"
                            value={entry.date}
                            onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                            className="bg-white/10 border border-white/20 text-slate-100 placeholder:text-slate-500 focus:ring-cyan-300/70 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs mb-1.5 block text-slate-300">Time</label>
                          <Input
                            type="time"
                            value={entry.time}
                            onChange={(e) => updateEntry(entry.id, { time: e.target.value })}
                            className="bg-white/10 border border-white/20 text-slate-100 placeholder:text-slate-500 focus:ring-cyan-300/70 text-sm"
                          />
                        </div>
                      </div>

                      {/* Syllabus selection */}
                      <div className="mt-3">
                        <label className="text-xs font-medium text-slate-300 mb-2 block">Syllabus</label>
                        <div className="space-y-2">
                          {entry.subject && contentTree.subjects[entry.subject] ? (
                            Object.entries(contentTree.subjects[entry.subject].chapters).map(
                              ([chapterTitle, topics]) => (
                                <div key={chapterTitle} className="border border-white/10 rounded-lg p-3 bg-white/5">
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const chapterSel = entry.syllabus.find((c) => c.chapter === chapterTitle);
                                      const selectedCount = chapterSel ? chapterSel.topics.length : 0;
                                      const totalTopics = topics.length;
                                      const checked = totalTopics > 0 && selectedCount === totalTopics;
                                      const indeterminate = selectedCount > 0 && selectedCount < totalTopics;
                                      return (
                                        <>
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            ref={(el) => {
                                              if (el) el.indeterminate = indeterminate;
                                            }}
                                            onChange={() => toggleChapterSelect(entry.id, chapterTitle, topics)}
                                          />
                                          <strong className="text-sm text-slate-200">{chapterTitle}</strong>
                                        </>
                                      );
                                    })()}
                                  </div>

                                  <div className="ml-6 mt-2 space-y-1">
                                    {topics.map((t) => (
                                      <label key={t.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={
                                            !!entry.syllabus
                                              .find((c) => c.chapter === chapterTitle)
                                              ?.topics.includes(t.title)
                                          }
                                          onChange={() => toggleChapterTopic(entry.id, chapterTitle, t.title, t.id)}
                                        />
                                        <span>{t.title}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )
                            )
                          ) : (
                            <div className="text-xs text-slate-400">Select a subject to pick syllabus</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addEntry}
                    className="text-sm px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-cyan-300 hover:bg-white/10 transition"
                  >
                    + Add another subject
                  </button>
                </div>

                {validationErrors.length > 0 && (
                  <div className="mb-4 space-y-1">
                    {validationErrors.map((err, i) => (
                      <div key={i} className="text-xs text-rose-400 bg-rose-500/15 border border-rose-400/30 rounded-lg p-2">{err}</div>
                    ))}
                  </div>
                )}

                <DialogFooter>
                  <div className="flex items-center gap-2 flex-wrap">
                    {editingTemplateId && (
                      <button
                        onClick={async () => {
                          if (!editingTemplateId) return;
                          const ok = confirm("Delete this template?");
                          if (!ok) return;
                          await deleteTemplate(editingTemplateId);
                        }}
                        className="text-xs px-4 py-2 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30 transition"
                      >
                        Delete Template
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOpen(false)}
                      className="text-xs px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-slate-300 hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveTemplate}
                      disabled={saving || !isFormValid}
                      className="text-xs px-4 py-2 rounded-lg bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/30 disabled:opacity-50 transition"
                    >
                      {saving ? "Saving..." : "Save Template"}
                    </button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Display Exam Templates Logic */}
        {savedTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {savedTemplates.map((template) => (
              <div key={template.id} className="border border-white/15 rounded-2xl p-5 bg-white/5 hover:bg-white/8 hover:border-white/25 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-100">{template.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 bg-white/5 border border-white/15 px-2 py-1 rounded-lg">
                      {template.entries.length} Subjects
                    </span>
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/30 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {template.entries.map((entry, idx) => (
                    <div key={idx} className="text-sm text-slate-300 flex justify-between border-b border-white/10 pb-1.5 last:border-0">
                      <span className="font-medium">{entry.subject}</span>
                      <span className="text-slate-400">{entry.date} @ {entry.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Create templates and schedules</h3>
            <p className="text-slate-400 text-sm">Use the button to create an exam template for your classroom.</p>
          </div>
        )}

      </div>
    </div>
  );
}