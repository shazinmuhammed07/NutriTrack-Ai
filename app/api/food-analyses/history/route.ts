import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  try {
    const userId = "default_user";

    if (!supabase) {
      return NextResponse.json({
        success: true,
        history: [],
        dbStatus: "not_configured",
      });
    }

    const { data: records, error } = await supabase
      .from("food_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    const history = (records || []).map((rec: any) => ({
      id: rec.id,
      userId: rec.user_id,
      foodName: rec.food_name,
      imageUrl: rec.image_url,
      servingSize: rec.serving_size,
      calories: rec.calories,
      protein: Number(rec.protein),
      carbohydrates: Number(rec.carbohydrates),
      fat: Number(rec.fat),
      fiber: Number(rec.fiber),
      healthScore: rec.health_score,
      recommendation: rec.recommendation,
      personalizedRecommendation: rec.personalized_recommendation,
      confidenceScore: rec.confidence_score,
      userGoal: rec.user_goal,
      createdAt: rec.created_at
    }));

    return NextResponse.json({
      success: true,
      history,
      dbStatus: "connected",
    });
  } catch (error: any) {
    console.error("Error in GET /api/food-analyses/history:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred while fetching history." },
      { status: 500 }
    );
  }
}
