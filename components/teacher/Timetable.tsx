"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { usePathname } from "next/navigation";
import { db } from "../../lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { Plus, Clock, Save, Edit2, Coffee, Utensils, BookOpen, Trash2 } from "lucide-react";

// --- Types ---

type TimeSlot = {
  id: string;
  start: { hour: string; min: string; period: "AM" | "PM" };
  end: { hour: string; min: string; period: "AM" | "PM" };
};

type CellType = "period" | "lunch" | "shortbreak";

type CellData = {
  type: CellType;
  subject?: string; // Only if type === 'period'
};

// Map: Day -> TimeSlotID -> CellData
type WeeklySchedule = Record<string, Record<string, CellData>>;

type TimetableData = {
  slots: TimeSlot[];
  schedule: WeeklySchedule;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// --- Main Component ---

export default function TimetableRedesign() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [slug, setSlug] = useState("");
  
  // State
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ day: string; slotId: string } | null>(null);

  // Extract Slug
  useEffect(() => {
    if (pathname) {
      const m = pathname.match(/^\/teacher\/([^\/]+)(?:\/|$)/);
      if (m && m[1]) setSlug(m[1]);
    }
  }, [pathname]);

  // Fetch Data (Realtime)
  useEffect(() => {
    if (!slug) return;
    const unsub = onSnapshot(doc(db, "classrooms", slug), (docSnap) => {
      // Normalize incoming timetable data to ensure required shapes exist
      if (docSnap.exists()) {
        const raw = (docSnap.data() as any).timetable || null;
        if (raw) {
          const safe: TimetableData = {
            slots: Array.isArray(raw.slots) ? raw.slots : [],
            schedule: raw.schedule || {},
          };
          setTimetable(safe);
        } else {
          setTimetable(null);
        }
      } else {
        setTimetable(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [slug]);

  // Save Function (Updates Firestore)
  const saveTimetable = async (newData: TimetableData) => {
    if (!slug) return;
    try {
      await setDoc(doc(db, "classrooms", slug), { timetable: newData }, { merge: true });
    } catch (error) {
      console.error("Error saving timetable:", error);
      alert("Failed to save changes.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="backdrop-blur-2xl bg-white/5 border border-white/15 rounded-2xl px-8 py-6 flex items-center gap-3 shadow-lg shadow-slate-900/70">
        <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-cyan-300 animate-spin" />
        <p className="text-slate-100/90 text-sm">Loading timetable…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white/95 tracking-tight">
          Class Timetable
        </h2>
        <p className="text-slate-300/70 text-xs sm:text-sm mt-1">
          Manage your class schedule and periods
        </p>
      </div>

      {/* VIEW 1: Empty State */}
      {!timetable && !isCreatorOpen && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] backdrop-blur-3xl bg-white/5 border border-white/15 rounded-3xl p-8 shadow-[0_22px_55px_rgba(15,23,42,0.85)]">
          <Clock className="w-16 h-16 text-slate-300/40 mb-4" />
          <h3 className="text-xl sm:text-2xl font-semibold text-white text-center">No Timetable Found</h3>
          <p className="text-slate-300/80 text-sm sm:text-base text-center mb-8 max-w-md mt-2">
            You haven't set up the class timings yet. Define your periods, lunch breaks, and short breaks to get started.
          </p>
          <button
            onClick={() => setIsCreatorOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 text-slate-900 font-semibold shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/70 transform hover:-translate-y-0.5 transition-all"
          >
            <Plus size={20} />
            Create Timetable
          </button>
        </div>
      )}

      {/* VIEW 2: Time Slot Creator (Wizard) */}
      {isCreatorOpen && (
        <TimeSlotCreator
          onCancel={() => setIsCreatorOpen(false)}
          onSave={(slots) => {
            const initialSchedule: WeeklySchedule = {};
            DAYS.forEach((day) => (initialSchedule[day] = {}));
            // Save to DB immediately to switch view
            saveTimetable({ slots, schedule: initialSchedule });
            setIsCreatorOpen(false);
          }}
        />
      )}

      {/* VIEW 3: The Grid */}
      {timetable && (
        <div className="rounded-3xl backdrop-blur-3xl bg-white/7 border border-white/15 shadow-[0_22px_55px_rgba(15,23,42,0.85)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/15">
                  <th className="p-4 text-left font-semibold text-slate-200 w-32 sticky left-0 bg-white/5 border-r border-white/15 text-xs sm:text-sm">
                    Time
                  </th>
                  {DAYS.map((day) => (
                    <th key={day} className="p-4 text-center font-semibold text-slate-100 min-w-[140px] text-xs sm:text-sm">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(timetable?.slots || []).map((slot) => (
                  <tr key={slot.id} className="hover:bg-white/8 transition-colors">
                    {/* Time Column */}
                    <td className="p-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-300 sticky left-0 bg-white/5 border-r border-white/15">
                      <div className="flex flex-col">
                        <span>
                          {slot.start.hour}:{slot.start.min} {slot.start.period}
                        </span>
                        <span className="text-slate-400/70 text-[10px] text-center">to</span>
                        <span>
                          {slot.end.hour}:{slot.end.min} {slot.end.period}
                        </span>
                      </div>
                    </td>

                    {/* Day Columns */}
                    {DAYS.map((day) => {
                      const cellData = timetable?.schedule?.[day]?.[slot.id];
                      return (
                        <td
                          key={`${day}-${slot.id}`}
                          onClick={() => setEditingCell({ day, slotId: slot.id })}
                          className="p-2 border-l border-white/10 cursor-pointer relative group h-24 align-top hover:bg-white/8 transition-colors"
                        >
                          {cellData ? (
                            <CellDisplay data={cellData} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-cyan-400/20 text-cyan-300 p-2 rounded-full border border-cyan-300/40">
                                <Plus size={16} />
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-white/5 border-t border-white/15 flex justify-between items-center text-xs sm:text-sm text-slate-400">
             <span>Click on any empty cell to assign a subject or break.</span>
             <button 
               onClick={() => {
                 if(confirm("This will clear the entire timetable structure. Are you sure?")) {
                   setTimetable(null);
                 }
               }}
               className="text-rose-400/80 hover:text-rose-300 transition"
             >
               Reset Timetable
             </button>
          </div>
        </div>
      )}

      {/* VIEW 4: Cell Editor Modal */}
      {(() => {
        // guard editing modal render to ensure slot exists
        const editingTimeSlot = editingCell && timetable ? timetable.slots.find((s) => s.id === editingCell.slotId) : undefined;
        if (editingCell && timetable && editingTimeSlot) {
          return (
            <CellEditor
              currentData={timetable.schedule?.[editingCell.day]?.[editingCell.slotId]}
              day={editingCell.day}
              timeSlot={editingTimeSlot}
              onClose={() => setEditingCell(null)}
              onSave={(data) => {
                const newSchedule = { ...(timetable.schedule || {}) } as WeeklySchedule;
                if (!newSchedule[editingCell.day]) newSchedule[editingCell.day] = {};

                if (data) {
                  newSchedule[editingCell.day][editingCell.slotId] = data;
                } else {
                  delete newSchedule[editingCell.day][editingCell.slotId];
                }

                saveTimetable({ ...timetable, schedule: newSchedule });
                setEditingCell(null);
              }}
            />
          );
        }
        return null;
      })()}
    </div>
  );
}

// --- Sub-Components ---

// 1. Display Component for a Table Cell
function CellDisplay({ data }: { data: CellData }) {
  if (data.type === "lunch") {
    return (
      <div className="w-full h-full bg-orange-500/20 rounded-lg flex flex-col items-center justify-center text-orange-300 border border-orange-400/40 backdrop-blur-sm">
        <Utensils size={18} className="mb-1" />
        <span className="text-[10px] font-bold uppercase">Lunch</span>
      </div>
    );
  }
  if (data.type === "shortbreak") {
    return (
      <div className="w-full h-full bg-yellow-500/20 rounded-lg flex flex-col items-center justify-center text-yellow-300 border border-yellow-400/40 backdrop-blur-sm">
        <Coffee size={18} className="mb-1" />
        <span className="text-[10px] font-bold uppercase">Break</span>
      </div>
    );
  }
  return (
    <div className="w-full h-full bg-cyan-500/15 rounded-lg p-2 border border-cyan-400/40 flex flex-col justify-center text-center backdrop-blur-sm">
      <span className="text-[10px] text-cyan-300/90 font-semibold uppercase mb-1">Period</span>
      <span className="text-xs font-bold text-slate-100 break-words leading-tight line-clamp-2">
        {data.subject || "Subject"}
      </span>
    </div>
  );
}

// 2. Wizard to Create Time Slots
function TimeSlotCreator({ onCancel, onSave }: { onCancel: () => void; onSave: (slots: TimeSlot[]) => void }) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  
  // Temporary input state
  const [startH, setStartH] = useState("09");
  const [startM, setStartM] = useState("00");
  const [startP, setStartP] = useState<"AM" | "PM">("AM");
  
  const [endH, setEndH] = useState("09");
  const [endM, setEndM] = useState("45");
  const [endP, setEndP] = useState<"AM" | "PM">("AM");
  // Duration for the next period in minutes (defaults to 40)
  const [durationMin, setDurationMin] = useState<number>(40);

  // helper: convert to minutes since midnight
  const toMinutes = (h: string, m: string, period: "AM" | "PM") => {
    let hour = parseInt(h || "0", 10);
    const minute = parseInt(m || "0", 10);
    if (period === "AM") {
      if (hour === 12) hour = 0;
    } else {
      if (hour !== 12) hour += 12;
    }
    return hour * 60 + minute;
  };

  const fromMinutes = (mins: number) => {
    mins = Math.max(0, mins);
    mins = mins % (24 * 60);
    const hour24 = Math.floor(mins / 60);
    const minute = mins % 60;
    const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
    let hour = hour24 % 12;
    if (hour === 0) hour = 12;
    return {
      hour: hour.toString().padStart(2, "0"),
      min: minute.toString().padStart(2, "0"),
      period,
    };
  };

  const addMinutes = (h: string, m: string, p: "AM" | "PM", delta: number) => {
    const mins = toMinutes(h, m, p) + delta;
    return fromMinutes(mins);
  };

  const [manualEndEdit, setManualEndEdit] = useState(false);

  // recompute end when duration or start changes, unless teacher manually edited end
  useEffect(() => {
    if (manualEndEdit) return;
    const start = slots.length > 0 ? slots[slots.length - 1].end : { hour: startH, min: startM, period: startP };
    const startMins = toMinutes(start.hour, start.min, start.period);
    const computed = fromMinutes(startMins + durationMin);
    setEndH(computed.hour);
    setEndM(computed.min);
    setEndP(computed.period);
  }, [durationMin, startH, startM, startP]);

  const addSlot = () => {
    // determine start: if previous slot exists, start = previous end, else use inputs
    const last = slots[slots.length - 1];
    const start = last ? last.end : { hour: startH, min: startM, period: startP };

    // Use durationMin to compute end from start
    const startMins = toMinutes(start.hour, start.min, start.period);
    const endComputed = fromMinutes(startMins + durationMin);

    // If user edited end inputs directly, prefer them if they represent a later time than computed end
    const manualEndMins = toMinutes(endH, endM, endP);
    const endFinal = manualEndMins > startMins ? { hour: endH, min: endM, period: endP } : endComputed;

    if (toMinutes(endFinal.hour, endFinal.min, endFinal.period) <= startMins) {
      alert("End time must be later than start time.");
      return;
    }

    const newSlot: TimeSlot = {
      id: Math.random().toString(36).substr(2, 9),
      start,
      end: endFinal,
    };

    setSlots([...slots, newSlot]);

    // After adding, prefill next start as this end and default duration to the same duration
    const nextStart = newSlot.end;
    setStartH(nextStart.hour);
    setStartM(nextStart.min);
    setStartP(nextStart.period);

    // set next default duration to the length of this slot
    const thisDuration = toMinutes(newSlot.end.hour, newSlot.end.min, newSlot.end.period) - toMinutes(newSlot.start.hour, newSlot.start.min, newSlot.start.period);
    if (thisDuration > 0) setDurationMin(thisDuration);
    // reset manualEndEdit so next end is computed from duration
    setManualEndEdit(false);
    // update end inputs to reflect next computed end
    const nextEnd = fromMinutes(toMinutes(nextStart.hour, nextStart.min, nextStart.period) + (thisDuration > 0 ? thisDuration : durationMin));
    setEndH(nextEnd.hour);
    setEndM(nextEnd.min);
    setEndP(nextEnd.period);
  };

  const removeSlot = (id: string) => {
    setSlots(slots.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">Setup Class Timings</h3>
          <p className="text-sm text-gray-500 mt-1">
            Define all your periods, lunch breaks, and short breaks here.
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Input Area */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
               <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded">TIP</span>
               <span className="text-sm text-blue-800">Don't forget to add slots for <span className="font-bold">Lunch Breaks</span> and <span className="font-bold">Short Breaks</span>!</span>
            </div>
            
            <div className="flex flex-col md:flex-row md:flex-wrap gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Start Time</label>
                <div className="flex items-center gap-2 bg-white p-1 rounded border shadow-sm">
                  <input
                    className={`w-12 p-2 text-center outline-none border-r font-mono ${slots.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    value={startH}
                    onChange={e => setStartH(e.target.value)}
                    maxLength={2}
                    disabled={slots.length > 0}
                  />
                  <span className="font-bold">:</span>
                  <input
                    className={`w-12 p-2 text-center outline-none border-r font-mono ${slots.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    value={startM}
                    onChange={e => setStartM(e.target.value)}
                    maxLength={2}
                    disabled={slots.length > 0}
                  />
                  <select
                    className={`p-2 outline-none bg-transparent font-medium text-gray-600 ${slots.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    value={startP}
                    onChange={e => setStartP(e.target.value as any)}
                    disabled={slots.length > 0}
                  >
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">End Time</label>
                <div className="flex items-center gap-2 bg-white p-1 rounded border shadow-sm">
                  <input className="w-12 p-2 text-center outline-none border-r font-mono" value={endH} onChange={e => { setEndH(e.target.value); setManualEndEdit(true); }} maxLength={2} />
                  <span className="font-bold">:</span>
                  <input className="w-12 p-2 text-center outline-none border-r font-mono" value={endM} onChange={e => { setEndM(e.target.value); setManualEndEdit(true); }} maxLength={2} />
                  <select className="p-2 outline-none bg-transparent font-medium text-gray-600" value={endP} onChange={e => { setEndP(e.target.value as any); setManualEndEdit(true); }}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                  
                  {/* Duration control: minutes with +/- buttons */}
                  <div className="ml-3 flex items-center gap-2">
                    <label className="text-xs text-gray-500">Duration</label>
                    <div className="flex items-center border rounded overflow-hidden">
                      <button
                        onClick={() => setDurationMin((d) => Math.max(0, d - 1))}
                        className="px-2 bg-gray-100 text-gray-700"
                        type="button"
                      >
                        -
                      </button>
                      <input
                        className="w-14 text-center px-2"
                        value={durationMin}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            // if user cleared the input entirely, set zero
                            setDurationMin(0);
                            return;
                          }
                          const v = parseInt(e.target.value || "0", 10);
                          if (!isNaN(v) && v >= 0) setDurationMin(v);
                        }}
                        type="number"
                        min={0}
                      />
                      <button
                        onClick={() => setDurationMin((d) => d + 1)}
                        className="px-2 bg-gray-100 text-gray-700"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">min</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={addSlot}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black font-medium flex-none w-full md:w-auto"
              >
                Add Slot
              </button>
            </div>
          </div>

          {/* List of Added Slots */}
          <div className="space-y-2">
            {slots.length === 0 && <div className="text-center py-8 text-gray-400">No slots added yet.</div>}
            {slots.map((slot, idx) => (
              <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    {idx + 1}
                  </span>
                  <div className="font-mono font-medium text-gray-700">
                    {slot.start.hour}:{slot.start.min} {slot.start.period} 
                    <span className="mx-2 text-gray-400">-</span> 
                    {slot.end.hour}:{slot.end.min} {slot.end.period}
                  </div>
                </div>
                <button onClick={() => removeSlot(slot.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">
            Cancel
          </button>
          <button 
            disabled={slots.length === 0}
            onClick={() => onSave(slots)} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
          >
            Create Timetable Grid
          </button>
        </div>
      </div>
    </div>
  );
}

// 3. Modal to Edit a Specific Cell
function CellEditor({ 
    currentData, 
    day, 
    timeSlot, 
    onClose, 
    onSave 
}: { 
    currentData?: CellData, 
    day: string, 
    timeSlot: TimeSlot, 
    onClose: () => void, 
    onSave: (data: CellData | null) => void 
}) {
  const [type, setType] = useState<CellType>(currentData?.type || "period");
  const [subject, setSubject] = useState(currentData?.subject || "");

  const handleSave = () => {
    // Only include `subject` when the cell type is a period.
    const data: CellData = { type };
    if (type === "period") data.subject = subject;
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h3 className="text-lg font-bold">{day}</h3>
          <p className="opacity-80 text-sm font-mono mt-1">
             {timeSlot.start.hour}:{timeSlot.start.min} {timeSlot.start.period} - {timeSlot.end.hour}:{timeSlot.end.min} {timeSlot.end.period}
          </p>
        </div>

        <div className="p-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">What happens in this slot?</label>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button 
              onClick={() => setType("period")}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${type === "period" ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}
            >
              <BookOpen size={20} className="mb-2" />
              <span className="text-xs font-semibold">Class</span>
            </button>
            <button 
              onClick={() => setType("lunch")}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${type === "lunch" ? "border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500" : "border-gray-200 hover:border-gray-300"}`}
            >
              <Utensils size={20} className="mb-2" />
              <span className="text-xs font-semibold">Lunch</span>
            </button>
            <button 
              onClick={() => setType("shortbreak")}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${type === "shortbreak" ? "border-yellow-500 bg-yellow-50 text-yellow-700 ring-1 ring-yellow-500" : "border-gray-200 hover:border-gray-300"}`}
            >
              <Coffee size={20} className="mb-2" />
              <span className="text-xs font-semibold">Break</span>
            </button>
          </div>

          {type === "period" && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
              <input
                autoFocus
                placeholder="e.g. Mathematics, History"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">
              Cancel
            </button>
            <button 
              onClick={() => onSave(null)} 
              className="px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg font-medium transition"
              title="Clear this cell"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={handleSave} 
              className="flex-[2] py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}