import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { generateDietPlanAI } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const userId = "default_user";

    const body = await request.json();
    const { age, gender, height, weight, activityLevel, goal, budget, cuisine, dietType, goalTimeline } = body;

    // Validation
    if (!age || !gender || !height || !weight || !activityLevel || !goal || !budget) {
      return NextResponse.json(
        {
          error:
            "All fields (age, gender, height, weight, activityLevel, goal, budget) are required.",
        },
        { status: 400 }
      );
    }

    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);

    const cuisineStr = cuisine || "Mixed Indian";
    const dietTypeStr = dietType || "Any";
    const goalTimelineStr = goalTimeline || "3 Months";

    if (
      isNaN(ageNum) ||
      isNaN(heightNum) ||
      isNaN(weightNum) ||
      ageNum <= 0 ||
      heightNum <= 0 ||
      weightNum <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid numeric values for age, height, or weight." },
        { status: 400 }
      );
    }

    // 1. Calculate BMI
    // BMI = weight (kg) / (height (m) ^ 2)
    const heightInMeters = heightNum / 100;
    const bmi = weightNum / (heightInMeters * heightInMeters);

    // 2. Calculate BMR (Mifflin-St Jeor)
    let bmr = 0;
    if (gender.toLowerCase() === "male") {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
    } else {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    }

    // 3. Activity Level multiplier
    let activityMultiplier = 1.2;
    switch (activityLevel.toLowerCase()) {
      case "sedentary":
        activityMultiplier = 1.2;
        break;
      case "light":
        activityMultiplier = 1.375;
        break;
      case "moderate":
        activityMultiplier = 1.55;
        break;
      case "active":
        activityMultiplier = 1.725;
        break;
      case "very_active":
      case "extra_active":
        activityMultiplier = 1.9;
        break;
      default:
        activityMultiplier = 1.2;
    }

    const maintenanceCalories = Math.round(bmr * activityMultiplier);

    // 4. Target Calories based on Goal
    let targetCalories = maintenanceCalories;
    const lowerGoal = goal.toLowerCase();

    if (
      lowerGoal.includes("lose") ||
      lowerGoal.includes("deficit") ||
      lowerGoal.includes("cut")
    ) {
      targetCalories = maintenanceCalories - 500;
      // Health safety floor
      const minCalories = gender.toLowerCase() === "male" ? 1500 : 1200;
      if (targetCalories < minCalories) {
        targetCalories = minCalories;
      }
    } else if (
      lowerGoal.includes("gain") ||
      lowerGoal.includes("surplus") ||
      lowerGoal.includes("bulk")
    ) {
      targetCalories = maintenanceCalories + 400;
    }

    // 5. Generate Diet Plan via AI (or fallback)
    const { plan, source } = await generateDietPlanAI(
      ageNum,
      gender,
      heightNum,
      weightNum,
      activityLevel,
      goal,
      targetCalories,
      bmi,
      budget,
      cuisineStr,
      dietTypeStr,
      goalTimelineStr
    );

    // 6. Connect to DB and save if connection exists
    let saveStatus = "local_only";
    let savedDocumentId = null;

    if (supabase) {
      try {
        const { data: saved, error } = await supabase
          .from("diet_plans")
          .insert([{
            user_id: userId,
            age: ageNum,
            gender,
            height: heightNum,
            weight: weightNum,
            activity_level: activityLevel,
            goal,
            budget,
            bmi,
            maintenance_calories: maintenanceCalories,
            target_calories: targetCalories,
            cuisine: cuisineStr,
            diet_type: dietTypeStr,
            goal_timeline: goalTimelineStr,
            meal_plan: plan
          }])
          .select("id")
          .single();

        if (error) throw error;

        saveStatus = "saved_to_db";
        savedDocumentId = saved?.id || null;
      } catch (dbError) {
        console.error("Failed to save diet plan to Supabase:", dbError);
        saveStatus = "db_save_failed";
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: savedDocumentId,
        age: ageNum,
        gender,
        height: heightNum,
        weight: weightNum,
        activityLevel,
        goal,
        budget,
        bmi,
        maintenanceCalories,
        targetCalories,
        mealPlan: plan,
        cuisine: cuisineStr,
        dietType: dietTypeStr,
        goalTimeline: goalTimelineStr,
        createdAt: new Date(),
      },
      source,
      saveStatus,
    });
  } catch (error: any) {
    console.error("Error in POST /api/diet-plan:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
