import { NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { requireAdmin } from "@/lib/dal/auth";

export const POST = async (req: Request) => {
  await requireAdmin();
  const { reasonCode, context } = await req.json();

  if (!reasonCode) {
    return NextResponse.json({ error: "Reason code is required" }, { status: 400 });
  }

  const prompt = `
    You are an assistant for a university Student Developer Club. 
    You are drafting a professional, empathetic rejection note.
    Context: ${context || "A club request"}
    Reason Code: ${reasonCode}
    
    Draft a 2-3 sentence explanation for why the request was rejected based on the reason code.
    Keep it polite but firm. Do not include placeholders or generic greetings, just the explanation text.
  `;

  try {
    const { text } = await generateText({
      model: openai("gpt-4-turbo"),
      prompt,
    });
    
    return NextResponse.json({ note: text.trim() });
  } catch (error) {
    console.error("AI Generation failed:", error);
    return NextResponse.json({ error: "Failed to generate note" }, { status: 500 });
  }
};
