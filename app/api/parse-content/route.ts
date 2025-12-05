import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

interface ParseRequest {
  text: string;
  subject?: string;
  topic?: string;
}

// Simple school-appropriate subject names
const SCHOOL_SUBJECTS = [
  "English", "Mathematics", "Science", "Social Studies", "History", 
  "Geography", "Physics", "Chemistry", "Biology", "Computer Science",
  "Physical Education", "Arts", "Music", "Languages"
];

// Prompt when subject and topic are NOT provided
const FULL_ANALYSIS_PROMPT = `You are an AI assistant helping teachers organize educational content for school students.

Analyze the text deeply and create a MICRO-FRAGMENTED structure:
1. Identify the school subject (use: English, Mathematics, Science, Social Studies, History, Geography, Physics, Chemistry, Biology, Computer Science, Physical Education, Arts, Music, or Languages)
2. Create descriptive chapter names based on major themes/units in the content
3. Break each chapter into MICRO-TOPICS - the smallest teachable units
4. Each topic must have a SPECIFIC, DESCRIPTIVE name that tells what it teaches
5. Extract actual headings or create names based on content

Return ONLY valid JSON (no markdown, no code blocks):
{
  "subjects": [
    {
      "title": "Specific Subject Name",
      "chapters": [
        {
          "title": "Specific Chapter Name (e.g., 'Cell Biology', 'Ancient Rome', 'Quadratic Equations')",
          "topics": [
            {
              "title": "Specific Micro-Topic Name (e.g., 'Cell Membrane Composition', 'Roman Senate Structure')",
              "content": "Content for this micro-topic..."
            }
          ]
        }
      ]
    }
  ]
}

RULES:
- Use simple, school-appropriate subject names from the list above
- Create DESCRIPTIVE chapter names based on content themes (never "Chapter 1", "Unit A")
- Break content into MICRO-FRAGMENTS: many small topics, not few large ones
- Never use generic names like "Topic 1", "Section 1", "Part A"
- Each topic name must describe the SPECIFIC concept it teaches
- If content mentions specific concepts, use those exact names
- Aim for 10-30 micro-topics for a typical document
- Each topic should be teachable independently in 2-5 minutes
- Always include complete content text in each topic`;

// Prompt when subject is provided but topic is NOT
const SUBJECT_PROVIDED_PROMPT = (subject: string) => `You are organizing educational content for the subject: "${subject}".

Analyze the content and create a HIGHLY GRANULAR structure:
1. Identify or create chapter names based on major themes/units
2. Break each chapter into MICRO-TOPICS (smallest teachable units)
3. Each topic must have a SPECIFIC, DESCRIPTIVE name
4. Extract actual headings from content or create descriptive names

Return ONLY valid JSON (no markdown, no code blocks):
{
  "subjects": [
    {
      "title": "${subject}",
      "chapters": [
        {
          "title": "Specific Chapter Name (e.g., 'Cell Biology', 'Photosynthesis')",
          "topics": [
            {
              "title": "Specific Topic Name (e.g., 'Cell Membrane Structure', 'Mitochondrial Function')",
              "content": "Content for this micro-topic..."
            }
          ]
        }
      ]
    }
  ]
}

RULES:
- Use the provided subject: "${subject}"
- Create descriptive chapter names based on content themes
- Break into MICRO-FRAGMENTS: aim for many small topics rather than few large ones
- Never use generic names like "Topic 1", "Chapter 1", "Section A"
- Give each topic a name that describes WHAT IT TEACHES
- For a 5-page document, aim for 10-20 micro-topics across chapters
- Each topic should cover ONE specific concept that can be taught in 2-5 minutes`;

// Prompt when both subject and topic are provided
const FULL_CONTEXT_PROMPT = (subject: string, topic: string) => `You are organizing educational content for:
Subject: "${subject}"
Topic/Chapter: "${topic}"

Analyze the content deeply and break it into MICRO-FRAGMENTS:
1. If the content has clear sub-sections, create multiple topics for each distinct concept
2. Each topic should cover ONE specific concept or idea
3. Break content into the smallest logical teaching units
4. Extract actual headings, sub-headings, or create descriptive topic names

Return ONLY valid JSON (no markdown, no code blocks):
{
  "subjects": [
    {
      "title": "${subject}",
      "chapters": [
        {
          "title": "${topic}",
          "topics": [
            {
              "title": "Specific Topic Name (NOT 'Topic 1')",
              "content": "Content for this specific concept..."
            }
          ]
        }
      ]
    }
  ]
}

RULES:
- Use "${topic}" as the chapter title
- Create MULTIPLE topics by breaking content into smallest logical units
- Give each topic a DESCRIPTIVE, SPECIFIC name based on what it teaches
- Never use generic names like "Topic 1", "Section 1", "Part 1"
- If content mentions specific concepts (e.g., "Cell Structure", "Mitosis", "DNA Replication"), use those as topic names
- Aim for 3-10 micro-topics per chapter for better granularity
- Each topic should be self-contained and teachable independently`;

export async function POST(request: NextRequest) {
  try {
    const body: ParseRequest = await request.json();
    const { text, subject, topic } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text content is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Select prompt based on what information is provided
    let systemPrompt: string;
    
    if (subject && topic) {
      // Both provided - minimal AI work
      systemPrompt = FULL_CONTEXT_PROMPT(subject, topic);
    } else if (subject) {
      // Only subject provided - moderate AI work
      systemPrompt = SUBJECT_PROVIDED_PROMPT(subject);
    } else {
      // Nothing provided - full AI analysis
      systemPrompt = FULL_ANALYSIS_PROMPT;
    }

    const prompt = `${systemPrompt}

Analyze this content:

${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // Clean up response
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Parse JSON
    const parsed = JSON.parse(responseText);

    // Validate structure
    if (!parsed.subjects || !Array.isArray(parsed.subjects) || parsed.subjects.length === 0) {
      throw new Error("Invalid response structure from AI");
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Error parsing content:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse content" },
      { status: 500 }
    );
  }
}
