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
      .from("diet_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    const history = (records || []).map((rec: any) => ({
      id: rec.id,
      _id: rec.id, // for local storage backwards compatibility
      userId: rec.user_id,
      age: rec.age,
      gender: rec.gender,
      height: rec.height,
      weight: rec.weight,
      activityLevel: rec.activity_level,
      goal: rec.goal,
      budget: rec.budget,
      bmi: Number(rec.bmi),
      maintenanceCalories: rec.maintenance_calories,
      targetCalories: rec.target_calories,
      cuisine: rec.cuisine,
      dietType: rec.diet_type,
      goalTimeline: rec.goal_timeline,
      mealPlan: rec.meal_plan,
      createdAt: rec.created_at
    }));

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
