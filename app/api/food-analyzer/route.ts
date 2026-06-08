import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { analyzeFoodAI, IUserProfile } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { foodName, base64Image, mimeType, profile } = body;

    // Validation: Require either foodName or base64Image
    const hasFoodName = foodName && typeof foodName === "string" && foodName.trim().length > 0;
    const hasImage = base64Image && typeof base64Image === "string" && base64Image.trim().length > 0;

    if (!hasFoodName && !hasImage) {
      return NextResponse.json(
        { error: "Provide either a food name or a food image for analysis." },
        { status: 400 }
      );
    }

    if (!profile || typeof profile !== "object") {
      return NextResponse.json(
        { error: "Active user profile metrics are required for personalized analysis." },
        { status: 400 }
      );
    }

    // Call the Gemini service logic (handles local matched lookups and offline fallbacks as well)
    const analysisResult = await analyzeFoodAI(
      {
        foodName: hasFoodName ? foodName.trim() : undefined,
        base64Image: hasImage ? base64Image : undefined,
        mimeType: hasImage ? mimeType || "image/jpeg" : undefined
      },
      profile as IUserProfile
    );

    // Save to Supabase if database connection is available
    let saveStatus = "local_only";
    let savedDocumentId = null;

    if (supabase) {
      try {
        const { data: saved, error } = await supabase
          .from("food_analyses")
          .insert([{
            user_id: "default_user",
            food_name: analysisResult.foodName,
            image_url: hasImage ? base64Image : null, // Store base64 or null
            serving_size: analysisResult.servingSize,
            calories: analysisResult.calories,
            protein: analysisResult.protein,
            carbohydrates: analysisResult.carbohydrates,
            fat: analysisResult.fat,
            fiber: analysisResult.fiber,
            health_score: analysisResult.healthScore,
            recommendation: analysisResult.recommendation,
            personalized_recommendation: analysisResult.personalizedRecommendation,
            confidence_score: analysisResult.confidenceScore || null,
            user_goal: profile.goal || "maintain weight"
          }])
          .select("id")
          .single();

        if (error) throw error;

        saveStatus = "saved_to_db";
        savedDocumentId = saved?.id || null;
      } catch (dbError) {
        console.error("Failed to save food analysis to Supabase:", dbError);
        saveStatus = "db_save_failed";
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: savedDocumentId || "local_" + Date.now(),
        ...analysisResult,
        imageUrl: hasImage ? base64Image : null,
        createdAt: new Date()
      },
      saveStatus
    });
  } catch (error: any) {
    console.error("Error in POST /api/food-analyzer:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during food analysis." },
      { status: 500 }
    );
  }
}
