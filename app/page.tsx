"use client";
import { useState, useEffect, useCallback } from "react";
import { TrendingDown, TrendingUp, Minus, CheckCircle, Zap, Download } from "lucide-react";
import Onboarding from "@/components/Onboarding";
import WeightPicker from "@/components/WeightPicker";
import ProgressCircle from "@/components/ProgressCircle";
import WeightCat from "@/components/WeightCat";
import BMICard from "@/components/BMICard";
import {
  getProfile,
  getWeightRecords,
  saveWeightRecord,
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
  calcStreak,
  addDays,
} from "@/lib/calculations";
import { getDailyCatMessage } from "@/lib/catMessages";
import { BACKUP_KEYS } from "@/lib/constants";
import { Profile, WeightRecord } from "@/lib/types";

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [weightInput, setWeightInput] = useState("60.0");
  const [todayRecord, setTodayRecord] = useState<WeightRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [reportDismissed, setReportDismissed] = useState(false);
  const [backupDays, setBackupDays] = useState<number | null>(null);
  const [backupDismissed, setBackupDismissed] = useState(false);
  const [showMealExercise, setShowMealExercise] = useState(true);

  const loadData = useCallback(() => {
    const p = getProfile();
    setProfile(p);
    const recs = getWeightRecords();
    setRecords(recs);
    const tr = recs.find((r) => r.date === today()) ?? null;
    setTodayRecord(tr);
    if (tr) {
      setWeightInput(String(tr.weight));
    } else {
      // 今日未記録なら前回の体重を初期値にセット
      const sorted = [...recs].sort((a, b) => a.date.localeCompare(b.date));
      const prev = sorted[sorted.length - 1];
      setWeightInput(prev ? String(prev.weight) : "");
    }
    // 週次レポート生成
    const report = getWeeklyReport(recs, getAllMeals(), getAllExercises());
    setWeeklyReport(report);
    // バックアップ経過日数チェック
    const lastBackup = localStorage.getItem("wm_last_backup");
    if (lastBackup) {
      const diff = Math.floor((new Date(today() + "T00:00:00").getTime() - new Date(lastBackup + "T00:00:00").getTime()) / 86400000);
      setBackupDays(diff);
    } else {
      // 一度もバックアップしていない場合、記録が3件以上あれば警告
      const recs = getWeightRecords();
      if (recs.length >= 3) setBackupDays(999);
    }
    setBackupDismissed(localStorage.getItem("wm_backup_dismissed_" + today()) === "1");
    setShowMealExercise(localStorage.getItem("wm_show_meal_exercise") !== "false");
    // 今週月曜日に既に閉じたかチェック（ローカルタイム基準）
    const thisMonday = (() => {
      const now = new Date();
      const dow = now.getDay();
      return addDays(today(), -((dow + 6) % 7));
    })();
    const dismissedKey = `wm_report_dismissed_${thisMonday}`;
    setReportDismissed(localStorage.getItem(dismissedKey) === "1");
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
    return () => {};
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
    setTimeout(() => setSaved(false), 5000);
  }

  function handleBackup() {
    const backup: Record<string, unknown> = {};
    BACKUP_KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      // JSON以外の生文字列（例: wm_activity_level の "low"）もそのまま保存
      if (v !== null) {
        try { backup[k] = JSON.parse(v); } catch { backup[k] = v; }
      }
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kotaro-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem("wm_last_backup", today());
    setBackupDays(0);
    setBackupDismissed(true);
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
  const age = profile.birthdate ? calcAge(profile.birthdate) : null;

  // 連続記録日数（ストリーク）— タイムゾーン安全な calcStreak を使用
  const streak = calcStreak(records.map((r) => r.date)).current;

  const isUnhealthyGoal =
    startWeight > 0 &&
    profile.goalWeight > 0 &&
    daysLeft > 0 &&
    (startWeight - profile.goalWeight) / (daysLeft / 7) / startWeight > 0.01;

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header gradient */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 pt-5 pb-6 px-4 rounded-b-3xl shadow-lg">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-white/60 text-sm font-medium">
              {now.toLocaleDateString("ja-JP", { year: "numeric" })}
            </div>
            <div className="text-2xl font-black" style={{ color: "#ffd8b0" }}>
              {now.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
            </div>
          </div>
          {streak >= 2 && (
            <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
              <div className="text-lg leading-none">🔥</div>
              <div className="text-white font-black text-sm leading-none">{streak}</div>
              <div className="text-white/70 text-[9px] mt-0.5">日連続</div>
            </div>
          )}
        </div>
        <h1 className="text-white text-lg font-black mb-4">今日の体重を記録</h1>

        <div className="bg-white/20 backdrop-blur rounded-2xl p-5 relative overflow-hidden">
          {/* 記録完了の紙吹雪 */}
          {saved && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={i}
                  className="confetti-piece"
                  style={{
                    left: `${(i * 37 + 13) % 100}%`,
                    background: ["#fbbf24", "#f472b6", "#34d399", "#60a5fa", "#fb923c", "#a78bfa"][i % 6],
                    animationDelay: `${(i % 10) * 0.13}s`,
                    animationDuration: `${2.6 + (i % 5) * 0.35}s`,
                    width: `${6 + (i % 3) * 2}px`,
                    height: `${9 + (i % 4) * 2}px`,
                  }}
                />
              ))}
            </div>
          )}
          {/* 記録済みの場合のみ右上に差分表示（未記録時はB表示を使う） */}
          {diff !== null && todayRecord && (
            <div className={`flex items-center justify-end gap-1 mb-1 text-sm font-bold ${
              diff > 0 ? "text-red-200" : diff < 0 ? "text-blue-200" : "text-white/70"
            }`}>
              {diff > 0 ? <TrendingUp size={16} /> : diff < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
              {diff > 0 ? "+" : ""}{diff.toFixed(1)}kg
            </div>
          )}
          <WeightPicker value={weightInput} onChange={setWeightInput} />

          {/* B: 前回との差分を目立たせる */}
          {(() => {
            const inputW = parseFloat(weightInput);
            if (!prevWeight || isNaN(inputW) || inputW <= 0) return null;
            const d = inputW - prevWeight;
            if (d === 0) return (
              <p className="text-center text-white/70 text-xs mb-2">前回と同じ {prevWeight}kg</p>
            );
            return (
              <div className={`flex items-center justify-center gap-1.5 mb-2 text-sm font-black ${
                d > 0 ? "text-red-200" : "text-blue-200"
              }`}>
                {d > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                <span>前回より {d > 0 ? "+" : ""}{d.toFixed(1)}kg</span>
                <span className="text-white/50 font-normal text-xs">（前回 {prevWeight}kg）</span>
              </div>
            );
          })()}

          {/* A: 異常値アラート（前回より±3kg以上） */}
          {(() => {
            const inputW = parseFloat(weightInput);
            if (!prevWeight || isNaN(inputW) || inputW <= 0) return null;
            const diff = Math.abs(inputW - prevWeight);
            if (diff < 3) return null;
            return (
              <div className="bg-yellow-400/90 rounded-xl px-3 py-2 mb-2 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <p className="text-yellow-900 text-xs font-black">
                  前回から{diff.toFixed(1)}kgの変化があります。入力を確認してください。
                </p>
              </div>
            );
          })()}

          <button
            onClick={handleSave}
            className="w-full bg-white text-teal-600 font-black py-3 rounded-xl text-base shadow active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-green-500">記録しました！🎉</span>
              </>
            ) : todayRecord ? (
              <>
                <Zap size={18} />
                更新する
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

        {/* バックアップ警告バナー */}
        {!backupDismissed && backupDays !== null && backupDays >= 7 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl">💾</span>
            <div className="flex-1">
              <p className="text-xs font-black text-amber-700">
                {backupDays === 999 ? "まだバックアップがありません" : `${backupDays}日間バックアップしていません`}
              </p>
              <p className="text-[11px] text-amber-600 mt-0.5">データを保護するためにバックアップを保存してください</p>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={handleBackup}
                className="bg-amber-400 text-white text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95"
              >
                <Download size={11} />保存
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("wm_backup_dismissed_" + today(), "1");
                  setBackupDismissed(true);
                }}
                className="text-[10px] text-amber-400 text-center"
              >
                あとで
              </button>
            </div>
          </div>
        )}

        {/* 週次レポート（先週データがあり、まだ閉じていない場合に表示） */}
        {weeklyReport && !reportDismissed && (
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-teal-600">
                📊 先週のレポート（{weeklyReport.weekStart.slice(5).replace("-", "/")}〜{weeklyReport.weekEnd.slice(5).replace("-", "/")}）
              </p>
              <button
                onClick={() => {
                  const dow = new Date().getDay();
                  const thisMonday = addDays(today(), -((dow + 6) % 7));
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
            <span className="font-black text-orange-500">{remaining.toFixed(1)}kg</span>
            {daysLeft > 0 ? (
              <>残り <span className="font-black text-blue-500">{daysLeft}日</span></>
            ) : (
              <span className="font-black text-gray-400">期限終了</span>
            )}
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

              {/* 達成予測日 */}
              {sortedRecords.length >= 5 && profile.goalWeight && currentWeight > profile.goalWeight && (() => {
                // 直近7件の平均変化速度
                const recent = sortedRecords.slice(-7);
                const dailyChange = recent.length >= 2
                  ? (recent[recent.length - 1].weight - recent[0].weight) / (recent.length - 1)
                  : 0;
                if (dailyChange >= 0) return (
                  <p className="text-xs text-gray-400 mt-1">📉 減量ペースが止まっています</p>
                );
                const daysNeeded = Math.ceil((currentWeight - profile.goalWeight) / Math.abs(dailyChange));
                const achieveDate = new Date();
                achieveDate.setDate(achieveDate.getDate() + daysNeeded);
                const label = achieveDate.toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
                return (
                  <p className="text-xs text-teal-600 font-black mt-1">
                    🎯 このペースなら <span className="text-orange-500">{label}</span> 達成予定
                  </p>
                );
              })()}
            </div>
          </div>
        </div>

        {/* カロリー収支カード */}
        {showMealExercise && (() => {
          const todayMeal = getAllMeals().find((m) => m.date === today());
          const todayExercise = getAllExercises().find((e) => e.date === today());
          const intake = todayMeal ? todayMeal.breakfast + todayMeal.lunch + todayMeal.dinner + todayMeal.snack : 0;
          const exerciseBurned = todayExercise ? todayExercise.entries.reduce((s, e) => s + e.calories, 0) : 0;
          const bmr = (age && profile.gender) ? calcBMR(currentWeight, profile.height, age, profile.gender) : 0;
          if (bmr === 0) return null;
          const totalBurned = bmr + exerciseBurned;
          const balance = totalBurned - intake;
          const maxVal = Math.max(totalBurned, intake, 1);
          const burnedPct = Math.min(100, (totalBurned / maxVal) * 100);
          const intakePct = Math.min(100, (intake / maxVal) * 100);
          const isDeficit = balance >= 0;
          const balanceLabel = isDeficit
            ? `${balance.toLocaleString()} kcal のマイナス 🎉`
            : `${Math.abs(balance).toLocaleString()} kcal オーバー ⚠️`;
          const monthlyKg = ((Math.abs(balance) * 30) / 7200).toFixed(1);
          const monthlyMsg = isDeficit
            ? `このペースなら月に約 ${monthlyKg}kg 減`
            : `このペースなら月に約 ${monthlyKg}kg 増`;
          return (
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <p className="text-sm font-black text-gray-700 mb-3">🔥 今日のカロリー収支</p>
              {/* 消費バー */}
              <div className="mb-2">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                  <span>消費 <span className="text-gray-400 text-[10px]">基礎{bmr.toLocaleString()} + 運動{exerciseBurned.toLocaleString()}</span></span>
                  <span className="font-black text-teal-600">{totalBurned.toLocaleString()} kcal</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <div className="h-4 rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-700" style={{ width: `${burnedPct}%` }} />
                </div>
              </div>
              {/* 摂取バー */}
              <div className="mb-3">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                  <span>摂取</span>
                  <span className={`font-black ${intake > 0 ? "text-orange-500" : "text-gray-300"}`}>
                    {intake > 0 ? `${intake.toLocaleString()} kcal` : "未記録"}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <div className="h-4 rounded-full bg-gradient-to-r from-orange-300 to-orange-500 transition-all duration-700" style={{ width: intake > 0 ? `${intakePct}%` : "0%" }} />
                </div>
              </div>
              {/* 収支結果 */}
              {intake > 0 ? (
                <div className={`rounded-xl px-4 py-2.5 text-center ${isDeficit ? "bg-teal-50" : "bg-red-50"}`}>
                  <p className={`text-sm font-black ${isDeficit ? "text-teal-600" : "text-red-500"}`}>{balanceLabel}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{monthlyMsg}</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-xs text-gray-400">食事を記録すると収支が表示されます</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* BMI */}
        {/* 現在体重が痩せすぎの時、こたろうの心配メッセージ */}
        {displayBmi !== null && displayBmi < 18.5 && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4">
            <div className="flex items-end gap-3 mb-3">
              <img src="/cat-sad.png" alt="こたろう" className="w-16 h-16 shrink-0 object-contain" />
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
