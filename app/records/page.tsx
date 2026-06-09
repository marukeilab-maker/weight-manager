"use client";
import { useState, useEffect } from "react";
import { Trash2, TrendingDown, TrendingUp, Minus, Pencil, Check, X, Plus } from "lucide-react";
import WeightChart from "@/components/WeightChart";
import { getWeightRecords, saveWeightRecord, deleteWeightRecord, getAllMeals, getProfile } from "@/lib/storage";
import { WeightRecord } from "@/lib/types";
import { calcBMI, today, addDays } from "@/lib/calculations";

export default function RecordsPage() {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [height, setHeight] = useState(170);
  const [goalWeight, setGoalWeight] = useState<number | undefined>(undefined);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDateValue, setEditDateValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteDate, setConfirmDeleteDate] = useState<string | null>(null);
  const [addDate, setAddDate] = useState(today());
  const [addWeight, setAddWeight] = useState("");
  const [showMealExercise, setShowMealExercise] = useState(true);

  const reload = () => {
    setRecords(getWeightRecords().slice().reverse());
    const p = getProfile();
    if (p) { setHeight(p.height); setGoalWeight(p.goalWeight); }
  };

  useEffect(() => {
    reload();
    const v = localStorage.getItem("wm_show_meal_exercise");
    setShowMealExercise(v !== "false");
    const onChanged = () => setShowMealExercise(localStorage.getItem("wm_show_meal_exercise") !== "false");
    // 画面復帰時・フォーカス時に再読み込み（他ページで保存した記録を反映）
    document.addEventListener("visibilitychange", reload);
    window.addEventListener("focus", reload);
    window.addEventListener("wm_settings_changed", onChanged);
    return () => {
      document.removeEventListener("visibilitychange", reload);
      window.removeEventListener("focus", reload);
      window.removeEventListener("wm_settings_changed", onChanged);
    };
  }, []);

  function handleDelete(date: string) {
    deleteWeightRecord(date);
    setRecords(getWeightRecords().slice().reverse());
    setConfirmDeleteDate(null);
  }

  function startEdit(r: WeightRecord) {
    setEditingDate(r.date);
    setEditValue(String(r.weight));
    setEditDateValue(r.date);
  }

  function handleSaveEdit(oldDate: string) {
    const w = parseFloat(editValue);
    if (isNaN(w) || w <= 0 || !editDateValue) return;
    const bmi = calcBMI(w, height);

    // 元の日付が変わっている場合は古い記録を削除
    if (oldDate !== editDateValue) {
      deleteWeightRecord(oldDate);
    }
    // 新しい日付で保存（同日の既存記録は上書き）
    saveWeightRecord({ date: editDateValue, weight: w, bmi });
    setRecords(getWeightRecords().slice().reverse());
    setEditingDate(null);
    setEditValue("");
    setEditDateValue("");
  }

  function handleCancelEdit() {
    setEditingDate(null);
    setEditValue("");
    setEditDateValue("");
  }

  function handleAdd() {
    const w = parseFloat(addWeight);
    if (isNaN(w) || w <= 0 || !addDate) return;
    const bmi = calcBMI(w, height);
    saveWeightRecord({ date: addDate, weight: w, bmi });
    setRecords(getWeightRecords().slice().reverse());
    setAddWeight("");
    setAddDate(today());
    setShowAddForm(false);
  }

  const allRecords = [...records].reverse();

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-br from-blue-500 to-violet-500 pt-10 pb-6 px-4 rounded-b-3xl shadow-lg">
        <h1
          className="text-white text-3xl font-black tracking-wide"
          style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.08em" }}
        >
          WEIGHT JOURNEY
        </h1>
        <p className="text-white/70 text-xs mt-1 tracking-wider">{records.length} 日の軌跡</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <WeightChart records={allRecords} goalWeight={goalWeight} showCaloriesOption={showMealExercise} />

        {/* 月間サマリー + 食事パターン分析 */}
        {(() => {
          const meals = getAllMeals();
          if (meals.length === 0 || allRecords.length === 0) return null;

          // 過去30日の範囲
          const d30ago = addDays(today(), -30);
          const recentRecords = allRecords.filter(r => r.date >= d30ago);
          const recentMeals = meals.filter(m => m.date >= d30ago);

          if (recentRecords.length < 3) return null;

          // 月間体重変化
          const sorted30 = [...recentRecords].sort((a, b) => a.date.localeCompare(b.date));
          const monthDiff = sorted30.length >= 2
            ? Math.round((sorted30[sorted30.length - 1].weight - sorted30[0].weight) * 10) / 10
            : null;

          // 平均摂取カロリー（食事記録がある日）
          const mealDays = recentMeals.filter(m => m.breakfast + m.lunch + m.dinner + m.snack > 0);
          const avgCalories = mealDays.length > 0
            ? Math.round(mealDays.reduce((s, m) => s + m.breakfast + m.lunch + m.dinner + m.snack, 0) / mealDays.length)
            : 0;

          // 食事パターン分析
          const skipBreakfast = recentMeals.filter(m => m.breakfast === 0).length;
          const skipLunch = recentMeals.filter(m => m.lunch === 0).length;
          const skipDinner = recentMeals.filter(m => m.dinner === 0).length;
          const withSnack = recentMeals.filter(m => m.snack > 0).length;
          const total = recentMeals.length || 1;

          // 曜日別平均カロリー（どの曜日が一番多いか）
          const dayTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
          const dayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
          recentMeals.forEach(m => {
            const kcal = m.breakfast + m.lunch + m.dinner + m.snack;
            if (kcal > 0) {
              const dow = new Date(m.date + "T00:00:00").getDay();
              dayTotals[dow] += kcal;
              dayCounts[dow]++;
            }
          });
          const dayAvgs = dayTotals.map((t, i) => dayCounts[i] > 0 ? Math.round(t / dayCounts[i]) : 0);
          const maxDow = dayAvgs.indexOf(Math.max(...dayAvgs));
          const dowNames = ["日", "月", "火", "水", "木", "金", "土"];
          const maxDowKcal = dayAvgs[maxDow];

          return (
            <div className="space-y-3">
              {/* 月間サマリー */}
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <p className="text-xs font-black text-gray-400 mb-3">📅 過去30日のまとめ</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 rounded-xl py-3 text-center">
                    <p className="text-[10px] text-gray-400 mb-1">記録日数</p>
                    <p className="text-xl font-black text-gray-800">{recentRecords.length}<span className="text-xs font-normal text-gray-400">日</span></p>
                  </div>
                  <div className="bg-gray-50 rounded-xl py-3 text-center">
                    <p className="text-[10px] text-gray-400 mb-1">体重変化</p>
                    <p className={`text-xl font-black ${monthDiff === null ? "text-gray-400" : monthDiff < 0 ? "text-teal-600" : monthDiff > 0 ? "text-red-400" : "text-gray-500"}`}>
                      {monthDiff === null ? "−" : monthDiff > 0 ? `+${monthDiff}` : monthDiff}
                      {monthDiff !== null && <span className="text-xs font-normal text-gray-400">kg</span>}
                    </p>
                  </div>
                  {showMealExercise && (
                    <div className="bg-gray-50 rounded-xl py-3 text-center">
                      <p className="text-[10px] text-gray-400 mb-1">平均摂取</p>
                      <p className="text-xl font-black text-orange-500">
                        {avgCalories > 0 ? avgCalories : "−"}
                        {avgCalories > 0 && <span className="text-xs font-normal text-gray-400">kcal</span>}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 食事パターン分析 */}
              {showMealExercise && recentMeals.length >= 5 && (
                <div className="bg-white rounded-2xl shadow-lg p-4">
                  <p className="text-xs font-black text-gray-400 mb-3">🔍 食事パターン分析</p>
                  <div className="space-y-3">
                    {/* 食事スキップ率 */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-2">食事スキップ率（過去30日）</p>
                      {[
                        { label: "🌅 朝食", skip: skipBreakfast, icon: "amber" },
                        { label: "☀️ 昼食", skip: skipLunch, icon: "orange" },
                        { label: "🌙 夕食", skip: skipDinner, icon: "indigo" },
                      ].map(({ label, skip }) => {
                        const pct = Math.round((skip / total) * 100);
                        return (
                          <div key={label} className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs text-gray-500 w-14 shrink-0">{label}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${pct > 50 ? "bg-red-400" : pct > 20 ? "bg-amber-400" : "bg-teal-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-black w-8 text-right ${pct > 50 ? "text-red-500" : pct > 20 ? "text-amber-500" : "text-teal-500"}`}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-gray-50 pt-3 space-y-2">
                      {/* 間食傾向 */}
                      <div className="flex items-center justify-between bg-pink-50 rounded-xl px-3 py-2">
                        <span className="text-xs font-bold text-gray-600">🍪 間食した日</span>
                        <span className="text-sm font-black text-pink-500">{Math.round((withSnack / total) * 100)}%</span>
                      </div>
                      {/* 最もカロリーが多い曜日 */}
                      {maxDowKcal > 0 && (
                        <div className="flex items-center justify-between bg-orange-50 rounded-xl px-3 py-2">
                          <span className="text-xs font-bold text-gray-600">📈 摂取が多い曜日</span>
                          <span className="text-sm font-black text-orange-500">{dowNames[maxDow]}曜日 <span className="text-xs font-normal text-gray-400">avg {maxDowKcal}kcal</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 過去の体重を追加 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Plus size={18} /> 過去の体重を追加
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500">📅 日付と体重を入力</p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={addDate}
                  max={today()}
                  onChange={(e) => setAddDate(e.target.value)}
                  className="flex-1 min-w-0 box-border appearance-none border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 transition-colors"
                />
                <div className="flex items-center border-2 border-gray-200 rounded-xl focus-within:border-blue-400 transition-colors">
                  <input
                    type="number"
                    step="0.1"
                    value={addWeight}
                    onChange={(e) => setAddWeight(e.target.value)}
                    placeholder="60.0"
                    className="w-20 px-2 py-2 text-sm font-bold text-center outline-none bg-transparent"
                  />
                  <span className="text-xs text-gray-400 pr-2">kg</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddForm(false); setAddWeight(""); setAddDate(today()); }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl active:scale-95 transition-all"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!addWeight || !addDate}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold rounded-xl disabled:opacity-40 active:scale-95 transition-all"
                >
                  追加する
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center">※ 同じ日付の記録は上書きされます</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {records.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-4xl mb-2">📝</p>
              <p>記録がありません</p>
            </div>
          ) : (
            records.map((r, i) => {
              const next = records[i + 1];
              const diff = next ? r.weight - next.weight : null;
              const isEditing = editingDate === r.date;

              return (
                <div key={r.date} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editDateValue}
                        max={today()}
                        onChange={(e) => setEditDateValue(e.target.value)}
                        className="max-w-full box-border appearance-none text-sm font-bold text-gray-700 border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-teal-500"
                      />
                    ) : (
                      <div className="text-sm font-bold text-gray-700">
                      {new Date(r.date + "T00:00:00").toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
                    </div>
                    )}
                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          step="0.1"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 text-xl font-black text-teal-600 border-b-2 border-teal-500 outline-none bg-transparent"
                          autoFocus
                        />
                        <span className="text-sm text-gray-400">kg</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-2xl font-black text-gray-900">{r.weight}kg</span>
                        <span className="text-xs text-gray-400">BMI {r.bmi}</span>
                        {diff !== null && (
                          <span className={`text-xs font-bold flex items-center gap-0.5 ${
                            diff > 0 ? "text-red-400" : diff < 0 ? "text-blue-400" : "text-gray-400"
                          }`}>
                            {diff > 0 ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                            {diff > 0 ? "+" : ""}
                            {diff.toFixed(1)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSaveEdit(r.date)}
                        className="p-2 text-green-500 hover:text-green-600 transition-colors"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-gray-300 hover:text-gray-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(r)}
                        className="p-2 text-gray-300 hover:text-teal-500 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      {confirmDeleteDate === r.date ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(r.date)}
                            className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg active:scale-95 transition-all"
                          >
                            削除
                          </button>
                          <button
                            onClick={() => setConfirmDeleteDate(null)}
                            className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg active:scale-95 transition-all"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteDate(r.date)}
                          className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* フッターロゴ */}
        <div className="flex justify-center pt-5 pb-3">
          <img src="/logo-footer.png" alt="こたろうダイエット" className="h-20 w-auto select-none opacity-90" draggable={false} />
        </div>
      </div>
    </div>
  );
}
