"use client";

import React, { useState, useEffect } from "react";
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

import { Loader2, Users, X, Check } from "lucide-react";

interface CollaborateProps {
  userId: string;
  classrooms: Classroom[];
  onUpdate: () => void;
  open: boolean;
  onClose: () => void;
}

export default function Collaborate({
  userId,
  classrooms,
  onUpdate,
  open,
  onClose,
}: CollaborateProps) {
  const [teacherEmail, setTeacherEmail] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) loadAll();
  }, [open, classrooms]);

  const loadAll = async () => {
    setRequestsLoading(true);
    const reqs: CollaborationRequest[] = [];

    for (const c of classrooms) {
      const r = await getCollaborationRequests(c.slug);
      if (r.success && r.requests) reqs.push(...r.requests);
    }
    setRequests(reqs);
    setRequestsLoading(false);
  };

  const submit = async () => {
    if (!teacherEmail || !selectedClassroom) {
      setMessage("Please fill all fields");
      return;
    }

    setLoading(true);

    const t = await getTeacherByEmail(teacherEmail.trim());
    if (!t.success || !t.teacher) {
      setLoading(false);
      return setMessage("Teacher not found");
    }

    if (t.teacher.uid === userId) {
      setLoading(false);
      return setMessage("You cannot invite yourself");
    }

    const result = await sendCollaborationRequest(
      selectedClassroom,
      t.teacher.uid,
      userId
    );

    setLoading(false);
    if (result.success) {
      setTeacherEmail("");
      setSelectedClassroom("");
      loadAll();
      onUpdate();
      setMessage("Request sent!");
    } else setMessage(result.error ?? "Failed");
  };

  const accept = async (slug: string, id: string, uid: string) => {
    setLoading(true);
    await acceptCollaborationRequest(slug, id, uid);
    setLoading(false);
    loadAll();
  };

  return (
    <>
      {/* OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xl transition-opacity duration-300 z-[90] ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* GLASS DIALOG */}
      <div
        className={`
          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          w-[90vw] max-w-2xl max-h-[90vh]
          bg-white/10 backdrop-blur-3xl border border-white/20
          rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)]
          p-8 z-[100]
          transition-all duration-300
          overflow-y-auto
          ${
            open
              ? "opacity-100 scale-100"
              : "opacity-0 scale-90 pointer-events-none"
          }
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-400/50 to-indigo-500/50 shadow-lg">
              <Users className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Collaborate</h2>
              <p className="text-sm text-white/70">Invite teachers to your classrooms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X className="text-white" />
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm text-white/80">Select Classroom</label>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full bg-slate-700 border border-white/20 rounded-xl px-3 py-2 text-sm text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-400"
              style={{
                colorScheme: "dark",
                backgroundColor: "rgba(55, 65, 81, 0.8)"
              }}
            >
              <option value="" style={{ backgroundColor: "#374151", color: "white" }}>Choose…</option>
              {classrooms.map((c) => (
                <option key={c.slug} value={c.slug} style={{ backgroundColor: "#374151", color: "white" }}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-white/80">Teacher Email</label>
            <input
              placeholder="teacher@example.com"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 backdrop-blur-xl"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            onClick={submit}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 text-slate-900 font-semibold shadow-lg"
          >
            {loading ? "Sending..." : "Send Request"}
          </button>

          {message && <p className="text-sm text-cyan-300">{message}</p>}
        </div>

        {/* LIST OF REQUESTS */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-white mb-3">
            Collaboration Requests
          </h3>

          {requestsLoading ? (
            <Loader2 className="text-white animate-spin mx-auto" />
          ) : requests.length === 0 ? (
            <p className="text-white/50 text-sm">No collaboration yet</p>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl mb-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-white">
                    {r.requesterName}
                  </p>
                  <p className="text-xs text-white/50">{r.requesterEmail}</p>
                </div>

                <button
                  className="p-2 rounded-lg bg-green-400/20"
                  onClick={() => accept(r.classroomSlug, r.id, r.requesterId)}
                >
                  <Check className="text-green-300" size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
