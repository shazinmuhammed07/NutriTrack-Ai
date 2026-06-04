export interface IMeal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
}

export interface IDietPlanData {
  id?: string | null;
  _id?: string | null;
  user_id?: string;
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
  createdAt?: string | Date;
}
