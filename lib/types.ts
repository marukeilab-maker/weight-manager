export interface Profile {
  height: number; // cm
  goalWeight: number; // kg
  goalDate: string; // YYYY-MM-DD
  notificationTime: string; // HH:MM
  targetCalories: number;
  birthdate?: string; // YYYY-MM-DD
  gender?: "male" | "female";
}

export interface WeightRecord {
  date: string; // YYYY-MM-DD
  weight: number; // kg
  bmi: number;
}

export interface MealRecord {
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
}

export interface ExerciseEntry {
  type: string;
  minutes: number;
  calories: number;
  met: number;
}

export interface ExerciseRecord {
  date: string;
  entries: ExerciseEntry[];
}
