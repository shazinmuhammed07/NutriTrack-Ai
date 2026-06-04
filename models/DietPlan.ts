import mongoose, { Schema, Document } from "mongoose";

export interface IMeal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
}

export interface IDietPlan extends Document {
  userId?: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
  budget: string;
  bmi: number;
  maintenanceCalories: number;
  targetCalories: number;
  mealPlan: {
    breakfast: IMeal;
    lunch: IMeal;
    dinner: IMeal;
    snack: IMeal;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
    tips: string[];
  };
  cuisine?: string;
  dietType?: string;
  goalTimeline?: string;
  createdAt: Date;
}

const MealSchema = new Schema<IMeal>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fats: { type: Number, required: true },
  ingredients: { type: [String], required: true },
});

const DietPlanSchema = new Schema<IDietPlan>({
  userId: { type: String, index: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  height: { type: Number, required: true },
  weight: { type: Number, required: true },
  activityLevel: { type: String, required: true },
  goal: { type: String, required: true },
  budget: { type: String, required: true },
  bmi: { type: Number, required: true },
  maintenanceCalories: { type: Number, required: true },
  targetCalories: { type: Number, required: true },
  mealPlan: {
    breakfast: { type: MealSchema, required: true },
    lunch: { type: MealSchema, required: true },
    dinner: { type: MealSchema, required: true },
    snack: { type: MealSchema, required: true },
    totalProtein: { type: Number, required: true },
    totalCarbs: { type: Number, required: true },
    totalFats: { type: Number, required: true },
    tips: { type: [String], required: true },
  },
  cuisine: { type: String },
  dietType: { type: String },
  goalTimeline: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.DietPlan ||
  mongoose.model<IDietPlan>("DietPlan", DietPlanSchema);
