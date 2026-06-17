"use client";
import { useState, useRef } from "react";
import { Scale, Target, Calendar, Flame, User, Cake, Calculator, Ruler, Upload } from "lucide-react";
import { Profile } from "@/lib/types";
import { saveProfile, saveWeightRecord } from "@/lib/storage";
import { today, calcBMR, calcAge, calcBMI } from "@/lib/calculations";
import BirthdateSelect from "@/components/BirthdateSelect";
import { ACTIVITY_LEVELS, DAILY_TARGET_DEFICIT } from "@/lib/constants";

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  // 次に来る12月31日（今日が12/31以降なら翌年）
  const now = new Date();
  const yearForDec31 = now.getMonth() === 11 && now.getDate() === 31
    ? now.getFullYear() + 1
    : now.getFullYear();
  const defaultGoalDate = `${yearForDec31}-12-31`;

  const [step, setStep] = useState(0); // 0:案内 / 1:基本情報
  const [importMsg, setImportMsg] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  const BACKUP_KEYS = ["wm_profile", "wm_records", "wm_meals", "wm_exercises", "wm_meal_dishes"];

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        BACKUP_KEYS.forEach((k) => {
          if (data[k] !== undefined) localStorage.setItem(k, JSON.stringify(data[k]));
        });
        setImportMsg("復元完了！読み込みます…");
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        setImportMsg("ファイルの形式が正しくありません");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }
  const [gender, setGender] = useState<"male" | "female">("male");
  const [birthdate, setBirthdate] = useState("");
  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [goalDate, setGoalDate] = useState(defaultGoalDate);
  const [targetCalories, setTargetCalories] = useState("1800");
  const [activityLevel, setActivityLevel] = useState("low");
  const [autoApplied, setAutoApplied] = useState(false);

  // 目標カロリー自動計算（設定画面と同じロジック・現在の体重を基準に計算）
  const age = birthdate ? calcAge(birthdate) : null;
  const bmr =
    age && Number(currentWeight) > 0 && Number(height) > 0
      ? calcBMR(Number(currentWeight), Number(height), age, gender)
      : null;
  const factor = ACTIVITY_LEVELS.find((a) => a.key === activityLevel)?.factor ?? 1.2;
  const tdee = bmr ? Math.round(bmr * factor) : null;
  const recommendedTarget = tdee ? Math.max(1200, tdee - DAILY_TARGET_DEFICIT) : null;
  function applyAutoCalorie() {
    if (recommendedTarget) {
      setTargetCalories(String(recommendedTarget));
      // 選んだ運動量を保存（設定画面の自動計算にも反映させる）
      try { localStorage.setItem("wm_activity_level", activityLevel); } catch {}
      setAutoApplied(true);
      setTimeout(() => setAutoApplied(false), 2000);
    }
  }

  function handleSubmit() {
    if (!height || !currentWeight || !goalWeight) return;
    const profile: Profile = {
      height: Number(height),
      goalWeight: Number(goalWeight),
      goalDate,
      notificationTime: "08:00",
      targetCalories: Number(targetCalories),
      birthdate: birthdate || undefined,
      gender,
    };
    saveProfile(profile);
    // 現在の体重を初期記録として保存（いきなり達成画面が出るのを防ぐ＝開始点になる）
    const w = Number(currentWeight);
    saveWeightRecord({ date: today(), weight: w, bmi: calcBMI(w, Number(height)) });
    // 運動量も保存して設定画面に反映（自動計算を使わなかった場合もデフォルト値を記録）
    try { localStorage.setItem("wm_activity_level", activityLevel); } catch {}
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-800 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">

        {/* ── STEP 0：ようこそ＆案内 ── */}
        {step === 0 && (
          <>
            <div className="text-center mb-3">
              <div className="relative inline-block">
                <span className="sparkle pointer-events-none" style={{ left: "-6%", top: "0%", fontSize: 18, animationDelay: "0s" }}>✨</span>
                <span className="sparkle pointer-events-none" style={{ left: "92%", top: "8%", fontSize: 20, animationDelay: "0.3s" }}>✨</span>
                <span className="sparkle pointer-events-none" style={{ left: "88%", top: "70%", fontSize: 16, animationDelay: "0.6s" }}>✨</span>
                <img
                  src="/cats/cat-4.png"
                  alt="こたろう"
                  className="h-20 w-auto mx-auto mb-1 select-none win-bounce"
                  draggable={false}
                />
              </div>
              <h1 className="text-xl font-black text-gray-800">こたろうダイエット</h1>
              <p className="text-gray-400 text-[11px] mt-0.5">猫と一緒に、ゆるく続ける体重管理</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3 bg-teal-50 rounded-xl p-2.5">
                <span className="text-xl">🐱</span>
                <div>
                  <p className="text-[13px] font-bold text-gray-700">こたろうと一緒にダイエット</p>
                  <p className="text-[10px] text-gray-500">目標に近づくほど、こたろうもスリムに！</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-teal-50 rounded-xl p-2.5">
                <span className="text-xl">✏️</span>
                <div>
                  <p className="text-[13px] font-bold text-gray-700">かんたん記録</p>
                  <p className="text-[10px] text-gray-500">タップ入力・「ざっくり」ワンタップもOK</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-2.5">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="text-[13px] font-bold text-gray-700">登録不要・広告なし</p>
                  <p className="text-[10px] text-gray-500">データは端末の中だけ。安心して使えます</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-black text-lg rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              はじめる 🚀
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">次の画面で基本情報を設定します（後から変更OK）</p>

            <button
              onClick={() => importRef.current?.click()}
              className="w-full py-3 mt-2 bg-gray-50 border-2 border-gray-200 text-gray-500 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-gray-100"
            >
              <Upload size={16} /> データを復元する
            </button>
            {importMsg && (
              <p className={`text-xs text-center font-bold mt-1 ${importMsg.includes("完了") ? "text-green-500" : "text-red-500"}`}>
                {importMsg}
              </p>
            )}
            <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </>
        )}

        {/* ── STEP 1：基本情報 ── */}
        {step === 1 && (
          <>
            <div className="text-center mb-4">
              <h1 className="text-xl font-black text-gray-800">基本情報を入力</h1>
              <p className="text-gray-400 text-xs mt-1">BMI・基礎代謝の計算に使います（後から変更できます）</p>
            </div>

            <div className="space-y-3">
              {/* 性別 */}
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-gray-600 mb-1">
                  <User size={13} className="text-teal-600" /> 性別
                </label>
                <div className="flex gap-2">
                  {(["male", "female"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
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
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-gray-600 mb-1">
                  <Cake size={13} className="text-teal-600" /> 誕生日
                </label>
                <BirthdateSelect value={birthdate} onChange={setBirthdate} />
              </div>

              {/* 身長 */}
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-gray-600 mb-1">
                  <Ruler size={13} className="text-teal-600" /> 身長 (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="170"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-center focus:border-teal-500 outline-none"
                />
              </div>

              {/* 現在の体重 */}
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-gray-600 mb-1">
                  <Scale size={13} className="text-teal-600" /> 現在の体重 (kg)
                </label>
                <input
                  type="number"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder="70"
                  step="0.1"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-center focus:border-teal-500 outline-none"
                />
              </div>

              {/* 目標体重 */}
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-gray-600 mb-1">
                  <Target size={13} className="text-teal-600" /> 目標体重 (kg)
                </label>
                <input
                  type="number"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  placeholder="65"
                  step="0.1"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-center focus:border-teal-500 outline-none"
                />
              </div>

              {/* 目標期限 */}
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-gray-600 mb-1">
                  <Calendar size={13} className="text-teal-600" /> 目標期限
                </label>
                <input
                  type="date"
                  value={goalDate}
                  min={today()}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="block w-full box-border appearance-none border-2 border-gray-200 rounded-xl px-3 py-2.5 text-base font-bold text-center focus:border-teal-500 outline-none"
                />
              </div>

              {/* 目標カロリー */}
              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-gray-600 mb-1">
                  <Flame size={13} className="text-teal-600" /> 1日の目標カロリー (kcal)
                </label>
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(e.target.value)}
                  placeholder="1800"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-center focus:border-teal-500 outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">迷ったら下で自動計算できます</p>
              </div>

              {/* 目標カロリー自動計算 */}
              <div className="bg-teal-50 rounded-2xl p-3">
                <p className="flex items-center gap-1 text-xs font-bold text-gray-600 mb-2">
                  <Calculator size={13} className="text-teal-600" /> 目標カロリーを自動計算
                </p>
                {bmr ? (
                  <>
                    <p className="text-[10px] text-gray-400 mb-1.5">運動以外の普段の活動量を選んでください</p>
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {ACTIVITY_LEVELS.map((a) => (
                        <button
                          key={a.key}
                          onClick={() => setActivityLevel(a.key)}
                          className={`py-1.5 px-2 rounded-lg text-left transition-all ${
                            activityLevel === a.key
                              ? "bg-gradient-to-r from-teal-500 to-teal-700 text-white shadow"
                              : "bg-white text-gray-500"
                          }`}
                        >
                          <div className="text-[11px] font-black">{a.label}</div>
                          <div className={`text-[8px] ${activityLevel === a.key ? "text-white/80" : "text-gray-400"}`}>{a.desc}</div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={applyAutoCalorie}
                      className={`w-full py-2 rounded-lg font-bold text-xs active:scale-95 transition-all ${
                        autoApplied ? "bg-green-500 text-white" : "bg-white text-teal-700 border border-teal-200"
                      }`}
                    >
                      {autoApplied ? "✓ 反映しました！" : `おすすめ ${recommendedTarget} kcal を設定`}
                    </button>
                  </>
                ) : (
                  <p className="text-[10px] text-gray-400 text-center py-1">
                    性別・誕生日・身長・現在の体重を入力すると計算できます
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep(0)}
                  className="px-5 py-3.5 bg-gray-100 text-gray-500 font-bold rounded-2xl active:scale-95 transition-transform"
                >
                  戻る
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!height || !currentWeight || !goalWeight}
                  className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-black text-base rounded-2xl shadow-lg disabled:opacity-40 active:scale-95 transition-transform"
                >
                  こたろうと始める 🐱
                </button>
              </div>
              {(!height || !currentWeight || !goalWeight) && (
                <p className="text-[10px] text-gray-400 text-center">※ 身長・現在の体重・目標体重は必須です</p>
              )}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
