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

  const toggleChapterTopic = (entryId: string, chapter: string, topic: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e;
        const sel = [...e.syllabus];
        let chapterSel = sel.find((c) => c.chapter === chapter);
        if (!chapterSel) {
          // add chapter with this topic
          sel.push({ chapter, topics: [topic] });
        } else {
          const ix = chapterSel.topics.indexOf(topic);
          if (ix === -1) chapterSel.topics = [...chapterSel.topics, topic];
          else chapterSel.topics = chapterSel.topics.filter((t) => t !== topic);
          // remove chapter if no topics left
          if (chapterSel.topics.length === 0) {
            return { ...e, syllabus: sel.filter((c) => c.chapter !== chapter) };
          }
        }
        return { ...e, syllabus: sel.map((c) => ({ ...c })) };
      })
    );
  };

  const toggleChapterSelect = (entryId: string, chapter: string, allTopics: string[]) => {
    // if all topics are selected -> unselect chapter, otherwise select all topics
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e;
        const sel = [...e.syllabus];
        const chapterSel = sel.find((c) => c.chapter === chapter);
        if (chapterSel) {
          const selectedCount = chapterSel.topics.length;
          if (selectedCount === allTopics.length) {
            // unselect entire chapter
            return { ...e, syllabus: sel.filter((c) => c.chapter !== chapter) };
          }
          // otherwise select all topics
          const updated = sel.map((c) => (c.chapter === chapter ? { chapter, topics: [...allTopics] } : c));
          return { ...e, syllabus: updated };
        }
        // not present -> add with all topics
        sel.push({ chapter, topics: [...allTopics] });
        return { ...e, syllabus: sel };
      })
    );
  };

  const saveTemplate = async () => {
    if (!classroomSlug) return;

    // Validation: Require Exam Name
    if (!examTitle.trim()) {
      alert("Please enter a name for this exam template.");
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
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Exam Corner</h2>
        <p className="text-gray-600">Create and manage exams and assessments</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Examination Hub</h3>
            <p className="text-gray-600">Create tests, quizzes, and track student performance</p>
          </div>
          <div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpen}>Create Exam Template</Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Exam Template</DialogTitle>
                  <DialogDescription>
                    Name your exam, select subjects, set date & time and choose syllabus.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4 max-h-[70vh] overflow-auto pr-2">
                  
                  {/* Exam Name Input */}
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Exam Name</label>
                    <Input 
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="e.g. Unit Test 1, Mid-Term Exam"
                      className="bg-white"
                    />
                  </div>

                  {entries.map((entry) => (
                    <div key={entry.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <strong>Subject entry</strong>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => removeEntry(entry.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="text-sm mb-1 block">Subject</label>
                          <select
                            value={entry.subject}
                            onChange={(e) => updateEntry(entry.id, { subject: e.target.value })}
                            className="border rounded-md px-2 py-2 w-full"
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
                          <label className="text-sm mb-1 block">Date</label>
                          <Input
                            type="date"
                            value={entry.date}
                            onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="text-sm mb-1 block">Time</label>
                          <Input
                            type="time"
                            value={entry.time}
                            onChange={(e) => updateEntry(entry.id, { time: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Syllabus selection */}
                      <div className="mt-2">
                        <label className="text-sm font-medium">Syllabus</label>
                        <div className="mt-2 space-y-2">
                          {entry.subject && contentTree.subjects[entry.subject] ? (
                            Object.entries(contentTree.subjects[entry.subject].chapters).map(
                              ([chapterTitle, topics]) => (
                                <div key={chapterTitle} className="border rounded p-2">
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
                                            onChange={() => toggleChapterSelect(entry.id, chapterTitle, topics.map((t) => t.title))}
                                          />
                                          <strong className="text-sm">{chapterTitle}</strong>
                                        </>
                                      );
                                    })()}
                                  </div>

                                  <div className="ml-6 mt-2 space-y-1">
                                    {topics.map((t) => (
                                      <label key={t.id} className="flex items-center gap-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={
                                            !!entry.syllabus
                                              .find((c) => c.chapter === chapterTitle)
                                              ?.topics.includes(t.title)
                                          }
                                          onChange={() => toggleChapterTopic(entry.id, chapterTitle, t.title)}
                                        />
                                        <span>{t.title}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )
                            )
                          ) : (
                            <div className="text-sm text-muted-foreground">Select a subject to pick syllabus</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={addEntry}>
                      + Add another subject
                    </Button>
                    <Button variant="outline" onClick={removeDuplicateSubjects}>
                      Remove duplicate subjects
                    </Button>
                  </div>
                </div>

                <DialogFooter>
                  <div className="flex items-center gap-2">
                    {editingTemplateId && (
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          if (!editingTemplateId) return;
                          const ok = confirm("Delete this template?");
                          if (!ok) return;
                          await deleteTemplate(editingTemplateId);
                        }}
                      >
                        Delete Template
                      </Button>
                    )}
                  </div>
                  <DialogClose asChild>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button onClick={saveTemplate} disabled={saving}>
                    {saving ? "Saving..." : "Save Template"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Display Exam Templates Logic */}
        {savedTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {savedTemplates.map((template) => (
              <div key={template.id} className="border rounded-lg p-5 bg-gray-50 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">{template.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      {template.entries.length} Subjects
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteTemplate(template.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {template.entries.map((entry, idx) => (
                    <div key={idx} className="text-sm text-gray-600 flex justify-between border-b pb-1 last:border-0">
                      <span className="font-medium">{entry.subject}</span>
                      <span>{entry.date} @ {entry.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Create templates and schedules</h3>
            <p className="text-gray-600">Use the button to create an exam template for your classroom.</p>
          </div>
        )}

      </div>
    </div>
  );
}