import { Profile, WeightRecord, MealRecord, ExerciseRecord } from "./types";

const KEYS = {
  profile: "wm_profile",
  records: "wm_records",
  meals: "wm_meals",
  exercises: "wm_exercises",
};

function load<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getProfile(): Profile | null {
  return load<Profile>(KEYS.profile);
}

export function saveProfile(profile: Profile): void {
  save(KEYS.profile, profile);
}

export function getWeightRecords(): WeightRecord[] {
  return load<WeightRecord[]>(KEYS.records) ?? [];
}

export function deleteWeightRecord(date: string): void {
  const records = getWeightRecords().filter((r) => r.date !== date);
  save(KEYS.records, records);
}

export function saveWeightRecord(record: WeightRecord): void {
  const records = getWeightRecords();
  const idx = records.findIndex((r) => r.date === record.date);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  records.sort((a, b) => a.date.localeCompare(b.date));
  save(KEYS.records, records);
}

export function getMealRecord(date: string): MealRecord {
  const all = load<MealRecord[]>(KEYS.meals) ?? [];
  return all.find((r) => r.date === date) ?? { date, breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
}

export function saveMealRecord(record: MealRecord): void {
  const all = load<MealRecord[]>(KEYS.meals) ?? [];
  const idx = all.findIndex((r) => r.date === record.date);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  save(KEYS.meals, all);
}

export function getExerciseRecord(date: string): ExerciseRecord {
  const all = load<ExerciseRecord[]>(KEYS.exercises) ?? [];
  return all.find((r) => r.date === date) ?? { date, entries: [] };
}

export function saveExerciseRecord(record: ExerciseRecord): void {
  const all = load<ExerciseRecord[]>(KEYS.exercises) ?? [];
  const idx = all.findIndex((r) => r.date === record.date);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  save(KEYS.exercises, all);
}

export function getAllMeals(): MealRecord[] {
  return load<MealRecord[]>(KEYS.meals) ?? [];
}

export function getAllExercises(): ExerciseRecord[] {
  return load<ExerciseRecord[]>(KEYS.exercises) ?? [];
}
