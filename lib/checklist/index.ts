// ============================================================
// CHECKLIST DEFINITIONS
// Complete checklist structure for all 3 categories.
// This is pure data — no side effects, no API calls.
// ============================================================

export type ChecklistFieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "number"
  | "color";

export interface ChecklistField {
  id: string;
  label: string;
  type: ChecklistFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  default?: string | number | string[];
  hint?: string;
}

export interface ChecklistCategory {
  id: string;
  label: string;
  fields: ChecklistField[];
}

export interface ChecklistDefinition {
  category: "game" | "mobile" | "web";
  sections: ChecklistCategory[];
}

// ============================================================
// GAME UI CHECKLIST
// ============================================================
export const gameChecklist: ChecklistDefinition = {
  category: "game",
  sections: [
    {
      id: "product",
      label: "Product Overview",
      fields: [
        {
          id: "product_name",
          label: "Game Name",
          type: "text",
          required: true,
          placeholder: "e.g. MonsterWar",
          hint: "The name of your game",
        },
        {
          id: "product_description",
          label: "Game Description",
          type: "textarea",
          required: true,
          placeholder: "Describe your game in 2-3 sentences",
          hint: "What is the game about? What makes it unique?",
        },
        {
          id: "genre_or_category",
          label: "Game Genre",
          type: "select",
          required: true,
          options: [
            "Action / Shooter",
            "RPG / Adventure",
            "Strategy",
            "Puzzle",
            "Simulation",
            "Sports",
            "Horror",
            "Platformer",
            "Other",
          ],
        },
        {
          id: "platform",
          label: "Platform",
          type: "multiselect",
          required: true,
          options: ["Mobile (iOS/Android)", "PC", "Console", "Web"],
        },
        {
          id: "target_audience",
          label: "Target Audience",
          type: "text",
          required: false,
          placeholder: "e.g. Casual gamers aged 18-35",
        },
      ],
    },
    {
      id: "visual",
      label: "Visual Style",
      fields: [
        {
          id: "visual_style",
          label: "Art Style",
          type: "select",
          required: true,
          options: [
            "Dark / Gritty",
            "Bright / Colorful",
            "Minimalist",
            "Fantasy / Medieval",
            "Sci-Fi / Futuristic",
            "Cartoon / Anime",
            "Realistic",
            "Pixel Art",
            "Other",
          ],
        },
        {
          id: "color_preferences",
          label: "Color Preferences",
          type: "text",
          required: false,
          placeholder: "e.g. Dark blues and purples with gold accents",
        },
    {
          id: "typography_preferences",
          label: "Typography Style",
          type: "select",
          required: false,
          options: [
            "Bold / Heavy",
            "Elegant / Serif",
            "Modern / Sans-serif",
            "Fantasy / Decorative",
            "Futuristic",
            "No preference",
          ],
        },
        {
          id: "orientation",
          label: "Screen Orientation",
          type: "select",
          required: true,
          options: ["Portrait", "Landscape"],
          default: "Portrait",
          hint: "Portrait for mobile games, Landscape for tablet/PC games",
        },
        {
          id: "screen_resolution",
          label: "Screen Resolution",
          type: "select",
          required: false,
          options: [
            "390×844 — iPhone Standard (default)",
            "430×932 — iPhone Pro Max",
            "360×800 — Android Standard",
            "768×1024 — Tablet Portrait",
            "1024×768 — Tablet Landscape",
            "Custom",
          ],
          default: "390×844 — iPhone Standard (default)",
          hint: "Resolution for your game screens. Leave default for standard mobile.",
        },
        {
          id: "custom_resolution",
          label: "Custom Resolution (if Custom selected)",
          type: "text",
          required: false,
          placeholder: "e.g. 1080×1920",
          hint: "Enter width×height in pixels",
        },
      ],
    },
    {
      id: "gameplay",
      label: "Gameplay & Monetization",
      fields: [
        {
          id: "currencies",
          label: "In-Game Currencies",
          type: "multiselect",
          required: false,
          options: [
            "Coins (soft currency)",
            "Gems (hard currency)",
            "Energy / Lives",
            "Keys",
            "Tickets",
            "Tokens",
            "Stars",
            "None",
          ],
          hint: "Select all currencies shown in your HUD. This directly affects how the HUD is generated.",
          default: ["Coins (soft currency)", "Gems (hard currency)"],
        },
        {
          id: "monetization",
          label: "Monetization Features",
          type: "multiselect",
          required: false,
          options: [
            "Battle Pass",
            "IAP Shop (in-app purchases)",
            "Rewarded Ads",
            "Subscription",
            "None",
          ],
          hint: "Select all that apply. Affects shop screen layout and HUD elements.",
        },
        {
          id: "game_systems",
          label: "Game Systems",
          type: "multiselect",
          required: false,
          options: [
            "Lives / Energy System",
            "PvP / Multiplayer",
            "Quest / Mission System",
            "Inventory / Equipment",
            "Crafting",
            "Clan / Guild",
            "Seasonal Events",
            "None",
          ],
          hint: "Select all systems your game has. Affects nav tabs and screen layouts.",
        },
        {
          id: "has_main_character",
          label: "Main Character on Home Screen",
          type: "select",
          required: false,
          options: ["Yes — show character on main menu", "No — no character illustration"],
          default: "Yes — show character on main menu",
          hint: "Whether the main menu features a character illustration.",
        },
      ],
    },
    {
      id: "screens",
      label: "Screens",
      fields: [
        {
          id: "key_screens",
          label: "Key Screens to Generate",
          type: "multiselect",
          required: true,
          options: [
            "Main Menu",
            "HUD / In-Game UI",
            "Pause Menu",
            "Inventory Screen",
            "Character / Stats Screen",
            "Shop / Store",
            "Battle Pass Screen",
            "Upgrade Tree",
            "Leaderboard",
            "Achievement Screen",
            "Settings",
            "Loading Screen",
            "Game Over / Victory Screen",
            "Map Screen",
            "Quest / Mission Log",
            "Clan / Guild Screen",
            "Daily Rewards Screen",
          ],
          default: [
            "Main Menu",
            "HUD / In-Game UI",
            "Pause Menu",
            "Inventory Screen",
            "Shop / Store",
          ],
        },
      ],
    },
    {
      id: "extra",
      label: "Additional Details",
      fields: [
        {
          id: "special_requirements",
          label: "Special Requirements",
          type: "textarea",
          required: false,
          placeholder: "Any specific UI requirements, inspirations, or constraints",
        },
      ],
    },
  ],
};

// ============================================================
// MOBILE UI CHECKLIST
// ============================================================
export const mobileChecklist: ChecklistDefinition = {
  category: "mobile",
  sections: [
    {
      id: "product",
      label: "Product Overview",
      fields: [
        {
          id: "product_name",
          label: "App Name",
          type: "text",
          required: true,
          placeholder: "e.g. FitTrack",
        },
        {
          id: "product_description",
          label: "App Description",
          type: "textarea",
          required: true,
          placeholder: "Describe your app in 2-3 sentences",
        },
        {
          id: "genre_or_category",
          label: "App Category",
          type: "select",
          required: true,
          options: [
            "Social / Community",
            "Health / Fitness",
            "Finance / Banking",
            "E-commerce / Shopping",
            "Food / Delivery",
            "Travel / Navigation",
            "Education / Learning",
            "Productivity / Tools",
            "Entertainment / Media",
            "Other",
          ],
        },
        {
          id: "platform",
          label: "Platform",
          type: "multiselect",
          required: true,
          options: ["iOS", "Android", "Both"],
        },
        {
          id: "target_audience",
          label: "Target Audience",
          type: "text",
          required: false,
          placeholder: "e.g. Young professionals aged 25-40",
        },
      ],
    },
    {
      id: "visual",
      label: "Visual Style",
      fields: [
        {
          id: "visual_style",
          label: "Design Style",
          type: "select",
          required: true,
          options: [
            "Clean / Minimal",
            "Bold / Vibrant",
            "Dark Mode",
            "Light / Airy",
            "Glassmorphism",
            "Material Design",
            "iOS Native",
            "Other",
          ],
        },
        {
          id: "color_preferences",
          label: "Color Preferences",
          type: "text",
          required: false,
          placeholder: "e.g. Green and white with subtle gradients",
        },
        {
          id: "typography_preferences",
          label: "Typography Style",
          type: "select",
          required: false,
          options: [
            "Modern / Sans-serif",
            "Friendly / Rounded",
            "Professional / Serif",
            "Bold / Heavy",
            "No preference",
          ],
        },
        {
          id: "screen_resolution",
          label: "Screen Resolution",
          type: "select",
          required: false,
          options: [
            "390×844 — iPhone Standard (default)",
            "430×932 — iPhone Pro Max",
            "360×800 — Android Standard",
            "768×1024 — Tablet Portrait",
            "Custom",
          ],
          default: "390×844 — iPhone Standard (default)",
          hint: "Resolution for your app screens.",
        },
        {
          id: "custom_resolution",
          label: "Custom Resolution (if Custom selected)",
          type: "text",
          required: false,
          placeholder: "e.g. 414×896",
          hint: "Enter width×height in pixels",
        },
        {
          id: "nav_pattern",
          label: "Navigation Pattern",
          type: "select",
          required: false,
          options: [
            "Bottom Tab Bar",
            "Side Drawer",
            "Top Tabs",
            "Minimal / No Nav",
          ],
          default: "Bottom Tab Bar",
          hint: "How users navigate between main sections of your app.",
        },
        {
          id: "color_scheme",
          label: "Color Scheme",
          type: "select",
          required: false,
          options: ["Light Mode", "Dark Mode", "System Default"],
          default: "Light Mode",
        },
      ],
    },
    {
      id: "screens",
      label: "Screens",
      fields: [
        {
          id: "key_screens",
          label: "Key Screens to Generate",
          type: "multiselect",
          required: true,
          options: [
            "Splash / Loading",
            "Onboarding",
            "Sign In / Sign Up",
            "Home / Feed",
            "Search / Discover",
            "Profile",
            "Settings",
            "Notifications",
            "Detail / Item View",
            "Checkout / Payment",
            "Map / Location",
            "Chat / Messages",
            "Dashboard / Stats",
            "Empty State",
          ],
          default: [
            "Onboarding",
            "Sign In / Sign Up",
            "Home / Feed",
            "Profile",
            "Settings",
          ],
        },
      ],
    },
    {
      id: "extra",
      label: "Additional Details",
      fields: [
        {
          id: "special_requirements",
          label: "Special Requirements",
          type: "textarea",
          required: false,
          placeholder: "Any specific UI requirements, inspirations, or constraints",
        },
      ],
    },
  ],
};

// ============================================================
// WEB / SAAS UI CHECKLIST
// ============================================================
export const webChecklist: ChecklistDefinition = {
  category: "web",
  sections: [
    {
      id: "product",
      label: "Product Overview",
      fields: [
        {
          id: "product_name",
          label: "Product Name",
          type: "text",
          required: true,
          placeholder: "e.g. DataFlow",
        },
        {
          id: "product_description",
          label: "Product Description",
          type: "textarea",
          required: true,
          placeholder: "Describe your product in 2-3 sentences",
        },
        {
          id: "genre_or_category",
          label: "Product Type",
          type: "select",
          required: true,
          options: [
            "SaaS / Web App",
            "Admin Panel / Dashboard",
            "E-commerce",
            "Marketing / Landing",
            "Analytics / Reporting",
            "CRM / Sales",
            "Project Management",
            "Developer Tool",
            "Other",
          ],
        },
        {
          id: "target_audience",
          label: "Target Audience",
          type: "text",
          required: false,
          placeholder: "e.g. Small business owners and their teams",
        },
      ],
    },
    {
      id: "visual",
      label: "Visual Style",
      fields: [
        {
          id: "visual_style",
          label: "Design Style",
          type: "select",
          required: true,
          options: [
            "Clean / Minimal",
            "Dark Mode",
            "Light / Professional",
            "Bold / Modern",
            "Data-Heavy / Dense",
            "Glassmorphism",
            "Other",
          ],
        },
        {
          id: "color_preferences",
          label: "Color Preferences",
          type: "text",
          required: false,
          placeholder: "e.g. Blue and white with dark sidebar",
        },
        {
          id: "typography_preferences",
          label: "Typography Style",
          type: "select",
          required: false,
          options: [
            "Modern / Sans-serif",
            "Professional / Serif",
            "Monospace / Technical",
            "Bold / Heavy",
            "No preference",
          ],
        },
        {
          id: "screen_resolution",
          label: "Screen Resolution",
          type: "select",
          required: false,
          options: [
            "1440×900 — Standard Desktop (default)",
            "1920×1080 — Full HD",
            "1280×800 — Small Desktop",
            "2560×1440 — 2K",
            "Custom",
          ],
          default: "1440×900 — Standard Desktop (default)",
          hint: "Resolution for your web screens.",
        },
        {
          id: "custom_resolution",
          label: "Custom Resolution (if Custom selected)",
          type: "text",
          required: false,
          placeholder: "e.g. 1600×1000",
          hint: "Enter width×height in pixels",
        },
        {
          id: "has_sidebar",
          label: "Sidebar Layout",
          type: "select",
          required: false,
          options: [
            "Left Sidebar",
            "Right Sidebar",
            "No Sidebar",
          ],
          default: "Left Sidebar",
          hint: "Most dashboards and SaaS apps use a left sidebar for navigation.",
        },
        {
          id: "data_density",
          label: "Data Density",
          type: "select",
          required: false,
          options: [
            "Minimal / Spacious",
            "Balanced",
            "Data-Heavy / Dense",
          ],
          default: "Balanced",
          hint: "How much information is shown on screen at once.",
        },
      ],
    },
    {
      id: "screens",
      label: "Screens",
      fields: [
        {
          id: "key_screens",
          label: "Key Screens to Generate",
          type: "multiselect",
          required: true,
          options: [
            "Landing / Marketing Page",
            "Sign In / Sign Up",
            "Dashboard / Overview",
            "Data Table / List View",
            "Detail / Item View",
            "Settings / Preferences",
            "Profile / Account",
            "Billing / Subscription",
            "Reports / Analytics",
            "Admin Panel",
            "Onboarding / Setup",
            "Empty State",
            "Error / 404 Page",
            "Notifications",
          ],
          default: [
            "Sign In / Sign Up",
            "Dashboard / Overview",
            "Data Table / List View",
            "Settings / Preferences",
            "Profile / Account",
          ],
        },
      ],
    },
    {
      id: "extra",
      label: "Additional Details",
      fields: [
        {
          id: "special_requirements",
          label: "Special Requirements",
          type: "textarea",
          required: false,
          placeholder: "Any specific UI requirements, inspirations, or constraints",
        },
      ],
    },
  ],
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Get checklist definition for a category.
 */
export function getChecklist(
  category: "game" | "mobile" | "web"
): ChecklistDefinition {
  const map = {
    game: gameChecklist,
    mobile: mobileChecklist,
    web: webChecklist,
  };
  return map[category];
}

/**
 * Get all field IDs for a category.
 */
export function getAllFieldIds(category: "game" | "mobile" | "web"): string[] {
  const checklist = getChecklist(category);
  return checklist.sections.flatMap((s) => s.fields.map((f) => f.id));
}

/**
 * Get required field IDs for a category.
 */
export function getRequiredFieldIds(
  category: "game" | "mobile" | "web"
): string[] {
  const checklist = getChecklist(category);
  return checklist.sections
    .flatMap((s) => s.fields)
    .filter((f) => f.required)
    .map((f) => f.id);
}