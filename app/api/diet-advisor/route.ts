import { NextResponse } from "next/server";
import { askDietAdvisorAI } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "A valid, non-empty question is required." },
        { status: 400 }
      );
    }

    const advisorResponse = await askDietAdvisorAI(question.trim());

    return NextResponse.json({
      success: true,
      data: advisorResponse,
    });
  } catch (error: any) {
    console.error("Error in POST /api/diet-advisor:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
