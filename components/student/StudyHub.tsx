"use client";

import React, { useState } from "react";
import { BookOpen, Filter, Search, Star, Download, Eye } from "lucide-react";

interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  category: string;
  rating: number;
  downloads: number;
  fileSize: string;
  uploadDate: string;
  description: string;
}

interface StudyHubProps {
  materials?: StudyMaterial[];
}

export default function StudyHub({ materials }: StudyHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const defaultMaterials: StudyMaterial[] = [
    {
      id: "1",
      title: "Algebra Fundamentals",
      subject: "Mathematics",
      category: "Notes",
      rating: 4.8,
      downloads: 234,
      fileSize: "2.4 MB",
      uploadDate: "2024-01-10",
      description: "Comprehensive notes on algebra basics and concepts",
    },
    {
      id: "2",
      title: "Shakespeare's Works",
      subject: "English",
      category: "Study Guide",
      rating: 4.5,
      downloads: 189,
      fileSize: "1.8 MB",
      uploadDate: "2024-01-12",
      description: "Complete study guide for Shakespeare's major works",
    },
    {
      id: "3",
      title: "Physics Experiments",
      subject: "Science",
      category: "Lab Manual",
      rating: 4.9,
      downloads: 312,
      fileSize: "3.1 MB",
      uploadDate: "2024-01-08",
      description: "Step-by-step guide for physics lab experiments",
    },
    {
      id: "4",
      title: "World History Timeline",
      subject: "History",
      category: "Notes",
      rating: 4.6,
      downloads: 267,
      fileSize: "2.0 MB",
      uploadDate: "2024-01-05",
      description: "Historical timeline with important events and dates",
    },
  ];

  const allMaterials = materials || defaultMaterials;
  const categories = ["all", ...new Set(allMaterials.map((m) => m.category))];

  const filteredMaterials = allMaterials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Study Hub</h1>
          <p className="text-gray-600 mt-1">Access study materials and resources</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
            >
              {/* Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {material.category}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-800 mb-2">{material.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{material.description}</p>

              {/* Details */}
              <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    <strong>Subject:</strong> {material.subject}
                  </span>
                  <span className="text-gray-600">
                    <strong>Size:</strong> {material.fileSize}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-gray-700">{material.rating}</span>
                  </div>
                  <span className="text-gray-600">
                    <Download className="w-4 h-4 inline mr-1" />
                    {material.downloads} downloads
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-semibold text-sm">
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors font-semibold text-sm">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMaterials.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Materials Found</h2>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Results Count */}
        {filteredMaterials.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Showing {filteredMaterials.length} of {allMaterials.length} materials
          </div>
        )}
      </div>
    </div>
  );
}
