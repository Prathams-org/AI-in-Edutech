import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { chatId, cardIndex, question, context } = await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `You are a helpful tutor answering a student's question about a learning topic.

Context (current flashcard):
Title: ${context.title}
Content: ${context.content}
Explanation: ${context.explanation}

Student's Question: ${question}

Provide a clear, helpful answer that:
1. Directly addresses their question
2. Uses simple, easy-to-understand language
3. Includes examples if helpful
4. Encourages further learning

Keep the response concise (2-4 sentences) but thorough.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Error answering doubt:", error);
    return NextResponse.json(
      { error: "Failed to answer question" },
      { status: 500 }
    );
  }
}
