"use client";
import { useState } from "react";
import { calcBodyFat, bodyFatCategory } from "@/lib/calculations";

interface Props {
  bmi: number;
  height?: number;
  currentWeight?: number;
  age?: number | null;
  gender?: "male" | "female";
}

const RANGES = [
  { label: "低体重",    min: 0,    max: 18.5, color: "#60A5FA", bg: "bg-blue-100",   text: "text-blue-600"   },
  { label: "普通体重",  min: 18.5, max: 25.0, color: "#34D399", bg: "bg-green-100",  text: "text-green-600"  },
  { label: "肥満(1度)", min: 25.0, max: 30.0, color: "#FBBF24", bg: "bg-yellow-100", text: "text-yellow-600" },
  { label: "肥満(2度)", min: 30.0, max: 35.0, color: "#F97316", bg: "bg-orange-100", text: "text-orange-600" },
  { label: "肥満(3度)", min: 35.0, max: 50.0, color: "#EF4444", bg: "bg-red-100",    text: "text-red-600"   },
];

const MESSAGES: Record<string, string> = {
  "低体重":    "少し体重を増やしましょう",
  "普通体重":  "理想的な体重範囲です！",
  "肥満(1度)": "少し体重が多めです",
  "肥満(2度)": "減量を意識しましょう",
  "肥満(3度)": "医師への相談をおすすめします",
};

function getRange(bmi: number) {
  return RANGES.find((r) => bmi >= r.min && bmi < r.max) ?? RANGES[RANGES.length - 1];
}

// BMI 15〜40 のスケールでバー上の位置を計算
const SCALE_MIN = 15;
const SCALE_MAX = 40;
function toPercent(val: number) {
  return Math.min(100, Math.max(0, ((val - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100));
}

export default function BMICard({ bmi, height, currentWeight, age, gender }: Props) {
  const range = getRange(bmi);
  const pointerPct = toPercent(bmi);
  const [expanded, setExpanded] = useState(false);

  // 体脂肪率の推定（年齢・性別が揃っている時のみ）
  const bodyFat = age && gender ? calcBodyFat(bmi, age, gender) : null;
  const bfCat = bodyFat !== null && gender ? bodyFatCategory(bodyFat, gender) : null;

  // 健康的体重の計算（身長があれば）
  const h2 = height ? (height / 100) ** 2 : 0;
  const idealWeight = h2 ? Math.round(h2 * 22 * 10) / 10 : 0;      // BMI 22
  const minHealthy  = h2 ? Math.round(h2 * 18.5 * 10) / 10 : 0;     // BMI 18.5
  const maxHealthy  = h2 ? Math.round(h2 * 25 * 10) / 10 : 0;       // BMI 25
  const beautyWeight = h2 ? Math.round(h2 * 20 * 10) / 10 : 0;      // BMI 20

  // 理想体重との差分
  const idealDiff = currentWeight && idealWeight
    ? Math.round((currentWeight - idealWeight) * 10) / 10
    : null;

  // タップした目標体重までの「健康的ペース」所要日数
  const [selected, setSelected] = useState<null | { label: string; target: number }>(null);
  const HEALTHY_KG_PER_WEEK = 0.5; // 健康的な減量ペース
  function estimate(target: number) {
    if (!currentWeight) return null;
    const diff = Math.round((currentWeight - target) * 10) / 10;
    if (diff <= 0) return { diff, days: 0, done: true };
    const days = Math.ceil((diff / HEALTHY_KG_PER_WEEK) * 7);
    return { diff, days, done: false };
  }
  const est = selected ? estimate(selected.target) : null;

  const isUnderweight = bmi < 18.5;

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${isUnderweight ? "border-2 border-blue-300" : ""}`}>
      {/* 痩せすぎ時のこたろう警告バナー */}
      {isUnderweight && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 pt-4 pb-3">
          <div className="flex items-end gap-3">
            <img src="/cat-sad.png" alt="こたろう" className="w-14 h-14 shrink-0 object-contain" />
            <div className="bg-white border border-blue-200 rounded-2xl rounded-bl-none px-3 py-2 flex-1">
              <p className="text-xs font-black text-blue-700 leading-relaxed">
                いまの体重、やせすぎにゃ…😿<br />
                BMI {bmi.toFixed(1)} は健康ラインより低いよ。<br />
                無理なダイエットは続けないでほしいにゃ🙏
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700 text-sm">BMI 指数</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${range.bg} ${range.text}`}>
          {range.label}
        </span>
      </div>

      {/* BMI 数値 */}
      <div className="flex items-end gap-2 mb-4">
        <span className={`text-5xl font-black ${range.text}`}>{bmi.toFixed(1)}</span>
        <div className="mb-1">
          <p className="text-xs text-gray-400 leading-tight">目標 18.5〜25.0</p>
          <p className={`text-xs font-bold ${range.text}`}>{MESSAGES[range.label]}</p>
        </div>
      </div>

      {/* グラデーションスケールバー */}
      <div className="mb-6">
        {/* 現在のBMI値（マーカー） */}
        <div className="relative h-5 mb-1">
          <div
            className="absolute top-0 transition-all duration-700"
            style={{ left: `${pointerPct}%`, transform: "translateX(-50%)" }}
          >
            <div
              className="text-[10px] font-black px-1.5 py-0.5 rounded text-white whitespace-nowrap shadow"
              style={{ background: range.color }}
            >
              {bmi.toFixed(1)}
            </div>
            {/* 下向き三角 */}
            <div
              className="w-0 h-0 mx-auto"
              style={{
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderTop: `5px solid ${range.color}`,
              }}
            />
          </div>
        </div>

        {/* バー本体（BMI境界値に合わせたグラデーション） */}
        <div className="relative">
          <div
            className="w-full h-3 rounded-full"
            style={{
              background: `linear-gradient(to right,
                #60A5FA 0%, #60A5FA ${toPercent(18.5)}%,
                #34D399 ${toPercent(18.5)}%, #34D399 ${toPercent(25)}%,
                #FBBF24 ${toPercent(25)}%, #FBBF24 ${toPercent(30)}%,
                #F97316 ${toPercent(30)}%, #F97316 ${toPercent(35)}%,
                #EF4444 ${toPercent(35)}%, #EF4444 100%)`,
            }}
          />
          {/* 境界の目盛り線 */}
          {[18.5, 25, 30, 35].map((v) => (
            <div
              key={v}
              className="absolute top-0 w-px h-3 bg-white/60"
              style={{ left: `${toPercent(v)}%` }}
            />
          ))}
        </div>

        {/* 目盛りラベル（実際のBMI値の位置に絶対配置） */}
        <div className="relative h-4 mt-1 text-[10px] font-medium">
          {[
            { val: 15, label: "15", color: "text-gray-400" },
            { val: 18.5, label: "18.5", color: "text-blue-500" },
            { val: 25, label: "25", color: "text-green-500" },
            { val: 30, label: "30", color: "text-yellow-500" },
            { val: 35, label: "35", color: "text-teal-600" },
            { val: 40, label: "40", color: "text-gray-400" },
          ].map((t) => (
            <span
              key={t.val}
              className={`absolute top-0 ${t.color}`}
              style={{ left: `${toPercent(t.val)}%`, transform: "translateX(-50%)" }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* 判定区分の凡例 */}
      <div className="grid grid-cols-5 gap-1">
        {RANGES.map((r) => (
          <div
            key={r.label}
            className={`text-center py-1 rounded-lg text-[9px] font-bold transition-all ${
              r.label === range.label
                ? `${r.bg} ${r.text} ring-2`
                : "bg-gray-50 text-gray-400"
            }`}
            style={r.label === range.label ? { "--tw-ring-color": r.color } as React.CSSProperties : {}}
          >
            {r.label}
          </div>
        ))}
      </div>

      {/* 詳細情報（折りたたみ） */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full mt-3 flex items-center justify-center gap-1 text-[11px] font-bold text-gray-400 py-1 active:opacity-60 transition-opacity"
      >
        {expanded ? "▲ 詳細を閉じる" : "▼ 体脂肪・体重目安を見る"}
      </button>

      {expanded && (
        <>
          {/* 推定体脂肪率 */}
          {bodyFat !== null && bfCat && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                    推定体脂肪率
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black" style={{ color: bfCat.color }}>
                      {bodyFat}
                    </span>
                    <span className="text-sm font-bold text-gray-400">%</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full ml-1"
                      style={{ background: `${bfCat.color}22`, color: bfCat.color }}
                    >
                      {bfCat.label}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-gray-300 text-right leading-tight max-w-[100px]">
                  身長・体重・年齢・性別からの推定値
                </p>
              </div>
            </div>
          )}

          {/* 健康的体重の目安 */}
          {idealWeight > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  🎯 健康的体重の目安
                </p>
                {idealDiff !== null && (
                  <p className="text-[10px] font-bold text-gray-400">
                    理想まで{" "}
                    <span className="text-gray-600">
                      {idealDiff > 0 ? "−" : idealDiff < 0 ? "+" : ""}
                      {Math.abs(idealDiff).toFixed(1)}kg
                    </span>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelected(selected?.label === "美容体重" ? null : { label: "美容体重", target: beautyWeight })}
                  className={`bg-gray-50 rounded-xl py-2.5 px-1 text-center flex flex-col justify-between min-h-[78px] active:scale-95 transition-all ${selected?.label === "美容体重" ? "ring-2 ring-blue-300" : ""}`}
                >
                  <p className="text-[10px] font-bold text-gray-500">美容体重</p>
                  <p className="font-black text-gray-700 leading-none">
                    <span className="text-lg">{beautyWeight}</span>
                    <span className="text-[10px] ml-0.5 text-gray-400">kg</span>
                  </p>
                  <p className="text-[9px] text-gray-400">BMI 20</p>
                </button>
                <button
                  onClick={() => setSelected(selected?.label === "健康範囲" ? null : { label: "健康範囲", target: maxHealthy })}
                  className={`bg-gray-100 rounded-xl py-2.5 px-1 text-center flex flex-col justify-between min-h-[78px] active:scale-95 transition-all ${selected?.label === "健康範囲" ? "ring-2 ring-green-300" : ""}`}
                >
                  <p className="text-[10px] font-bold text-gray-600">健康範囲</p>
                  <p className="font-black text-gray-800 leading-none whitespace-nowrap">
                    <span className="text-sm">{minHealthy}</span>
                    <span className="text-[9px] mx-px text-gray-400">〜</span>
                    <span className="text-sm">{maxHealthy}</span>
                  </p>
                  <p className="text-[9px] text-gray-400">BMI 18.5〜25</p>
                </button>
                <button
                  onClick={() => setSelected(selected?.label === "理想体重" ? null : { label: "理想体重", target: idealWeight })}
                  className={`bg-gray-50 rounded-xl py-2.5 px-1 text-center flex flex-col justify-between min-h-[78px] active:scale-95 transition-all ${selected?.label === "理想体重" ? "ring-2 ring-orange-300" : ""}`}
                >
                  <p className="text-[10px] font-bold text-gray-500">理想体重</p>
                  <p className="font-black text-gray-700 leading-none">
                    <span className="text-lg">{idealWeight}</span>
                    <span className="text-[10px] ml-0.5 text-gray-400">kg</span>
                  </p>
                  <p className="text-[9px] text-gray-400">BMI 22</p>
                </button>
              </div>

              {/* 健康的に減らしてよいペースの目安 */}
              {currentWeight && currentWeight > 0 && (
                <div className="mt-2 bg-blue-50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-bold text-blue-500 mb-0.5">💡 健康的に減らせるペースの目安</p>
                  <p className="text-xs text-gray-600">
                    週に体重の <span className="font-bold">0.5〜1%</span> まで＝
                    <span className="font-black text-blue-600 mx-0.5">
                      {(currentWeight * 0.005).toFixed(1)}〜{(currentWeight * 0.01).toFixed(1)}
                    </span>
                    kg/週
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    （1ヶ月で約 {(currentWeight * 0.02).toFixed(1)}〜{(currentWeight * 0.04).toFixed(1)} kg が無理のない範囲）
                  </p>
                </div>
              )}

              {/* タップした目標までの所要日数 */}
              {selected && est && (
                <div className="mt-2 bg-teal-50 rounded-xl p-3 text-center">
                  {est.done ? (
                    <p className="text-sm font-bold text-green-600">
                      ✨ {selected.label}（{selected.target}kg）はすでに達成しています！
                    </p>
                  ) : (
                    <>
                      <p className="text-[11px] text-gray-500 mb-1">
                        現在 {currentWeight}kg → {selected.label} {selected.target}kg（あと <span className="font-bold text-teal-600">{est.diff}kg</span>）
                      </p>
                      <p className="text-sm font-bold text-gray-700">
                        健康的なペース（0.5kg/週）で
                      </p>
                      <p className="text-amber-600 font-black">
                        約 <span className="text-2xl">{est.days}</span> 日
                        <span className="text-xs text-gray-400 ml-1">（約{Math.round(est.days / 30 * 10) / 10}ヶ月）</span>
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
