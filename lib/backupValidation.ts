// バックアップJSONのスキーマ検証
// 壊れたファイルや別アプリのJSONを取り込むと画面がNaNになるため、
// インポート前に主要キーの形式をチェックし、不正なら理由付きで弾く。

import { BACKUP_KEYS } from "./constants";

type Result = { ok: true } | { ok: false; reason: string };

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isDateStr = (v: unknown): v is string => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function validRecords(v: unknown): boolean {
  return Array.isArray(v) && v.every((r) => isObj(r) && isDateStr(r.date) && isNum(r.weight));
}

function validMeals(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.every(
      (m) =>
        isObj(m) &&
        isDateStr(m.date) &&
        isNum(m.breakfast) && isNum(m.lunch) && isNum(m.dinner) && isNum(m.snack)
    )
  );
}

function validExercises(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.every(
      (e) =>
        isObj(e) &&
        isDateStr(e.date) &&
        Array.isArray(e.entries) &&
        (e.entries as unknown[]).every(
          (en) => isObj(en) && isStr(en.type) && isNum(en.minutes) && isNum(en.calories)
        )
    )
  );
}

function validDishes(v: unknown): boolean {
  // { "YYYY-MM-DD": { breakfast: [{name, kcal}], ... } }
  if (!isObj(v)) return false;
  return Object.values(v).every(
    (slots) =>
      isObj(slots) &&
      Object.values(slots).every(
        (dishes) =>
          Array.isArray(dishes) &&
          dishes.every((d) => isObj(d) && isStr(d.name) && isNum(d.kcal))
      )
  );
}

function validFoodHistory(v: unknown): boolean {
  return Array.isArray(v) && v.every((d) => isObj(d) && isStr(d.name) && isNum(d.kcal));
}

function validProfile(v: unknown): boolean {
  return isObj(v) && isNum(v.height) && isNum(v.goalWeight);
}

function validMaintenance(v: unknown): boolean {
  return isObj(v) && isDateStr(v.startDate) && isNum(v.baseWeight);
}

const VALIDATORS: Record<string, { check: (v: unknown) => boolean; label: string }> = {
  wm_profile: { check: validProfile, label: "プロフィール" },
  wm_records: { check: validRecords, label: "体重記録" },
  wm_meals: { check: validMeals, label: "食事記録" },
  wm_exercises: { check: validExercises, label: "運動記録" },
  wm_meal_dishes: { check: validDishes, label: "料理の詳細" },
  wm_custom_food_history: { check: validFoodHistory, label: "よく使う料理" },
  wm_maintenance: { check: validMaintenance, label: "維持モード" },
};

/**
 * バックアップJSONを検証する。
 * - こたろうダイエットのキーが1つも無い → 別アプリのファイルとして弾く
 * - 存在するキーの形式が不正 → どのデータが壊れているかを理由に弾く
 */
export function validateBackup(data: unknown): Result {
  if (!isObj(data)) {
    return { ok: false, reason: "バックアップファイルの形式が正しくありません" };
  }
  const knownKeys = BACKUP_KEYS.filter((k) => data[k] !== undefined);
  if (knownKeys.length === 0) {
    return { ok: false, reason: "こたろうダイエットのバックアップファイルではないようです" };
  }
  for (const key of knownKeys) {
    const validator = VALIDATORS[key];
    if (validator && !validator.check(data[key])) {
      return { ok: false, reason: `「${validator.label}」のデータ形式が壊れています` };
    }
  }
  return { ok: true };
}
