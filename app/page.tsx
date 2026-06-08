"use client";
import { useState, useEffect, useCallback } from "react";
import { TrendingDown, TrendingUp, Minus, CheckCircle, Zap } from "lucide-react";
import Onboarding from "@/components/Onboarding";
import WeightPicker from "@/components/WeightPicker";
import ProgressCircle from "@/components/ProgressCircle";
import WeightCat from "@/components/WeightCat";
import BMICard from "@/components/BMICard";
import {
  getProfile,
  getWeightRecords,
  saveWeightRecord,
  getMealRecord,
  getExerciseRecord,
  getAllMeals,
  getAllExercises,
} from "@/lib/storage";
import { getWeeklyReport, WeeklyReport } from "@/lib/weeklyReport";
import {
  calcBMI,
  calcProgress,
  calcDailyPace,
  daysBetween,
  today,
  formatDate,
  calcAge,
  calcBMR,
} from "@/lib/calculations";
import { getDailyCatMessage } from "@/lib/catMessages";
import { Profile, WeightRecord } from "@/lib/types";

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [weightInput, setWeightInput] = useState("60.0");
  const [todayRecord, setTodayRecord] = useState<WeightRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  const [showMealExercise, setShowMealExercise] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [reportDismissed, setReportDismissed] = useState(false);

  const loadData = useCallback(() => {
    const p = getProfile();
    setProfile(p);
    const recs = getWeightRecords();
    setRecords(recs);
    const tr = recs.find((r) => r.date === today()) ?? null;
    setTodayRecord(tr);
    if (tr) {
      setWeightInput(String(tr.weight));
    } else if (recs.length > 0) {
      setWeightInput(String(recs[recs.length - 1].weight));
    }
    // 週次レポート生成
    const report = getWeeklyReport(recs, getAllMeals(), getAllExercises());
    setWeeklyReport(report);
    // 今週月曜日に既に閉じたかチェック
    const thisMonday = (() => {
      const now = new Date();
      const dow = now.getDay();
      const d = new Date(now);
      d.setDate(now.getDate() - ((dow + 6) % 7));
      return d.toISOString().slice(0, 10);
    })();
    const dismissedKey = `wm_report_dismissed_${thisMonday}`;
    setReportDismissed(localStorage.getItem(dismissedKey) === "1");
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
    const v = localStorage.getItem("wm_show_meal_exercise");
    setShowMealExercise(v !== "false");
    const onChanged = () => {
      const v2 = localStorage.getItem("wm_show_meal_exercise");
      setShowMealExercise(v2 !== "false");
    };
    window.addEventListener("wm_settings_changed", onChanged);
    return () => window.removeEventListener("wm_settings_changed", onChanged);
  }, [loadData]);

  // 日付・データの自動更新（1分ごと＋画面復帰時＋フォーカス時）
  useEffect(() => {
    const update = () => {
      setNow(new Date());
      loadData(); // プロフィール・記録を常に最新化（設定変更を即反映）
    };
    const timer = setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, [loadData]);

  function handleSave() {
    if (!weightInput || !profile) return;
    const w = Number(weightInput);
    const bmi = calcBMI(w, profile.height);
    const record: WeightRecord = { date: today(), weight: w, bmi };
    saveWeightRecord(record);
    loadData();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!mounted) return null;
  if (!profile) return <Onboarding onComplete={loadData} />;

  const currentWeight = todayRecord?.weight ?? records[records.length - 1]?.weight ?? 0;
  const startWeight = records[0]?.weight ?? currentWeight;
  const progress = calcProgress(startWeight, currentWeight, profile.goalWeight);
  const daysLeft = Math.max(0, daysBetween(today(), profile.goalDate));
  const dailyPace = calcDailyPace(currentWeight, profile.goalWeight, daysLeft);
  const remaining = Math.max(0, currentWeight - profile.goalWeight);

  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const prevRecord = sortedRecords.length >= 2 ? sortedRecords[sortedRecords.length - 2] : null;
  const prevWeight = prevRecord?.weight;
  const diff = todayRecord && prevWeight ? todayRecord.weight - prevWeight : null;

  // BMI表示用：今日の記録がなくても直近の体重から計算して常に表示
  const latestRecord = todayRecord ?? sortedRecords[sortedRecords.length - 1] ?? null;
  const displayBmi = latestRecord ? calcBMI(latestRecord.weight, profile.height) : null;
  // 開始時BMI（こたろうのスタート段階用）
  const startBmi = startWeight > 0 ? calcBMI(startWeight, profile.height) : null;

  const meal = getMealRecord(today());
  const totalCalories = meal.breakfast + meal.lunch + meal.dinner + meal.snack;
  const exercise = getExerciseRecord(today());
  const burnedCalories = exercise.entries.reduce((s, e) => s + e.calories, 0);

  const age = profile.birthdate ? calcAge(profile.birthdate) : null;
  const bmr = age && profile.gender && currentWeight
    ? calcBMR(currentWeight, profile.height, age, profile.gender)
    : null;
  const totalBurned = burnedCalories + (bmr ?? 0);

  const isUnhealthyGoal =
    startWeight > 0 &&
    profile.goalWeight > 0 &&
    daysLeft > 0 &&
    (startWeight - profile.goalWeight) / (daysLeft / 7) / startWeight > 0.01;

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header gradient */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 pt-5 pb-6 px-4 rounded-b-3xl shadow-lg">
        <div className="mb-2">
          <div className="text-white/60 text-sm font-medium">
            {now.toLocaleDateString("ja-JP", { year: "numeric" })}
          </div>
          <div className="text-2xl font-black" style={{ color: "#ffd8b0" }}>
            {now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
          </div>
        </div>
        <h1 className="text-white text-lg font-black mb-4">今日の体重を記録</h1>

        <div className="bg-white/20 backdrop-blur rounded-2xl p-5">
          {diff !== null && (
            <div className={`flex items-center justify-end gap-1 mb-1 text-sm font-bold ${
              diff > 0 ? "text-red-200" : diff < 0 ? "text-blue-200" : "text-white/70"
            }`}>
              {diff > 0 ? <TrendingUp size={16} /> : diff < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
              {diff > 0 ? "+" : ""}{diff.toFixed(1)}kg
            </div>
          )}
          <WeightPicker value={weightInput} onChange={setWeightInput} />
          <button
            onClick={handleSave}
            className="w-full bg-white text-teal-600 font-black py-3 rounded-xl text-base shadow active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-green-500">記録しました！🎉</span>
              </>
            ) : (
              <>
                <Zap size={18} />
                記録する
              </>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* 週次レポート（先週データがあり、まだ閉じていない場合に表示） */}
        {weeklyReport && !reportDismissed && (
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-teal-600">
                📊 先週のレポート（{weeklyReport.weekStart.slice(5).replace("-", "/")}〜{weeklyReport.weekEnd.slice(5).replace("-", "/")}）
              </p>
              <button
                onClick={() => {
                  const now = new Date();
                  const dow = now.getDay();
                  const d = new Date(now);
                  d.setDate(now.getDate() - ((dow + 6) % 7));
                  const thisMonday = d.toISOString().slice(0, 10);
                  localStorage.setItem(`wm_report_dismissed_${thisMonday}`, "1");
                  setReportDismissed(true);
                }}
                className="text-gray-300 hover:text-gray-400 text-lg leading-none"
                aria-label="閉じる"
              >✕</button>
            </div>

            {/* データサマリー */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-gray-50 rounded-xl py-2 text-center">
                <p className="text-[10px] text-gray-400 mb-0.5">記録日数</p>
                <p className="text-lg font-black text-gray-700">{weeklyReport.recordDays}<span className="text-xs font-normal text-gray-400"> / 7日</span></p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl py-2 text-center">
                <p className="text-[10px] text-gray-400 mb-0.5">体重変化</p>
                <p className={`text-lg font-black ${
                  weeklyReport.weightDiff === null ? "text-gray-400"
                  : weeklyReport.weightDiff < 0 ? "text-teal-600"
                  : weeklyReport.weightDiff > 0 ? "text-red-400"
                  : "text-gray-500"
                }`}>
                  {weeklyReport.weightDiff === null ? "−"
                    : weeklyReport.weightDiff > 0 ? `+${weeklyReport.weightDiff}` : weeklyReport.weightDiff}
                  {weeklyReport.weightDiff !== null && <span className="text-xs font-normal text-gray-400">kg</span>}
                </p>
              </div>
              {weeklyReport.avgCalories > 0 && (
                <div className="flex-1 bg-gray-50 rounded-xl py-2 text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">平均摂取</p>
                  <p className="text-lg font-black text-orange-500">{weeklyReport.avgCalories}<span className="text-xs font-normal text-gray-400">kcal</span></p>
                </div>
              )}
            </div>

            {/* こたろうのメッセージ */}
            <div className="bg-orange-50 rounded-xl px-4 py-3 relative">
              <p className="text-xs font-bold text-gray-700 leading-relaxed whitespace-pre-line">
                🐱 {weeklyReport.message}
              </p>
            </div>
          </div>
        )}

        {isUnhealthyGoal && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 text-sm text-yellow-700">
            ⚠️ 設定されたペースは健康的な減量目安（体重の0.5〜1%/週）を超えています。無理のない計画をおすすめします。
          </div>
        )}

        {/* Goal card */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-gray-500 text-sm mb-1">
            📅 {formatDate(profile.goalDate)}までに ⚖️ {profile.goalWeight}kgを目指しています！
          </p>
          <p className="text-gray-700 text-sm font-medium mb-3">
            現在{" "}
            <span className="font-black text-gray-900">{currentWeight}kg</span>　あと{" "}
            <span className="font-black text-orange-500">{remaining.toFixed(1)}kg</span>　残り{" "}
            <span className="font-black text-blue-500">{daysLeft}日</span>
          </p>

          <div className="flex justify-center mb-2">
            <WeightCat progress={progress} bmi={displayBmi} startBmi={startBmi} goalBmi={profile.height > 0 ? calcBMI(profile.goalWeight, profile.height) : null} />
          </div>

          {/* こたろうからの日替わりメッセージ（記録した日に表示） */}
          {todayRecord && (
            <div className="relative mx-auto max-w-[280px] mb-3">
              <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2.5 text-center">
                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                  {getDailyCatMessage(today())}
                </p>
              </div>
              {/* 吹き出しのしっぽ（上向き） */}
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-50 border-l border-t border-orange-100 rotate-45"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <ProgressCircle percent={progress} size={80} label="達成率" />
            <div className="flex-1">
              <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {daysLeft > 0 && (
                <p className="text-xs text-gray-500">
                  1日約{(dailyPace * 1000).toFixed(0)}gペースで減量が必要
                </p>
              )}
              {sortedRecords.length >= 3 &&
                (() => {
                  const recentDiff =
                    (sortedRecords[sortedRecords.length - 1].weight -
                      sortedRecords[sortedRecords.length - 3].weight) /
                    2;
                  const onTrack = recentDiff <= -dailyPace * 0.8;
                  return (
                    <p className={`text-xs font-bold mt-1 ${onTrack ? "text-green-500" : "text-teal-600"}`}>
                      {onTrack ? "✅ 順調です！" : "⚡ もう少しペースアップが必要です"}
                    </p>
                  );
                })()}
            </div>
          </div>
        </div>

        {/* BMI */}
        {/* 現在体重が痩せすぎの時、こたろうの心配メッセージ */}
        {displayBmi !== null && displayBmi < 18.5 && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4">
            <div className="flex items-end gap-3 mb-3">
              <div className="text-5xl shrink-0">😿</div>
              <div className="bg-white border border-blue-200 rounded-2xl rounded-bl-none px-3 py-2.5 flex-1">
                <p className="text-xs font-black text-blue-700 leading-relaxed">
                  いまの体重、やせすぎにゃ…😿<br />
                  BMI {displayBmi.toFixed(1)} は健康ラインより低いよ。<br />
                  こたろうはあなたの健康が一番大事にゃ🙏
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl px-3 py-2.5 text-xs text-gray-600 leading-relaxed space-y-1">
              <p className="font-black text-blue-600 mb-1">💙 体重を増やすためのヒント</p>
              <p>🍳 <span className="font-bold">タンパク質を意識して摂る</span>（卵・鶏むね・豆腐・魚など）</p>
              <p>🍚 <span className="font-bold">3食しっかり食べる</span>（食事を抜かない）</p>
              <p>🏋️ <span className="font-bold">筋トレを取り入れる</span>（健康的に体重を増やせる）</p>
              <p>😴 <span className="font-bold">睡眠を十分に取る</span>（ホルモンバランスが整う）</p>
              <p className="text-[10px] text-gray-400 pt-1">※ 体調が気になる場合は医師にご相談ください</p>
            </div>
          </div>
        )}

        {displayBmi !== null && <BMICard bmi={displayBmi} height={profile.height} currentWeight={currentWeight} age={age} gender={profile.gender} />}

        {/* Calorie summary */}
        {showMealExercise && <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="font-bold text-gray-700 mb-3 text-sm">⚖️ 今日のカロリー収支</h3>

          {/* メイン：グレー背景＋色付き数字（ラベルも数字と色を合わせて見やすく） */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-50 rounded-xl py-2.5 text-center">
              <div className="text-lg mb-0.5">🍽️</div>
              <div className="text-xs font-bold text-blue-500 mb-1">食事</div>
              <div className="text-2xl font-black text-blue-600 leading-none">{totalCalories}</div>
              <div className="text-[9px] text-gray-400 mt-1">kcal</div>
            </div>
            <div className="bg-gray-50 rounded-xl py-2.5 text-center">
              <div className="text-lg mb-0.5">🔥</div>
              <div className="text-xs font-bold text-green-600 mb-1">消費</div>
              <div className="text-2xl font-black text-green-600 leading-none">{totalBurned}</div>
              <div className="text-[9px] text-gray-400 mt-1">kcal</div>
            </div>
            <div className="bg-gray-50 rounded-xl py-2.5 text-center">
              <div className="text-lg mb-0.5">{totalCalories - totalBurned > 0 ? "⚠️" : "✨"}</div>
              <div className={`text-xs font-bold mb-1 ${
                totalCalories === 0
                  ? "text-gray-600"
                  : totalCalories - totalBurned > 0
                  ? "text-red-500"
                  : "text-green-600"
              }`}>差引</div>
              <div className={`text-2xl font-black leading-none ${
                totalCalories === 0
                  ? "text-gray-500"
                  : totalCalories - totalBurned > 0
                  ? "text-red-600"
                  : "text-green-700"
              }`}>
                {totalCalories - totalBurned > 0 ? "+" : ""}{totalCalories - totalBurned}
              </div>
              <div className="text-[9px] text-gray-400 mt-1">kcal</div>
            </div>
          </div>

          {/* 状態メッセージ（グレー基調・絵文字で状態を表現） */}
          {(() => {
            const net = totalCalories - totalBurned;
            let msg = "", icon = "";
            if (totalCalories === 0) {
              msg = "まだ食事が記録されていません";
              icon = "📝";
            } else if (net < -300) {
              msg = `カロリー不足ペース！体重が減りやすい状態です`;
              icon = "🔥";
            } else if (net < 0) {
              msg = `${Math.abs(net)} kcal の黒字。ダイエット効果あり`;
              icon = "✨";
            } else if (net < 200) {
              msg = `バランス良好（差 ${net} kcal）`;
              icon = "⚖️";
            } else {
              msg = `${net} kcal オーバー。明日は控えめに`;
              icon = "⚠️";
            }
            return (
              <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2 mb-3 text-gray-600">
                <span className="text-base">{icon}</span>
                <span>{msg}</span>
              </div>
            );
          })()}

          {/* 消費内訳（基礎代謝 + 運動）：合計だけ消費と同じ緑で関連付け */}
          {bmr && (
            <div className="border border-gray-100 rounded-xl p-2.5 mb-3">
              <p className="text-[10px] font-bold text-gray-500 mb-2 text-center">🔥 消費カロリーの内訳</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-[9px] text-gray-500 mb-1">基礎代謝</div>
                  <div className="text-base font-black text-gray-700 leading-none">{bmr}</div>
                  <div className="text-[9px] text-gray-400 mt-1">kcal</div>
                </div>
                <div className="text-center border-x border-gray-100">
                  <div className="text-[9px] text-gray-500 mb-1">運動</div>
                  <div className="text-base font-black text-gray-700 leading-none">{burnedCalories}</div>
                  <div className="text-[9px] text-gray-400 mt-1">kcal</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-gray-500 mb-1">合計</div>
                  <div className="text-base font-black text-green-600 leading-none">{totalBurned}</div>
                  <div className="text-[9px] text-gray-400 mt-1">kcal</div>
                </div>
              </div>
            </div>
          )}

          {/* 摂取目標プログレスバー */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-500">🍽️ 摂取目標まで</span>
              <span className={`font-bold ${
                totalCalories > profile.targetCalories ? "text-red-500" : "text-gray-700"
              }`}>
                {totalCalories > profile.targetCalories
                  ? `+${totalCalories - profile.targetCalories} kcal オーバー`
                  : `あと ${profile.targetCalories - totalCalories} kcal`}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 relative">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${
                  totalCalories > profile.targetCalories
                    ? "bg-gradient-to-r from-red-400 to-red-500"
                    : "bg-gradient-to-r from-amber-400 to-orange-500"
                }`}
                style={{ width: `${Math.min(100, (totalCalories / profile.targetCalories) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0</span>
              <span>目標 {profile.targetCalories} kcal</span>
            </div>
          </div>
        </div>}

        {/* フッターロゴ */}
        <div className="flex justify-center pt-5 pb-3">
          <img
            src="/logo-footer.png"
            alt="こたろうダイエット"
            className="h-20 w-auto select-none opacity-90"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
