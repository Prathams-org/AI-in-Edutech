import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { contentContext } = await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert educator creating assessment questions.

Based on this educational content, create 10-15 multiple choice questions:

${contentContext}

Create questions that:
1. Test understanding, not just memorization
2. Cover all important concepts
3. Have one clearly correct answer
4. Include plausible distractors
5. Mix of Easy (3-5), Medium (4-6), and Hard (3-5) difficulty
6. Mark difficulty but DO NOT show it to students

Return ONLY valid JSON in this format:
{
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
      "difficulty": "easy"
    }
  ]
}

Make questions progressively challenging with mixed difficulty.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // Clean up response
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(responseText);

    return NextResponse.json({ questions: parsed.questions || parsed.testData?.questions || [] });
  } catch (error) {
    console.error("Error generating test:", error);
    return NextResponse.json(
      { error: "Failed to generate test" },
      { status: 500 }
    );
  }
}
