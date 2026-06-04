"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Check, 
  Sparkles, 
  User, 
  Target, 
  Settings, 
  AlertCircle 
} from "lucide-react";

interface IMeal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
}

interface IDietPlanData {
  id?: string | null;
  _id?: string | null;
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

export default function CalculatePage() {
  const router = useRouter();

  // Form State
  const [age, setAge] = useState<string>("25");
  const [gender, setGender] = useState<string>("Male");
  const [height, setHeight] = useState<string>("175");
  const [weight, setWeight] = useState<string>("70");
  const [activityLevel, setActivityLevel] = useState<string>("moderate");
  const [goal, setGoal] = useState<string>("lose weight");
  const [budget, setBudget] = useState<string>("Moderate");
  const [cuisine, setCuisine] = useState<string>("Mixed Indian");
  const [dietType, setDietType] = useState<string>("Any");
  const [goalTimeline, setGoalTimeline] = useState<string>("3 Months");

  // Form Wizard step
  const [formStep, setFormStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      const ageNum = Number(age);
      if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        errors.age = "Please enter a valid age between 1 and 120.";
      }
      const heightNum = Number(height);
      if (!height || isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
        errors.height = "Please enter a valid height between 50 and 250 cm.";
      }
      const weightNum = Number(weight);
      if (!weight || isNaN(weightNum) || weightNum < 10 || weightNum > 300) {
        errors.weight = "Please enter a valid weight between 10 and 300 kg.";
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(formStep)) {
      setFormStep(formStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1);
    }
  };

  // Real-time BMI indicator
  const [realtimeBmi, setRealtimeBmi] = useState<number | null>(null);
  useEffect(() => {
    const h = Number(height);
    const w = Number(weight);
    if (h > 0 && w > 0) {
      const bmiVal = w / ((h / 100) * (h / 100));
      if (!isNaN(bmiVal) && isFinite(bmiVal)) {
        setRealtimeBmi(bmiVal);
      }
    } else {
      setRealtimeBmi(null);
    }
  }, [height, weight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStep < 3) {
      handleNextStep();
      return;
    }

    if (!validateStep(formStep)) return;

    setLoading(true);
    setError(null);

    const payload = {
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
      activityLevel,
      goal,
      budget,
      cuisine,
      dietType,
      goalTimeline,
    };

    try {
      const response = await fetch("/api/diet-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate plan");
      }

      const result = await response.json();

      if (result.success) {
        const planData: IDietPlanData = result.data;
        const userId = "default_user";
        
        // Save current active plan to localStorage scoped to user
        localStorage.setItem(`nutritrack_current_plan_${userId}`, JSON.stringify(planData));

        // Sync history locally if database is offline
        if (result.saveStatus === "local_only" || result.saveStatus === "db_save_failed") {
          const localHistory = localStorage.getItem(`nutritrack_history_${userId}`);
          const existing: IDietPlanData[] = localHistory ? JSON.parse(localHistory) : [];
          const newPlan = { ...planData, id: "local_" + Date.now() };
          const updated = [newPlan, ...existing].slice(0, 10);
          localStorage.setItem(`nutritrack_history_${userId}`, JSON.stringify(updated));
        }

        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: "Personal Info", icon: User },
    { label: "Goals", icon: Target },
    { label: "Preferences", icon: Settings },
    { label: "Results", icon: Sparkles }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-[#111111] dark:text-[#fafafa] flex flex-col font-sans transition-colors duration-300 justify-between">
      <header className="border-b border-[#e4e4e7] dark:border-[#27272a] bg-white/70 dark:bg-[#121214]/70 backdrop-blur-md sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center w-full">
          
          <button
            onClick={() => router.push("/")}
            className="text-xs text-[#71717a] hover:text-[#111111] dark:hover:text-[#fafafa] transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>

          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push("/")}>
            <div className="bg-[#111111] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#111111] p-3 rounded-2xl font-bold flex items-center justify-center shadow-md relative transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#111111] to-[#71717a] dark:from-[#fafafa] dark:to-[#a1a1aa]">
                NutriTrack
              </span>
              <span className="text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-lg border border-[#e4e4e7] dark:border-[#27272a] bg-[#111111] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#111111] shadow-sm">
                AI
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="text-xs text-[#71717a] hover:text-[#111111] dark:hover:text-[#fafafa] font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>

        </div>
      </header>

      {/* Main content container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-12">
        <div className="w-full max-w-xl bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 sm:p-8 premium-shadow relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#111111] dark:bg-[#fafafa]"></div>

          {/* Premium Stepper */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = formStep > stepNum;
                const isActive = formStep === stepNum || (stepNum === 4 && loading);
                const IconComponent = step.icon;

                return (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center relative z-10">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center border text-xs font-bold transition-all duration-300 ${
                        isCompleted 
                          ? "bg-[#111111] border-[#111111] text-[#fafafa] dark:bg-[#fafafa] dark:border-[#fafafa] dark:text-[#111111]" 
                          : isActive 
                            ? "bg-white border-[#111111] text-[#111111] ring-2 ring-[#e4e4e7] dark:bg-[#121214] dark:border-[#fafafa] dark:text-[#fafafa] dark:ring-[#27272a]" 
                            : "bg-white border-[#e4e4e7] text-[#a1a1aa] dark:bg-[#121214] dark:border-[#27272a]"
                      }`}>
                        {isCompleted ? <Check className="h-4 w-4" /> : <IconComponent className="h-4 w-4" />}
                      </div>
                      <span className={`text-[10px] font-semibold mt-2 hidden sm:block ${
                        isActive ? "text-[#111111] dark:text-[#fafafa] font-bold" : "text-[#71717a] dark:text-[#a1a1aa]"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="flex-1 h-[1px] bg-[#e4e4e7] dark:bg-[#27272a] mx-2 -translate-y-2 sm:-translate-y-4 relative">
                        <div className="absolute inset-0 bg-[#111111] dark:bg-[#fafafa] transition-all duration-500" style={{
                          width: formStep > stepNum ? "100%" : "0%"
                        }}></div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {loading ? (
            /* Formulating step */
            <div className="py-12 flex flex-col items-center text-center animate-fadeIn">
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-full border border-dashed border-[#111111] dark:border-[#fafafa] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-[#111111] dark:text-[#fafafa] animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">Formulating Your Intelligence Plan</h3>
              <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] max-w-sm leading-relaxed mb-6">
                Our AI model is building a personalized nutrition strategy based on your cuisine selections, goals, and metabolic profiles.
              </p>
              
              <div className="w-full max-w-xs bg-[#fafafa] dark:bg-[#09090b] rounded-xl border border-[#e4e4e7] dark:border-[#27272a] p-4 text-left text-[11px] space-y-2 text-[#71717a] dark:text-[#a1a1aa]">
                <div className="flex justify-between">
                  <span>Targeting:</span>
                  <span className="font-bold text-[#111111] dark:text-[#fafafa] capitalize">{goal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cuisine:</span>
                  <span className="font-bold text-[#111111] dark:text-[#fafafa]">{cuisine}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diet Style:</span>
                  <span className="font-bold text-[#111111] dark:text-[#fafafa]">{dietType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Budget Mode:</span>
                  <span className="font-bold text-[#111111] dark:text-[#fafafa]">{budget}</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Step 1: Personal Info */}
              {formStep === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-[#e4e4e7] dark:border-[#27272a] pb-3 mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#71717a]">1. Personal Metrics</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#71717a] mb-2 uppercase tracking-wider">Age (years)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className={`w-full bg-[#fafafa] dark:bg-[#09090b] border ${validationErrors.age ? "border-rose-500" : "border-[#e4e4e7] dark:border-[#27272a]"} focus:border-[#111111] dark:focus:border-[#fafafa] rounded-xl px-4 py-3 text-sm text-[#111111] dark:text-[#fafafa] focus:outline-none transition-all`}
                        placeholder="25"
                      />
                      {validationErrors.age && (
                        <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {validationErrors.age}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#71717a] mb-2 uppercase tracking-wider">Biological Gender</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Male", "Female"].map((g) => (
                          <button
                            type="button"
                            key={g}
                            onClick={() => setGender(g)}
                            className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              gender === g
                                ? "bg-[#111111] border-[#111111] text-[#fafafa] dark:bg-[#fafafa] dark:border-[#fafafa] dark:text-[#111111] shadow-sm"
                                : "bg-[#fafafa] dark:bg-[#09090b] border-[#e4e4e7] dark:border-[#27272a] text-[#71717a] hover:border-[#a1a1aa]"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#71717a] mb-2 uppercase tracking-wider">Height (cm)</label>
                      <input
                        type="number"
                        min="50"
                        max="250"
                        required
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className={`w-full bg-[#fafafa] dark:bg-[#09090b] border ${validationErrors.height ? "border-rose-500" : "border-[#e4e4e7] dark:border-[#27272a]"} focus:border-[#111111] dark:focus:border-[#fafafa] rounded-xl px-4 py-3 text-sm text-[#111111] dark:text-[#fafafa] focus:outline-none transition-all`}
                        placeholder="175"
                      />
                      {validationErrors.height && (
                        <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {validationErrors.height}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#71717a] mb-2 uppercase tracking-wider">Weight (kg)</label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        step="0.1"
                        required
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className={`w-full bg-[#fafafa] dark:bg-[#09090b] border ${validationErrors.weight ? "border-rose-500" : "border-[#e4e4e7] dark:border-[#27272a]"} focus:border-[#111111] dark:focus:border-[#fafafa] rounded-xl px-4 py-3 text-sm text-[#111111] dark:text-[#fafafa] focus:outline-none transition-all`}
                        placeholder="70"
                      />
                      {validationErrors.weight && (
                        <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {validationErrors.weight}
                        </p>
                      )}
                    </div>
                  </div>

                  {realtimeBmi !== null && (
                    <div className="p-4 bg-[#fafafa] dark:bg-[#09090b] rounded-2xl border border-[#e4e4e7] dark:border-[#27272a] flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[#71717a] font-medium block">Estimated BMI</span>
                        <span className="text-lg font-black text-[#111111] dark:text-[#fafafa] mt-0.5 block">{realtimeBmi.toFixed(1)}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full border text-[10px] font-bold ${
                        realtimeBmi < 18.5 
                          ? "bg-zinc-100 text-zinc-650 border-zinc-200" 
                          : realtimeBmi < 25 
                            ? "bg-[#111111] text-white border-[#111111] dark:bg-[#fafafa] dark:text-[#111111] dark:border-[#fafafa]"
                            : "bg-zinc-200 text-zinc-800 border-zinc-300"
                      }`}>
                        {realtimeBmi < 18.5 ? "Underweight" : realtimeBmi < 25 ? "Normal Weight" : realtimeBmi < 30 ? "Overweight" : "Obese"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Goals */}
              {formStep === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-[#e4e4e7] dark:border-[#27272a] pb-3 mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#71717a]">2. Targets & Activity</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#71717a] mb-2 uppercase tracking-wider">Fitness Goal</label>
                    <select
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] focus:border-[#111111] dark:focus:border-[#fafafa] rounded-xl px-4 py-3 text-sm text-[#111111] dark:text-[#fafafa] focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="lose weight">Weight Loss (Calorie deficit)</option>
                      <option value="maintain weight">Weight Maintenance</option>
                      <option value="gain weight">Weight Gain / Bulk (Calorie surplus)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#71717a] mb-2 uppercase tracking-wider">Activity Profile</label>
                    <select
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value)}
                      className="w-full bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] focus:border-[#111111] dark:focus:border-[#fafafa] rounded-xl px-4 py-3 text-sm text-[#111111] dark:text-[#fafafa] focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="sedentary">Sedentary (No formal exercise)</option>
                      <option value="light">Lightly Active (1-3 days exercise/wk)</option>
                      <option value="moderate">Moderately Active (3-5 days exercise/wk)</option>
                      <option value="active">Active (6-7 days intense exercise/wk)</option>
                      <option value="very_active">Very Active (Heavy sports, physical labor job)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#71717a] mb-2 uppercase tracking-wider">Goal Timeline</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["1 Month", "3 Months", "6 Months"].map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setGoalTimeline(t)}
                          className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            goalTimeline === t
                              ? "bg-[#111111] border-[#111111] text-[#fafafa] dark:bg-[#fafafa] dark:border-[#fafafa] dark:text-[#111111] shadow-sm"
                              : "bg-[#fafafa] dark:bg-[#09090b] border-[#e4e4e7] dark:border-[#27272a] text-[#71717a] hover:border-[#a1a1aa]"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Preferences */}
              {formStep === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-[#e4e4e7] dark:border-[#27272a] pb-3 mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#71717a]">3. Cuisine & Dietary Choices</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#71717a] mb-2 uppercase tracking-wider">Cuisine Focus</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Kerala", "South Indian", "North Indian", "Mixed Indian", "International"].map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setCuisine(c)}
                          className={`py-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                            cuisine === c
                              ? "bg-[#111111] border-[#111111] text-[#fafafa] dark:bg-[#fafafa] dark:border-[#fafafa] dark:text-[#111111] shadow-sm"
                              : "bg-[#fafafa] dark:bg-[#09090b] border-[#e4e4e7] dark:border-[#27272a] text-[#71717a] hover:border-[#a1a1aa]"
                          } ${c === "Mixed Indian" ? "col-span-2" : ""}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#71717a] mb-2 uppercase tracking-wider">Diet Type</label>
                      <select
                        value={dietType}
                        onChange={(e) => setDietType(e.target.value)}
                        className="w-full bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] focus:border-[#111111] dark:focus:border-[#fafafa] rounded-xl px-3 py-2.5 text-xs text-[#111111] dark:text-[#fafafa] focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="Any">Any / Flexitarian</option>
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Eggetarian">Eggetarian</option>
                        <option value="Non-Vegetarian">Non-Vegetarian</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#71717a] mb-2 uppercase tracking-wider">Budget Selection</label>
                      <select
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] focus:border-[#111111] dark:focus:border-[#fafafa] rounded-xl px-3 py-2.5 text-xs text-[#111111] dark:text-[#fafafa] focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="Student Budget">Student Budget</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Premium">Premium</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-6 border-t border-[#e4e4e7] dark:border-[#27272a] transition-all">
                {formStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 bg-[#fafafa] dark:bg-[#09090b] hover:bg-[#e4e4e7] dark:hover:bg-[#1c1c1f] border border-[#e4e4e7] dark:border-[#27272a] text-[#111111] dark:text-[#fafafa] font-bold py-3.5 rounded-xl transition-all cursor-pointer text-xs"
                  >
                    Previous Step
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={formStep === 3 ? handleSubmit : handleNextStep}
                  className="flex-2 bg-[#111111] hover:bg-black dark:bg-[#fafafa] dark:hover:bg-white text-[#fafafa] dark:text-[#111111] font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <span>{formStep === 3 ? "Generate Intelligence Plan" : "Continue"}</span>
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e4e4e7] dark:border-[#27272a] py-4 text-center text-xs text-[#71717a] bg-white dark:bg-[#121214]">
        <p>© {new Date().getFullYear()} NutriTrack AI. Engineered with Next.js & Gemini.</p>
      </footer>
    </div>
  );
}
