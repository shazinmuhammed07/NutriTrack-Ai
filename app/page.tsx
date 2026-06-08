"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Apple,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckSquare,
  ChevronRight,
  Coffee,
  Coins,
  Download,
  Flame,
  HelpCircle,
  History,
  Info,
  Maximize2,
  MessageSquare,
  RefreshCw,
  Scale,
  Send,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Utensils,
  Zap
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

export default function Home() {
  const router = useRouter();

  // App States
  const [currentPlan, setCurrentPlan] = useState<IDietPlanData | null>(null);
  const [history, setHistory] = useState<IDietPlanData[]>([]);
  const [activeMealTab, setActiveMealTab] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(false);
  const [hasSavedPlan, setHasSavedPlan] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");

  // Interactive sidebar drawer toggle
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Grocery list checked state
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  // AI Diet Advisor Q&A States
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am your Nutrition Intelligence Panel. Ask me anything about foods, ingredients, calories, or diet queries (e.g. *'How much protein is in 100g of almonds?'* or *'Is peanut butter good for losing weight?'*)."
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleSendQuestion = async (e?: React.FormEvent, customQuestion?: string) => {
    if (e) e.preventDefault();
    const question = customQuestion ? customQuestion.trim() : inputQuestion.trim();
    if (!question || chatLoading) return;

    if (!customQuestion) {
      setInputQuestion("");
    }
    setChatError(null);

    // Add user message
    const userMsgId = "user_" + Date.now();
    setChatMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: question }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/diet-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, userName }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to get advice");
      }

      const result = await res.json();
      if (result.success) {
        const aiMsgId = "ai_" + Date.now();
        setChatMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            sender: "ai",
            text: result.data.answer,
            nutrition: result.data.nutrition,
          }
        ]);
      }
    } catch (err: any) {
      setChatError(err.message || "Something went wrong. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  const formatMessageText = (text: string) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content: React.ReactNode = line;
      let isBullet = false;
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        isBullet = true;
        content = line.trim().substring(2);
      }

      if (typeof content === "string") {
        const parts = content.split(/\*\*([^*]+)\*\*/g);
        if (parts.length > 1) {
          content = parts.map((part, i) => {
            if (i % 2 === 1) return <strong key={i} className="font-bold text-[#111111] dark:text-[#fafafa]">{part}</strong>;
            return part;
          });
        }
      }

      if (typeof content === "string") {
        const parts = content.split(/\*([^*]+)\*/g);
        if (parts.length > 1) {
          content = parts.map((part, i) => {
            if (i % 2 === 1) return <em key={i} className="italic">{part}</em>;
            return part;
          });
        }
      } else if (Array.isArray(content)) {
        content = content.flatMap((item, itemIdx) => {
          if (typeof item === "string") {
            const parts = item.split(/\*([^*]+)\*/g);
            if (parts.length > 1) {
              return parts.map((part, i) => {
                if (i % 2 === 1) return <em key={`it-${itemIdx}-${i}`} className="italic">{part}</em>;
                return part;
              });
            }
          }
          return item;
        });
      }

      if (isBullet) {
        return (
          <li key={idx} className="list-disc ml-4 mt-1 leading-relaxed text-[#71717a] dark:text-[#a1a1aa]">
            {content}
          </li>
        );
      }

      return (
        <p key={idx} className="leading-relaxed mt-1 first:mt-0">
          {content}
        </p>
      );
    });
  };

  // Status flags
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [isAiGemini, setIsAiGemini] = useState<boolean>(true);
  const [showDemoBanner, setShowDemoBanner] = useState<boolean>(true);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  // Load active plan and history on mount
  useEffect(() => {
    const userId = "default_user";

    // Check if welcome was dismissed in this session
    const seenWelcome = sessionStorage.getItem("has_seen_welcome") === "true";
    setWelcomeDismissed(seenWelcome);

    // Load user name
    const storedName = localStorage.getItem("nutritrack_user_name");
    if (storedName) {
      setUserName(storedName);
    }

    // Load active plan scoped to user
    const savedPlan = localStorage.getItem(`nutritrack_current_plan_${userId}`);
    if (savedPlan) {
      try {
        setCurrentPlan(JSON.parse(savedPlan));
        setHasSavedPlan(true);
      } catch (e) {
        console.error("Error parsing current plan:", e);
      }
    }

    // Load history
    loadHistory(userId);
  }, []);

  const loadHistory = async (userId: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/diet-plan/history");
      if (!res.ok) throw new Error("Failed to fetch history");
      const result = await res.json();

      if (result.dbStatus === "not_configured") {
        setIsDbConnected(false);
        const localHistory = localStorage.getItem(`nutritrack_history_${userId}`);
        if (localHistory) {
          setHistory(JSON.parse(localHistory));
        }
      } else {
        setIsDbConnected(true);
        setHistory(result.history || []);
      }
    } catch (err) {
      console.error("Error loading history from API, falling back to local storage:", err);
      setIsDbConnected(false);
      const localHistory = localStorage.getItem(`nutritrack_history_${userId}`);
      if (localHistory) {
        setHistory(JSON.parse(localHistory));
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectHistory = (plan: IDietPlanData) => {
    const userId = "default_user";
    setCurrentPlan(plan);
    localStorage.setItem(`nutritrack_current_plan_${userId}`, JSON.stringify(plan));
    setHasSavedPlan(true);
    sessionStorage.setItem("has_seen_welcome", "true");
    setWelcomeDismissed(true);
    setIsHistoryOpen(false); // Close history drawer
  };

  const clearLocalHistory = () => {
    const userId = "default_user";
    localStorage.removeItem(`nutritrack_history_${userId}`);
    setHistory([]);
  };

  const handleStartOver = () => {
    const userId = "default_user";
    localStorage.removeItem(`nutritrack_current_plan_${userId}`);
    localStorage.removeItem("nutritrack_user_name");
    setUserName("");
    setCurrentPlan(null);
    setHasSavedPlan(false);
  };

  // BMI needle angle (-90 to 90 degrees)
  const getBmiNeedleRotation = (bmi: number) => {
    const minBmi = 15;
    const maxBmi = 35;
    const bounded = Math.max(minBmi, Math.min(maxBmi, bmi));
    const pct = (bounded - minBmi) / (maxBmi - minBmi);
    return -90 + pct * 180;
  };

  // BMI Interpretation
  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-[#71717a] dark:text-[#a1a1aa]", bg: "bg-[#fafafa] dark:bg-[#09090b] border-[#e4e4e7] dark:border-[#27272a]" };
    if (bmi < 25) return { label: "Optimal Weight", color: "text-white dark:text-[#111111]", bg: "bg-[#111111] dark:bg-[#fafafa] border-[#111111] dark:border-[#fafafa]" };
    if (bmi < 30) return { label: "Overweight", color: "text-[#71717a] dark:text-[#a1a1aa]", bg: "bg-[#fafafa] dark:bg-[#09090b] border-[#e4e4e7] dark:border-[#27272a]" };
    return { label: "Obese Category", color: "text-[#71717a] dark:text-[#a1a1aa]", bg: "bg-[#fafafa] dark:bg-[#09090b] border-[#e4e4e7] dark:border-[#27272a]" };
  };

  // Macro calculations
  const calculateMacroPercentages = (plan: IDietPlanData) => {
    const pCal = plan.mealPlan.totalProtein * 4;
    const cCal = plan.mealPlan.totalCarbs * 4;
    const fCal = plan.mealPlan.totalFats * 9;
    const total = pCal + cCal + fCal;
    if (total === 0) return { p: 30, c: 40, f: 30 };
    return {
      p: Math.round((pCal / total) * 100),
      c: Math.round((cCal / total) * 100),
      f: Math.round((fCal / total) * 100),
    };
  };

  // Health Score Calculation
  const getHealthScore = (plan: IDietPlanData) => {
    let score = 75; // Baseline

    // BMI check
    if (plan.bmi >= 18.5 && plan.bmi < 25) {
      score += 15;
    } else if (plan.bmi >= 25 && plan.bmi < 30) {
      score += 5;
    } else {
      score -= 5;
    }

    // Protein content check (optimizing for 20-30% calories)
    const pCal = plan.mealPlan.totalProtein * 4;
    const totalCal = pCal + (plan.mealPlan.totalCarbs * 4) + (plan.mealPlan.totalFats * 9);
    if (totalCal > 0) {
      const pRatio = pCal / totalCal;
      if (pRatio >= 0.20 && pRatio <= 0.35) {
        score += 10;
      }
    }

    return Math.min(100, Math.max(45, score));
  };

  // Weight Projection Math (deficit of 500 kcal = 0.5kg/wk loss, surplus of 400 kcal = 0.4kg/wk gain)
  const getWeightProjection = (plan: IDietPlanData) => {
    const diff = plan.targetCalories - plan.maintenanceCalories;
    const weeklyRate = diff / 1100; // 7700 kcal per kg of fat

    const projection = [];
    for (let w = 0; w <= 12; w += 2) {
      const projected = plan.weight + (weeklyRate * w);
      projection.push({
        week: `Wk ${w}`,
        weight: projected.toFixed(1)
      });
    }
    return projection;
  };

  // Food Substitutions suggestions helper
  const getFoodSubstitutions = (cuisine: string, plan: IDietPlanData) => {
    const subs = [
      { original: "White Rice / Jasmine Rice", swap: "Kerala Red Matta Rice or Quinoa", reason: "Adds 4x dietary fiber & minerals, lower glycemic response." },
      { original: "Refined Wheat Flour / Maida", swap: "Ragi Flour (Finger Millet) or Wheat Flour", reason: "Boosts bone calcium, iron, and digests slower." },
      { original: "Whole Chicken / Dairy Cream", swap: "Low-Fat Paneer or Organic Tofu", reason: "Saves 150 kcal of saturated fats, preserves lean protein." },
      { original: "Sugar / Honey Drizzle", swap: "Stevia Extract or Pure Apple Mash", reason: "Zeroes out glycemic spikes while maintaining sweetness." }
    ];

    const isKerala = cuisine.toLowerCase().includes("kerala") || cuisine.toLowerCase().includes("south");
    if (isKerala) {
      return [
        { original: "White Rice", swap: "Kerala Matta Rice", reason: "Rich in fiber and B-complex vitamins." },
        { original: "Maida Porotta", swap: "Wheat Chappati or Ragi Dosa", reason: "Drastically reduces simple carbs and saturated fats." },
        { original: "Fried Fish", swap: "Kerala Fish Curry (Kudampuli based)", reason: "Preserves healthy fish oils, eliminates frying oils." },
        { original: "Refined Sugar in tea", swap: "Jaggery (small amount) or Stevia", reason: "Avoids empty calorie spikes." }
      ];
    }
    return subs;
  };

  // Category based Grocery list builder
  const getGroceryListByCategory = (plan: IDietPlanData) => {
    const ingredients: string[] = [];
    const meals: ("breakfast" | "lunch" | "dinner" | "snack")[] = ["breakfast", "lunch", "dinner", "snack"];
    meals.forEach(m => {
      if (plan.mealPlan[m] && plan.mealPlan[m].ingredients) {
        plan.mealPlan[m].ingredients.forEach(ing => {
          if (!ingredients.includes(ing)) {
            ingredients.push(ing);
          }
        });
      }
    });

    const categories: Record<string, string[]> = {
      "Produce & Greens": [],
      "Proteins & Dairy": [],
      "Grains & Pantry": [],
      "Seasoning & Spices": []
    };

    ingredients.forEach(ing => {
      const norm = ing.toLowerCase();
      if (norm.includes("spinach") || norm.includes("broccoli") || norm.includes("tomato") || norm.includes("avocado") || norm.includes("banana") || norm.includes("apple") || norm.includes("greens") || norm.includes("lettuce") || norm.includes("cucumber") || norm.includes("veg") || norm.includes("lemon") || norm.includes("garlic") || norm.includes("ginger") || norm.includes("asparagus") || norm.includes("onion")) {
        categories["Produce & Greens"].push(ing);
      } else if (norm.includes("egg") || norm.includes("chicken") || norm.includes("salmon") || norm.includes("fish") || norm.includes("beef") || norm.includes("steak") || norm.includes("paneer") || norm.includes("tofu") || norm.includes("yogurt") || norm.includes("curd") || norm.includes("milk") || norm.includes("protein") || norm.includes("chickpeas") || norm.includes("beans") || norm.includes("lentils") || norm.includes("dal")) {
        categories["Proteins & Dairy"].push(ing);
      } else if (norm.includes("rice") || norm.includes("oats") || norm.includes("bread") || norm.includes("quinoa") || norm.includes("pasta") || norm.includes("flour") || norm.includes("tortilla") || norm.includes("butter") || norm.includes("oil") || norm.includes("honey") || norm.includes("almonds") || norm.includes("walnuts") || norm.includes("seeds") || norm.includes("pittu") || norm.includes("appam")) {
        categories["Grains & Pantry"].push(ing);
      } else {
        categories["Seasoning & Spices"].push(ing);
      }
    });

    return categories;
  };

  const bmiCat = currentPlan ? getBmiCategory(currentPlan.bmi) : null;
  const macrosPercent = currentPlan ? calculateMacroPercentages(currentPlan) : null;
  const healthScore = currentPlan ? getHealthScore(currentPlan) : null;
  const weightProj = currentPlan ? getWeightProjection(currentPlan) : [];
  const groceryCategories = currentPlan ? getGroceryListByCategory(currentPlan) : null;
  const cuisineType = currentPlan?.cuisine || "Mixed Indian";
  const substitutions = currentPlan ? getFoodSubstitutions(cuisineType, currentPlan) : [];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-[#111111] dark:text-[#fafafa] flex flex-col font-sans selection:bg-[#111111] selection:text-white dark:selection:bg-white dark:selection:text-black relative transition-colors duration-300">

      {/* Top Header */}
      <header className="border-b border-[#e4e4e7] dark:border-[#27272a] bg-white/70 dark:bg-[#121214]/70 backdrop-blur-md sticky top-0 z-40 px-6 py-4 shadow-sm no-print">
        <div className="max-w-5xl mx-auto flex justify-between items-center w-full">

          {/* DB Status */}
          <div className="hidden sm:flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold flex items-center gap-1.5 ${isDbConnected ? "bg-[#111111]/5 dark:bg-[#fafafa]/5 border-[#e4e4e7] dark:border-[#27272a] text-[#111111] dark:text-[#fafafa]" : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-550"} shadow-sm`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isDbConnected ? "bg-[#111111] dark:bg-white animate-pulse" : "bg-zinc-400"}`}></span>
              {isDbConnected ? "Sync On" : "Local Storage"}
            </span>
          </div>

          {/* Logo */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 cursor-pointer group" onClick={() => router.push("/")}>
            <div className="bg-[#111111] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#111111] p-2 sm:p-3 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center shadow-md relative transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#111111] to-[#71717a] dark:from-[#fafafa] dark:to-[#a1a1aa]">
                NutriTrack
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded border border-[#e4e4e7] dark:border-[#27272a] bg-[#111111] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#111111] shadow-sm">
                AI
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[#e4e4e7] dark:border-[#27272a] bg-white dark:bg-[#121214] hover:bg-[#fafafa] dark:hover:bg-[#1c1c1f] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <History className="h-3.5 w-3.5 text-[#71717a] dark:text-[#a1a1aa]" />
              <span className="hidden sm:inline">History ({history.length})</span>
              <span className="sm:hidden">{history.length}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Demo Notification Banner */}
      {showDemoBanner && (!isDbConnected || !isAiGemini) && (
        <div className="bg-[#111111] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#111111] px-6 py-2.5 text-[10px] font-medium flex justify-between items-center z-30 shadow-inner no-print">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Offline Recommendation Mode:</strong> {!isDbConnected && "Supabase connection string offline."} Configured local intelligence recommendations are active for Kerala / Indian traditional meals. Configure a <code className="bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black px-1 rounded">GEMINI_API_KEY</code> for dynamic cloud execution.
            </span>
          </div>
          <button onClick={() => setShowDemoBanner(false)} className="opacity-70 hover:opacity-100 ml-4 font-bold">✕</button>
        </div>
      )}

      {/* History Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 no-print ${isHistoryOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-[#09090b]/40 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)}></div>

        <div className={`absolute top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-[#121214] border-l border-[#e4e4e7] dark:border-[#27272a] p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 transform ${isHistoryOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#e4e4e7] dark:border-[#27272a] mb-6">
              <h2 className="text-sm font-bold text-[#111111] dark:text-[#fafafa] uppercase tracking-wider flex items-center gap-2">
                <History className="h-4 w-4" />
                Previous Reports
              </h2>
              <button onClick={() => setIsHistoryOpen(false)} className="text-[#71717a] hover:text-[#111111] dark:hover:text-[#fafafa] font-bold">✕</button>
            </div>

            {loadingHistory ? (
              <div className="text-center py-12 flex justify-center">
                <RefreshCw className="animate-spin h-6 w-6 text-[#71717a]" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-[#e4e4e7] dark:border-[#27272a] rounded-2xl flex flex-col items-center">
                <Scale className="h-8 w-8 text-[#a1a1aa] mb-2" />
                <p className="text-xs text-[#71717a]">No calculations recorded.</p>
                <p className="text-[10px] text-[#a1a1aa] mt-1">Generate a metabolic index report.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
                {history.map((hPlan, index) => {
                  const key = hPlan.id || hPlan._id || index.toString();
                  const isSelected = currentPlan && (currentPlan.id === hPlan.id || (hPlan._id && currentPlan.id === hPlan._id));
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectHistory(hPlan)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center ${isSelected
                        ? "bg-[#111111] border-[#111111] text-[#fafafa] dark:bg-[#fafafa] dark:border-[#fafafa] dark:text-[#111111] shadow-md"
                        : "bg-[#fafafa] dark:bg-[#09090b] border-[#e4e4e7] dark:border-[#27272a] text-[#71717a] hover:border-[#111111] dark:hover:border-[#fafafa]"
                        }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-white dark:text-black" : "text-[#111111] dark:text-[#fafafa]"}`}>
                            {hPlan.goal.replace(" weight", "")}
                          </span>
                          <span className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-650 px-1.5 py-0.5 rounded font-mono">
                            {hPlan.age}y • {hPlan.gender[0]}
                          </span>
                        </div>
                        <div className="text-[9px] opacity-80 flex items-center space-x-2">
                          <span>{hPlan.weight}kg</span>
                          <span>•</span>
                          <span>{hPlan.cuisine || "Kerala"}</span>
                          <span>•</span>
                          <span className="font-bold">{hPlan.targetCalories} kcal</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className={`text-xs font-bold ${isSelected ? "text-white dark:text-black" : "text-[#111111] dark:text-[#fafafa]"}`}>
                          {hPlan.bmi.toFixed(1)}
                        </div>
                        <div className="text-[8px] opacity-60">
                          {hPlan.createdAt ? new Date(hPlan.createdAt).toLocaleDateString() : "Just now"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {history.length > 0 && !isDbConnected && (
            <button
              onClick={clearLocalHistory}
              className="w-full bg-[#111111] dark:bg-white text-white dark:text-black hover:opacity-90 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Clear Storage Logs
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-12 flex flex-col justify-center print-container">

        {currentPlan && welcomeDismissed ? (
          /* Dashboard Layout */
          <div className="space-y-8 animate-fadeIn w-full">

            {/* Dashboard Subheader */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-[#e4e4e7] dark:border-[#27272a] gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#71717a]">Nutrition Analytics Portal</span>
                <h2 className="text-2xl font-black text-[#111111] dark:text-[#fafafa] tracking-tight mt-0.5">
                  {userName ? `Hello, ${userName} 👋` : "Clinical Diet Overview"}
                </h2>
                {userName && (
                  <p className="text-xs font-bold text-[#71717a] dark:text-[#a1a1aa] mt-0.5">Your Personalized Diet Plan</p>
                )}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-[#71717a] dark:text-[#a1a1aa] font-medium">
                  <span className="capitalize">{currentPlan.gender}</span>
                  <span>•</span>
                  <span>{currentPlan.age}y</span>
                  <span>•</span>
                  <span>{currentPlan.height}cm</span>
                  <span>•</span>
                  <span>{currentPlan.weight}kg</span>
                  <span>•</span>
                  <span className="capitalize">{currentPlan.activityLevel.replace("_", " ")}</span>
                  <span>•</span>
                  <span>{currentPlan.cuisine || "Kerala Focus"}</span>
                  <span>•</span>
                  <span>{currentPlan.dietType || "Any"}</span>
                  <span>•</span>
                  <span>{currentPlan.goalTimeline || "3 Months"}</span>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto no-print actions-row">
                <button
                  onClick={() => router.push("/calculate")}
                  className="flex-1 sm:flex-initial bg-white dark:bg-[#121214] hover:bg-[#fafafa] dark:hover:bg-[#1c1c1f] border border-[#e4e4e7] dark:border-[#27272a] font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-[#71717a]" />
                  Recalculate
                </button>
                <button
                  onClick={handleStartOver}
                  className="flex-1 sm:flex-initial bg-[#111111] hover:bg-black dark:bg-[#fafafa] dark:hover:bg-white text-white dark:text-black font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  Start Over
                </button>
              </div>
            </div>

            {/* Visual Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              {/* BMI Gauge */}
              <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block">Body Mass Index</span>
                    <Scale className="h-3.5 w-3.5 text-[#71717a]" />
                  </div>
                  <div className="text-3xl font-black text-[#111111] dark:text-[#fafafa] mt-2">{currentPlan.bmi.toFixed(1)}</div>
                  {bmiCat && (
                    <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded border mt-2 ${bmiCat.color} ${bmiCat.bg}`}>
                      {bmiCat.label}
                    </span>
                  )}
                </div>

                {/* SVG Gauge */}
                <div className="relative h-20 w-full mt-4 flex justify-center overflow-hidden">
                  <svg className="w-32 h-16 absolute bottom-0" viewBox="0 0 100 50">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e4e4e7" strokeWidth="8" className="dark:stroke-zinc-800" strokeLinecap="round" />
                    {/* Highlight normal weight range */}
                    <path d="M 29.5 21.5 A 40 40 0 0 1 70.5 21.5" fill="none" stroke="#111111" strokeWidth="8" className="dark:stroke-white" strokeLinecap="round" />

                    {/* Rotating needle */}
                    <line x1="50" y1="50" x2="50" y2="15" stroke="#111111" className="dark:stroke-white gauge-needle" strokeWidth="3" strokeLinecap="round"
                      style={{ transform: `rotate(${getBmiNeedleRotation(currentPlan.bmi)}deg)` }} />
                    <circle cx="50" cy="50" r="5" fill="#111111" className="dark:fill-white" />
                  </svg>
                </div>
              </div>

              {/* Calorie Ring Progress */}
              <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block">Target Calories</span>
                    <Flame className="h-3.5 w-3.5 text-[#71717a]" />
                  </div>
                  <div className="text-3xl font-black text-[#111111] dark:text-[#fafafa] mt-2">
                    {currentPlan.targetCalories}
                    <span className="text-[10px] font-normal text-[#71717a] ml-1">kcal/d</span>
                  </div>

                  <div className="text-[9px] text-[#71717a] mt-2 font-mono">
                    {currentPlan.targetCalories < currentPlan.maintenanceCalories ? (
                      <span className="font-bold flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Deficit of {currentPlan.maintenanceCalories - currentPlan.targetCalories} kcal</span>
                    ) : currentPlan.targetCalories > currentPlan.maintenanceCalories ? (
                      <span className="font-bold flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Surplus of {currentPlan.targetCalories - currentPlan.maintenanceCalories} kcal</span>
                    ) : (
                      <span>Baseline maintenance</span>
                    )}
                  </div>
                </div>

                {/* SVG Calorie Circle */}
                <div className="flex justify-center items-center mt-4">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" className="stroke-zinc-150 dark:stroke-zinc-800" strokeWidth="6" fill="transparent" />
                      <circle cx="50" cy="50" r="42" className="stroke-black dark:stroke-white progress-ring-circle" strokeWidth="6" fill="transparent"
                        strokeDasharray={2 * Math.PI * 42}
                        strokeDashoffset={2 * Math.PI * 42 * (1 - Math.min(100, Math.round((currentPlan.targetCalories / currentPlan.maintenanceCalories) * 100)) / 100)}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-[10px] font-black">{Math.round((currentPlan.targetCalories / currentPlan.maintenanceCalories) * 100)}%</span>
                      <span className="text-[8px] opacity-60 text-center font-semibold leading-none">of BMR</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Score Panel */}
              <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block">Metabolic Health Score</span>
                    <Award className="h-3.5 w-3.5 text-[#71717a]" />
                  </div>
                  <div className="text-3xl font-black text-[#111111] dark:text-[#fafafa] mt-2">
                    {healthScore}
                    <span className="text-xs font-normal text-[#71717a] ml-1">/100</span>
                  </div>
                  <p className="text-[9px] text-[#71717a] mt-2 leading-relaxed">
                    Based on BMI index, target macros split and local ingredient balance ratio.
                  </p>
                </div>

                <div className="space-y-1.5 mt-4">
                  <div className="flex justify-between text-[8px] font-bold text-[#71717a] uppercase">
                    <span>Index Grading</span>
                    <span>Excellent</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-black dark:bg-white" style={{ width: `${healthScore}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Maintenance kcal Baseline */}
              <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold text-[#71717a] dark:text-[#a1a1aa] uppercase tracking-wider block">Maintenance Baseline</span>
                    <Activity className="h-3.5 w-3.5 text-[#71717a]" />
                  </div>
                  <div className="text-3xl font-black text-[#111111] dark:text-[#fafafa] mt-2">
                    {currentPlan.maintenanceCalories}
                    <span className="text-[10px] font-normal text-[#71717a] ml-1">kcal/d</span>
                  </div>
                  <p className="text-[9px] text-[#71717a] mt-2 leading-relaxed">
                    Calculated daily calorie baseline required to hold current weight index.
                  </p>
                </div>

                <div className="p-3 bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-xl flex items-center justify-between text-[9px] text-[#71717a] font-medium">
                  <span>Metabolic Rate (BMR):</span>
                  <span className="font-bold text-[#111111] dark:text-[#fafafa]">{Math.round(currentPlan.maintenanceCalories / 1.3)} kcal</span>
                </div>
              </div>

            </div>

            {/* Secondary Row: Meal Plan & Projection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left Column: Macro split & Weight Projection */}
              <div className="space-y-6 lg:col-span-1">

                {/* Target Macros Split Card */}
                <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-sm">
                  <h4 className="text-[10px] font-black text-[#111111] dark:text-[#fafafa] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Utensils className="h-3.5 w-3.5 text-[#71717a]" /> Target Macros Allocation
                  </h4>

                  {macrosPercent && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-[#71717a] font-bold">Protein ({macrosPercent.p}%)</span>
                          <span className="text-[#111111] dark:text-[#fafafa] font-bold">{currentPlan.mealPlan.totalProtein}g</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-black dark:bg-white" style={{ width: `${macrosPercent.p}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-[#71717a] font-bold">Carbohydrates ({macrosPercent.c}%)</span>
                          <span className="text-[#111111] dark:text-[#fafafa] font-bold">{currentPlan.mealPlan.totalCarbs}g</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#71717a] dark:bg-[#a1a1aa]" style={{ width: `${macrosPercent.c}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-[#71717a] font-bold">Dietary Fats ({macrosPercent.f}%)</span>
                          <span className="text-[#111111] dark:text-[#fafafa] font-bold">{currentPlan.mealPlan.totalFats}g</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-350 dark:bg-zinc-600" style={{ width: `${macrosPercent.f}%` }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Weight Projection Card */}
                <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-sm">
                  <h4 className="text-[10px] font-black text-[#111111] dark:text-[#fafafa] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#71717a]" /> Weekly weight projection
                  </h4>

                  <div className="flex sm:grid sm:grid-cols-7 gap-2 overflow-x-auto pb-2 sm:pb-0 font-mono scrollbar-none">
                    {weightProj.map((proj, idx) => (
                      <div key={idx} className="flex flex-col items-center flex-1 min-w-[52px] sm:min-w-0">
                        <span className="text-[8px] text-[#71717a] uppercase mb-1 font-sans">{proj.week}</span>
                        <div className="w-full bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-lg py-1.5 flex flex-col items-center">
                          <span className="text-[9px] font-bold text-[#111111] dark:text-[#fafafa]">{proj.weight}</span>
                          <span className="text-[7px] opacity-60">kg</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[8px] text-[#71717a] dark:text-[#a1a1aa] mt-4 leading-relaxed font-sans">
                    *Estimation calculated on constant caloric target compliance over the specified timeline. Individual metabolic variations may apply.
                  </p>
                </div>

              </div>

              {/* Right Column: Dynamic Tabbed Meal Planner */}
              <div className="space-y-6 lg:col-span-2">

                <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-md flex flex-col justify-between">

                  <div>
                    {/* Meal Tabs Selection */}
                    <div className="grid grid-cols-4 gap-2 mb-6">
                      {[
                        { id: "breakfast", label: "🍳 Breakfast", icon: Coffee },
                        { id: "lunch", label: "🥗 Lunch", icon: Utensils },
                        { id: "dinner", label: "🍲 Dinner", icon: Apple },
                        { id: "snack", label: "🍎 Snack", icon: Zap }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setActiveMealTab(t.id as any)}
                          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 px-2 py-3 rounded-2xl border text-[10px] font-bold transition-all cursor-pointer ${activeMealTab === t.id
                            ? "bg-[#111111] border-[#111111] text-[#fafafa] dark:bg-[#fafafa] dark:border-[#fafafa] dark:text-[#111111] shadow-sm"
                            : "bg-[#fafafa] dark:bg-[#09090b] border-[#e4e4e7] dark:border-[#27272a] text-[#71717a] hover:border-[#a1a1aa]"
                            }`}
                        >
                          <t.icon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{t.label.split(" ")[1]}</span>
                        </button>
                      ))}
                    </div>

                    {/* Active Meal Details block */}
                    <div className="border-b border-[#e4e4e7] dark:border-[#27272a] pb-4 mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-[#71717a]">{activeMealTab} allocation</span>
                          <h3 className="text-lg font-bold text-[#111111] dark:text-[#fafafa] mt-1">{currentPlan.mealPlan[activeMealTab].name}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-[#111111] dark:text-[#fafafa]">{currentPlan.mealPlan[activeMealTab].calories}</span>
                          <span className="text-[8px] font-bold uppercase text-[#71717a] block">kcal</span>
                        </div>
                      </div>

                      {/* Micro Macros badges */}
                      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                        <div className="bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-xl p-2">
                          <span className="text-[8px] font-bold text-[#71717a] uppercase block">Protein</span>
                          <span className="text-xs font-bold text-[#111111] dark:text-[#fafafa]">{currentPlan.mealPlan[activeMealTab].protein}g</span>
                        </div>
                        <div className="bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-xl p-2">
                          <span className="text-[8px] font-bold text-[#71717a] uppercase block">Carbohydrates</span>
                          <span className="text-xs font-bold text-[#111111] dark:text-[#fafafa]">{currentPlan.mealPlan[activeMealTab].carbs}g</span>
                        </div>
                        <div className="bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-xl p-2">
                          <span className="text-[8px] font-bold text-[#71717a] uppercase block">Fats</span>
                          <span className="text-xs font-bold text-[#111111] dark:text-[#fafafa]">{currentPlan.mealPlan[activeMealTab].fats}g</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-[9px] font-black text-[#71717a] uppercase tracking-wider mb-1">Dish Description</h5>
                        <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] leading-relaxed">{currentPlan.mealPlan[activeMealTab].description}</p>
                      </div>

                      {/* Ingredients */}
                      <div>
                        <h5 className="text-[9px] font-black text-[#71717a] uppercase tracking-wider mb-2">Ingredients Profile</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {currentPlan.mealPlan[activeMealTab].ingredients.map((ing, i) => (
                            <div key={i} className="flex items-center space-x-2 text-xs text-[#71717a] dark:text-[#a1a1aa]">
                              <Check className="h-3 w-3 text-[#111111] dark:text-[#fafafa] flex-shrink-0" />
                              <span>{ing}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Food Substitution box */}
                  <div className="mt-6 pt-5 border-t border-[#e4e4e7] dark:border-[#27272a] space-y-3">
                    <h5 className="text-[9px] font-black text-[#111111] dark:text-[#fafafa] uppercase tracking-wider flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" /> Recommended Food Substitutions
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                      {substitutions.slice(0, 2).map((sub, i) => (
                        <div key={i} className="p-3 bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-2xl flex flex-col justify-between">
                          <div>
                            <span className="text-[#71717a] font-bold">Instead of: </span>
                            <span className="text-rose-500 line-through font-medium block">{sub.original}</span>
                            <span className="text-[#71717a] font-bold mt-1.5 block">Use: </span>
                            <span className="text-[#111111] dark:text-white font-bold block">{sub.swap}</span>
                          </div>
                          <span className="text-[8px] text-[#71717a] mt-2 block italic leading-snug">{sub.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Grocery Checklist Section */}
            {groceryCategories && (
              <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-sm">
                <h4 className="text-[10px] font-black text-[#111111] dark:text-[#fafafa] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-[#71717a]" /> Integrated Grocery Shopping Checklist
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  {Object.entries(groceryCategories).map(([catName, ings]) => {
                    if (ings.length === 0) return null;
                    return (
                      <div key={catName} className="space-y-3">
                        <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider block border-b border-[#e4e4e7] dark:border-[#27272a] pb-1.5">{catName}</span>
                        <div className="space-y-2">
                          {ings.map((ing, idx) => {
                            const isChecked = !!checkedIngredients[ing];
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setCheckedIngredients(prev => ({ ...prev, [ing]: !isChecked }))}
                                className="w-full flex items-start gap-2 text-left text-xs text-[#71717a] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-white transition-all cursor-pointer group"
                              >
                                <div className={`h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${isChecked
                                  ? "bg-[#111111] dark:bg-[#fafafa] border-[#111111] dark:border-[#fafafa] text-white dark:text-black"
                                  : "border-[#e4e4e7] dark:border-[#27272a] group-hover:border-black dark:group-hover:border-white"
                                  }`}>
                                  {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                </div>
                                <span className={`${isChecked ? "line-through opacity-50" : ""}`}>{ing}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lifestyle and Nutrition Advice */}
            <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-sm">
              <h3 className="text-[10px] font-black text-[#111111] dark:text-[#fafafa] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#71717a]" /> Metabolic Guidelines & Lifestyle Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentPlan.mealPlan.tips.map((tip, idx) => (
                  <div key={idx} className="bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] p-4 rounded-2xl flex items-start space-x-3">
                    <span className="bg-[#111111] dark:bg-white text-white dark:text-black h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[9px] font-mono">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-[#71717a] dark:text-[#a1a1aa] leading-relaxed pt-0.5">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Intelligence Panel (AI Assistant Redesign) */}
            <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-md flex flex-col gap-4 chat-panel no-print">
              <div className="border-b border-[#e4e4e7] dark:border-[#27272a] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#111111] dark:bg-[#fafafa] text-white dark:text-[#111111] p-2 rounded-xl flex items-center justify-center shadow-md">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#111111] dark:text-[#fafafa] uppercase tracking-wider leading-none">Nutrition Intelligence Panel</h3>
                    <p className="text-[10px] text-[#71717a] mt-1">Metabolic assistant. Input any dietary queries to query calorie counts or local food benefits.</p>
                  </div>
                </div>

                {/* Suggestions badges */}
                <div className="flex flex-row overflow-x-auto pb-1 scrollbar-none whitespace-nowrap w-full gap-1.5 text-[9px] font-bold no-print">
                  {[
                    "Is Kerala Matta Rice good for fat loss?",
                    "What is the protein content of 100g Paneer?",
                    "Puttu & Kadala curry calories?"
                  ].map((sPrompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendQuestion(undefined, sPrompt)}
                      className="bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] text-[#71717a] hover:border-[#111111] hover:text-[#111111] dark:hover:border-white dark:hover:text-white rounded-full px-2.5 py-1.5 cursor-pointer transition-all flex-shrink-0"
                    >
                      {sPrompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Message Window */}
              <div className="bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-2xl p-4 flex flex-col gap-3 max-h-[300px] overflow-y-auto min-h-[160px] shadow-inner font-mono">
                {chatMessages.map((msg) => {
                  const isAi = msg.sender === "ai";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-1 w-full max-w-[85%] ${isAi ? "mr-auto items-start font-sans" : "ml-auto items-end font-sans"}`}
                    >
                      <span className="text-[8px] text-[#71717a] uppercase font-bold px-1">
                        {isAi ? "⚡ Intelligence Diagnostics" : "👤 User Client"}
                      </span>
                      <div
                        className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${isAi
                          ? "bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] text-[#111111] dark:text-[#fafafa] rounded-tl-none"
                          : "bg-[#111111] dark:bg-white text-white dark:text-black rounded-tr-none font-medium"
                          }`}
                      >
                        {isAi ? formatMessageText(msg.text) : <p>{msg.text}</p>}

                        {/* Nutrition table */}
                        {isAi && msg.nutrition && (
                          <div className="mt-3 bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-xl p-3 shadow-inner max-w-sm text-[#111111] dark:text-[#fafafa]">
                            <div className="flex justify-between items-center pb-1.5 border-b border-[#e4e4e7] dark:border-[#27272a] mb-2 font-mono text-[10px]">
                              <span className="font-bold">{msg.nutrition.foodName}</span>
                              <span className="opacity-60 text-[8px]">{msg.nutrition.portion}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                              <div className="bg-white dark:bg-[#121214] rounded-lg p-1.5 border border-[#e4e4e7] dark:border-[#27272a]">
                                <div className="text-[7px] text-[#71717a] font-bold">KCAL</div>
                                <div className="font-black mt-0.5">{msg.nutrition.calories}</div>
                              </div>
                              <div className="bg-white dark:bg-[#121214] rounded-lg p-1.5 border border-[#e4e4e7] dark:border-[#27272a]">
                                <div className="text-[7px] text-[#71717a] font-bold">PRO</div>
                                <div className="font-black mt-0.5">{msg.nutrition.protein}g</div>
                              </div>
                              <div className="bg-white dark:bg-[#121214] rounded-lg p-1.5 border border-[#e4e4e7] dark:border-[#27272a]">
                                <div className="text-[7px] text-[#71717a] font-bold">CARB</div>
                                <div className="font-black mt-0.5">{msg.nutrition.carbs}g</div>
                              </div>
                              <div className="bg-white dark:bg-[#121214] rounded-lg p-1.5 border border-[#e4e4e7] dark:border-[#27272a]">
                                <div className="text-[7px] text-[#71717a] font-bold">FAT</div>
                                <div className="font-black mt-0.5">{msg.nutrition.fats}g</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {chatLoading && (
                  <div className="flex flex-col gap-1 w-full max-w-[80%] mr-auto items-start animate-pulse">
                    <span className="text-[8px] text-[#71717a] font-bold">⚡ Intelligence Diagnostics</span>
                    <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-2xl rounded-tl-none px-4 py-3 text-xs text-[#71717a] flex items-center gap-2">
                      <div className="dot-flashing"></div>
                      <span className="ml-4 font-mono text-[10px]">Analyzing query...</span>
                    </div>
                  </div>
                )}

                {chatError && (
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-550 rounded-xl text-[10px] text-center font-bold">
                    {chatError}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendQuestion} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Query metabolic benefits or nutrition stats..."
                  className="flex-1 bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] focus:border-[#111111] dark:focus:border-white focus:bg-white dark:focus:bg-[#121214] rounded-xl px-4 py-3 text-xs text-[#111111] dark:text-[#fafafa] focus:outline-none transition-all"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !inputQuestion.trim()}
                  className="bg-[#111111] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-black font-bold px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send Query</span>
                </button>
              </form>
            </div>

            {/* PDF print trigger row */}
            <div className="pt-4 pb-12 flex justify-center no-print">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 text-xs font-bold bg-[#111111] dark:bg-white text-white dark:text-black px-6 py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" /> Download PDF Diet Report
              </button>
            </div>

          </div>
        ) : (
          /* Landing Page / Welcome Hero */
          <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-5 sm:p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10 w-full max-w-4xl mx-auto my-4 sm:my-6 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#111111] dark:bg-[#fafafa]"></div>

            <div className="flex-1 space-y-6 text-left w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111111]/5 dark:bg-[#fafafa]/5 border border-[#e4e4e7] dark:border-[#27272a] text-[#111111] dark:text-white text-[9px] font-black uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-[#111111] dark:bg-white animate-pulse"></span>
                Nutrition Intelligence Platform
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-[#111111] dark:text-white tracking-tight leading-tight">
                  Redefining <br />
                  Metabolic Health.
                </h2>
                <p className="text-xs md:text-sm text-[#71717a] dark:text-[#a1a1aa] leading-relaxed max-w-sm">
                  Compute BMR metrics, estimate localized BMI categories, and structure a custom diet plan tailored for Indian and Kerala cuisines using clinical AI.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-start">
                <button
                  onClick={() => {
                    sessionStorage.setItem("has_seen_welcome", "true");
                    router.push("/calculate?mode=new");
                  }}
                  className="bg-[#111111] hover:bg-black dark:bg-[#fafafa] dark:hover:bg-white text-white dark:text-black font-black px-6 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  Configure Metabolic Profile
                  <ArrowRight className="h-4 w-4" />
                </button>
                {hasSavedPlan && (
                  <button
                    onClick={() => {
                      sessionStorage.setItem("has_seen_welcome", "true");
                      setWelcomeDismissed(true);
                    }}
                    className="bg-white hover:bg-[#fafafa] dark:bg-[#121214] dark:hover:bg-[#1c1c1f] border border-[#e4e4e7] dark:border-[#27272a] text-[#111111] dark:text-white font-black px-6 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    View Current Diet Plan
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#e4e4e7] dark:border-[#27272a] text-[10px] text-[#71717a] font-medium">
                <div>
                  <span className="font-bold text-[#111111] dark:text-[#fafafa] block">01. Mifflin Math</span>
                  <span>Basal metabolic baseline</span>
                </div>
                <div>
                  <span className="font-bold text-[#111111] dark:text-[#fafafa] block">02. Regional Focus</span>
                  <span>Kerala & Indian foods</span>
                </div>
                <div>
                  <span className="font-bold text-[#111111] dark:text-[#fafafa] block">03. Clinical Data</span>
                  <span>Monochrome diagnostics</span>
                </div>
              </div>
            </div>

            {/* Concentric Progress Ring Illustration */}
            <div className="flex-shrink-0 flex justify-center items-center relative py-6 w-full md:w-auto">
              <div className="absolute h-48 w-48 sm:h-56 sm:w-56 bg-zinc-150 dark:bg-zinc-900 rounded-full filter blur-3xl opacity-40"></div>

              <svg className="w-full max-w-[200px] sm:max-w-[280px] h-auto object-contain relative z-10 animate-float" viewBox="0 0 120 120">
                {/* Outermost ring */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e4e4e7" strokeWidth="5" className="dark:stroke-zinc-800" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#111111" strokeWidth="5" className="dark:stroke-white"
                  strokeDasharray="314" strokeDashoffset="80" strokeLinecap="round" />

                {/* Middle ring */}
                <circle cx="60" cy="60" r="40" fill="none" stroke="#e4e4e7" strokeWidth="5" className="dark:stroke-zinc-800" />
                <circle cx="60" cy="60" r="40" fill="none" stroke="#71717a" strokeWidth="5" className="dark:stroke-zinc-500"
                  strokeDasharray="251" strokeDashoffset="100" strokeLinecap="round" />

                {/* Innermost ring */}
                <circle cx="60" cy="60" r="30" fill="none" stroke="#e4e4e7" strokeWidth="5" className="dark:stroke-zinc-800" />
                <circle cx="60" cy="60" r="30" fill="none" stroke="#a1a1aa" strokeWidth="5" className="dark:stroke-zinc-400"
                  strokeDasharray="188" strokeDashoffset="120" strokeLinecap="round" />

                {/* Sparkle Icon in Center */}
                <path d="M 60 48 L 63 57 L 72 60 L 63 63 L 60 72 L 57 63 L 48 60 L 57 57 Z" fill="#111111" className="dark:fill-white animate-pulse" />
              </svg>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e4e4e7] dark:border-[#27272a] py-6 text-center text-xs text-[#71717a] bg-white dark:bg-[#121214] no-print">
        <p>© {new Date().getFullYear()} NutriTrack AI. Engineered with Next.js & Gemini.</p>
      </footer>
    </div>
  );
}