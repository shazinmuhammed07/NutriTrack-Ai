"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Upload, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Flame, 
  Sparkles, 
  History, 
  X, 
  ChevronRight,
  Apple,
  Award
} from "lucide-react";

interface IUserProfile {
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
  dietType?: string;
  budget?: string;
  cuisine?: string;
}

interface IFoodAnalysis {
  id?: string;
  foodName: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  healthScore: number;
  recommendation: "Excellent Choice" | "Good Choice" | "Occasional Choice" | "Avoid Frequently";
  personalizedRecommendation: string;
  confidenceScore?: number;
  imageUrl?: string | null;
  createdAt?: string | Date;
}

interface FoodAnalyzerProps {
  profile: IUserProfile | null;
  onProfileRedirect?: () => void;
}

export default function FoodAnalyzer({ profile, onProfileRedirect }: FoodAnalyzerProps) {
  // Tabs & Inputs State
  const [activeTab, setActiveTab] = useState<"search" | "upload">("search");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  
  // Drag & Drop
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading & Results
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [result, setResult] = useState<IFoodAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History logs
  const [history, setHistory] = useState<IFoodAnalysis[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [dbConnected, setDbConnected] = useState<boolean>(true);

  // Load History on Mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/food-analyses/history");
      if (!res.ok) throw new Error("Failed to fetch food history");
      const data = await res.json();
      
      if (data.dbStatus === "not_configured") {
        setDbConnected(false);
        const localLogs = localStorage.getItem("nutritrack_food_history");
        if (localLogs) {
          setHistory(JSON.parse(localLogs));
        }
      } else {
        setDbConnected(true);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load food analysis history:", err);
      setDbConnected(false);
      const localLogs = localStorage.getItem("nutritrack_food_history");
      if (localLogs) {
        setHistory(JSON.parse(localLogs));
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Step-by-step loading phase text simulator
  useEffect(() => {
    if (!isAnalyzing) {
      setLoadingStep("");
      return;
    }

    const steps = [
      "Sending food details to AI service...",
      "Analyzing visual pixel structures and shapes...",
      "Estimating portions and volumetric weight...",
      "Querying local macronutrient dictionaries...",
      "Formulating energy (calories) and macro density...",
      "Cross-referencing report metrics with user goal...",
      "Finalizing diagnostics analysis results..."
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);

    const interval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setLoadingStep(steps[stepIndex]);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Drag Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    // Limit to 4MB
    if (file.size > 4 * 1024 * 1024) {
      setError("Please select an image file under 4MB.");
      return;
    }

    setSelectedImage(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);

      // Extract base64 representation
      const parts = dataUrl.split(";base64,");
      if (parts.length > 1) {
        setBase64Image(parts[1]);
        setMimeType(parts[0].split(":")[1]);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setBase64Image(null);
    setError(null);
  };

  // Submit Handler
  const handleAnalyze = async (e?: React.FormEvent, customFoodName?: string) => {
    if (e) e.preventDefault();
    if (isAnalyzing) return;

    setError(null);

    // Get input values
    const queryFoodName = customFoodName || (activeTab === "search" ? searchText.trim() : "");
    const queryImage = activeTab === "upload" ? base64Image : null;

    if (!queryFoodName && !queryImage) {
      setError("Please input a food name or upload a photo to start diagnostics.");
      return;
    }

    // Set fallback active user profile to standard values if missing
    const userProfile: IUserProfile = profile || {
      age: 25,
      gender: "Male",
      height: 175,
      weight: 70,
      activityLevel: "moderate",
      goal: "maintain weight",
      dietType: "Any"
    };

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/food-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: queryFoodName || undefined,
          base64Image: queryImage || undefined,
          mimeType: queryImage ? mimeType : undefined,
          profile: userProfile
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to analyze food item.");
      }

      const resultData = await response.json();
      if (resultData.success) {
        const analysis: IFoodAnalysis = resultData.data;
        setResult(analysis);
        setSearchText("");

        // Handle offline storage sync if needed
        if (resultData.saveStatus === "local_only" || resultData.saveStatus === "db_save_failed") {
          const localLogs = localStorage.getItem("nutritrack_food_history");
          const existing: IFoodAnalysis[] = localLogs ? JSON.parse(localLogs) : [];
          const updated = [analysis, ...existing].slice(0, 10);
          localStorage.setItem("nutritrack_food_history", JSON.stringify(updated));
          setHistory(updated);
        } else {
          // Refresh database history
          loadHistory();
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    clearSelectedImage();
    setSearchText("");
    setError(null);
  };

  const handleSelectHistoryItem = (item: IFoodAnalysis) => {
    setResult(item);
    if (item.imageUrl) {
      setImagePreview(item.imageUrl);
      setActiveTab("upload");
    } else {
      setActiveTab("search");
    }
    setError(null);
  };

  // UI badge styles helper
  const getRecommendationStyles = (rec: string) => {
    switch (rec) {
      case "Excellent Choice":
        return "bg-[#111111] text-[#fafafa] dark:bg-white dark:text-black border-[#111111] dark:border-white";
      case "Good Choice":
        return "bg-transparent border-[#111111] text-[#111111] dark:border-[#fafafa] dark:text-[#fafafa]";
      case "Occasional Choice":
        return "bg-[#fafafa] dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400";
      case "Avoid Frequently":
        return "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 line-through opacity-70";
      default:
        return "border-zinc-200 text-zinc-500";
    }
  };

  // Helper macro bar calculations
  const calculateMacroPct = (amount: number, max: number) => {
    const pct = (amount / max) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Primary container */}
      <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-md relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#111111] dark:bg-[#fafafa]"></div>
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#e4e4e7] dark:border-[#27272a] mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#111111] dark:bg-[#fafafa] text-white dark:text-black p-2 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#111111] dark:text-[#fafafa]">Food Analyzer AI</h3>
              <p className="text-[10px] text-[#71717a] dark:text-[#a1a1aa] mt-0.5">Diagnose meal calories, macro breakdowns, and clinical choice rankings.</p>
            </div>
          </div>

          {!profile && onProfileRedirect && (
            <button
              onClick={onProfileRedirect}
              className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 transition-all"
            >
              Configure Profile
            </button>
          )}
        </div>

        {isAnalyzing ? (
          /* Professional Loading state */
          <div className="py-12 flex flex-col items-center justify-center text-center animate-fadeIn min-h-[300px]">
            <div className="relative mb-6">
              <div className="h-14 w-14 rounded-full border border-dashed border-black dark:border-white animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-black dark:text-white animate-pulse" />
              </div>
            </div>
            <h4 className="text-sm font-bold tracking-tight mb-1 text-black dark:text-white">AI Clinical Nutrition Scanner Active</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono animate-pulse min-h-[16px]">
              {loadingStep}
            </p>
          </div>
        ) : result ? (
          /* Results Report Display */
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header: Name and Grade */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#e4e4e7] dark:border-[#27272a] pb-4">
              <div>
                <span className="text-[8px] font-mono uppercase text-[#71717a] dark:text-[#a1a1aa] tracking-widest block">
                  Identified Item
                </span>
                <h4 className="text-xl font-black text-black dark:text-white mt-1">
                  {result.foodName}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#71717a] dark:text-[#a1a1aa] font-medium">
                    Serving: {result.servingSize}
                  </span>
                  {result.confidenceScore && result.confidenceScore < 100 && (
                    <>
                      <span className="text-[10px] text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="text-[9px] font-mono font-bold bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                        Confidence: {result.confidenceScore}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Recommendation Choice Badge */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border font-black ${getRecommendationStyles(result.recommendation)}`}>
                  {result.recommendation}
                </span>
              </div>
            </div>

            {/* Core Stats Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Calories and Health Score */}
              <div className="md:col-span-1 space-y-4">
                {/* Calories Display */}
                <div className="bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-2xl p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider block">Estimated Energy</span>
                    <span className="text-3xl font-black text-black dark:text-white mt-1 block">
                      {result.calories}
                      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-1">kcal</span>
                    </span>
                  </div>
                  <div className="h-10 w-10 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center">
                    <Flame className="h-5 w-5 text-[#71717a] dark:text-zinc-400" />
                  </div>
                </div>

                {/* Health Score Panel */}
                <div className="bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">Health Score Index</span>
                    <Award className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-zinc-200 dark:text-zinc-800"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-black dark:text-white"
                          strokeDasharray={`${result.healthScore}, 100`}
                          strokeWidth="3"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-sm font-black text-black dark:text-white">{result.healthScore}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 block font-medium leading-tight">
                        Rating grade assigned on nutritional fiber, macro ratios, and profile targets.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle & Right: Macros details charts */}
              <div className="md:col-span-2 bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-5 shadow-sm space-y-4">
                <h5 className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider border-b border-[#e4e4e7] dark:border-[#27272a] pb-2">
                  Macronutrient Density Profile
                </h5>

                <div className="space-y-3.5">
                  {/* Protein */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-zinc-500">Protein (g)</span>
                      <span className="text-black dark:text-white font-mono font-bold">{result.protein}g</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-black dark:bg-white transition-all duration-500" style={{ width: `${calculateMacroPct(result.protein, 50)}%` }}></div>
                    </div>
                  </div>

                  {/* Carbohydrates */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-zinc-500">Carbohydrates (g)</span>
                      <span className="text-black dark:text-white font-mono font-bold">{result.carbohydrates}g</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-500 dark:bg-zinc-400 transition-all duration-500" style={{ width: `${calculateMacroPct(result.carbohydrates, 100)}%` }}></div>
                    </div>
                  </div>

                  {/* Fat */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-zinc-500">Dietary Fats (g)</span>
                      <span className="text-black dark:text-white font-mono font-bold">{result.fat}g</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-400 dark:bg-zinc-600 transition-all duration-500" style={{ width: `${calculateMacroPct(result.fat, 40)}%` }}></div>
                    </div>
                  </div>

                  {/* Fiber */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-zinc-500">Dietary Fiber (g)</span>
                      <span className="text-black dark:text-white font-mono font-bold">{result.fiber}g</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-200 dark:bg-zinc-500 transition-all duration-500" style={{ width: `${calculateMacroPct(result.fiber, 15)}%` }}></div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Personalized Recommendation Callout */}
            <div className="bg-black text-[#fafafa] dark:bg-white dark:text-black rounded-3xl p-5 shadow-md flex items-start space-x-3.5 relative overflow-hidden">
              <div className="bg-white/10 dark:bg-black/5 p-2 rounded-xl flex items-center justify-center mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-wider opacity-60">Personalized AI Evaluation</span>
                <p className="text-xs leading-relaxed font-semibold">
                  {result.personalizedRecommendation}
                </p>
                <div className="pt-2 text-[8px] opacity-50 flex items-center gap-1.5 font-bold uppercase tracking-wider font-mono">
                  <span>Profile Goal: {profile?.goal || "Maintain weight"}</span>
                  {profile?.dietType && (
                    <>
                      <span>•</span>
                      <span>Preference: {profile.dietType}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Image display if available */}
            {imagePreview && (
              <div className="border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl overflow-hidden shadow-inner flex justify-center bg-zinc-50 dark:bg-zinc-950 p-2">
                <img src={imagePreview} alt={result.foodName} className="max-h-48 object-contain rounded-2xl shadow-sm" />
              </div>
            )}

            {/* Accuracy disclaimer */}
            <p className="text-[8.5px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed max-w-lg mx-auto pt-2">
              *Estimated nutritional values are AI-generated based on standard serving sizes and recipes. Actual values may vary depending on preparation methods, ingredients, and portion sizes.
            </p>

            {/* Reset Row */}
            <div className="pt-2 border-t border-[#e4e4e7] dark:border-[#27272a] flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="bg-[#111111] hover:bg-black dark:bg-[#fafafa] dark:hover:bg-white text-white dark:text-black font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Analyze Another Food
              </button>
            </div>

          </div>
        ) : (
          /* Inputs Setup tab */
          <div className="space-y-6 animate-fadeIn">
            
            {/* Input Selection Tab Bar */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] rounded-2xl">
              <button
                type="button"
                onClick={() => { setActiveTab("search"); setError(null); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "search"
                  ? "bg-white dark:bg-[#121214] text-black dark:text-white border border-[#e4e4e7] dark:border-[#27272a] shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
              >
                <span className="flex items-center justify-center gap-1.5"><Search className="h-3.5 w-3.5" /> Food Name Search</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setActiveTab("upload"); setError(null); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "upload"
                  ? "bg-white dark:bg-[#121214] text-black dark:text-white border border-[#e4e4e7] dark:border-[#27272a] shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
              >
                <span className="flex items-center justify-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Food Image Upload</span>
              </button>
            </div>

            {/* Forms body */}
            {activeTab === "search" ? (
              /* TEXT MODE */
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">What are you eating?</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="e.g. Chicken Biryani, Kerala Meals, Apple..."
                      className="flex-1 bg-[#fafafa] dark:bg-[#09090b] border border-[#e4e4e7] dark:border-[#27272a] focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-transparent rounded-xl px-4 py-3 text-xs text-[#111111] dark:text-[#fafafa] focus:outline-none transition-all shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!searchText.trim() || isAnalyzing}
                      className="bg-[#111111] hover:bg-black dark:bg-[#fafafa] dark:hover:bg-white text-white dark:text-black font-bold px-4 rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      Analyze
                    </button>
                  </div>
                </div>

                {/* Recommendation Quick tags */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Example Searches</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Chicken Biryani",
                      "Kerala Meals",
                      "Apple",
                      "Shawarma",
                      "Egg Omelette",
                      "Paneer Butter Masala"
                    ].map((tag, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearchText(tag);
                          handleAnalyze(undefined, tag);
                        }}
                        className="text-[9px] font-semibold bg-[#fafafa] hover:bg-zinc-200 dark:bg-[#09090b] dark:hover:bg-zinc-900 border border-[#e4e4e7] dark:border-[#27272a] text-zinc-500 dark:text-zinc-400 px-2.5 py-1.5 rounded-full cursor-pointer transition-all active:scale-95"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              /* IMAGE MODE */
              <div className="space-y-4">
                
                {imagePreview ? (
                  /* Preview layout details */
                  <div className="border border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#09090b] rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-inner animate-fadeIn min-h-[160px]">
                    <button
                      type="button"
                      onClick={clearSelectedImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-500 hover:text-black dark:hover:text-white rounded-full transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <img src={imagePreview} alt="Preview selection" className="max-h-40 rounded-xl object-contain shadow-md mb-4" />
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      className="bg-[#111111] hover:bg-black dark:bg-[#fafafa] dark:hover:bg-white text-white dark:text-black font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" /> Scan Food Image
                    </button>
                  </div>
                ) : (
                  /* Drag and Drop Zone */
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[160px] ${dragActive
                      ? "border-black dark:border-white bg-black/5 dark:bg-white/5 scale-[1.01]"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-650 bg-[#fafafa] dark:bg-[#09090b]"
                      }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                      capture="environment" // Enables camera directly on mobile devices
                    />

                    <div className="h-10 w-10 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
                      <Upload className="h-5 w-5 text-zinc-400" />
                    </div>
                    
                    <span className="text-xs font-bold text-black dark:text-white block">Drag & Drop Food Photo</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-1">
                      Works with Mobile Camera, Gallery, or desktop uploads (Max 4MB)
                    </span>
                  </div>
                )}
                
              </div>
            )}

            {/* Error view */}
            {error && (
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-[10px] text-center font-bold flex items-center justify-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

          </div>
        )}

      </div>

      {/* History Feed List */}
      <div className="bg-white dark:bg-[#121214] border border-[#e4e4e7] dark:border-[#27272a] rounded-3xl p-6 shadow-sm">
        <h4 className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-zinc-400" /> Recent AI Diagnostics Logs
        </h4>

        {isLoadingHistory ? (
          <div className="text-center py-6 flex justify-center">
            <RefreshCw className="animate-spin h-5 w-5 text-zinc-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center p-6 border border-dashed border-[#e4e4e7] dark:border-[#27272a] rounded-2xl flex flex-col items-center">
            <Apple className="h-6 w-6 text-zinc-300 dark:text-zinc-700 mb-1.5" />
            <p className="text-[11px] text-zinc-400">No scanned items logged.</p>
            <p className="text-[9px] text-zinc-500 mt-0.5">Analyze food to create history metrics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {history.map((log) => (
              <button
                key={log.id}
                onClick={() => handleSelectHistoryItem(log)}
                className="w-full text-left p-3.5 rounded-2xl border border-[#e4e4e7] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#09090b] hover:border-[#111111] dark:hover:border-white transition-all flex items-center gap-3.5 cursor-pointer group shadow-sm"
              >
                {/* Image preview or standard icon */}
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center shadow-inner relative">
                  {log.imageUrl ? (
                    <img src={log.imageUrl} alt={log.foodName} className="h-full w-full object-cover" />
                  ) : (
                    <Apple className="h-5 w-5 text-zinc-400 group-hover:scale-105 transition-transform" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-black dark:text-white truncate block pr-2">
                      {log.foodName}
                    </span>
                    <span className="text-[8px] font-mono opacity-60">
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "Just now"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[9px] text-zinc-400 block truncate">
                      {log.servingSize} • <strong className="text-black dark:text-white font-mono">{log.calories} kcal</strong>
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-wider font-mono flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Inspect <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {history.length > 0 && !dbConnected && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                localStorage.removeItem("nutritrack_food_history");
                setHistory([]);
              }}
              className="text-[10px] font-bold text-zinc-400 hover:text-black dark:hover:text-white border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 transition-all"
            >
              Clear Local Logs
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
