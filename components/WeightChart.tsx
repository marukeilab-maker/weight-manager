"use client";
import { useState, useEffect } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { WeightRecord } from "@/lib/types";
import { getProfile, getMealRecord, getExerciseRecord } from "@/lib/storage";
import { calcBMR, calcAge } from "@/lib/calculations";

type Range = "week" | "month" | "all";

interface Props {
  records: WeightRecord[];
  goalWeight?: number;
}

interface ChartPoint {
  date: string;
  weight?: number;
  trend?: number; // 7日移動平均（トレンドライン）
  calorieBalance?: number;
  completeness?: number; // 0-1（朝・昼・夕の何食記録されたか / 3）
}

export default function WeightChart({ records, goalWeight }: Props) {
  const [range, setRange] = useState<Range>("week");
  const [showCalories, setShowCalories] = useState(true);
  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    // 期間に応じて日付範囲を決定
    const now = new Date();
    let startDate = new Date(now);
    if (range === "week") startDate.setDate(now.getDate() - 7);
    else if (range === "month") startDate.setDate(now.getDate() - 30);
    else {
      // 全期間：最古の記録から今日まで
      if (records.length > 0) {
        const oldest = [...records].sort((a, b) => a.date.localeCompare(b.date))[0];
        startDate = new Date(oldest.date);
      }
    }

    const profile = getProfile();
    const age = profile?.birthdate ? calcAge(profile.birthdate) : 30;
    const gender = profile?.gender ?? "male";
    const height = profile?.height ?? 170;

    // 日付ごとのデータを作成
    const dailyData: ChartPoint[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // 各日の体重を引きやすくする辞書
    const weightByDate: Record<string, number> = {};
    records.forEach((r) => { weightByDate[r.date] = r.weight; });

    // 各日のスロット入力情報（食事抜きを含む）
    let allDishes: Record<string, Record<string, { name: string; kcal: number }[]>> = {};
    try {
      allDishes = JSON.parse(localStorage.getItem("wm_meal_dishes") ?? "{}");
    } catch { /* noop */ }

    while (cursor <= today) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;

      const weight = weightByDate[dateStr];
      const meal = getMealRecord(dateStr);
      const exercise = getExerciseRecord(dateStr);
      const intake = (meal.breakfast || 0) + (meal.lunch || 0) + (meal.dinner || 0) + (meal.snack || 0);
      const exerciseKcal = exercise.entries.reduce((s, e) => s + e.calories, 0);

      // 各スロットの入力状況（食事抜きを含む）
      const dishesForDay = allDishes[dateStr] ?? {};
      const mainSlots: ("breakfast" | "lunch" | "dinner")[] = ["breakfast", "lunch", "dinner"];
      const recordedCount = mainSlots.filter(
        (slot) => (dishesForDay[slot] ?? []).length > 0
      ).length;
      const completeness = recordedCount / 3; // 0, 0.33, 0.67, 1.0

      // BMRはその日の体重があれば使う、なければ最近の体重
      let bmrWeight = weight;
      if (!bmrWeight) {
        const past = records
          .filter((r) => r.date <= dateStr)
          .sort((a, b) => b.date.localeCompare(a.date));
        bmrWeight = past[0]?.weight ?? 60;
      }
      const bmr = calcBMR(bmrWeight, height, age, gender);

      // 1食でも記録されている日はグラフに表示（完了度に応じて透明度を変える）
      const balance = recordedCount > 0
        ? intake - (bmr + exerciseKcal)
        : undefined;

      const label =
        range === "week" || range === "month"
          ? `${cursor.getMonth() + 1}/${cursor.getDate()}`
          : `${cursor.getMonth() + 1}/${cursor.getDate()}`;

      dailyData.push({
        date: label,
        weight,
        calorieBalance: balance,
        completeness,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    // 7日移動平均（トレンドライン）を計算：直近7件の実測体重の平均
    const recent: number[] = [];
    dailyData.forEach((d) => {
      if (d.weight !== undefined) {
        recent.push(d.weight);
        if (recent.length > 7) recent.shift();
      }
      if (recent.length > 0) {
        d.trend = Math.round((recent.reduce((s, w) => s + w, 0) / recent.length) * 100) / 100;
      }
    });

    setData(dailyData);
  }, [range, records]);

  const weights = data.map((d) => d.weight).filter((w): w is number => w !== undefined);
  const allVals = goalWeight ? [...weights, goalWeight] : weights;
  const minY = allVals.length ? Math.floor(Math.min(...allVals) - 1) : 50;
  const maxY = allVals.length ? Math.ceil(Math.max(...allVals) + 1) : 80;

  const balances = data.map((d) => d.calorieBalance).filter((c): c is number => c !== undefined);
  const calMax = balances.length ? Math.max(...balances.map(Math.abs), 500) : 500;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700">体重 & カロリー収支</h3>
        <div className="flex gap-1">
          {(["week", "month", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${
                range === r
                  ? "bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {r === "week" ? "週" : r === "month" ? "月" : "全期間"}
            </button>
          ))}
        </div>
      </div>

      {/* カロリー表示トグル */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowCalories((v) => !v)}
          className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
            showCalories
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {showCalories ? "📊 カロリー収支 ON" : "📊 カロリー収支 OFF"}
        </button>
      </div>

      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          データがありません
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 5, right: 0, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis
              yAxisId="weight"
              domain={[minY, maxY]}
              tick={{ fontSize: 10 }}
              orientation="left"
              label={{ value: "kg", angle: 0, position: "insideTopLeft", fontSize: 9, fill: "#999", dx: 22, dy: -2 }}
            />
            {showCalories && (
              <YAxis
                yAxisId="calorie"
                domain={[-calMax, calMax]}
                tick={{ fontSize: 9 }}
                orientation="right"
                label={{ value: "kcal", angle: 0, position: "insideTopRight", fontSize: 9, fill: "#999", dx: -10, dy: -2 }}
              />
            )}
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 11 }}
              formatter={((value: unknown, name: unknown) => {
                const n = String(name);
                if (n === "weight" || n === "体重") return [`${value}kg`, "実測"];
                if (n === "trend" || n === "トレンド") return [`${value}kg`, "トレンド"];
                if (n === "calorieBalance" || n === "カロリー差") {
                  const v = Number(value);
                  return [`${v > 0 ? "+" : ""}${v}kcal`, "カロリー差"];
                }
                return [String(value), String(name)];
              }) as never}
            />
            {/* カロリー収支バー（背景） */}
            {showCalories && (
              <Bar
                yAxisId="calorie"
                dataKey="calorieBalance"
                name="カロリー差"
                radius={[3, 3, 0, 0]}
                barSize={range === "week" ? 18 : range === "month" ? 6 : 3}
              >
                {data.map((d, i) => {
                  if (d.calorieBalance === undefined) {
                    return <Cell key={i} fill="transparent" />;
                  }
                  // 完了度に応じて透明度を調整：1/3=0.4, 2/3=0.7, 3/3=1.0
                  const c = d.completeness ?? 0;
                  const alpha = c >= 1 ? 1.0 : c >= 2 / 3 ? 0.7 : c >= 1 / 3 ? 0.4 : 0.2;
                  const color = d.calorieBalance > 0
                    ? `rgba(252, 165, 165, ${alpha})`  // 赤（過多）
                    : `rgba(134, 239, 172, ${alpha})`; // 緑（不足）
                  return <Cell key={i} fill={color} />;
                })}
              </Bar>
            )}

            {/* 目標体重ライン */}
            {goalWeight && (
              <ReferenceLine
                yAxisId="weight"
                y={goalWeight}
                stroke="#0d9488"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{ value: `目標 ${goalWeight}kg`, position: "insideBottomRight", fontSize: 10, fill: "#0d9488" }}
              />
            )}

            {/* カロリー0ライン */}
            {showCalories && (
              <ReferenceLine yAxisId="calorie" y={0} stroke="#94a3b8" strokeDasharray="2 2" strokeWidth={1} />
            )}

            {/* 体重ライン（実測・控えめ） */}
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              name="体重"
              stroke="#fbbf24"
              strokeWidth={1.2}
              dot={{ fill: "#fbbf24", r: 2.5 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
            {/* トレンドライン（7日移動平均・主役） */}
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="trend"
              name="トレンド"
              stroke="url(#lineGrad)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls
            />
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* 凡例 */}
      {data.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex justify-center gap-3 text-[10px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-3 rounded-full bg-amber-400 inline-block" style={{ height: 2 }} />
              実測
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 inline-block" style={{ height: 3 }} />
              トレンド（7日平均）
            </span>
            {showCalories && (
              <span className="flex items-center gap-1">
                <span className="inline-flex">
                  <span className="w-2 h-2.5 rounded-sm bg-green-300" />
                  <span className="w-2 h-2.5 rounded-sm bg-red-300 ml-0.5" />
                </span>
                カロリー差（緑=不足 / 赤=過多）
              </span>
            )}
          </div>
          {showCalories && (
            <div className="flex justify-center gap-2 text-[9px] text-gray-400">
              <span>濃さ = 記録した食事数：</span>
              <span className="flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: "rgba(134,239,172,0.4)" }} />
                1食
              </span>
              <span className="flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: "rgba(134,239,172,0.7)" }} />
                2食
              </span>
              <span className="flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: "rgba(134,239,172,1.0)" }} />
                3食
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
