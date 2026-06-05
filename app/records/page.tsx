"use client";
import { useState, useEffect } from "react";
import { Trash2, TrendingDown, TrendingUp, Minus, Pencil, Check, X, Plus } from "lucide-react";
import WeightChart from "@/components/WeightChart";
import { getWeightRecords, saveWeightRecord } from "@/lib/storage";
import { WeightRecord } from "@/lib/types";
import { getProfile } from "@/lib/storage";
import { calcBMI, today } from "@/lib/calculations";

export default function RecordsPage() {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [height, setHeight] = useState(170);
  const [goalWeight, setGoalWeight] = useState<number | undefined>(undefined);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDateValue, setEditDateValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState(today());
  const [addWeight, setAddWeight] = useState("");

  const reload = () => {
    setRecords(getWeightRecords().slice().reverse());
    const p = getProfile();
    if (p) { setHeight(p.height); setGoalWeight(p.goalWeight); }
  };

  useEffect(() => {
    reload();
    // 画面復帰時・フォーカス時に再読み込み（他ページで保存した記録を反映）
    document.addEventListener("visibilitychange", reload);
    window.addEventListener("focus", reload);
    return () => {
      document.removeEventListener("visibilitychange", reload);
      window.removeEventListener("focus", reload);
    };
  }, []);

  function handleDelete(date: string) {
    const updated = records.filter((r) => r.date !== date);
    const sorted = [...updated].reverse();
    localStorage.setItem("wm_records", JSON.stringify(sorted));
    setRecords(updated);
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

    // 元の日付の記録を削除し、新しい日付で保存（日付が変わっていない場合は単に上書き）
    let updated = records.filter((r) => r.date !== oldDate);
    // 同じ日付に既に別の記録があれば上書き
    updated = updated.filter((r) => r.date !== editDateValue);
    updated.push({ date: editDateValue, weight: w, bmi });
    updated.sort((a, b) => b.date.localeCompare(a.date));

    const sorted = [...updated].reverse();
    localStorage.setItem("wm_records", JSON.stringify(sorted));
    setRecords(updated);
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
        <WeightChart records={allRecords} goalWeight={goalWeight} />

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
                      <div className="text-sm font-bold text-gray-700">{r.date}</div>
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
                      <button
                        onClick={() => handleDelete(r.date)}
                        className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
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
