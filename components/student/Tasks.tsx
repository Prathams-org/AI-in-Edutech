"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  Trash2,
  Edit2,
  Calendar,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "completed" | "in_progress" | "not_started";
  submittedDate?: string;
  marks?: number;
  totalMarks?: number;
}

interface TasksProps {
  tasks?: Task[];
}

export default function Tasks({ tasks }: TasksProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "in_progress" | "not_started">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("dueDate");

  const defaultTasks: Task[] = [
    {
      id: "1",
      title: "Mathematics Assignment - Chapter 5",
      description: "Solve problems 1-20 from chapter 5 on quadratic equations",
      subject: "Mathematics",
      dueDate: "2024-12-10",
      priority: "high",
      status: "in_progress",
    },
    {
      id: "2",
      title: "English Essay Writing",
      description: "Write a 500-word essay on Shakespeare's Hamlet",
      subject: "English",
      dueDate: "2024-12-12",
      priority: "high",
      status: "not_started",
    },
    {
      id: "3",
      title: "Science Lab Report",
      description: "Complete the photosynthesis experiment lab report",
      subject: "Science",
      dueDate: "2024-12-08",
      priority: "medium",
      status: "completed",
      submittedDate: "2024-12-07",
      marks: 18,
      totalMarks: 20,
    },
    {
      id: "4",
      title: "History Research Project",
      description: "Research and compile information about the Industrial Revolution",
      subject: "History",
      dueDate: "2024-12-20",
      priority: "low",
      status: "not_started",
    },
    {
      id: "5",
      title: "Computer Science Code Assignment",
      description: "Write a program to solve sorting algorithms",
      subject: "Computer Science",
      dueDate: "2024-12-09",
      priority: "high",
      status: "in_progress",
    },
  ];

  const allTasks = tasks || defaultTasks;

  let filteredTasks = allTasks.filter((task) =>
    filterStatus === "all" ? true : task.status === filterStatus
  );

  if (sortBy === "dueDate") {
    filteredTasks = filteredTasks.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  } else if (sortBy === "priority") {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    filteredTasks = filteredTasks.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  const stats = {
    total: allTasks.length,
    completed: allTasks.filter((t) => t.status === "completed").length,
    pending: allTasks.filter((t) => t.status !== "completed").length,
    overdue: allTasks.filter(
      (t) => new Date(t.dueDate) < new Date() && t.status !== "completed"
    ).length,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "not_started":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== "completed";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Tasks</h1>
            <p className="text-gray-600 mt-1">Track and manage your assignments</p>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Tasks</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Clock className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filter and Sort */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                filterStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("not_started")}
              className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                filterStatus === "not_started"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Not Started
            </button>
            <button
              onClick={() => setFilterStatus("in_progress")}
              className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                filterStatus === "in_progress"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                filterStatus === "completed"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Completed
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "dueDate" | "priority")}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 ${
                isOverdue(task.dueDate, task.status) ? "border-l-red-500" : "border-l-blue-500"
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* Checkbox */}
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => {}}
                    className="w-6 h-6 rounded border-gray-300 text-green-600 focus:ring-green-500 mt-1"
                  />

                  {/* Task Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{task.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>

                    {/* Tags and Details */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        {task.subject}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status === "completed"
                          ? "Completed"
                          : task.status === "in_progress"
                          ? "In Progress"
                          : "Not Started"}
                      </span>
                    </div>

                    {/* Due Date and Marks */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                        {isOverdue(task.dueDate, task.status) && (
                          <span className="text-red-600 font-semibold ml-1">(Overdue)</span>
                        )}
                      </div>
                      {task.status === "completed" && task.marks !== undefined && (
                        <span className="text-green-600 font-semibold">
                          Marks: {task.marks}/{task.totalMarks}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full md:w-auto">
                  <button className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-semibold text-sm">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-semibold text-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {filterStatus === "completed" ? "No Completed Tasks" : "No Tasks Found"}
            </h2>
            <p className="text-gray-600">
              {filterStatus === "completed"
                ? "Complete some tasks to see them here"
                : "Try adjusting your filters"}
            </p>
          </div>
        )}

        {/* Add Task Dialog */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Task</h2>
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Task title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Task description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
