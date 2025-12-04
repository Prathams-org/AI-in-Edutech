"use client";

import { useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DownloadDataPage() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);

    try {
      const studentId = "Rrzo9rEH4pMfkOAJOQimyywo1673";

      // Fetch main student document
      const studentRef = doc(db, "students", studentId);
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        alert("No student document found!");
        setLoading(false);
        return;
      }

      const studentData = studentSnap.data();

      // Fetch chats subcollection
      const chatsRef = collection(db, "students", studentId, "chats");
      const chatsSnap = await getDocs(chatsRef);

      const chats: any[] = [];
      chatsSnap.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() });
      });

      // Final combined JSON
      const finalData = {
        id: studentId,
        ...studentData,
        chats,
      };

      // Convert to downloadable JSON
      const blob = new Blob([JSON.stringify(finalData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `student_${studentId}_data.json`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading data:", error);
      alert("Failed to download. Check console.");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Download Student Data</h1>
      <p>This page generates a JSON file with the student document and all chat documents.</p>

      <button
        onClick={handleDownload}
        disabled={loading}
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          background: "#000",
          color: "white",
          borderRadius: "6px",
        }}
      >
        {loading ? "Preparing..." : "Download JSON"}
      </button>
    </div>
  );
}
