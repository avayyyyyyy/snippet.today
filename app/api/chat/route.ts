import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const { messages, systemMessage, apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI writing assistant for snippet.today, a minimalist writing app. Your goal is to help users improve their writing by:
- Providing clear and actionable suggestions for improvement
- Helping with grammar, style, and clarity
- Offering creative ideas and alternative phrasings
- Maintaining the user's voice and intent
- Being concise and specific in your feedback

Keep your responses focused on writing and document editing. When appropriate, refer to specific parts of their text and explain why certain changes would improve their writing.
`,
        },
        ...messages,
        systemMessage,
      ],
      temperature: 0.5,
    });

    return NextResponse.json({
      choices: [
        {
          message: {
            content: response.choices[0].message.content,
            role: response.choices[0].message.role,
          },
        },
      ],
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    const errorStatus =
      error instanceof Error && "status" in error
        ? Number((error as { status: number }).status)
        : 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
