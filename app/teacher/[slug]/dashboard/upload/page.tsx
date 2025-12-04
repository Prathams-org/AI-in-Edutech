"use client";

import React, { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseDocument } from "@/lib/documentParser";
import { saveContentToFirestore } from "@/lib/contentStorage";
import { Loader2, Upload, FileText, X, ArrowLeft } from "lucide-react";

interface ParsedContent {
  subjects: Array<{
    title: string;
    chapters: Array<{
      title: string;
      topics: Array<{
        title: string;
        content: string;
      }>;
    }>;
  }>;
}

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const classroomSlug = params.slug as string;

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(extension || "")) {
      alert("Please upload only PDF or DOC/DOCX files");
      return;
    }
    setFile(file);
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      setProgress("Reading document...");

      // Parse document on CLIENT side
      const text = await parseDocument(file);

      setProgress("Analyzing with AI...");

      // Call server-side API with parsed text
      const response = await fetch("/api/parse-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          subject: subject.trim() || undefined,
          topic: topic.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to parse content");
      }

      const parsedContent: ParsedContent = await response.json();

      setProgress("Saving to database...");

      // Save to Firestore
      await saveContentToFirestore(classroomSlug, parsedContent);

      setProgress("Complete!");

      // Navigate back to content tab after short delay
      setTimeout(() => {
        router.push(`/teacher/${classroomSlug}/dashboard?tab=content`);
      }, 1000);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "Failed to upload content");
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/teacher/${classroomSlug}/dashboard?tab=content`)}
            disabled={uploading}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Upload Content</h1>
            <p className="text-gray-600">
              Upload educational materials for your classroom
            </p>
          </div>
        </div>

        {/* Upload Card */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Optional Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm text-gray-700">
                  Subject <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics, Science, English"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={uploading}
                  className="border-gray-300 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500">
                  If not provided, AI will detect the subject
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic" className="text-sm text-gray-700">
                  Topic <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="topic"
                  placeholder="e.g., Algebra, Cell Biology"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={uploading}
                  className="border-gray-300 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500">
                  Helps AI organize content more efficiently
                </p>
              </div>
            </div>

            {/* Drag and Drop Area */}
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                  isDragging
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700 mb-1">
                      {isDragging
                        ? "Drop your file here"
                        : "Drag and drop your file here"}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      or click to browse
                    </p>
                  </div>
                  <input
                    type="file"
                    id="file-input"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="file-input">
                    <Button asChild disabled={uploading}>
                      <span className="cursor-pointer">
                        <FileText className="w-4 h-4 mr-2" />
                        Select File
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500">
                    Supported formats: PDF, DOC, DOCX
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  {!uploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/teacher/${classroomSlug}/dashboard?tab=content`)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {progress}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload Progress Overlay */}
        {uploading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="w-96">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="w-16 h-16 animate-spin text-purple-600" />
                  <div className="text-center">
                    <p className="text-lg font-semibold">{progress}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Please wait, this may take a moment...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
