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

    const prompt = `You are an expert educator creating engaging learning flashcards. 

Based on this educational content, create 8-12 flashcards for students:

${contentContext}

For each flashcard, create:
1. A clear, concise title
2. Main content (2-3 paragraphs explaining the concept)
3. An engaging AI explanation that simplifies the concept
4. 3-5 key points to remember

Return ONLY valid JSON in this format:
{
  "flashcards": [
    {
      "id": 1,
      "title": "Concept Title",
      "content": "Main explanation of the concept...",
      "explanation": "Simplified explanation for better understanding...",
      "keyPoints": [
        "Key point 1",
        "Key point 2",
        "Key point 3"
      ]
    }
  ]
}

Important:
- Make content clear and educational
- Keep explanations simple and engaging
- Focus on understanding, not memorization`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // Clean up response
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(responseText);

    // Process image URLs - convert search queries to Unsplash URLs
    if (parsed.flashcards) {
      parsed.flashcards = parsed.flashcards.map((card: any) => {
        if (card.imageUrl && card.imageUrl.startsWith("search:")) {
          const query = card.imageUrl.replace("search:", "").trim();
          // Use Unsplash API for stock images
          card.imageUrl = `https://source.unsplash.com/800x400/?${encodeURIComponent(query)}`;
        } else if (!card.imageUrl) {
          card.imageUrl = null;
        }
        return card;
      });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
