import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { results, questions } = await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `Analyze the student's test performance.

QUESTIONS & ANSWERS:
${JSON.stringify(questions)}

STUDENT RESULTS:
${JSON.stringify(results)}

Analyze:
1. Score
2. Response times (too fast? too slow?)
3. Difficulty handling (did they miss easy or hard ones?)
4. Weak points & Strong points
5. Suggestions for improvement
6. A "pick up line" (motivational quote or fun educational pun)

Return ONLY valid JSON:
{
  "score": number,
  "totalQuestions": number,
  "weakPoints": ["point 1", "point 2"],
  "strongPoints": ["point 1", "point 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "pickupLine": "string"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Error analyzing test:", error);
    return NextResponse.json({ error: "Failed to analyze test" }, { status: 500 });
  }
}
