import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import DietPlan from "@/models/DietPlan";

export async function GET() {
  try {
    const userId = "default_user";

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        success: true,
        history: [],
        dbStatus: "not_configured",
      });
    }

    const history = await DietPlan.find({ userId }).sort({ createdAt: -1 }).limit(10);

    return NextResponse.json({
      success: true,
      history,
      dbStatus: "connected",
    });
  } catch (error: any) {
    console.error("Error in GET /api/diet-plan/history:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
