export interface RecipeData {
  id: number;
  name: string;
  category: string;
  image: string;
  ingredients: string;
  instructions: string;
  pageNumber: number;
}

export interface TableOfContentsItem {
  name: string;
  pageNumber: number;
  image: string;
  category: string;
}

export interface TableOfContentsData {
  left: {
    breakfast: TableOfContentsItem[];
    sides: TableOfContentsItem[];
    lunch: TableOfContentsItem[];
  };
  right: {
    mainDishes: TableOfContentsItem[];
    desserts: TableOfContentsItem[];
  };
}

// Sample recipes for the book preview
export const sampleRecipes: RecipeData[] = [
  {
    id: 1,
    name: "Oatmeal Granola Bowl",
    category: "Breakfast",
    image: "/images/BooksPrinted/recipe_modal_1.png",
    ingredients: "• 1 cup rolled oats\n• 1/2 cup granola\n• 1 banana, sliced\n• Fresh berries\n• Honey or maple syrup",
    instructions: "1. Cook oats according to package directions\n2. Top with granola and fresh fruit\n3. Drizzle with honey or maple syrup\n4. Serve warm or cold",
    pageNumber: 4,
  },
  {
    id: 2,
    name: "Avocado Toast with Egg",
    category: "Breakfast",
    image: "/images/BooksPrinted/recipe_modal_2.png",
    ingredients: "• 2 slices sourdough bread\n• 1 ripe avocado\n• 2 eggs\n• Salt and pepper\n• Red pepper flakes",
    instructions: "1. Toast bread until golden\n2. Mash avocado and spread on toast\n3. Fry eggs to desired doneness\n4. Top toast with eggs and seasonings",
    pageNumber: 6,
  },
  {
    id: 3,
    name: "Punjabi Samosa",
    category: "Sides",
    image: "/images/BooksPrinted/recipe_modal_3.png",
    ingredients: "• 2 cups all-purpose flour\n• 2 large potatoes, boiled\n• 1/2 cup peas\n• Spices: cumin, coriander, garam masala\n• Oil for frying",
    instructions: "1. Make dough with flour, salt, and water\n2. Prepare potato and pea filling with spices\n3. Fill and shape samosas\n4. Deep fry until golden brown",
    pageNumber: 10,
  },
  {
    id: 4,
    name: "Butter Chicken",
    category: "Main Dishes",
    image: "/images/BooksPrinted/recipe_modal_4.png",
    ingredients: "• 1.5 lbs chicken breast\n• 1 cup tomato puree\n• 1/2 cup heavy cream\n• Butter, garlic, ginger\n• Garam masala and fenugreek",
    instructions: "1. Marinate chicken in yogurt and spices\n2. Cook chicken until done\n3. Prepare tomato-based sauce\n4. Simmer chicken in sauce with cream",
    pageNumber: 20,
  },
  {
    id: 5,
    name: "Mango Lassi",
    category: "Desserts",
    image: "/images/BooksPrinted/recipe_modal_5.png",
    ingredients: "• 1 cup ripe mango, diced\n• 1 cup plain yogurt\n• 2 tbsp honey or sugar\n• Ice cubes\n• Cardamom (optional)",
    instructions: "1. Blend mango, yogurt, and sweetener\n2. Add ice cubes and blend until smooth\n3. Strain if desired\n4. Serve chilled, garnish with cardamom",
    pageNumber: 24,
  },
  {
    id: 6,
    name: "Kheer Rice Pudding",
    category: "Desserts",
    image: "/images/BooksPrinted/recipe_modal_6.png",
    ingredients: "• 1/2 cup basmati rice\n• 4 cups whole milk\n• 1/2 cup sugar\n• Cardamom pods\n• Nuts and raisins for garnish",
    instructions: "1. Rinse and soak rice\n2. Simmer rice in milk until tender\n3. Add sugar and cardamom\n4. Garnish with nuts and serve warm or cold",
    pageNumber: 22,
  },
];

// Table of contents data matching Mixbook design
export const tableOfContents: TableOfContentsData = {
  left: {
    breakfast: [
      { name: "oatmeal granola bowl", pageNumber: 4, image: "/images/BooksPrinted/recipe_thumb_1.jpg", category: "breakfast" },
      { name: "avocado toast with egg", pageNumber: 6, image: "/images/BooksPrinted/recipe_thumb_2.jpg", category: "breakfast" },
      { name: "chef's breakfast smoothie", pageNumber: 8, image: "/images/BooksPrinted/recipe_thumb_3.jpg", category: "breakfast" },
    ],
    sides: [
      { name: "punjabi samosa", pageNumber: 10, image: "/images/BooksPrinted/recipe_thumb_4.jpg", category: "sides" },
      { name: "naan's roti", pageNumber: 12, image: "/images/BooksPrinted/recipe_thumb_5.jpg", category: "sides" },
      { name: "pumpkin soup", pageNumber: 14, image: "/images/BooksPrinted/recipe_thumb_6.jpg", category: "sides" },
    ],
    lunch: [
      { name: "aloo paratha", pageNumber: 16, image: "/images/BooksPrinted/recipe_thumb_7.jpg", category: "lunch" },
      { name: "kabab rolls", pageNumber: 18, image: "/images/BooksPrinted/recipe_thumb_8.jpg", category: "lunch" },
      { name: "cocktail samosa", pageNumber: 20, image: "/images/BooksPrinted/recipe_thumb_9.jpg", category: "lunch" },
    ],
  },
  right: {
    mainDishes: [
      { name: "easy tandoori chicken", pageNumber: 16, image: "/images/BooksPrinted/recipe_modal_7.png", category: "main dishes" },
      { name: "chicken keema", pageNumber: 18, image: "/images/BooksPrinted/recipe_modal_8.png", category: "main dishes" },
      { name: "butter chicken", pageNumber: 20, image: "/images/BooksPrinted/recipe_modal_4.png", category: "main dishes" },
    ],
    desserts: [
      { name: "kheer rice pudding", pageNumber: 22, image: "/images/BooksPrinted/recipe_modal_6.png", category: "desserts" },
      { name: "mango lassi", pageNumber: 24, image: "/images/BooksPrinted/recipe_modal_5.png", category: "desserts" },
      { name: "jalebi", pageNumber: 26, image: "/images/BooksPrinted/recipe_modal_10.png", category: "desserts" },
    ],
  },
};

