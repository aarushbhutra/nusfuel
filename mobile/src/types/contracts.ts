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

export type MacroTargets = {
  totalFatG?: number;
  carbohydrateG?: number;
  sugarG?: number;
};

export type Goal = {
  mode: "preset" | "custom";
  preset?: "cutting" | "maintenance" | "gaining";
  caloriesKcal: number;
  proteinG: number;
  moreOptions?: MacroTargets;
};

export type MealLog = {
  id: string;
  menuItemId: string;
  loggedAt: string;
  servingQuantity: number;
  nutritionTotal: Nutrition;
};

export type Recommendation = {
  rank: number;
  menuItemId: string;
  fitReason: string;
  nutritionImpact: Nutrition;
  allergenWarnings: string[];
};
