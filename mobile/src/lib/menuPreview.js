export const PREVIEW_MENU = Object.freeze([
  {
    id: "techno-edge-western-001",
    stall: "Techno Edge 1 Western",
    name: "Black Pepper Chicken Chop",
    serving: { quantity: 1, unit: "serving" },
    nutrition: {
      energyKcal: 775,
      proteinG: 42.4,
      totalFatG: 51.7,
      carbohydrateG: 31.6,
      sugarG: 6.9,
    },
    allergens: { contains: ["Cereals containing gluten"], mayContain: [], unknown: [], incomplete: false },
    source: {
      name: "Western-TE-1.pdf",
      url: "https://uci.nus.edu.sg/wp-content/uploads/2024/03/Western-TE-1.pdf",
      lastVerified: "2026-07-12",
      confidence: "official_nus_pdf",
    },
  },
  {
    id: "techno-edge-western-003",
    stall: "Techno Edge 1 Western",
    name: "Grilled Dory Fish",
    serving: { quantity: 1, unit: "serving" },
    nutrition: {
      energyKcal: 530,
      proteinG: 45.1,
      totalFatG: 21.3,
      carbohydrateG: 37.2,
      sugarG: 8.2,
    },
    allergens: { contains: ["Cereals containing gluten"], mayContain: [], unknown: [], incomplete: false },
    source: {
      name: "Western-TE-1.pdf",
      url: "https://uci.nus.edu.sg/wp-content/uploads/2024/03/Western-TE-1.pdf",
      lastVerified: "2026-07-12",
      confidence: "official_nus_pdf",
    },
  },
  {
    id: "techno-edge-western-043",
    stall: "Techno Edge 1 Western",
    name: "Baked Beans, Mashed Potato & Sausage",
    serving: { quantity: 1, unit: "serving" },
    nutrition: {
      energyKcal: 447,
      proteinG: 18.6,
      totalFatG: 24.6,
      carbohydrateG: 35.6,
      sugarG: 6,
    },
    allergens: { contains: [], mayContain: [], unknown: ["not provided"], incomplete: true },
    source: {
      name: "Western-TE-1.pdf",
      url: "https://uci.nus.edu.sg/wp-content/uploads/2024/03/Western-TE-1.pdf",
      lastVerified: "2026-07-12",
      confidence: "official_nus_pdf",
    },
  },
]);

export const PREVIEW_RECOMMENDATIONS = Object.freeze([
  {
    rank: 1,
    menuItemId: PREVIEW_MENU[1].id,
    fitReason: "Protein-forward fit for your remaining daily target.",
    nutritionImpact: PREVIEW_MENU[1].nutrition,
    allergenWarnings: [],
  },
  {
    rank: 2,
    menuItemId: PREVIEW_MENU[0].id,
    fitReason: "Balanced energy and protein for your next meal.",
    nutritionImpact: PREVIEW_MENU[0].nutrition,
    allergenWarnings: [],
  },
  {
    rank: 3,
    menuItemId: PREVIEW_MENU[2].id,
    fitReason: "A close energy fit, with an allergen check needed.",
    nutritionImpact: PREVIEW_MENU[2].nutrition,
    allergenWarnings: ["Allergen data incomplete: check with the stall before ordering."],
  },
]);
