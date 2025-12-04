// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export interface Topic {
  title: string;
  content: string;
}

export interface Chapter {
  title: string;
  topics: Topic[];
}

export interface Subject {
  title: string;
  chapters: Chapter[];
}

export interface ParsedContent {
  subjects: Subject[];
}

const SYSTEM_PROMPT = `You are an AI assistant that helps teachers organize educational content. Your task is to analyze uploaded document text and structure it into subjects, chapters, and topics.

IMPORTANT INSTRUCTIONS:
1. Analyze the text and identify distinct subjects, chapters within subjects, and topics within chapters
2. Extract the actual content for each topic
3. Return ONLY valid JSON, no markdown formatting, no code blocks, no extra text
4. If the content is small and belongs to a single topic, structure it as one subject → one chapter → one topic

Response format (MUST be valid JSON):
{
  "subjects": [
    {
      "title": "Subject Name",
      "chapters": [
        {
          "title": "Chapter Name",
          "topics": [
            {
              "title": "Topic Name",
              "content": "The actual content text for this topic..."
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Subject titles should be broad educational categories (e.g., "Mathematics", "Physics", "History")
- Chapter titles should be specific units or modules
- Topic titles should be specific concepts or lessons
- Content should be the actual educational text
- For small documents (1-2 pages), create logical divisions even if minimal
- Never return empty arrays
- Always include at least one subject, one chapter, and one topic`;

export async function parseContentWithAI(text: string): Promise<ParsedContent> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `${SYSTEM_PROMPT}

Now analyze this educational content and structure it:

${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Parse the JSON
    const parsed = JSON.parse(responseText) as ParsedContent;

    // Validate structure
    if (!parsed.subjects || !Array.isArray(parsed.subjects) || parsed.subjects.length === 0) {
      throw new Error("Invalid response structure from AI");
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing content with AI:", error);
    throw new Error("Failed to parse content. Please try again.");
  }
}