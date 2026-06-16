// 実測ベースの消費カロリー（アダプティブTDEE）
//
// 理論値（基礎代謝×活動係数）ではなく、実際の「体重の動き」と「食事の記録」から
// その人の本当の維持カロリー（＝総消費カロリー）を逆算する。
//
//   ある期間で体重が ΔW kg 動いたら、その間の収支は ΔW × 7200 kcal。
//   1日あたり収支 = ΔW×7200 / 日数 = 平均摂取 − 維持カロリー
//   → 維持カロリー = 平均摂取 −（1日あたりの体重変化 × 7200）
//
// 体重は水分で日々ブレるため、期間内の体重を線形回帰してトレンド(kg/日)を求める。

import { WeightRecord, MealRecord } from "./types";
import { addDays, today, daysBetween } from "./calculations";

/** 脂肪1kgあたりのカロリー */
const KCAL_PER_KG = 7200;
/** 遡る最大日数 */
const WINDOW_DAYS = 28;
/** 体重トレンドに必要な最小期間（日） */
const MIN_SPAN_DAYS = 14;
/** 必要な最小体重記録数 */
const MIN_WEIGHT_POINTS = 5;
/** 必要な最小食事記録日数 */
const MIN_INTAKE_DAYS = 7;
/** ありえない値を弾くための維持カロリーの下限・上限 */
const MIN_MAINTENANCE = 800;
const MAX_MAINTENANCE = 5000;

export interface AdaptiveMaintenance {
  /** 実測の維持カロリー（＝総消費カロリー, kcal/日） */
  maintenance: number;
  /** 体重トレンド（kg/週）。マイナス=減少 */
  trendKgPerWeek: number;
  /** 期間中の平均摂取（kcal/日） */
  avgIntake: number;
  /** 体重データの期間（日） */
  spanDays: number;
  /** 使った体重記録数 */
  weightPoints: number;
  /** 使った食事記録日数 */
  intakeDays: number;
}

/**
 * 実測ベースの維持カロリーを算出する。
 * データが不足している・値が非現実的な場合は null（理論値にフォールバックさせる）。
 */
export function calcAdaptiveMaintenance(
  records: WeightRecord[],
  meals: MealRecord[]
): AdaptiveMaintenance | null {
  const t = today();
  const start = addDays(t, -(WINDOW_DAYS - 1));

  // 窓内の体重記録（日付昇順）
  const ws = records
    .filter((r) => r.date >= start && r.date <= t)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (ws.length < MIN_WEIGHT_POINTS) return null;

  // 最初の記録日を起点に「経過日数 x」と「体重 y」の点列を作る
  const base = ws[0].date;
  const pts = ws.map((r) => ({ x: daysBetween(base, r.date), y: r.weight }));
  const spanDays = pts[pts.length - 1].x;
  if (spanDays < MIN_SPAN_DAYS) return null;

  // 線形回帰の傾き（kg/日）
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of pts) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  if (den === 0) return null;
  const slopePerDay = num / den; // kg/日（マイナス=減少）

  // 窓内の平均摂取（記録があり0kcalでない日のみ）
  const logged = meals
    .filter((m) => m.date >= start && m.date <= t)
    .map((m) => m.breakfast + m.lunch + m.dinner + m.snack)
    .filter((kcal) => kcal > 0);
  if (logged.length < MIN_INTAKE_DAYS) return null;
  const avgIntake = logged.reduce((s, kcal) => s + kcal, 0) / logged.length;

  // 維持カロリー = 平均摂取 −（1日あたりの体重変化 × 7200）
  const maintenance = Math.round(avgIntake - slopePerDay * KCAL_PER_KG);
  if (maintenance < MIN_MAINTENANCE || maintenance > MAX_MAINTENANCE) return null;

  return {
    maintenance,
    trendKgPerWeek: Math.round(slopePerDay * 7 * 100) / 100,
    avgIntake: Math.round(avgIntake),
    spanDays,
    weightPoints: n,
    intakeDays: logged.length,
  };
}

export interface DailyExpenditure {
  /** 今日の総消費カロリー（kcal） */
  burned: number;
  /** "adaptive" = 実測ベース / "estimate" = 理論値ベース */
  mode: "adaptive" | "estimate";
  /** 理論値の内訳（estimate時のみ意味を持つ） */
  bmr: number;
  lifeActivity: number;
  exercise: number;
  /** 実測ベースの根拠（adaptive時のみ） */
  adaptive: AdaptiveMaintenance | null;
}

/**
 * 今日の消費カロリーを返す。十分なデータがあれば実測ベース、無ければ理論値。
 * - 実測ベース: 維持カロリー（運動分は実測値に既に含まれるため別途加算しない）
 * - 理論値: 基礎代謝 × 活動係数 + 運動記録
 */
export function calcDailyExpenditure(params: {
  records: WeightRecord[];
  meals: MealRecord[];
  bmr: number;
  factor: number;
  exerciseBurned: number;
}): DailyExpenditure {
  const { records, meals, bmr, factor, exerciseBurned } = params;
  const adaptive = calcAdaptiveMaintenance(records, meals);
  if (adaptive) {
    return {
      burned: adaptive.maintenance,
      mode: "adaptive",
      bmr,
      lifeActivity: 0,
      exercise: exerciseBurned,
      adaptive,
    };
  }
  const dailyTdee = Math.round(bmr * factor);
  return {
    burned: dailyTdee + exerciseBurned,
    mode: "estimate",
    bmr,
    lifeActivity: dailyTdee - bmr,
    exercise: exerciseBurned,
    adaptive: null,
  };
}
