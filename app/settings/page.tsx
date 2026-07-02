"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Scale, Target, Calendar, Flame, CheckCircle, Download, Upload, Cake, User, AlertTriangle, Calculator, Trash2, HelpCircle, Shield, Weight } from "lucide-react";
import { getProfile, saveProfile, getWeightRecords, saveWeightRecord } from "@/lib/storage";
import { today, calcBMR, calcAge, daysBetween, addDays, calcBMI } from "@/lib/calculations";
import { APP_VERSION } from "@/lib/version";
import { BACKUP_KEYS, ACTIVITY_LEVELS, DAILY_TARGET_DEFICIT } from "@/lib/constants";
import { validateBackup } from "@/lib/backupValidation";
import BirthdateSelect from "@/components/BirthdateSelect";

// 1ヶ月後の日付（ローカルタイム基準。toISOStringはUTCで日付がずれるため使わない）
function oneMonthLater(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function SettingsPage() {
  const [height, setHeight] = useState("170");
  const [goalWeight, setGoalWeight] = useState("65");
  const [goalDate, setGoalDate] = useState("");
  const [targetCalories, setTargetCalories] = useState("1800");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importError, setImportError] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [activityLevel, setActivityLevel] = useState("low");
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [currentWeightInput, setCurrentWeightInput] = useState("");
  const [todayRecorded, setTodayRecorded] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showMealExercise, setShowMealExercise] = useState(true);
  const [maintenanceInfo, setMaintenanceInfo] = useState<{ startDate: string; baseWeight: number } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const LAST_BACKUP_KEY = "wm_last_backup";

  function handleExport() {
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
    a.download = `weight-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const now = today();
    localStorage.setItem(LAST_BACKUP_KEY, now);
    setLastBackup(now);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const check = validateBackup(data);
        if (!check.ok) {
          setImportError(true);
          setImportMsg(check.reason);
          return;
        }
        BACKUP_KEYS.forEach((k) => {
          if (data[k] !== undefined) {
            const val = data[k];
            // 生文字列はそのまま、それ以外はJSONとして復元
            localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
          }
        });
        setImportError(false);
        setImportMsg("復元完了！再読み込みします…");
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        setImportError(true);
        setImportMsg("ファイルの形式が正しくありません");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // 全データをリセット（最初からやり直す）
  async function handleReset() {
    try {
      localStorage.clear(); // このアプリのデータを全消去
    } catch {
      /* noop */
    }
    // PWAのキャッシュ・Service Workerも消去（古い画面が残る問題対策）
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {
      /* noop */
    }
    // キャッシュを避けて初回画面を確実に読み込む
    window.location.href = "/?fresh=" + Date.now();
  }

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setHeight(p.height != null ? String(p.height) : "");
      setGoalWeight(p.goalWeight != null ? String(p.goalWeight) : "");
      setGoalDate(p.goalDate ?? "");
      setTargetCalories(p.targetCalories != null ? String(p.targetCalories) : "");
      if (p.birthdate) setBirthdate(p.birthdate);
      if (p.gender) setGender(p.gender);
    } else {
      setGoalDate(oneMonthLater());
    }
    setLastBackup(localStorage.getItem(LAST_BACKUP_KEY));
    const showME = localStorage.getItem("wm_show_meal_exercise");
    if (showME !== null) setShowMealExercise(showME !== "false");
    // 活動レベルの保存値を復元
    const savedActivity = localStorage.getItem("wm_activity_level");
    if (savedActivity) setActivityLevel(savedActivity);
    // 維持モードの状態を復元
    try {
      const m = localStorage.getItem("wm_maintenance");
      setMaintenanceInfo(m ? JSON.parse(m) : null);
    } catch { setMaintenanceInfo(null); }
    // 最新体重を取得
    const recs = getWeightRecords();
    if (recs.length) setCurrentWeight(recs[recs.length - 1].weight);
    // 今日すでに記録済みか確認
    setTodayRecorded(recs.some((r) => r.date === today()));
  }, []);

  // TDEE計算（基礎代謝 × 活動係数）
  const age = birthdate ? calcAge(birthdate) : null;
  const weightForCalc = currentWeight ?? Number(goalWeight) ?? 0;
  const bmr = age && weightForCalc && Number(height)
    ? calcBMR(weightForCalc, Number(height), age, gender)
    : null;
  const factor = ACTIVITY_LEVELS.find((a) => a.key === activityLevel)?.factor ?? 1.2;
  const tdee = bmr ? Math.round(bmr * factor) : null;
  // 減量目標：TDEEから目標不足分マイナス（健康的なペース ≒ -0.5kg/週）
  const recommendedTarget = tdee ? Math.max(1200, tdee - DAILY_TARGET_DEFICIT) : null;

  function applyAutoCalorie() {
    if (!recommendedTarget) return;
    setTargetCalories(String(recommendedTarget));
    localStorage.setItem("wm_activity_level", activityLevel);
    // 「保存する」を押し忘れても反映されるよう即保存
    const existingNotificationTime = getProfile()?.notificationTime ?? "08:00";
    saveProfile({
      height: Number(height),
      goalWeight: Number(goalWeight),
      goalDate: goalDate || oneMonthLater(),
      notificationTime: existingNotificationTime,
      targetCalories: recommendedTarget,
      birthdate: birthdate || undefined,
      gender,
    });
    setAutoApplied(true);
    setTimeout(() => setAutoApplied(false), 2000);
  }

  // 美容体重・健康体重チェック
  const h = Number(height) / 100; // メートル
  const beautyWeight = h > 0 ? +(h * h * 20).toFixed(1) : 0;  // BMI 20
  const minHealthyWeight = h > 0 ? +(h * h * 18.5).toFixed(1) : 0; // BMI 18.5

  // 目標ペースの健康チェック（無理な目標の警告）
  const gw = Number(goalWeight);
  const cw = currentWeight ?? 0;
  const daysToGoal = goalDate ? daysBetween(today(), goalDate) : 0;
  const weeksToGoal = daysToGoal / 7;
  const toLose = cw > 0 && gw > 0 ? cw - gw : 0;
  let goalWarning: null | { reqPerWeek: number; healthyMax: number; ratio: number; safeDate: string; severe: boolean } = null;
  if (cw > 0 && gw > 0 && toLose > 0 && weeksToGoal > 0) {
    const reqPerWeek = toLose / weeksToGoal;       // 必要な週間減量
    const healthyMax = cw * 0.01;                   // 健康的上限（体重の1%/週）
    const ratio = reqPerWeek / healthyMax;
    if (ratio > 1) {
      const safeDays = Math.ceil((toLose / (cw * 0.01)) * 7); // 安全に必要な日数
      goalWarning = {
        reqPerWeek,
        healthyMax,
        ratio,
        safeDate: addDays(today(), safeDays),
        severe: ratio > 1.6,
      };
    }
  }

  // 最終バックアップからの日数
  const daysSinceBackup = lastBackup
    ? Math.floor((new Date(today() + "T00:00:00").getTime() - new Date(lastBackup + "T00:00:00").getTime()) / 86400000)
    : null;
  const needsBackup = daysSinceBackup === null || daysSinceBackup >= 30;

  function handleSave() {
    const parsedGoalDate = goalDate || oneMonthLater();
    const existingNotificationTime = getProfile()?.notificationTime ?? "08:00";
    saveProfile({
      height: Number(height),
      goalWeight: Number(goalWeight),
      goalDate: parsedGoalDate,
      notificationTime: existingNotificationTime,
      targetCalories: Number(targetCalories),
      birthdate: birthdate || undefined,
      gender,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-br from-gray-600 to-gray-800 pt-10 pb-6 px-4 rounded-b-3xl shadow-lg">
        <h1 className="text-white text-2xl font-black">設定 ⚙️</h1>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {/* ── 基本情報 ── */}
        <p className="text-xs font-black text-gray-400 tracking-wide pt-1 pl-1">基本情報</p>

        {/* 性別 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-3">
            <User size={14} className="text-teal-600" /> 性別
          </label>
          <div className="flex gap-3">
            {(["male", "female"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 py-3 rounded-xl font-black text-base transition-all ${
                  gender === g
                    ? "bg-gradient-to-r from-teal-500 to-teal-700 text-white shadow"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {g === "male" ? "男性" : "女性"}
              </button>
            ))}
          </div>
        </div>

        {/* 誕生日 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-2">
            <Cake size={14} className="text-teal-600" /> 誕生日
          </label>
          <BirthdateSelect key={birthdate || "empty"} value={birthdate} onChange={setBirthdate} />
        </div>

        {/* スタート体重 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-1">
            <Weight size={14} className="text-teal-600" /> スタート体重 (kg)
          </label>
          <p className="text-[11px] text-gray-400 mb-2">
            基礎代謝・カロリー計算の基準になります。
            {!todayRecorded && <span className="text-teal-600 font-bold"> 初回設定時に入力してください。</span>}
          </p>

          {todayRecorded ? (
            /* 今日記録済み → ホームへ誘導 */
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-teal-700">今日の体重は記録済みです ✅</p>
                <p className="text-[11px] text-teal-500 mt-0.5">現在の記録：{currentWeight}kg</p>
                <p className="text-[11px] text-gray-400 mt-0.5">毎日の体重はホーム画面から記録してください</p>
              </div>
            </div>
          ) : (
            /* 未記録 → 入力フォーム表示 */
            <>
              {currentWeight && (
                <p className="text-xs text-teal-600 font-bold mb-2">直近の記録：{currentWeight}kg</p>
              )}
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={currentWeightInput}
                  onChange={(e) => setCurrentWeightInput(e.target.value)}
                  placeholder={currentWeight ? String(currentWeight) : "例: 60.0"}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-black text-center focus:border-teal-500 outline-none"
                />
                <button
                  onClick={() => {
                    const w = parseFloat(currentWeightInput);
                    if (isNaN(w) || w <= 0) return;
                    const h = Number(height);
                    const bmi = h > 0 ? calcBMI(w, h) : 0;
                    saveWeightRecord({ date: today(), weight: w, bmi });
                    setCurrentWeight(w);
                    setCurrentWeightInput("");
                    setTodayRecorded(true);
                  }}
                  disabled={!currentWeightInput}
                  className="px-5 py-3 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-black rounded-xl disabled:opacity-40 active:scale-95 transition-all text-sm"
                >
                  記録
                </button>
              </div>
            </>
          )}
        </div>

        {/* 身長 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-2">
            <Scale size={14} className="text-teal-600" /> 身長 (cm)
          </label>
          <input
            type="number"
            value={height}
            placeholder="170"
            onChange={(e) => setHeight(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-black text-center focus:border-teal-500 outline-none"
          />
        </div>

        {/* ── 目標設定 ── */}
        <p className="text-xs font-black text-gray-400 tracking-wide pt-2 pl-1">目標設定</p>

        {/* 維持モード中バナー */}
        {maintenanceInfo && (
          <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-black text-teal-700">🛡️ 維持モード中</p>
              <span className="text-xs text-teal-500 font-bold">
                {(() => {
                  const d = new Date(maintenanceInfo.startDate + "T00:00:00");
                  return `${d.getMonth() + 1}月${d.getDate()}日から`;
                })()}
              </span>
            </div>
            <p className="text-xs text-teal-600 mb-3">
              基準体重 {maintenanceInfo.baseWeight}kg をキープ中。解除すると通常の目標モードに戻ります。
            </p>
            <button
              onClick={() => {
                localStorage.removeItem("wm_maintenance");
                setMaintenanceInfo(null);
              }}
              className="w-full py-2.5 bg-white border border-teal-300 text-teal-600 font-bold rounded-xl text-sm active:scale-95 transition-all"
            >
              維持モードを解除して新しい目標に挑戦する
            </button>
          </div>
        )}

        {/* 目標体重 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-2">
            <Target size={14} className="text-teal-600" /> 目標体重 (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={goalWeight}
            placeholder="65"
            onChange={(e) => setGoalWeight(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-black text-center focus:border-teal-500 outline-none"
          />
        </div>

        {/* 目標期限 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-2">
            <Calendar size={14} className="text-teal-600" /> 目標期限
          </label>
          <input
            type="date"
            value={goalDate}
            min={today()}
            onChange={(e) => setGoalDate(e.target.value)}
            className="block w-full box-border appearance-none border-2 border-gray-200 rounded-xl px-3 py-3 text-lg font-black text-center focus:border-teal-500 outline-none"
          />
        </div>

        {/* 健康被害警告（BMI 18.5未満） */}
        {h > 0 && gw > 0 && gw < minHealthyWeight && (
          <div className="rounded-2xl border-2 border-red-400 bg-red-50 overflow-hidden">
            {/* こたろうの吹き出し */}
            <div className="flex items-end gap-3 px-4 pt-4 pb-3 border-b border-red-200">
              <img src="/cat-sad.png" alt="こたろう" className="w-14 h-14 shrink-0 object-contain" />
              <div className="relative bg-white border-2 border-red-300 rounded-2xl rounded-bl-none px-3 py-2 flex-1">
                <p className="text-xs font-black text-red-600 leading-relaxed">
                  ちょっと待って！{gw}kg はやせすぎにゃ…😿<br />
                  こたろう、心配で眠れないにゃ。<br />
                  お願いだから、目標を見直してほしいにゃ🙏
                </p>
              </div>
            </div>
            {/* 詳細情報 */}
            <div className="px-4 py-3 text-xs leading-relaxed">
              <p className="font-black text-red-700 mb-1">🚨 健康被害のリスクがあります</p>
              <p className="text-red-700 font-bold mb-1">
                目標体重 {gw}kg は BMI 18.5 を下回っており、医学的に「低体重（痩せ）」の範囲です。
              </p>
              <p className="text-gray-700 mb-1.5">この体重域では以下のリスクが高まります：</p>
              <ul className="text-gray-700 space-y-0.5 mb-2 pl-3 list-disc">
                <li>貧血・免疫力の低下</li>
                <li>骨密度の低下・骨粗しょう症</li>
                <li>生理不順・ホルモンバランスの乱れ</li>
                <li>筋肉量の著しい低下</li>
                <li>摂食障害のリスク</li>
              </ul>
              <p className="text-red-600 font-bold">
                💡 健康を守る最低ラインは {minHealthyWeight}kg（BMI 18.5）です。目標体重の見直しを強くおすすめします。
              </p>
              <p className="text-gray-400 mt-1.5 text-[10px]">
                ※ 気になる症状がある場合は医師にご相談ください。
              </p>
            </div>
          </div>
        )}

        {/* 美容体重警告（BMI 18.5以上 20未満） */}
        {h > 0 && gw > 0 && gw >= minHealthyWeight && gw < beautyWeight && (
          <div className="rounded-2xl border border-pink-200 bg-pink-50 overflow-hidden">
            {/* こたろうの吹き出し */}
            <div className="flex items-end gap-3 px-4 pt-4 pb-3 border-b border-pink-100">
              <div className="text-4xl shrink-0">🐱</div>
              <div className="relative bg-white border border-pink-200 rounded-2xl rounded-bl-none px-3 py-2 flex-1">
                <p className="text-xs font-black text-pink-600 leading-relaxed">
                  うーん、{gw}kg は美容的にちょっと気になるにゃ💄<br />
                  健康な範囲だけど、筋肉も一緒に落ちちゃうかも。<br />
                  {beautyWeight}kg あたりを目指した方がキレイにゃ✨
                </p>
              </div>
            </div>
            {/* 詳細情報 */}
            <div className="px-4 py-3 text-xs leading-relaxed">
              <p className="font-black text-pink-600 mb-1">💄 美容体重を下回っています</p>
              <p className="text-gray-600 mb-1.5">
                目標体重 {gw}kg は「美容体重」({beautyWeight}kg / BMI 20) を下回っています。
                健康範囲内ではありますが、見た目の印象への影響が出やすくなります。
              </p>
              <ul className="text-gray-600 space-y-0.5 mb-2 pl-3 list-disc">
                <li>頬・顔のこけ、老け見えが出やすくなる</li>
                <li>髪のツヤ・肌のハリが失われやすい</li>
                <li>筋肉量の減少で体のラインが崩れることも</li>
              </ul>
              <p className="text-pink-600 font-bold">
                💡 美しく痩せるためには、筋トレと高タンパク食を組み合わせて筋肉を保つことが大切です。
                美容体重 {beautyWeight}kg を目安に、無理のない範囲で進めましょう。
              </p>
            </div>
          </div>
        )}

        {/* 目標ペースの健康警告 */}
        {goalWarning && (
          <div
            className={`rounded-2xl p-4 border ${
              goalWarning.severe
                ? "bg-red-50 border-red-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={18}
                className={`shrink-0 mt-0.5 ${goalWarning.severe ? "text-red-500" : "text-yellow-600"}`}
              />
              <div className="text-xs leading-relaxed">
                <p className={`font-black mb-1 ${goalWarning.severe ? "text-red-600" : "text-yellow-700"}`}>
                  {goalWarning.severe ? "⚠️ かなり無理のある目標です" : "⚠️ ペースがやや速めです"}
                </p>
                <p className="text-gray-600">
                  この目標では <span className="font-bold">週 約{goalWarning.reqPerWeek.toFixed(1)}kg</span> 減らす必要があり、
                  健康的な上限 <span className="font-bold">週 {goalWarning.healthyMax.toFixed(1)}kg</span>（体重の1%）を超えています。
                </p>
                {goalWarning.severe && (
                  <p className="text-red-600 font-bold mt-1">
                    急激な減量は筋肉減少・体調不良・リバウンドの原因になります。
                  </p>
                )}
                <p className="text-gray-600 mt-1.5">
                  💡 安全に達成するには、期限を <span className="font-bold text-blue-600">{(() => {
                    const d = new Date(goalWarning.safeDate + "T00:00:00");
                    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
                  })()}</span> 以降にするか、目標体重を見直しましょう。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1日の目標カロリー */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-2">
            <Flame size={14} className="text-teal-600" /> 1日の目標カロリー (kcal)
          </label>
          <input
            type="number"
            value={targetCalories}
            placeholder="1800"
            onChange={(e) => setTargetCalories(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-black text-center focus:border-teal-500 outline-none"
          />
        </div>

        {/* 目標カロリー自動計算 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-3">
            <Calculator size={14} className="text-teal-600" /> 目標カロリーの自動計算
          </label>

          {bmr ? (
            <>
              <p className="text-[11px] text-gray-400 mb-2">運動以外の普段の活動量を選んでください<br />（運動した分は運動記録から自動で加算されます）</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {ACTIVITY_LEVELS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setActivityLevel(a.key)}
                    className={`py-2 px-2 rounded-xl text-left transition-all ${
                      activityLevel === a.key
                        ? "bg-gradient-to-r from-teal-500 to-teal-700 text-white shadow"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <div className="text-xs font-black">{a.label}</div>
                    <div className={`text-[9px] ${activityLevel === a.key ? "text-white/80" : "text-gray-400"}`}>{a.desc}</div>
                  </button>
                ))}
              </div>

              {/* 計算結果 */}
              <div className="bg-teal-50 rounded-xl p-3 mb-3">
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-[9px] text-gray-500 mb-0.5">基礎代謝</div>
                    <div className="text-sm font-black text-gray-700">{bmr}</div>
                  </div>
                  <div className="border-x border-teal-200">
                    <div className="text-[9px] text-gray-500 mb-0.5">消費目安</div>
                    <div className="text-sm font-black text-gray-700">{tdee}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-teal-600 mb-0.5 font-bold">減量目標</div>
                    <div className="text-sm font-black text-amber-600">{recommendedTarget}</div>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 text-center mt-2">
                  消費目安より約500kcal少なめ＝健康的に約0.5kg/週ペース
                </p>
              </div>

              <button
                onClick={applyAutoCalorie}
                className={`w-full py-2.5 font-bold rounded-xl active:scale-95 transition-all text-sm ${
                  autoApplied
                    ? "bg-green-500 text-white"
                    : "bg-gradient-to-r from-teal-500 to-teal-700 text-white"
                }`}
              >
                {autoApplied
                  ? "✓ 目標カロリーに反映しました！"
                  : `この値（${recommendedTarget} kcal）を目標に設定`}
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">
              身長・誕生日・性別を入力し、体重を1回記録すると自動計算できます
            </p>
          )}
        </div>

        {/* ── 表示設定 ── */}
        <p className="text-xs font-black text-gray-400 tracking-wide pt-2 pl-1">表示設定</p>
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">食事・運動タブを表示</p>
              <p className="text-[10px] text-gray-400 mt-0.5">体重記録だけ使う場合はOFFにできます</p>
            </div>
            <button
              onClick={() => {
                const next = !showMealExercise;
                setShowMealExercise(next);
                localStorage.setItem("wm_show_meal_exercise", String(next));
                window.dispatchEvent(new Event("wm_settings_changed"));
              }}
              className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${
                showMealExercise ? "bg-orange-500" : "bg-gray-200"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                showMealExercise ? "translate-x-6" : "translate-x-0"
              }`} />
            </button>
          </div>
        </div>

        {/* ── データ管理 ── */}
        <p className="text-xs font-black text-gray-400 tracking-wide pt-2 pl-1">データ管理</p>

        {/* バックアップ */}
        <div className="bg-white rounded-2xl shadow-lg p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-500">データのバックアップ</p>
            {lastBackup && (
              <p className="text-[10px] text-gray-400">
                最終: {lastBackup}（{daysSinceBackup}日前）
              </p>
            )}
          </div>

          {/* バックアップ警告バナー */}
          {needsBackup && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 flex items-start gap-2">
              <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-yellow-700 leading-snug">
                {lastBackup ? (
                  <>
                    <strong>{daysSinceBackup}日間</strong>バックアップしていません。
                    ブラウザのデータを消去すると全データが失われます。
                  </>
                ) : (
                  <>
                    まだ一度もバックアップしていません。
                    ブラウザのデータが消えると全記録が失われるため、定期的なエクスポートをおすすめします。
                  </>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleExport}
            className={`w-full py-3 flex items-center justify-center gap-2 font-bold rounded-xl active:scale-95 transition-all text-sm ${
              needsBackup
                ? "bg-gradient-to-r from-teal-500 to-teal-700 text-white shadow"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
          >
            <Download size={16} /> データをエクスポート（JSON）
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="w-full py-3 flex items-center justify-center gap-2 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 active:scale-95 transition-all text-sm"
          >
            <Upload size={16} /> データをインポート（復元）
          </button>
          <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          {importMsg && <p className={`text-xs text-center font-bold ${importError ? "text-red-500" : "text-green-500"}`}>{importMsg}</p>}
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-black text-lg rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <CheckCircle size={20} />
              保存しました！
            </>
          ) : (
            "保存する"
          )}
        </button>

        {/* ── ヘルプ・規約 ── */}
        <p className="text-xs font-black text-gray-400 tracking-wide pt-2 pl-1">ヘルプ・規約</p>
        <Link
          href="/support"
          className="flex items-center gap-3 bg-white rounded-2xl shadow-lg p-4 active:scale-[0.98] transition-transform"
        >
          <HelpCircle size={18} className="text-teal-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-700">使い方・サポート</p>
            <p className="text-[10px] text-gray-400">よくある質問・お問い合わせ</p>
          </div>
          <span className="text-gray-300 text-lg">›</span>
        </Link>
        <Link
          href="/privacy"
          className="flex items-center gap-3 bg-white rounded-2xl shadow-lg p-4 active:scale-[0.98] transition-transform"
        >
          <Shield size={18} className="text-gray-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-700">プライバシーポリシー</p>
            <p className="text-[10px] text-gray-400">データの取扱いについて</p>
          </div>
          <span className="text-gray-300 text-lg">›</span>
        </Link>

        {/* こたろうダイエット & 制作元（同じ幅・中央揃え） */}
        <div className="flex flex-col items-center pt-6 pb-4">
          {/* こたろうダイエット ロゴ（主役） */}
          <img src="/logo-footer.png" alt="こたろうダイエット" className="w-64 h-auto select-none" draggable={false} />
          <p className="text-[10px] text-gray-500 font-bold tracking-wider -mt-2">Version {APP_VERSION}</p>

          <p className="text-[9px] font-bold text-gray-400 tracking-[0.3em] mt-8 mb-1">— CRAFTED BY —</p>

          {/* 会社名：32px・やや右へ */}
          <h2
            className="w-52 text-center tracking-[0.1em] font-normal pl-3"
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "32px",
              background: "linear-gradient(135deg, #000000 0%, #2a2a2a 50%, #000000 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: `
                0 1px 0 rgba(255,255,255,0.8),
                0 1px 2px rgba(0,0,0,0.25),
                0 3px 6px rgba(0,0,0,0.15)
              `,
            }}
          >
            MARUKEI LAB.
          </h2>

          <p className="text-[9px] text-gray-300 tracking-wider mt-2">© 2026 ALL RIGHTS RESERVED</p>
        </div>

        {/* データリセット（誤操作防止のため最下部・2段階確認） */}
        <div className="pt-2 pb-6">
          {!confirmReset ? (
            <>
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full py-2.5 flex items-center justify-center gap-2 text-red-400 font-bold rounded-xl active:scale-95 transition-all text-xs border border-red-100"
              >
                <Trash2 size={14} /> 全データをリセット
              </button>
              <p className="text-[9px] text-gray-300 mt-1.5 text-center leading-relaxed">
                体重・食事・運動・設定をすべて削除して初期状態に戻します<br />
                （取り消せません。念のため先にエクスポートを）
              </p>
            </>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-bold text-red-600 text-center mb-3">
                本当に全データを削除しますか？<br />
                <span className="text-[10px] font-normal text-red-400">この操作は取り消せません</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-2.5 bg-white text-gray-600 font-bold rounded-xl text-sm active:scale-95 transition-all"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm active:scale-95 transition-all"
                >
                  削除して最初から
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
