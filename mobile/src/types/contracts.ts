export type Nutrition = {
  energyKcal: number;
  proteinG: number;
  totalFatG: number;
  carbohydrateG: number;
  sugarG: number;
};

export type Serving = {
  quantity: number;
  unit: string;
};

export type Allergens = {
  contains: string[];
  mayContain: string[];
  unknown: string[];
  incomplete: boolean;
};

export type Source = {
  name: string;
  url?: string;
  lastVerified: string;
  confidence: string;
};

export type MenuItem = {
  id: string;
  stall: string;
  name: string;
  serving: Serving;
  nutrition: Nutrition;
  allergens: Allergens;
  source: Source;
};

export type NaturalLanguageSearchResponse = {
  items: MenuItem[];
  usedFallback: boolean;
};

export type MacroTargets = {
  totalFatG?: number;
  carbohydrateG?: number;
  sugarG?: number;
};

export type UserProfile = {
  age: number;
  weightKg: number;
  gender: "female" | "male" | "other";
};

export type Goal = {
  mode: "preset" | "custom";
  preset?: "cutting" | "maintenance" | "gaining";
  caloriesKcal: number;
  proteinG: number;
  moreOptions?: MacroTargets;
  profile?: UserProfile;
};

export type MealLog = {
  id: string;
  menuItemId: string;
  loggedAt: string;
  servingQuantity: number;
  nutritionTotal: Nutrition;
};

export type ProgressNutrition = {
  energyKcal: number;
  proteinG: number;
  totalFatG?: number;
  carbohydrateG?: number;
  sugarG?: number;
};

export type Progress = {
  period: "daily" | "weekly";
  startDate: string;
  endDate: string;
  goal: Goal;
  consumed: ProgressNutrition;
  remaining: ProgressNutrition;
};

export type Recommendation = {
  rank: number;
  menuItemId: string;
  fitReason: string;
  nutritionImpact: Nutrition;
  allergenWarnings: string[];
};
