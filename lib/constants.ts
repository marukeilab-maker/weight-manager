export const ACTIVITY_LEVELS = [
  { key: "low",      label: "ほぼ運動なし", desc: "デスクワーク中心", factor: 1.2   },
  { key: "light",    label: "軽い運動",     desc: "週1〜2回",        factor: 1.375 },
  { key: "moderate", label: "中程度",       desc: "週3〜5回",        factor: 1.55  },
  { key: "high",     label: "ハード",       desc: "週6〜7回",        factor: 1.725 },
] as const;

export type ActivityLevelKey = typeof ACTIVITY_LEVELS[number]["key"];

export const BACKUP_KEYS = [
  "wm_profile",
  "wm_records",
  "wm_meals",
  "wm_exercises",
  "wm_meal_dishes",
  "wm_custom_food_history",
  "wm_show_meal_exercise",
  "wm_activity_level",
] as const;
