import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { chatData } = await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare content context
    let contentContext = "";
    if (chatData.mode === "user-topic") {
      contentContext = `Topic: ${chatData.topicName}`;
    } else if (chatData.topics && chatData.topics.length > 0) {
      contentContext = chatData.topics
        .map((t: any) => `Topic: ${t.topic}\nContent: ${t.content}`)
        .join("\n\n");
    }

    const prompt = `You are an expert educator creating comprehensive study summaries.

Based on this educational content, create a detailed summary:

${contentContext}

Create a summary with:
1. 5-8 key points (most important concepts)
2. 5-10 important definitions with clear explanations
3. 4-6 core concepts that tie everything together

Return ONLY valid JSON in this format:
{
  "summary": {
    "keyPoints": [
      "Key point 1 - detailed explanation",
      "Key point 2 - detailed explanation"
    ],
    "definitions": [
      {
        "term": "Term name",
        "definition": "Clear, concise definition"
      }
    ],
    "concepts": [
      "Core concept 1 with explanation",
      "Core concept 2 with explanation"
    ]
  }
}

Make it comprehensive yet concise for quick revision.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // Clean up response
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(responseText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
