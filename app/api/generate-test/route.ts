import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { chatData } = await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Prepare content context
    let contentContext = "";
    if (chatData.mode === "user-topic") {
      contentContext = `Topic: ${chatData.topicName}`;
    } else if (chatData.topics && chatData.topics.length > 0) {
      contentContext = chatData.topics
        .map((t: any) => `Topic: ${t.topic}\nContent: ${t.content}`)
        .join("\n\n");
    }

    const prompt = `You are an expert educator creating assessment questions.

Based on this educational content, create 10-15 multiple choice questions:

${contentContext}

Create questions that:
1. Test understanding, not just memorization
2. Cover all important concepts
3. Have one clearly correct answer
4. Include plausible distractors
5. Mix of Easy, Medium, and Hard difficulty

Return ONLY valid JSON in this format:
{
  "testData": {
    "questions": [
      {
        "id": 1,
        "question": "Clear question text?",
        "options": [
          "Option A",
          "Option B",
          "Option C",
          "Option D"
        ],
        "correctAnswer": "Option A",
        "explanation": "Why this is the correct answer",
        "difficulty": "easy" | "medium" | "hard"
      }
    ]
  }
}

Make questions progressively challenging.`;

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
    console.error("Error generating test:", error);
    return NextResponse.json(
      { error: "Failed to generate test" },
      { status: 500 }
    );
  }
}
