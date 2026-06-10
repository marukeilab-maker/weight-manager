"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Flame, Timer, ChevronLeft, ChevronRight, History } from "lucide-react";
import { getExerciseRecord, saveExerciseRecord, getWeightRecords, getProfile, getAllExercises } from "@/lib/storage";
import { today, addDays } from "@/lib/calculations";
import { MET_VALUES, calcBurnedCalories } from "@/lib/calculations";
import { ExerciseEntry, ExerciseRecord } from "@/lib/types";

const EXERCISES = [
  { key: "ウォーキング", icon: "🚶", color: "from-lime-400 to-green-500" },
  { key: "速歩",         icon: "🏃", color: "from-green-400 to-teal-500" },
  { key: "ランニング",   icon: "🏅", color: "from-teal-400 to-cyan-500"  },
  { key: "水泳",         icon: "🏊", color: "from-cyan-400 to-blue-500"  },
  { key: "サイクリング", icon: "🚴", color: "from-blue-400 to-violet-500"},
  { key: "筋トレ",       icon: "💪", color: "from-violet-400 to-purple-500"},
  { key: "ストレッチ",   icon: "🧘", color: "from-teal-400 to-rose-500"  },
  { key: "その他",       icon: "⚡", color: "from-teal-500 to-amber-500"},
];

// 消費カロリーの強度カラー
function intensityColor(kcal: number) {
  if (kcal < 100) return "text-blue-500";
  if (kcal < 200) return "text-green-500";
  if (kcal < 350) return "text-teal-600";
  return "text-red-500";
}

export default function ExercisePage() {
  const [date, setDate] = useState(today());
  const [record, setRecord] = useState<ExerciseRecord>({ date, entries: [] });
  const [selected, setSelected] = useState(EXERCISES[0]);
  const [minutes, setMinutes] = useState("");
  const [bodyWeight, setBodyWeight] = useState(70);
  const [added, setAdded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const isAutoDateRef = useRef(true);

  const changeDate = (d: string) => {
    isAutoDateRef.current = (d === today());
    setDate(d);
  };

  useEffect(() => {
    const r = getExerciseRecord(date);
    setRecord(r);
    const recs = getWeightRecords();
    if (recs.length) {
      setBodyWeight(recs[recs.length - 1].weight);
    } else {
      // 体重記録がない場合はプロフィールの目標体重を参考にする
      const p = getProfile();
      if (p && p.goalWeight > 0) setBodyWeight(p.goalWeight);
    }
  }, [date]);

  // 日付の自動更新（1分ごと＋画面復帰時＋フォーカス時）
  useEffect(() => {
    const update = () => {
      if (isAutoDateRef.current) {
        setDate(today());
      }
    };
    const timer = setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, []);

  function addEntry() {
    if (!minutes || Number(minutes) <= 0) return;
    const met = MET_VALUES[selected.key];
    const cal = calcBurnedCalories(met, bodyWeight, Number(minutes));
    const entry: ExerciseEntry = { type: selected.key, minutes: Number(minutes), calories: cal, met };
    const updated: ExerciseRecord = { ...record, entries: [...record.entries, entry] };
    setRecord(updated);
    saveExerciseRecord(updated);
    setMinutes("");
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function removeEntry(idx: number) {
    const updated = { ...record, entries: record.entries.filter((_, i) => i !== idx) };
    setRecord(updated);
    saveExerciseRecord(updated);
  }

  // 過去7日間の運動履歴
  const recentHistory = (() => {
    const all = getAllExercises();
    return all
      .filter((r) => r.date < date && r.entries.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
  })();

  const totalBurned = record.entries.reduce((s, e) => s + e.calories, 0);
  const preview = minutes
    ? calcBurnedCalories(MET_VALUES[selected.key], bodyWeight, Number(minutes))
    : 0;

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">

      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-green-400 to-teal-500 pt-10 pb-8 px-4 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-white text-2xl font-black">運動記録 🏃</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => changeDate(addDays(date, -1))} className="bg-white/20 text-white rounded-lg p-3 active:bg-white/40 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <label className="relative cursor-pointer">
              <span className="bg-white/20 text-white rounded-xl px-3 py-1.5 text-sm font-bold block select-none">
                {(() => {
                  const d = new Date(date + "T00:00:00");
                  const w = ["日","月","火","水","木","金","土"][d.getDay()];
                  return `${d.getMonth()+1}/${d.getDate()}(${w})`;
                })()}
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => changeDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <button onClick={() => changeDate(addDays(date, 1))} className="bg-white/20 text-white rounded-lg p-3 active:bg-white/40 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* 消費カロリー合計（ヘッダー内） */}
        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 flex items-center gap-4">
          <div className="bg-white/30 rounded-xl p-2.5">
            <Flame size={28} className="text-white" />
          </div>
          <div>
            <div className="text-4xl font-black text-white">{totalBurned}<span className="text-xl ml-1 font-bold opacity-80">kcal</span></div>
            <div className="text-white/70 text-xs">今日の消費カロリー合計</div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-4">

        {/* 運動種目セレクター */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">運動の種類を選ぶ</p>
          <div className="grid grid-cols-4 gap-2">
            {EXERCISES.map((ex) => (
              <button
                key={ex.key}
                onClick={() => setSelected(ex)}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl transition-all active:scale-95 ${
                  selected.key === ex.key
                    ? `bg-gradient-to-br ${ex.color} shadow-md`
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <span className="text-2xl mb-0.5">{ex.icon}</span>
                <span className={`text-[10px] font-bold leading-tight text-center ${
                  selected.key === ex.key ? "text-white" : "text-gray-600"
                }`}>{ex.key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 時間入力 */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">時間を入力</p>

          {/* 選択中の運動表示 */}
          <div className={`flex items-center gap-3 bg-gradient-to-r ${selected.color} rounded-xl px-4 py-3 mb-4`}>
            <span className="text-2xl">{selected.icon}</span>
            <div className="flex-1">
              <div className="text-white font-black text-base">{selected.key}</div>
              <div className="text-white/75 text-xs">
                {MET_VALUES[selected.key] <= 3 ? "強度：低" : MET_VALUES[selected.key] <= 5 ? "強度：中" : MET_VALUES[selected.key] <= 7 ? "強度：高" : "強度：非常に高い"}
              </div>
            </div>
          </div>

          {/* クイック入力ボタン */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[15, 30, 45, 60].map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(String(m))}
                className={`py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  minutes === String(m)
                    ? `bg-gradient-to-r ${selected.color} text-white shadow-sm`
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {m}分
              </button>
            ))}
          </div>

          {/* 時間入力 */}
          <div className="flex items-center justify-center border-2 border-gray-200 rounded-xl focus-within:border-teal-400 transition-colors mb-2 py-3">
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="30"
              className="w-24 text-4xl font-black text-center outline-none bg-transparent text-gray-800"
            />
            <span className="text-xl font-bold text-gray-400 ml-1 mt-1">分</span>
          </div>

          {/* カロリープレビュー */}
          <p className={`text-xs font-bold text-center mb-3 h-4 ${minutes ? intensityColor(preview) : "text-transparent"}`}>
            {minutes ? `約 ${preview} kcal 消費予定` : "-"}
          </p>

          {/* 追加ボタン（全幅） */}
          <button
            onClick={addEntry}
            disabled={!minutes}
            className={`w-full py-3.5 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-40 ${
              added
                ? "bg-green-500 text-white"
                : `bg-gradient-to-r ${selected.color} text-white`
            }`}
          >
            {added ? (
              <><span className="text-lg">✓</span> 追加しました！</>
            ) : (
              <><Plus size={20} /> 記録に追加する</>
            )}
          </button>
        </div>

        {/* 記録リスト */}
        {record.entries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">今日の運動記録</p>
            </div>
            {record.entries.map((e, i) => {
              const ex = EXERCISES.find((x) => x.key === e.type) ?? EXERCISES[EXERCISES.length - 1];
              return (
                <div key={i} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className={`bg-gradient-to-br ${ex.color} rounded-xl p-2 mr-3 shrink-0`}>
                    <span className="text-lg">{ex.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-sm">{e.type}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Timer size={10} /> {e.minutes}分
                      </span>
                      <span className={`text-xs font-bold ${intensityColor(e.calories)}`}>
                        {e.calories} kcal
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeEntry(i)}
                    className="p-2 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 過去の運動履歴 */}
        {recentHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50"
            >
              <div className="flex items-center gap-2">
                <History size={14} className="text-gray-400" />
                <p className="text-xs font-bold text-gray-500">過去の運動履歴</p>
              </div>
              <span className="text-xs text-gray-400">{showHistory ? "▲ 閉じる" : "▼ 開く"}</span>
            </button>
            {showHistory && recentHistory.map((r) => {
              const d = new Date(r.date + "T00:00:00");
              const label = d.toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" });
              const dayTotal = r.entries.reduce((s, e) => s + e.calories, 0);
              return (
                <div key={r.date} className="px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-500">{label}</span>
                    <span className="text-xs font-black text-green-600">{dayTotal} kcal</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.entries.map((e, i) => {
                      const ex = EXERCISES.find((x) => x.key === e.type) ?? EXERCISES[EXERCISES.length - 1];
                      return (
                        <span key={i} className="inline-flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1 text-[10px] font-bold text-gray-600">
                          {ex.icon} {e.type} {e.minutes}分
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* フッターロゴ */}
        <div className="flex justify-center pt-5 pb-3">
          <img src="/logo-footer.png" alt="こたろうダイエット" className="h-20 w-auto select-none opacity-90" draggable={false} />
        </div>

      </div>
    </div>
  );
}
