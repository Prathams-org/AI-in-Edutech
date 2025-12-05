import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is missing. Please check your environment variables." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { examTemplates, timeAvailability, currentDay, userId } = body;

    if (!examTemplates || !timeAvailability || !currentDay) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId in request body" },
        { status: 400 }
      );
    }

    // Validate examTemplates is not empty
    if (!Array.isArray(examTemplates) || examTemplates.length === 0) {
      return NextResponse.json(
        { error: "No exam templates found. Please ensure you have joined classrooms with exams." },
        { status: 400 }
      );
    }

    // Validate student document exists
    const studentDoc = await getDoc(doc(db, "students", userId));
    if (!studentDoc.exists()) {
      return NextResponse.json(
        { error: "Student data not found. Please ensure you are logged in." },
        { status: 404 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert timeAvailability format from {hours, mins} to readable string
    const formatTime = (timeObj: any): string => {
      if (typeof timeObj === 'string') return timeObj;
      const hours = parseInt(timeObj?.hours || '0');
      const mins = parseInt(timeObj?.mins || '0');
      if (hours === 0 && mins === 0) return 'No time set';
      return `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''} ${mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''}` : ''}`.trim();
    };

    const prompt = `You are an AI study planner. Generate study tasks for today based on the student's exam schedule.

**Today:** ${currentDay}
**Available Study Time Today:** ${formatTime(timeAvailability[currentDay])}

**Upcoming Exams:**
${examTemplates
  .map(
    (template: any) =>
      `\n${template.title}:\n${template.entries
        .map(
          (entry: any) =>
            `  - ${entry.subject} (${entry.date})\n    Syllabus: ${entry.syllabus
              .map((s: any) => `${s.chapter}: [${s.topics.join(", ")}] (IDs: [${(s.topicIds || []).join(", ")}])`)
              .join("; ")}`
        )
        .join("\n")}`
  )
  .join("\n")}

**Instructions:**
Generate 4-8 prioritized study tasks for today. Focus on:
- Exams happening sooner (higher priority)
- Realistic time estimates
- Mix of learning, revision, and practice

Return ONLY valid JSON (no markdown):
[
  {
    "id": "unique-id",
    "title": "Task title",
    "subject": "Subject name",
    "chapter": "Chapter name",
    "topics": ["topic1", "topic2"],
    "topicIds": ["docId1", "docId2"],
    "estimatedDuration": "30 minutes",
    "difficultyLevel": "easy|medium|hard",
    "relatedExam": "Exam name"
  }
]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let tasks;
    try {
      tasks = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse AI response:", text);
      return NextResponse.json(
        { error: "Failed to parse AI response", rawResponse: text },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Error generating study tasks:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate study tasks" },
      { status: 500 }
    );
  }
}
