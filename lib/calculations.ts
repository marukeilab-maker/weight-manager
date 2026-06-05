export function calcBMI(weight: number, height: number): number {
  const h = height / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function calcProgress(
  startWeight: number,
  currentWeight: number,
  goalWeight: number
): number {
  const total = startWeight - goalWeight;
  if (total <= 0) return 100;
  const done = startWeight - currentWeight;
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}

export function calcDailyPace(
  currentWeight: number,
  goalWeight: number,
  daysLeft: number
): number {
  if (daysLeft <= 0) return 0;
  return Math.round(((currentWeight - goalWeight) / daysLeft) * 1000) / 1000;
}

export const MET_VALUES: Record<string, number> = {
  ウォーキング: 3.5,
  速歩: 4.5,
  ランニング: 8.0,
  水泳: 8.0,
  サイクリング: 6.0,
  筋トレ: 4.0,
  ストレッチ: 2.5,
  その他: 3.0,
};

export function calcBurnedCalories(met: number, weightKg: number, minutes: number): number {
  return Math.round(met * weightKg * (minutes / 60));
}

export function calcAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// Mifflin-St Jeor式
export function calcBMR(weight: number, height: number, age: number, gender: "male" | "female"): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

// 体脂肪率の推定（Deurenberg式）
// 体脂肪率 = 1.20 × BMI + 0.23 × 年齢 − 10.8 × 性別(男1/女0) − 5.4
export function calcBodyFat(bmi: number, age: number, gender: "male" | "female"): number {
  const sex = gender === "male" ? 1 : 0;
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * sex - 5.4;
  return Math.round(Math.max(2, Math.min(60, bf)) * 10) / 10;
}

// 体脂肪率の判定区分（性別別）
export function bodyFatCategory(
  bf: number,
  gender: "male" | "female"
): { label: string; color: string } {
  if (gender === "male") {
    if (bf < 10) return { label: "低い", color: "#60A5FA" };
    if (bf < 20) return { label: "標準", color: "#34D399" };
    if (bf < 25) return { label: "やや高い", color: "#FBBF24" };
    return { label: "高い", color: "#EF4444" };
  } else {
    if (bf < 20) return { label: "低い", color: "#60A5FA" };
    if (bf < 30) return { label: "標準", color: "#34D399" };
    if (bf < 35) return { label: "やや高い", color: "#FBBF24" };
    return { label: "高い", color: "#EF4444" };
  }
}

// 日付加減算（ローカルタイム）
export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 連続記録日数の計算
export function calcStreak(dates: string[]): {
  current: number;
  best: number;
  total: number;
} {
  if (!dates.length) return { current: 0, best: 0, total: 0 };

  // 重複排除・昇順ソート
  const uniq = Array.from(new Set(dates)).sort();
  const total = uniq.length;

  // 最高連続記録
  let best = 1;
  let run = 1;
  for (let i = 1; i < uniq.length; i++) {
    if (uniq[i] === addDays(uniq[i - 1], 1)) {
      run++;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }

  // 現在の連続記録（今日 or 昨日に最新記録があれば継続中）
  const t = today();
  const yest = addDays(t, -1);
  const last = uniq[uniq.length - 1];

  let current = 0;
  if (last === t || last === yest) {
    current = 1;
    for (let i = uniq.length - 2; i >= 0; i--) {
      if (uniq[i] === addDays(uniq[i + 1], -1)) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, best, total };
}
