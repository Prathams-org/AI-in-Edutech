import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Helper function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const { contentContext, chatData } = await request.json();

    // Use gemini-1.5-flash for better stability and rate limits
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert educator creating comprehensive learning materials. Generate ONLY FLASHCARDS for this educational content:

CONTENT TO ANALYZE:
${contentContext}

Generate the following in a SINGLE response:

FLASHCARDS (8-12 cards):
- Each with title, content (2-3 paragraphs), explanation, and key points (3-5)
- Make content clear, engaging, and educational
- DO NOT include image search queries or image URLs

Return ONLY valid JSON in this EXACT format:
{
  "flashcards": [
    {
      "id": 1,
      "title": "Concept Title",
      "content": "Main explanation...",
      "explanation": "Simplified explanation...",
      "keyPoints": ["point 1", "point 2", "point 3"]
    }
  ]
}

IMPORTANT: Return complete, valid JSON. No markdown, no code blocks, just JSON.`;

    // Implement retry logic with exponential backoff
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let responseText = response.text();

        // Clean up response
        responseText = responseText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        const parsed = JSON.parse(responseText);

        // Validate structure
        if (!parsed.flashcards) {
          throw new Error("Invalid response structure from AI");
        }

        return NextResponse.json(parsed);
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt failed. Retries left: ${retries - 1}`, error);
        
        // Check if it's a rate limit error (429)
        if (error.message?.includes('429') || error.status === 429) {
          retries--;
          if (retries > 0) {
            // Wait for 2, 4, 8 seconds...
            const waitTime = 2000 * (4 - retries);
            console.log(`Waiting ${waitTime}ms before retry...`);
            await delay(waitTime);
            continue;
          }
        } else {
          // If it's not a rate limit error, throw immediately
          throw error;
        }
      }
    }

    throw lastError;

  } catch (error) {
    console.error("Error generating learning content:", error);
    
    // Return more detailed error for debugging
    return NextResponse.json(
      { 
        error: "Failed to generate learning content",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
