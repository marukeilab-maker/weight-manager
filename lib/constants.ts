// 活動レベル（日常生活の活動量＝運動を除く）。運動した分は別途記録から加算するため、
// ここには「運動以外の普段の活動量」を表す係数を持たせる。
export const ACTIVITY_LEVELS = [
  { key: "low",      label: "座り仕事中心", desc: "ほぼ座っている",       factor: 1.2   },
  { key: "light",    label: "ときどき動く", desc: "軽い家事・買い物程度", factor: 1.375 },
  { key: "moderate", label: "よく動く",     desc: "立ち仕事・歩くことが多い", factor: 1.55  },
  { key: "high",     label: "とても活発",   desc: "肉体労働・一日中動く", factor: 1.725 },
] as const;

export type ActivityLevelKey = typeof ACTIVITY_LEVELS[number]["key"];

/** 活動レベルのキー（localStorageの生文字列）から活動係数を返す。未設定・不正値は 1.2（ほぼ運動なし） */
export function getActivityFactor(key: string | null | undefined): number {
  return ACTIVITY_LEVELS.find((a) => a.key === key)?.factor ?? 1.2;
}

/**
 * ダイエットの1日の目標不足カロリー（kcal）。
 * 消費からこの分を引いた「目標ライン」を下回って初めて「ダイエットペース達成」とみなす。
 * 500kcal/日 ≒ 週0.5kgの健康的な減量ペース。
 */
export const DAILY_TARGET_DEFICIT = 500;

export const BACKUP_KEYS = [
  "wm_profile",
  "wm_records",
  "wm_meals",
  "wm_exercises",
  "wm_meal_dishes",
  "wm_custom_food_history",
  "wm_show_meal_exercise",
  "wm_activity_level",
  "wm_maintenance",
  "wm_goal_celebrated",
] as const;
