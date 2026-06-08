import { GoogleGenAI } from "@google/genai";

export interface IMeal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
}

export interface IMealPlan {
  breakfast: IMeal;
  lunch: IMeal;
  dinner: IMeal;
  snack: IMeal;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  tips: string[];
}

// Highly comprehensive offline meal database mapped by Cuisine and Diet Type
const REGIONAL_TEMPLATES: Record<string, Record<string, any>> = {
  Kerala: {
    Veg: {
      breakfast: {
        name: "Kerala Puttu & Kadala Curry",
        description: "Steamed rice cake with coconut layers (Puttu) paired with a traditional spiced black chickpea curry.",
        calories: 400, protein: 12, carbs: 68, fats: 8,
        ingredients: ["1 cup Rice flour", "1/2 cup Grated coconut", "1/2 cup Black chickpeas", "Kerala spices (mustard, curry leaves)"]
      },
      lunch: {
        name: "Kerala Matta Rice & Avial with Thoran",
        description: "Nutritious red Matta rice served with Avial (mixed vegetables in coconut paste) and Cabbage Thoran.",
        calories: 550, protein: 14, carbs: 88, fats: 15,
        ingredients: ["1 cup Matta rice", "1/2 cup Mixed vegetables", "1/2 cup Cabbage", "1/2 cup Coconut paste"]
      },
      dinner: {
        name: "Wheat Dosa & Vegetable Stew",
        description: "Thin wheat crepes served with a light coconut milk-based vegetable stew.",
        calories: 350, protein: 9, carbs: 58, fats: 10,
        ingredients: ["2 Wheat dosas", "1/2 cup Potatoes & Carrots", "1/2 cup Coconut milk"]
      },
      snack: {
        name: "Steamed Ethan Nendran (Banana)",
        description: "Steamed traditional ripe Kerala plantain banana, rich in fiber and vitamins.",
        calories: 180, protein: 2, carbs: 42, fats: 0,
        ingredients: ["1 Ripe Kerala Nendran banana"]
      },
      tips: [
        "Include curry leaves in your curries; they are rich in iron and aid digestion.",
        "Opt for Matta rice over white rice for a lower glycemic index and more dietary fiber.",
        "Limit coconut oil to 1-2 teaspoons per meal to manage fat intake while cooking.",
        "Drink warm cumin seed water (Jeera water) throughout the day to support gut health."
      ]
    },
    NonVeg: {
      breakfast: {
        name: "Appam & Egg Roast",
        description: "Soft-centered lacy rice pancakes served with a spiced caramelized onion egg gravy.",
        calories: 450, protein: 18, carbs: 60, fats: 14,
        ingredients: ["2 Appams", "2 Boiled eggs", "1 Onion", "Spices & curry leaves"]
      },
      lunch: {
        name: "Matta Rice & Kerala Fish Curry",
        description: "Traditional red Matta rice paired with spicy, tangy Kerala fish curry cooked with kudampuli (gamboge).",
        calories: 600, protein: 32, carbs: 82, fats: 16,
        ingredients: ["1 cup Matta rice", "120g Sardine or Kingfish", "2 pieces Kudampuli", "Coconut oil & ginger"]
      },
      dinner: {
        name: "Chappati & Chicken Ularthiyathu (Dry)",
        description: "Soft whole wheat flatbreads paired with Kerala-style roasted chicken breast with coconut bites.",
        calories: 500, protein: 35, carbs: 48, fats: 18,
        ingredients: ["2 Chappatis", "150g Chicken breast", "Coconut tidbits", "Traditional dry spices"]
      },
      snack: {
        name: "Steamed Ripe Plantain (Pazham Steamed)",
        description: "Sweet steamed ripe plantain slice, providing rapid post-workout energy.",
        calories: 200, protein: 4, carbs: 40, fats: 2,
        ingredients: ["1 Large Nendran Plantain"]
      },
      tips: [
        "Sardines and Mackerel in fish curry provide premium Omega-3 fatty acids for cardiovascular health.",
        "Kerala spices like black pepper and turmeric have potent anti-inflammatory properties.",
        "Combine your protein sources with fresh vegetable salads to increase micronutrient density.",
        "Ensure your chicken stir-fry uses breast meat to minimize saturated fats."
      ]
    }
  },
  SouthIndian: {
    Veg: {
      breakfast: {
        name: "Idli with Sambhar & Coconut Chutney",
        description: "Fermented steamed rice-lentil cakes served with a vegetable-packed lentil stew and fresh coconut chutney.",
        calories: 380, protein: 10, carbs: 68, fats: 7,
        ingredients: ["3 Idlis", "1 cup Sambhar", "2 tbsp Coconut chutney"]
      },
      lunch: {
        name: "Brown Rice with Dal & Sautéed Beans Poriyal",
        description: "Fiber-rich brown rice paired with cooked split pigeon peas (toor dal) and green beans with grated coconut.",
        calories: 520, protein: 16, carbs: 80, fats: 14,
        ingredients: ["1 cup Brown rice", "1/2 cup Toor dal", "1/2 cup Beans", "Grated coconut"]
      },
      dinner: {
        name: "Ragi Dosa & Tomato Chutney",
        description: "Iron-rich finger millet crepes served with a tangy roasted tomato and onion chutney.",
        calories: 320, protein: 8, carbs: 55, fats: 8,
        ingredients: ["2 Ragi dosas", "2 tbsp Tomato chutney"]
      },
      snack: {
        name: "Roasted Bengal Gram (Chana)",
        description: "Dry roasted crunchy yellow chickpeas, high in plant-based protein and low in fat.",
        calories: 150, protein: 8, carbs: 22, fats: 2,
        ingredients: ["1/2 cup Roasted chana"]
      },
      tips: [
        "Include ragi (finger millet) in your diet weekly to boost calcium and iron intake.",
        "Fermented foods like idlis are excellent for maintaining a healthy gut microbiome.",
        "Boost protein in sambhar by adding extra drumsticks and double-boiled lentils.",
        "Use mint or coriander chutney to replace high-fat dips and dressings."
      ]
    },
    NonVeg: {
      breakfast: {
        name: "Masala Dosa & Egg Podi Curry",
        description: "Crispy rice crepe filled with potato masala, paired with egg scramble cooked with gun powder spice.",
        calories: 480, protein: 16, carbs: 68, fats: 15,
        ingredients: ["1 Masala dosa", "2 Eggs", "1 tsp Podi spice"]
      },
      lunch: {
        name: "Brown Rice & Andhra Chicken Curry",
        description: "Steamed brown rice served with a spicy, aromatic chicken gravy cooked in classic Guntur style.",
        calories: 580, protein: 34, carbs: 75, fats: 14,
        ingredients: ["1 cup Brown rice", "150g Chicken breast", "Andhra spice blend"]
      },
      dinner: {
        name: "Oat Dosa & Chettinad Fish Roast",
        description: "Soluble-fiber oats crepe paired with pan-roasted fish fillet rubbed with hand-ground Chettinad spices.",
        calories: 440, protein: 28, carbs: 46, fats: 16,
        ingredients: ["2 Oats crepes", "120g Seer fish fillet", "Chettinad spice paste"]
      },
      snack: {
        name: "Spiced Boiled Peanut Sundal",
        description: "Boiled peanuts tossed with mustard seeds, curry leaves, and a pinch of grated coconut.",
        calories: 220, protein: 10, carbs: 12, fats: 14,
        ingredients: ["1/2 cup Peanuts", "Mustard seeds & lemon juice"]
      },
      tips: [
        "Sundal is an excellent low glycemic index snack that keeps you satiated for hours.",
        "Andhra and Chettinad curries can be made with minimal oil while retaining authentic flavor profiles.",
        "Oats dosa is a quick, high-fiber alternative to traditional fermented rice batters.",
        "Stay hydrated: South Indian summers require replenishing electrolytes with buttermilk (Moru)."
      ]
    }
  },
  NorthIndian: {
    Veg: {
      breakfast: {
        name: "Stuffed Paneer Paratha with Curd",
        description: "Whole wheat flatbread stuffed with spiced low-fat paneer, roasted with minimal oil, served with plain yogurt.",
        calories: 450, protein: 18, carbs: 55, fats: 17,
        ingredients: ["1 Large Paratha", "60g Low-fat Paneer", "1/2 cup Plain curd"]
      },
      lunch: {
        name: "Jeera Rice, Yellow Dal Tadka & Mix Veg",
        description: "Basmati rice seasoned with cumin, served with tempered yellow lentils and stir-fried seasonal vegetables.",
        calories: 530, protein: 16, carbs: 82, fats: 14,
        ingredients: ["1 cup Basmati rice", "1/2 cup Yellow split peas", "1/2 cup Cauliflower, peas & carrots"]
      },
      dinner: {
        name: "Missi Roti & Baingan Bharta",
        description: "Gram-flour and wheat flatbread served with roasted spiced eggplant mash.",
        calories: 360, protein: 12, carbs: 52, fats: 11,
        ingredients: ["2 Missi rotis", "1 cup Eggplant bharta", "1 tsp Mustard oil"]
      },
      snack: {
        name: "Roasted Makhana (Foxnuts)",
        description: "Puffed foxnuts roasted with a pinch of turmeric and black salt, a premium crunchy snack.",
        calories: 140, protein: 3, carbs: 26, fats: 3,
        ingredients: ["1.5 cups Makhanas", "1/2 tsp Olive oil"]
      },
      tips: [
        "Missi Roti (chana dal flour) has a much higher protein content than normal wheat roti.",
        "Plain curd helps digest heavy meals and supplies gut-friendly lactic acid bacteria.",
        "Makhana is an excellent low-calorie substitute for processed chips or crackers.",
        "Reduce ghee toppings on dals; use dry roasting spices for maximum aroma with minimal fats."
      ]
    },
    NonVeg: {
      breakfast: {
        name: "Spiced Egg Bhurji & Multigrain Roti",
        description: "Indian scrambled eggs cooked with tomatoes, green chilies, and onions, served with whole wheat multigrain roti.",
        calories: 420, protein: 22, carbs: 42, fats: 16,
        ingredients: ["2 Whole eggs", "1 Egg white", "1 Multigrain roti", "Onions, tomatoes, green chilies"]
      },
      lunch: {
        name: "Pulao & Chicken Tariwala",
        description: "Basmati rice pulao cooked with peas, served with a home-style North Indian chicken curry in onion-tomato gravy.",
        calories: 620, protein: 36, carbs: 78, fats: 18,
        ingredients: ["1 cup Basmati peas pulao", "150g Chicken breast", "Home-style light gravy"]
      },
      dinner: {
        name: "Tandoori Roti & Fish Tikka Masala",
        description: "Clay-oven baked whole wheat roti paired with grilled fish tikkas simmered in a light spiced masala.",
        calories: 480, protein: 32, carbs: 48, fats: 16,
        ingredients: ["2 Tandoori rotis", "130g Tilapia or Basa fish cubes", "Yogurt marinade spices"]
      },
      snack: {
        name: "Spiced Chickpea Salad (Chana Chaat)",
        description: "Boiled white chickpeas tossed with cucumbers, onions, tomatoes, chaat masala, and fresh lemon juice.",
        calories: 180, protein: 8, carbs: 30, fats: 2,
        ingredients: ["1/2 cup White chickpeas", "Cucumbers, tomatoes, lemon juice"]
      },
      tips: [
        "Home-style chicken tari (gravy) is light on fat compared to restaurant butter-rich gravies.",
        "Grilling fish tikkas preserves protein quality and keeps fat addition extremely low.",
        "Use lemon juice on chana chaat to enhance iron absorption due to Vitamin C.",
        "Multigrain rotis provide a sustained release of glucose into your bloodstream."
      ]
    }
  },
  MixedIndian: {
    Veg: {
      breakfast: {
        name: "Vegetable Upma with Roasted Cashews",
        description: "Roasted semolina cooked with mixed vegetables, mustard seeds, curry leaves, and a sprinkle of cashews.",
        calories: 410, protein: 10, carbs: 62, fats: 13,
        ingredients: ["1 cup Semolina upma", "1/4 cup Peas & carrots", "6 Cashew nuts"]
      },
      lunch: {
        name: "Chappati, Lentil Tadka & Jeera Alloo",
        description: "Soft whole wheat rotis served with tempered lentils and pan-seared cumin potatoes.",
        calories: 550, protein: 18, carbs: 80, fats: 17,
        ingredients: ["2 Chappatis", "1/2 cup Yellow lentils (dal)", "1/2 cup Potatoes"]
      },
      dinner: {
        name: "Moong Dal Khichdi & Papad",
        description: "A comforting, easily digestible one-pot dish of rice and moong dal, served with roasted lentil papad.",
        calories: 380, protein: 12, carbs: 68, fats: 6,
        ingredients: ["1.5 cups Moong dal khichdi", "1 Roasted papad"]
      },
      snack: {
        name: "Dry Fruit Mix (Almonds & Raisins)",
        description: "A healthy mix of raw almonds and sweet raisins for quick, sustained energy.",
        calories: 160, protein: 4, carbs: 24, fats: 8,
        ingredients: ["12 Almonds", "15 Raisins"]
      },
      tips: [
        "Dal Khichdi is a complete protein, containing all essential amino acids in a perfect ratio.",
        "Prepare dal using low-fat preparations instead of butter and cream.",
        "Upma is highly customizable; add carrots, beans, and peas to increase fiber.",
        "Dry fruits provide quick energy and essential minerals like copper and magnesium."
      ]
    },
    NonVeg: {
      breakfast: {
        name: "Oatmeal Scrambled Eggs & Fruit",
        description: "Rolled oats cooked dry, served alongside fluffy egg-white scramble and sliced apples.",
        calories: 430, protein: 26, carbs: 48, fats: 14,
        ingredients: ["2 Egg whites", "1 Whole egg", "1/2 cup Oats", "1/2 Apple"]
      },
      lunch: {
        name: "Basmati Rice, Dal & Egg Curry",
        description: "Cooked white basmati rice served with simple yellow dal and hard-boiled egg curry.",
        calories: 580, protein: 24, carbs: 85, fats: 16,
        ingredients: ["1 cup Rice", "1/2 cup Yellow dal", "2 Eggs in light gravy"]
      },
      dinner: {
        name: "Chappati & Kadai Chicken breast",
        description: "Whole wheat rotis paired with chicken breast strips cooked with bell peppers and fresh kadai spices.",
        calories: 500, protein: 36, carbs: 45, fats: 18,
        ingredients: ["2 Chappatis", "150g Chicken breast", "1/2 cup Bell peppers"]
      },
      snack: {
        name: "Spiced Roasted Kala Chana",
        description: "Dry roasted black chickpeas seasoned with dry spices, a traditional high-fiber snack.",
        calories: 150, protein: 8, carbs: 22, fats: 2,
        ingredients: ["1/2 cup Kala chana"]
      },
      tips: [
        "Kala Chana contains high amounts of soluble fiber which supports cholesterol management.",
        "Bell peppers in Kadai chicken add high vitamin C, helping joint tissue repair.",
        "Remove egg yolks from 1-2 eggs if you want to strictly control fat and cholesterol intakes.",
        "Opt for dry-roasted snacks over deep-fried Indian namkeen."
      ]
    }
  },
  International: {
    Veg: {
      breakfast: {
        name: "Avocado Toast & Sautéed Mushrooms",
        description: "Sourdough toast spread with ripe mashed avocado, topped with pan-seared garlic mushrooms.",
        calories: 420, protein: 11, carbs: 42, fats: 22,
        ingredients: ["1 slice Sourdough bread", "1/2 Avocado", "1/2 cup Mushrooms", "1 tsp Garlic oil"]
      },
      lunch: {
        name: "Quinoa Mediterranean Power Salad",
        description: "Cooked quinoa mixed with cherry tomatoes, cucumbers, olives, chickpeas, and crumbled low-fat feta.",
        calories: 520, protein: 18, carbs: 64, fats: 19,
        ingredients: ["1 cup cooked Quinoa", "1/2 cup Chickpeas", "30g Feta cheese", "6 Kalamata olives"]
      },
      dinner: {
        name: "Tofu Vegetable Stir-Fry & Jasmine Rice",
        description: "Firm organic tofu cubes sautéed with broccoli, baby corn, carrots, and low-sodium soy sauce over jasmine rice.",
        calories: 440, protein: 20, carbs: 68, fats: 10,
        ingredients: ["120g Firm tofu", "1 cup Jasmine rice", "1.5 cups stir-fry Veggies"]
      },
      snack: {
        name: "Greek Yogurt with Honey & Walnuts",
        description: "Thick Greek yogurt topped with a drizzle of organic honey and raw crushed walnuts.",
        calories: 220, protein: 15, carbs: 18, fats: 10,
        ingredients: ["150g Greek yogurt", "1 tsp Honey", "15g Walnuts"]
      },
      tips: [
        "Greek yogurt contains double the protein of traditional yogurt due to the straining process.",
        "Tofu is an excellent vegan source of all nine essential amino acids and iron.",
        "Sourdough fermentation breaks down gluten, making it easier on the stomach than white bread.",
        "Quinoa is a pseudo-cereal that is naturally gluten-free and packed with fiber."
      ]
    },
    NonVeg: {
      breakfast: {
        name: "Smoked Salmon & Scrambled Eggs",
        description: "Fluffy scrambled eggs paired with premium cured smoked salmon on a bed of baby spinach.",
        calories: 390, protein: 28, carbs: 8, fats: 26,
        ingredients: ["3 Scrambled eggs", "60g Smoked salmon", "1 cup Baby spinach"]
      },
      lunch: {
        name: "Grilled Chicken Caesar Wrap",
        description: "Slices of tender grilled chicken breast, romaine lettuce, parmigiano, and light Caesar dressing in a tortilla.",
        calories: 560, protein: 38, carbs: 48, fats: 20,
        ingredients: ["150g Chicken breast", "1 Large flour tortilla", "1 cup Romaine", "1.5 tbsp Caesar dressing"]
      },
      dinner: {
        name: "Seared Sirloin Steak & Sweet Potato",
        description: "Lean grass-fed sirloin steak cooked in cast iron, served with a baked sweet potato and asparagus.",
        calories: 620, protein: 42, carbs: 45, fats: 28,
        ingredients: ["150g Sirloin steak", "1 Medium sweet potato", "6 spears Asparagus"]
      },
      snack: {
        name: "Hummus & Carrot Sticks",
        description: "Creamy chickpea hummus paired with crisp, sweet baby carrot sticks.",
        calories: 160, protein: 5, carbs: 18, fats: 8,
        ingredients: ["3 tbsp Hummus", "100g Carrot sticks"]
      },
      tips: [
        "Sweet potatoes are an excellent source of beta-carotene, which converts to Vitamin A.",
        "Smoked salmon provides healthy monounsaturated fats and essential fish oils.",
        "Using light Caesar dressings dramatically reduces fat intake while keeping wraps moist.",
        "Sirloin is one of the leanest beef cuts available, making it excellent for protein targets."
      ]
    }
  }
};

/**
 * Enhanced Offline Recommendation Engine
 */
function generateLocalPlan(
  goalType: "lose" | "gain" | "maintain",
  targetCalories: number,
  budget: string,
  cuisine: string,
  dietType: string
): IMealPlan {
  // Determine if veg or non-veg fallback is needed
  const isVeg = ["vegetarian", "vegan", "eggetarian"].includes(dietType.toLowerCase());
  const vegKey = isVeg ? "Veg" : "NonVeg";

  // Clean cuisine key matching our map
  let cuisineKey = "MixedIndian";
  const normCuisine = cuisine.toLowerCase().replace(/[\s-]/g, "");
  if (normCuisine.includes("kerala")) cuisineKey = "Kerala";
  else if (normCuisine.includes("south")) cuisineKey = "SouthIndian";
  else if (normCuisine.includes("north")) cuisineKey = "NorthIndian";
  else if (normCuisine.includes("international")) cuisineKey = "International";

  // Deep copy the template
  const baseCuisine = REGIONAL_TEMPLATES[cuisineKey] || REGIONAL_TEMPLATES["MixedIndian"];
  const template = JSON.parse(JSON.stringify(baseCuisine[vegKey] || baseCuisine["Veg"]));

  // Adjust names & ingredients based on budget level
  const budgetNorm = budget.toLowerCase();
  if (budgetNorm.includes("student")) {
    // Modify names to cheap version
    template.breakfast.name = "Budget " + template.breakfast.name;
    template.breakfast.ingredients.push("Eco-store items");
    template.lunch.name = "Budget " + template.lunch.name;
    template.dinner.name = "Budget " + template.dinner.name;
  } else if (budgetNorm.includes("premium")) {
    template.breakfast.name = "Premium Organic " + template.breakfast.name;
    template.breakfast.ingredients.push("Organic local harvest");
    template.lunch.name = "Premium Organic " + template.lunch.name;
    template.dinner.name = "Premium Organic " + template.dinner.name;
  }

  const templateTotalCalories =
    template.breakfast.calories +
    template.lunch.calories +
    template.dinner.calories +
    template.snack.calories;

  const scaleFactor = targetCalories / templateTotalCalories;

  const scaleMeal = (meal: any): IMeal => {
    return {
      name: meal.name,
      description: meal.description,
      calories: Math.round(meal.calories * scaleFactor),
      protein: Math.round(meal.protein * scaleFactor),
      carbs: Math.round(meal.carbs * scaleFactor),
      fats: Math.round(meal.fats * scaleFactor),
      ingredients: meal.ingredients,
    };
  };

  const breakfast = scaleMeal(template.breakfast);
  const lunch = scaleMeal(template.lunch);
  const dinner = scaleMeal(template.dinner);
  const snack = scaleMeal(template.snack);

  const totalProtein = breakfast.protein + lunch.protein + dinner.protein + snack.protein;
  const totalCarbs = breakfast.carbs + lunch.carbs + dinner.carbs + snack.carbs;
  const totalFats = breakfast.fats + lunch.fats + dinner.fats + snack.fats;

  return {
    breakfast,
    lunch,
    dinner,
    snack,
    totalProtein,
    totalCarbs,
    totalFats,
    tips: template.tips,
  };
}

/**
 * Generates an AI meal plan using the Gemini API.
 */
export async function generateDietPlanAI(
  age: number,
  gender: string,
  height: number,
  weight: number,
  activityLevel: string,
  goal: string,
  targetCalories: number,
  bmi: number,
  budget: string,
  cuisine: string,
  dietType: string,
  goalTimeline: string
): Promise<{ plan: IMealPlan; source: "gemini" | "local_fallback" }> {
  let goalKey: "lose" | "gain" | "maintain" = "maintain";
  const lowerGoal = goal.toLowerCase();
  if (lowerGoal.includes("lose") || lowerGoal.includes("deficit") || lowerGoal.includes("cut")) {
    goalKey = "lose";
  } else if (lowerGoal.includes("gain") || lowerGoal.includes("surplus") || lowerGoal.includes("bulk")) {
    goalKey = "gain";
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("No GEMINI_API_KEY. Generating diet plan using local fallback recommendation engine.");
    return {
      plan: generateLocalPlan(goalKey, targetCalories, budget, cuisine, dietType),
      source: "local_fallback",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are an expert nutritionist and AI diet planner. Generate a customized 1-day meal plan based on:
      - Age: ${age} years, Gender: ${gender}, Height: ${height} cm, Weight: ${weight} kg, Activity: ${activityLevel}
      - Goal: ${goal} (Calorie target: ${targetCalories} kcal)
      - Current BMI: ${bmi.toFixed(1)}
      - Budget: ${budget} (Ensure ingredients/complexity match budget level)
      - Cuisine: ${cuisine} (Integrate traditional dishes of this style, e.g. Puttu/Matta Rice/Fish Curry for Kerala; Paneer/Dal for North Indian)
      - Diet Type: ${dietType} (Strictly: Any, Vegetarian, Vegan, Eggetarian, Non-Vegetarian)
      - Goal Timeline: ${goalTimeline}

      Meals: breakfast, lunch, dinner, snack. Total calories must be around ${targetCalories} kcal (+/- 50 kcal).
      Provide exact ingredients, a concise dish description, calories, protein (g), carbs (g), and fats (g) for each meal.
      Include 4 actionable lifestyle/nutrition tips tailored to their timeline.

      You MUST respond with a JSON object matching this schema exactly:
      {
        "breakfast": {
          "name": "Meal Name",
          "description": "Concise preparation/dish description",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fats": number,
          "ingredients": ["ingredient 1", "ingredient 2"]
        },
        "lunch": {
          "name": "Meal Name",
          "description": "Concise description",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fats": number,
          "ingredients": ["ingredient 1", "ingredient 2"]
        },
        "dinner": {
          "name": "Meal Name",
          "description": "Concise description",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fats": number,
          "ingredients": ["ingredient 1", "ingredient 2"]
        },
        "snack": {
          "name": "Meal Name",
          "description": "Concise description",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fats": number,
          "ingredients": ["ingredient 1", "ingredient 2"]
        },
        "totalProtein": number,
        "totalCarbs": number,
        "totalFats": number,
        "tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "";
    const cleanJsonText = jsonText.replace(/^\s*```json\s*/i, "").replace(/\s*```\s*$/, "");
    const parsedPlan: IMealPlan = JSON.parse(cleanJsonText);

    return {
      plan: parsedPlan,
      source: "gemini",
    };
  } catch (error) {
    console.error("Gemini failed. Falling back to offline local engine:", error);
    return {
      plan: generateLocalPlan(goalKey, targetCalories, budget, cuisine, dietType),
      source: "local_fallback",
    };
  }
}

// -------------------------------------------------------------
// Nutrition Intelligence Q&A Helpers (Offline database updated)
// -------------------------------------------------------------
export interface IAdvisorResponse {
  answer: string;
  hasNutritionTable: boolean;
  nutrition?: {
    foodName: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

const LOCAL_NUTRITION_DATABASE: Record<
  string,
  { foodName: string; portion: string; calories: number; protein: number; carbs: number; fats: number; answer: string }
> = {
  paneer: {
    foodName: "Indian Paneer (Cottage Cheese)",
    portion: "100g",
    calories: 265, protein: 18, carbs: 3.2, fats: 20,
    answer: "Paneer is a popular dairy-based protein source in Indian cuisine. It is rich in calcium and casein protein, which digests slowly, making it excellent for keeping you full."
  },
  mattarice: {
    foodName: "Kerala Matta Rice (Cooked)",
    portion: "150g",
    calories: 195, protein: 4.5, carbs: 41, fats: 0.8,
    answer: "Kerala Matta rice is an unpolished red rice loaded with dietary fiber, magnesium, and vitamins. It has a lower glycemic index than regular white rice, aiding sugar control and digestion."
  },
  puttu: {
    foodName: "Kerala Puttu (Rice & Coconut)",
    portion: "1 piece (100g)",
    calories: 230, protein: 4.2, carbs: 46, fats: 3.5,
    answer: "Puttu is a steamed rice cylinder layered with grated coconut. It is an authentic, fat-free Kerala breakfast item that pairs perfectly with Kadala curry for a complete amino acid profile."
  },
  kadala: {
    foodName: "Kerala Kadala Curry (Black Chickpeas)",
    portion: "1 cup (150g)",
    calories: 220, protein: 11, carbs: 32, fats: 5,
    answer: "Kadala curry is a black chickpea gravy loaded with spices and coconut. It is a very rich source of iron, potassium, and vegetarian dietary fiber, ideal for sustained energy."
  },
  egg: {
    foodName: "Whole Egg (Large)",
    portion: "1 large (50g)",
    calories: 72, protein: 6.3, carbs: 0.4, fats: 4.8,
    answer: "A single large whole egg provides high-quality protein and essential nutrients like vitamin D, choline, and vitamin B12."
  },
  eggs: {
    foodName: "Whole Eggs (Large)",
    portion: "2 large eggs (100g)",
    calories: 144, protein: 12.6, carbs: 0.8, fats: 9.6,
    answer: "Two large whole eggs offer 12.6 grams of highly bioavailable protein. They contain all nine essential amino acids."
  },
  chicken: {
    foodName: "Chicken Breast (Cooked, Skinless)",
    portion: "100g",
    calories: 165, protein: 31, carbs: 0, fats: 3.6,
    answer: "Cooked skinless chicken breast is one of the most popular lean protein sources for muscle building and fat loss, with zero carbs."
  },
  almond: {
    foodName: "Almonds (Raw)",
    portion: "100g",
    calories: 579, protein: 21, carbs: 22, fats: 49,
    answer: "Almonds are nutrient-dense tree nuts rich in dietary fiber, protein, vitamin E, and magnesium."
  },
  almonds: {
    foodName: "Almonds (Raw)",
    portion: "30g (about 23 nuts)",
    calories: 174, protein: 6.3, carbs: 6.6, fats: 14.7,
    answer: "A handful of almonds (approx. 30g) provides 6.3g of plant-based protein and is a great source of vitamin E."
  },
  salmon: {
    foodName: "Salmon Fillet (Baked)",
    portion: "100g",
    calories: 206, protein: 22, carbs: 0, fats: 12,
    answer: "Baked salmon is a high-quality protein source famous for its high concentrations of anti-inflammatory Omega-3 fatty acids."
  },
  peanutbutter: {
    foodName: "Creamy Peanut Butter",
    portion: "1 tbsp (16g)",
    calories: 94, protein: 4, carbs: 3, fats: 8,
    answer: "Peanut butter is high in protein and healthy fats, but also calorie-dense. Opt for natural versions with no added sugar."
  },
  rice: {
    foodName: "Brown Rice (Cooked)",
    portion: "100g",
    calories: 111, protein: 2.6, carbs: 23, fats: 0.9,
    answer: "Cooked brown rice is a complex carbohydrate that retains its fibrous bran and germ layers, releasing energy slowly."
  },
  oats: {
    foodName: "Rolled Oats (Dry)",
    portion: "100g",
    calories: 389, protein: 16.9, carbs: 66, fats: 6.9,
    answer: "Oats are rich in beta-glucan, a soluble fiber that helps lower cholesterol and regulate blood sugar."
  },
  milk: {
    foodName: "Whole Milk (3.25% Fat)",
    portion: "1 cup (244ml)",
    calories: 149, protein: 8, carbs: 12, fats: 8,
    answer: "Whole milk is a nutritious liquid food providing calcium, vitamin D, and high-quality casein and whey proteins."
  },
  banana: {
    foodName: "Banana (Medium)",
    portion: "1 medium (118g)",
    calories: 105, protein: 1.3, carbs: 27, fats: 0.3,
    answer: "Bananas are a quick-digesting source of simple carbohydrates and potassium, an essential electrolyte."
  },
  whey: {
    foodName: "Whey Protein Isolate",
    portion: "1 scoop (30g)",
    calories: 120, protein: 25, carbs: 1, fats: 0.5,
    answer: "Whey protein isolate is a highly refined milk derivative supplying a rapid-digesting 25g dose of protein rich in BCAAs."
  }
};

function findLocalNutrition(query: string) {
  const normalized = query.toLowerCase().replace(/[\s-_]/g, "").replace(/[^a-z0-9]/g, "");
  if (!normalized) return null;

  if (LOCAL_NUTRITION_DATABASE[normalized]) {
    return LOCAL_NUTRITION_DATABASE[normalized];
  }

  for (const key of Object.keys(LOCAL_NUTRITION_DATABASE)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return LOCAL_NUTRITION_DATABASE[key];
    }
  }

  return null;
}

export async function askDietAdvisorAI(question: string, userName?: string): Promise<IAdvisorResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("No GEMINI_API_KEY. Using local Q&A engine.");
    const match = findLocalNutrition(question);
    if (match) {
      const personalGreeting = userName ? `Hello ${userName}! ` : "";
      return {
        answer: `${personalGreeting}${match.answer}\n\nHere is the nutritional breakdown for **${match.foodName}** (${match.portion}):`,
        hasNutritionTable: true,
        nutrition: {
          foodName: match.foodName,
          portion: match.portion,
          calories: match.calories,
          protein: match.protein,
          carbs: match.carbs,
          fats: match.fats,
        },
      };
    }

    const personalGreeting = userName ? `Hello ${userName}! ` : "";
    return {
      answer: `I am currently running in **Offline Mode**. \n\n${personalGreeting}I can provide nutritional breakdowns for popular local foods like: **paneer, matta rice, puttu, kadala curry, eggs, chicken, almonds, salmon, peanut butter, rice, oats, milk, bananas, and whey**.\n\nTo ask general nutrition questions or get personalized diet advice, please configure your \`GEMINI_API_KEY\` in your environment configuration!`,
      hasNutritionTable: false,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are an expert nutritionist and diet assistant in a top health-tech startup. Answer the user's diet question or food inquiry.
      ${userName ? `The user's name is ${userName}. Refer to them by their name naturally in your response where appropriate (e.g. "Sure, ${userName}, ..." or "Based on your goals, ${userName}, ...").` : ""}
      User Question: "${question}"

      If the user is asking about the calories or macronutrient content of a specific food item:
      - Answer the question in detail with rich nutritional advice.
      - Extract or estimate the nutritional breakdown (portion, calories, protein, carbs, fats).
      - Set "hasNutritionTable" to true and populate the "nutrition" object.

      If the user is asking a general diet/nutrition question (not about a specific food's macros):
      - Answer the question in detail using clear, encouraging nutritionist advice.
      - Set "hasNutritionTable" to false.

      You MUST respond with a valid JSON object matching the following structure exactly. Do not include markdown code block formatting (like \`\`\`json) in your final response, just the raw JSON text:
      {
        "answer": "A detailed, encouraging response in clear Markdown format. Use bullets, bolding, and headers where appropriate.",
        "hasNutritionTable": true,
        "nutrition": {
          "foodName": "Name of the food (e.g. Cooked Chicken Breast)",
          "portion": "The portion size referred to (e.g. 100g, 1 cup, 1 tablespoon)",
          "calories": 165,
          "protein": 31,
          "carbs": 0,
          "fats": 3.6
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "";
    const cleanJsonText = jsonText.replace(/^\s*```json\s*/i, "").replace(/\s*```\s*$/, "");
    const result: IAdvisorResponse = JSON.parse(cleanJsonText);
    return result;
  } catch (err) {
    console.error("Failed to query Gemini for advisor:", err);
    return {
      answer: "Sorry, I ran into an error while communicating with my AI model. Please try asking again in a moment.",
      hasNutritionTable: false,
    };
  }
}

// -------------------------------------------------------------
// Food Analyzer AI Interfaces & Helpers
// -------------------------------------------------------------

export interface IUserProfile {
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

export interface IFoodAnalysis {
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
}

// Extended Local Food Database for exact match lookup and offline fallback
export const OFFLINE_FOOD_DATABASE: Record<
  string,
  {
    foodName: string;
    servingSize: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    healthScore: number;
    recommendation: "Excellent Choice" | "Good Choice" | "Occasional Choice" | "Avoid Frequently";
    confidenceScore: number;
  }
> = {
  paneer: {
    foodName: "Indian Paneer (Cottage Cheese)",
    servingSize: "100g",
    calories: 265, protein: 18, carbs: 3.2, fats: 20, fiber: 0,
    healthScore: 70, recommendation: "Good Choice", confidenceScore: 100
  },
  mattarice: {
    foodName: "Kerala Matta Rice (Cooked)",
    servingSize: "150g",
    calories: 195, protein: 4.5, carbs: 41, fats: 0.8, fiber: 4.5,
    healthScore: 85, recommendation: "Excellent Choice", confidenceScore: 100
  },
  puttu: {
    foodName: "Kerala Puttu (Rice & Coconut)",
    servingSize: "1 piece (100g)",
    calories: 230, protein: 4.2, carbs: 46, fats: 3.5, fiber: 3.2,
    healthScore: 72, recommendation: "Good Choice", confidenceScore: 100
  },
  kadala: {
    foodName: "Kerala Kadala Curry (Black Chickpeas)",
    servingSize: "1 cup (150g)",
    calories: 220, protein: 11, carbs: 32, fats: 5, fiber: 7.5,
    healthScore: 82, recommendation: "Excellent Choice", confidenceScore: 100
  },
  egg: {
    foodName: "Whole Egg (Large)",
    servingSize: "1 large (50g)",
    calories: 72, protein: 6.3, carbs: 0.4, fats: 4.8, fiber: 0,
    healthScore: 80, recommendation: "Good Choice", confidenceScore: 100
  },
  eggs: {
    foodName: "Whole Eggs (Large)",
    servingSize: "2 large eggs (100g)",
    calories: 144, protein: 12.6, carbs: 0.8, fats: 9.6, fiber: 0,
    healthScore: 80, recommendation: "Good Choice", confidenceScore: 100
  },
  chicken: {
    foodName: "Chicken Breast (Cooked, Skinless)",
    servingSize: "100g",
    calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0,
    healthScore: 90, recommendation: "Excellent Choice", confidenceScore: 100
  },
  almond: {
    foodName: "Almonds (Raw)",
    servingSize: "100g",
    calories: 579, protein: 21, carbs: 22, fats: 49, fiber: 12,
    healthScore: 88, recommendation: "Good Choice", confidenceScore: 100
  },
  almonds: {
    foodName: "Almonds (Raw)",
    servingSize: "30g (approx. 23 nuts)",
    calories: 174, protein: 6.3, carbs: 6.6, fats: 14.7, fiber: 3.6,
    healthScore: 88, recommendation: "Good Choice", confidenceScore: 100
  },
  salmon: {
    foodName: "Salmon Fillet (Baked)",
    servingSize: "100g",
    calories: 206, protein: 22, carbs: 0, fats: 12, fiber: 0,
    healthScore: 92, recommendation: "Excellent Choice", confidenceScore: 100
  },
  peanutbutter: {
    foodName: "Creamy Peanut Butter",
    servingSize: "1 tbsp (16g)",
    calories: 94, protein: 4, carbs: 3, fats: 8, fiber: 1,
    healthScore: 70, recommendation: "Good Choice", confidenceScore: 100
  },
  rice: {
    foodName: "Brown Rice (Cooked)",
    servingSize: "100g",
    calories: 111, protein: 2.6, carbs: 23, fats: 0.9, fiber: 1.8,
    healthScore: 80, recommendation: "Good Choice", confidenceScore: 100
  },
  oats: {
    foodName: "Rolled Oats (Dry)",
    servingSize: "100g",
    calories: 389, protein: 16.9, carbs: 66, fats: 6.9, fiber: 10.6,
    healthScore: 90, recommendation: "Excellent Choice", confidenceScore: 100
  },
  milk: {
    foodName: "Whole Milk (3.25% Fat)",
    servingSize: "1 cup (244ml)",
    calories: 149, protein: 8, carbs: 12, fats: 8, fiber: 0,
    healthScore: 75, recommendation: "Good Choice", confidenceScore: 100
  },
  banana: {
    foodName: "Banana (Medium)",
    servingSize: "1 medium (118g)",
    calories: 105, protein: 1.3, carbs: 27, fats: 0.3, fiber: 3.1,
    healthScore: 85, recommendation: "Good Choice", confidenceScore: 100
  },
  whey: {
    foodName: "Whey Protein Isolate",
    servingSize: "1 scoop (30g)",
    calories: 120, protein: 25, carbs: 1, fats: 0.5, fiber: 0,
    healthScore: 90, recommendation: "Excellent Choice", confidenceScore: 100
  },
  biryani: {
    foodName: "Chicken Biryani",
    servingSize: "1 plate (approx. 350g)",
    calories: 550, protein: 24, carbs: 70, fats: 18, fiber: 3.5,
    healthScore: 50, recommendation: "Occasional Choice", confidenceScore: 100
  },
  chickenbiryani: {
    foodName: "Chicken Biryani",
    servingSize: "1 plate (approx. 350g)",
    calories: 550, protein: 24, carbs: 70, fats: 18, fiber: 3.5,
    healthScore: 50, recommendation: "Occasional Choice", confidenceScore: 100
  },
  keralameals: {
    foodName: "Traditional Kerala Meals",
    servingSize: "1 traditional serving (Matta rice, avial, thoran, sambar)",
    calories: 650, protein: 15, carbs: 95, fats: 14, fiber: 8,
    healthScore: 78, recommendation: "Good Choice", confidenceScore: 100
  },
  apple: {
    foodName: "Fresh Apple",
    servingSize: "1 medium apple (approx. 182g)",
    calories: 95, protein: 0.5, carbs: 25, fats: 0.3, fiber: 4.4,
    healthScore: 95, recommendation: "Excellent Choice", confidenceScore: 100
  },
  shawarma: {
    foodName: "Chicken Shawarma Wrap",
    servingSize: "1 wrap (approx. 250g)",
    calories: 480, protein: 26, carbs: 40, fats: 22, fiber: 2,
    healthScore: 42, recommendation: "Avoid Frequently", confidenceScore: 100
  },
  eggomelette: {
    foodName: "Egg Omelette (2 Eggs)",
    servingSize: "1 plate (2 eggs, oil, onions)",
    calories: 190, protein: 13, carbs: 2, fats: 15, fiber: 0.5,
    healthScore: 80, recommendation: "Good Choice", confidenceScore: 100
  },
  paneerbuttermasala: {
    foodName: "Paneer Butter Masala",
    servingSize: "1 bowl (approx. 200g)",
    calories: 380, protein: 12, carbs: 14, fats: 32, fiber: 1.5,
    healthScore: 45, recommendation: "Occasional Choice", confidenceScore: 100
  }
};

export function findLocalFoodAnalysis(query: string) {
  const normalized = query.toLowerCase().replace(/[\s-_]/g, "").replace(/[^a-z0-9]/g, "");
  if (!normalized) return null;

  if (OFFLINE_FOOD_DATABASE[normalized]) {
    return OFFLINE_FOOD_DATABASE[normalized];
  }

  for (const key of Object.keys(OFFLINE_FOOD_DATABASE)) {
    if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
      return OFFLINE_FOOD_DATABASE[key];
    }
  }

  return null;
}

export function generateLocalPersonalizedRecommendation(
  foodName: string,
  macros: { calories: number; protein: number; carbs: number; fats: number; fiber: number },
  profile: IUserProfile
): { healthScore: number; recommendation: "Excellent Choice" | "Good Choice" | "Occasional Choice" | "Avoid Frequently"; personalizedRecommendation: string } {
  const goal = profile.goal || "maintain weight";
  const lowerGoal = goal.toLowerCase();
  let recommendation: "Excellent Choice" | "Good Choice" | "Occasional Choice" | "Avoid Frequently" = "Good Choice";
  let advice = "";
  let healthScore = 75;

  const isHighProtein = macros.protein > 15;
  const isHighCalorie = macros.calories > 400;
  const isHighFiber = macros.fiber > 4;

  if (lowerGoal.includes("lose") || lowerGoal.includes("deficit") || lowerGoal.includes("cut")) {
    if (isHighCalorie) {
      recommendation = "Occasional Choice";
      advice = `Based on your weight loss goal, this food is relatively calorie-dense (${macros.calories} kcal) and should be consumed occasionally to stay within your daily budget constraint.`;
      healthScore = Math.max(45, healthScore - 15);
    } else {
      recommendation = "Good Choice";
      advice = `Based on your weight loss goal, this is a calorie-conscious choice that helps you manage your deficit target.`;
      if (isHighFiber) {
        recommendation = "Excellent Choice";
        advice += " Its high fiber content supports digestive satiety.";
        healthScore = Math.min(100, healthScore + 15);
      }
    }
  } else if (lowerGoal.includes("gain") || lowerGoal.includes("surplus") || lowerGoal.includes("bulk")) {
    if (isHighProtein) {
      recommendation = "Excellent Choice";
      advice = `Based on your muscle gain goal, this is an excellent choice as it provides a solid amount of protein (${macros.protein}g) to support lean muscle building.`;
      healthScore = Math.min(100, healthScore + 20);
    } else if (isHighCalorie) {
      recommendation = "Good Choice";
      advice = `Based on your muscle gain goal, this meal provides clean calorie density to help you hit your daily caloric surplus target.`;
      healthScore = Math.min(100, healthScore + 10);
    } else {
      recommendation = "Occasional Choice";
      advice = `Based on your muscle gain goal, this choice is low in calories and protein, making it less optimal for hitting your daily metabolic targets.`;
      healthScore = Math.max(50, healthScore - 5);
    }
  } else {
    // Maintain weight
    advice = `Based on your weight maintenance goal, this is a balanced meal option to sustain your daily activity energy requirements.`;
    if (isHighProtein) {
      recommendation = "Good Choice";
      healthScore = Math.min(100, healthScore + 10);
    }
  }

  return {
    healthScore,
    recommendation,
    personalizedRecommendation: advice
  };
}

export async function analyzeFoodAI(
  input: { foodName?: string; base64Image?: string; mimeType?: string },
  profile: IUserProfile
): Promise<IFoodAnalysis> {
  const isImage = !!input.base64Image;
  const apiKey = process.env.GEMINI_API_KEY;

  // Exact local database match logic
  if (!isImage && input.foodName) {
    const localMatch = findLocalFoodAnalysis(input.foodName);
    if (localMatch) {
      console.log(`Local match found for: ${input.foodName}. Using exact database values.`);
      const localAdvice = generateLocalPersonalizedRecommendation(
        localMatch.foodName,
        {
          calories: localMatch.calories,
          protein: localMatch.protein,
          carbs: localMatch.carbs,
          fats: localMatch.fats,
          fiber: localMatch.fiber
        },
        profile
      );

      // If online, use Gemini to refine the advice using the exact local numbers.
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `
            You are an expert nutritionist and clinical AI food advisor.
            The user wants to analyze the food "${localMatch.foodName}".
            We have confirmed the exact nutritional values for a serving size of "${localMatch.servingSize}":
            - Calories: ${localMatch.calories} kcal
            - Protein: ${localMatch.protein}g
            - Carbohydrates: ${localMatch.carbs}g
            - Fats: ${localMatch.fats}g
            - Fiber: ${localMatch.fiber}g

            User Profile Context:
            - Age: ${profile.age} years
            - Gender: ${profile.gender}
            - Weight: ${profile.weight} kg
            - Height: ${profile.height} cm
            - Goal: ${profile.goal}
            - Activity level: ${profile.activityLevel}
            - Diet preference: ${profile.dietType || "Any"}

            Provide a customized, encouraging, personalized recommendation explaining WHY this food fits their profile based on these numbers (1-2 sentences). 
            Also assign a Health Score (0-100) and recommendation category strictly as one of: "Excellent Choice", "Good Choice", "Occasional Choice", "Avoid Frequently".

            You MUST respond with a JSON object matching this schema exactly:
            {
              "foodName": "${localMatch.foodName}",
              "servingSize": "${localMatch.servingSize}",
              "calories": ${localMatch.calories},
              "protein": ${localMatch.protein},
              "carbs": ${localMatch.carbs},
              "fats": ${localMatch.fats},
              "fiber": ${localMatch.fiber},
              "healthScore": number,
              "recommendation": "Excellent Choice" | "Good Choice" | "Occasional Choice" | "Avoid Frequently",
              "personalizedRecommendation": "Your custom advice sentence."
            }
          `;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });

          const jsonText = response.text || "";
          const cleanJsonText = jsonText.replace(/^\s*```json\s*/i, "").replace(/\s*```\s*$/, "");
          const apiResult = JSON.parse(cleanJsonText);

          return {
            foodName: apiResult.foodName,
            servingSize: apiResult.servingSize,
            calories: Math.round(Number(apiResult.calories)),
            protein: Number(apiResult.protein),
            carbohydrates: Number(apiResult.carbs),
            fat: Number(apiResult.fats),
            fiber: Number(apiResult.fiber),
            healthScore: Math.round(Number(apiResult.healthScore)),
            recommendation: apiResult.recommendation,
            personalizedRecommendation: apiResult.personalizedRecommendation,
            confidenceScore: 100
          };
        } catch (apiErr) {
          console.error("Failed to query Gemini for local match personalization, falling back to local template:", apiErr);
        }
      }

      // Offline mode or API error fallback for exact match
      return {
        foodName: localMatch.foodName,
        servingSize: localMatch.servingSize,
        calories: localMatch.calories,
        protein: localMatch.protein,
        carbohydrates: localMatch.carbs,
        fat: localMatch.fats,
        fiber: localMatch.fiber,
        healthScore: localAdvice.healthScore,
        recommendation: localAdvice.recommendation,
        personalizedRecommendation: localAdvice.personalizedRecommendation,
        confidenceScore: 100
      };
    }
  }

  // Graceful offline fallback when API key is missing
  if (!apiKey) {
    console.log("No GEMINI_API_KEY. Using local/mock Food Analysis engine.");
    if (isImage) {
      // Offline visual mock
      const mockMacros = { calories: 380, protein: 18, carbs: 45, fats: 12, fiber: 5 };
      const localAdvice = generateLocalPersonalizedRecommendation("Healthy Balanced Plate", mockMacros, profile);
      return {
        foodName: "Balanced Plate (Detected Offline)",
        servingSize: "1 plate (approx. 300g)",
        calories: mockMacros.calories,
        protein: mockMacros.protein,
        carbohydrates: mockMacros.carbs,
        fat: mockMacros.fats,
        fiber: mockMacros.fiber,
        healthScore: localAdvice.healthScore,
        recommendation: localAdvice.recommendation,
        personalizedRecommendation: `${localAdvice.personalizedRecommendation} [Offline mode mock image detection]`,
        confidenceScore: 85
      };
    } else {
      // Offline text match not matched in dictionary
      const mockMacros = { calories: 200, protein: 6, carbs: 30, fats: 5, fiber: 2.5 };
      const localAdvice = generateLocalPersonalizedRecommendation(input.foodName || "Custom Item", mockMacros, profile);
      return {
        foodName: input.foodName || "Custom Item",
        servingSize: "1 serving (approx. 100g)",
        calories: mockMacros.calories,
        protein: mockMacros.protein,
        carbohydrates: mockMacros.carbs,
        fat: mockMacros.fats,
        fiber: mockMacros.fiber,
        healthScore: localAdvice.healthScore,
        recommendation: localAdvice.recommendation,
        personalizedRecommendation: localAdvice.personalizedRecommendation,
        confidenceScore: 100
      };
    }
  }

  // Active Gemini flow
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are an expert nutritionist and clinical AI food analyzer.
      Analyze the food item ${isImage ? "visible in the provided image" : "with the name: '" + input.foodName + "'"}.

      User Profile Context:
      - Age: ${profile.age} years
      - Biological Gender: ${profile.gender}
      - Weight: ${profile.weight} kg
      - Height: ${profile.height} cm
      - Goal: ${profile.goal}
      - Activity Level: ${profile.activityLevel}
      - Diet Preference: ${profile.dietType || "Any"}

      Tasks:
      1. Identify the food item ${isImage ? "from the image" : ""}.
      2. Estimate a standard serving size for this item (e.g. "1 medium plate", "100g", "1 medium piece").
      3. Estimate the nutritional values for this estimated serving size:
         - Calories (kcal, integer)
         - Protein (g, number)
         - Carbohydrates (g, number)
         - Fat (g, number)
         - Fiber (g, number)
      4. Calculate a Health Score (0 to 100) reflecting its nutritional density, glycemic load, and balance relative to general metabolic health.
      5. Determine the recommendation category strictly as one of:
         - "Excellent Choice"
         - "Good Choice"
         - "Occasional Choice"
         - "Avoid Frequently"
      6. Provide a personalized recommendation rationale explaining WHY this food fits their specific profile goal (e.g., weight loss, muscle gain). Tailor the tone to their goal and activity level.
      7. ${isImage ? "Determine your confidence score as an integer percentage (e.g., 85) for identifying this food item correctly." : "For text queries, output a default confidence score of 100."}

      You MUST respond with a JSON object matching this schema exactly:
      {
        "foodName": "Name of the food identified",
        "servingSize": "Estimated serving size (e.g. 1 plate, 150g)",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number,
        "fiber": number,
        "healthScore": number,
        "recommendation": "Excellent Choice" | "Good Choice" | "Occasional Choice" | "Avoid Frequently",
        "personalizedRecommendation": "Your custom advice sentence.",
        "confidenceScore": number
      }
    `;

    const contents: any[] = [];
    if (isImage && input.base64Image && input.mimeType) {
      contents.push({
        inlineData: {
          data: input.base64Image,
          mimeType: input.mimeType
        }
      });
    }
    contents.push(prompt);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text || "";
    const cleanJsonText = jsonText.replace(/^\s*```json\s*/i, "").replace(/\s*```\s*$/, "");
    const result = JSON.parse(cleanJsonText);

    // Map properties from JSON output structure to our component types
    return {
      foodName: result.foodName,
      servingSize: result.servingSize,
      calories: Math.round(Number(result.calories)),
      protein: Number(result.protein),
      carbohydrates: Number(result.carbs),
      fat: Number(result.fats),
      fiber: Number(result.fiber),
      healthScore: Math.round(Number(result.healthScore)),
      recommendation: result.recommendation,
      personalizedRecommendation: result.personalizedRecommendation,
      confidenceScore: result.confidenceScore ? Math.round(Number(result.confidenceScore)) : (isImage ? 85 : 100)
    };
  } catch (err) {
    console.error("Failed to query Gemini for food analysis:", err);
    // Dynamic local fallback on error
    const fallbackMacros = { calories: 300, protein: 12, carbs: 40, fats: 10, fiber: 3.5 };
    const localAdvice = generateLocalPersonalizedRecommendation(input.foodName || "Custom Food Item", fallbackMacros, profile);
    return {
      foodName: input.foodName || "Custom Food Item (Fallback)",
      servingSize: "1 serving (approx. 200g)",
      calories: fallbackMacros.calories,
      protein: fallbackMacros.protein,
      carbohydrates: fallbackMacros.carbs,
      fat: fallbackMacros.fats,
      fiber: fallbackMacros.fiber,
      healthScore: localAdvice.healthScore,
      recommendation: localAdvice.recommendation,
      personalizedRecommendation: `We encountered an error connecting to our AI server, but here is a standard projection: ${localAdvice.personalizedRecommendation}`,
      confidenceScore: 70
    };
  }
}

