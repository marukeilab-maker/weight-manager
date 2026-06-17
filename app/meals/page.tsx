"use client";
import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ClipboardList, Star } from "lucide-react";
import { getMealRecord, saveMealRecord, getProfile, getWeightRecords, getAllExercises, getAllMeals } from "@/lib/storage";
import { today, addDays, calcBMR, calcAge } from "@/lib/calculations";
import { searchFoods, FoodItem } from "@/lib/foodDatabase";
import { getActivityFactor, DAILY_TARGET_DEFICIT } from "@/lib/constants";
import { calcDailyExpenditure } from "@/lib/energy";
import { MealRecord } from "@/lib/types";

// ── 型定義 ──────────────────────────────
type MealSlot = keyof Omit<MealRecord, "date">;
type Dish = { name: string; kcal: number };

// ── 食事スロット ─────────────────────────
const SLOTS: { key: MealSlot; label: string; icon: string; grad: string }[] = [
  { key: "breakfast", label: "朝食", icon: "🌅", grad: "from-amber-300 to-orange-400"   },
  { key: "lunch",     label: "昼食", icon: "☀️",  grad: "from-orange-400 to-rose-400"    },
  { key: "dinner",    label: "夕食", icon: "🌙", grad: "from-indigo-500 to-purple-700"  },
  { key: "snack",     label: "間食", icon: "🍪", grad: "from-rose-300 to-pink-400"      },
];

// 現在時刻に応じたスロットを返す
function getSlotByTime(): MealSlot {
  const now = new Date();
  const total = now.getHours() * 60 + now.getMinutes();
  if (total >= 1 && total <= 11 * 60) return "breakfast";   // 00:01〜11:00
  if (total > 11 * 60 && total <= 17 * 60) return "lunch";  // 11:01〜17:00
  return "dinner";                                           // 17:01〜00:00
}

const DISHES_KEY = "wm_meal_dishes";
type SlotDishes = { [slot in MealSlot]?: Dish[] };
type AllDishes  = { [date: string]: SlotDishes };

const CUSTOM_HISTORY_KEY = "wm_custom_food_history";
const MAX_CUSTOM_HISTORY = 20;

function loadCustomHistory(): Dish[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CUSTOM_HISTORY_KEY) ?? "[]"); } catch { return []; }
}
function saveToCustomHistory(dish: Dish) {
  const history = loadCustomHistory().filter(d => d.name !== dish.name);
  history.unshift(dish);
  localStorage.setItem(CUSTOM_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_CUSTOM_HISTORY)));
}
function removeFromCustomHistory(name: string) {
  const history = loadCustomHistory().filter(d => d.name !== name);
  localStorage.setItem(CUSTOM_HISTORY_KEY, JSON.stringify(history));
}

function loadSlotDishes(date: string): SlotDishes {
  if (typeof window === "undefined") return {};
  try {
    const all: AllDishes = JSON.parse(localStorage.getItem(DISHES_KEY) ?? "{}");
    return all[date] ?? {};
  } catch { return {}; }
}
function saveSlotDishes(date: string, slotDishes: SlotDishes) {
  if (typeof window === "undefined") return;
  const all: AllDishes = (() => {
    try { return JSON.parse(localStorage.getItem(DISHES_KEY) ?? "{}"); } catch { return {}; }
  })();
  all[date] = slotDishes;
  localStorage.setItem(DISHES_KEY, JSON.stringify(all));
}

// ── コンポーネント ───────────────────────
export default function MealsPage() {
  const [date, setDate]       = useState(today());
  const [activeSlot, setSlot] = useState<MealSlot>(getSlotByTime);
  const [slotDishes, setSlotDishes] = useState<SlotDishes>({});
  const [meal, setMeal]       = useState<MealRecord>({ date, breakfast: 0, lunch: 0, dinner: 0, snack: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState("");
  const [flashDish, setFlashDish] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [customHistory, setCustomHistory] = useState<Dish[]>([]);
  const [targetCalories, setTargetCalories] = useState<number>(0);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isAutoDateRef = useRef(true);  // 自動日付モード（手動変更後はfalseに）

  // 手動で日付を変更（自動更新を停止）
  const changeDate = (d: string) => {
    isAutoDateRef.current = (d === today());
    setDate(d);
  };

  useEffect(() => {
    setMeal(getMealRecord(date));
    setSlotDishes(loadSlotDishes(date));
  }, [date]);

  useEffect(() => {
    setMounted(true);
    setCustomHistory(loadCustomHistory());
    const p = getProfile();
    if (p) setTargetCalories(p.targetCalories);
  }, []);

  // 日付・スロットの自動更新（1分ごと＋画面復帰時）
  useEffect(() => {
    const update = () => {
      if (isAutoDateRef.current) {
        setDate(today());
      }
      setSlot(getSlotByTime());
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

  // 料理を追加
  function addDish(dish: Dish) {
    // 「食事抜き」状態なら自動でクリアしてから追加
    const current = (slotDishes[activeSlot] ?? []).filter((d) => d.name !== "食事抜き");
    const updated = { ...slotDishes, [activeSlot]: [...current, dish] };
    setSlotDishes(updated);
    saveSlotDishes(date, updated);
    const total = (updated[activeSlot] ?? []).reduce((s, d) => s + d.kcal, 0);
    const newMeal = { ...meal, [activeSlot]: total };
    setMeal(newMeal);
    saveMealRecord(newMeal);
    setFlashDish(dish.name);
    setTimeout(() => setFlashDish(null), 1000);
  }

  // 食品検索
  function handleSearch(q: string) {
    setSearchQuery(q);
    setSearchResults(searchFoods(q));
  }

  // 検索結果から追加
  function addFromSearch(item: FoodItem) {
    addDish({ name: item.name, kcal: item.kcal });
    setSearchQuery("");
    setSearchResults([]);
  }

  // カスタム料理を追加（記録に追加するだけ。お気に入り保存は記録一覧の★で行う）
  function addCustomDish() {
    if (!customKcal || Number(customKcal) <= 0) return;
    const dish: Dish = { name: customName.trim() || "カスタム料理", kcal: Number(customKcal) };
    addDish(dish);
    setCustomName("");
    setCustomKcal("");
  }

  // 履歴から削除
  function deleteFromHistory(name: string) {
    removeFromCustomHistory(name);
    setCustomHistory(loadCustomHistory());
  }

  // お気に入り（よく使う料理）の登録・解除
  function isFavorite(name: string): boolean {
    return customHistory.some((d) => d.name === name);
  }
  function toggleFavorite(dish: Dish) {
    if (isFavorite(dish.name)) {
      removeFromCustomHistory(dish.name);
    } else {
      saveToCustomHistory(dish);
    }
    setCustomHistory(loadCustomHistory());
  }

  // ざっくり入力（食事ごとの目安kcal）
  const roughOptions =
    activeSlot === "snack"
      ? [
          { label: "軽め", kcal: 100 },
          { label: "普通", kcal: 250 },
          { label: "しっかり", kcal: 450 },
          { label: "食べすぎ", kcal: 700 },
        ]
      : [
          { label: "軽め", kcal: 300 },
          { label: "普通", kcal: 600 },
          { label: "しっかり", kcal: 900 },
          { label: "食べすぎ", kcal: 1200 },
        ];
  function addRough(label: string, kcal: number) {
    addDish({ name: `${label}（ざっくり）`, kcal });
  }

  // 昨日と同じ料理をコピー（重複防止のため現在の内容を置き換え）
  function copyFromYesterday() {
    const yesterday = addDays(date, -1);
    const yesterdayDishes = (loadSlotDishes(yesterday)[activeSlot] ?? []).filter(d => d.name !== "食事抜き");
    if (yesterdayDishes.length === 0) return;
    const merged = [...yesterdayDishes];
    const updated = { ...slotDishes, [activeSlot]: merged };
    setSlotDishes(updated);
    saveSlotDishes(date, updated);
    const total = merged.reduce((s, d) => s + d.kcal, 0);
    const newMeal = { ...meal, [activeSlot]: total };
    setMeal(newMeal);
    saveMealRecord(newMeal);
    setFlashDish("昨日と同じ");
    setTimeout(() => setFlashDish(null), 1000);
  }

  // 昨日の同スロットに料理があるか
  function yesterdayDishCount(): number {
    const yesterday = addDays(date, -1);
    return (loadSlotDishes(yesterday)[activeSlot] ?? []).filter(d => d.name !== "食事抜き").length;
  }

  // 食事を抜く（スキップ）
  function skipMeal() {
    // 既存の料理を全部消して「食事抜き」だけ残す
    const updated = { ...slotDishes, [activeSlot]: [{ name: "食事抜き", kcal: 0 }] };
    setSlotDishes(updated);
    saveSlotDishes(date, updated);
    const newMeal = { ...meal, [activeSlot]: 0 };
    setMeal(newMeal);
    saveMealRecord(newMeal);
    setFlashDish("食事抜き");
    setTimeout(() => setFlashDish(null), 1000);
  }

  // スロットが「抜いた」状態か判定
  function isSkipped(slot: MealSlot): boolean {
    const dishes = slotDishes[slot] ?? [];
    return dishes.length === 1 && dishes[0].name === "食事抜き";
  }

  // 料理を削除
  function removeDish(idx: number) {
    const current = slotDishes[activeSlot] ?? [];
    const updated = { ...slotDishes, [activeSlot]: current.filter((_, i) => i !== idx) };
    setSlotDishes(updated);
    saveSlotDishes(date, updated);
    const total = (updated[activeSlot] ?? []).reduce((s, d) => s + d.kcal, 0);
    const newMeal = { ...meal, [activeSlot]: total };
    setMeal(newMeal);
    saveMealRecord(newMeal);
  }

  const totalAll = SLOTS.reduce((s, sl) => s + (meal[sl.key] || 0), 0);
  const currentDishes = slotDishes[activeSlot] ?? [];
  const slotTotal = currentDishes.reduce((s, d) => s + d.kcal, 0);

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">

      {/* ── 1日の食事一覧モーダル ── */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="flex-1" onClick={() => setShowSummary(false)} />
          <div className="bg-white rounded-t-3xl max-h-[80vh] flex flex-col">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-bold">
                  {(() => {
                    const d = new Date(date + "T00:00:00");
                    const w = ["日","月","火","水","木","金","土"][d.getDay()];
                    return `${d.getMonth()+1}月${d.getDate()}日(${w})`;
                  })()}
                </p>
                <p className="text-lg font-black text-gray-800">1日の食事一覧</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold">合計</p>
                  <p className="text-orange-500 font-black text-xl">{totalAll} <span className="text-xs font-bold text-gray-400">kcal</span></p>
                </div>
                <button onClick={() => setShowSummary(false)} className="text-gray-400 active:text-gray-600">
                  <X size={22} />
                </button>
              </div>
            </div>
            {/* 各スロット */}
            <div className="overflow-y-auto flex-1 px-4 py-3 pb-24 space-y-3">
              {SLOTS.map(sl => {
                const dishes = slotDishes[sl.key] ?? [];
                const kcal = meal[sl.key] || 0;
                return (
                  <div key={sl.key} className="bg-gray-50 rounded-2xl overflow-hidden">
                    <div className={`bg-gradient-to-r ${sl.grad} px-4 py-2 flex items-center justify-between`}>
                      <span className="text-white font-black text-sm">{sl.icon} {sl.label}</span>
                      <span className="text-white font-black text-sm">{kcal > 0 ? `${kcal} kcal` : "—"}</span>
                    </div>
                    {dishes.length > 0 ? (
                      dishes.map((dish, i) => (
                        <div key={i} className="flex items-center px-4 py-2 border-b border-gray-100 last:border-0">
                          <span className="flex-1 text-sm text-gray-700 font-bold">{dish.name}</span>
                          <span className="text-orange-500 font-bold text-sm">{dish.kcal} kcal</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-3">記録なし</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ヘッダー ── */}
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 pt-10 pb-5 px-4 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-white text-2xl font-black">食事記録</h1>
            <button
              onClick={() => setShowSummary(true)}
              className="bg-white/20 text-white rounded-xl px-2.5 py-1.5 flex items-center gap-1 active:bg-white/40 transition-colors"
            >
              <ClipboardList size={14} />
              <span className="text-xs font-bold">一覧</span>
            </button>
          </div>
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
                type="date" value={date}
                onChange={(e) => changeDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <button onClick={() => changeDate(addDays(date, 1))} className="bg-white/20 text-white rounded-lg p-3 active:bg-white/40 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="bg-white/20 rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm font-bold">合計カロリー</span>
            <span className="text-white text-3xl font-black">{totalAll} <span className="text-base font-bold opacity-80">kcal</span></span>
          </div>
          {targetCalories > 0 && (
            <>
              <div className="w-full bg-white/20 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${totalAll > targetCalories ? "bg-red-300" : "bg-white"}`}
                  style={{ width: `${Math.min(100, (totalAll / targetCalories) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-white/70 text-[10px] font-bold">
                <span>目標 {targetCalories} kcal</span>
                <span className={totalAll > targetCalories ? "text-red-200 font-black" : "text-white font-black"}>
                  {totalAll > targetCalories
                    ? `${totalAll - targetCalories} kcal オーバー 🔺`
                    : `あと ${targetCalories - totalAll} kcal`}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">

        {/* ── カロリー収支カード（今日のみ表示） ── */}
        {mounted && date === today() && (() => {
          const profile = getProfile();
          if (!profile) return null;
          const records = getWeightRecords();
          const currentWeight = records.length > 0 ? records[records.length - 1].weight : 0;
          if (!currentWeight || !profile.height || !profile.birthdate || !profile.gender) return null;
          const age = calcAge(profile.birthdate);
          const bmr = calcBMR(currentWeight, profile.height, age, profile.gender);
          const exercises = getAllExercises();
          const todayExercise = exercises.find((e) => e.date === today());
          const exerciseBurned = todayExercise ? todayExercise.entries.reduce((s, e) => s + e.calories, 0) : 0;
          // 十分なデータがあれば実測ベース、無ければ理論値。ホーム画面と計算を揃える。
          const factor = getActivityFactor(localStorage.getItem("wm_activity_level"));
          const energy = calcDailyExpenditure({ records, meals: getAllMeals(), bmr, factor, exerciseBurned });
          const isAdaptive = energy.mode === "adaptive";
          const totalBurned = energy.burned;
          const balance = totalBurned - totalAll;
          const isDeficit = balance >= 0;
          const achieved = balance >= DAILY_TARGET_DEFICIT; // 目標ペース達成
          const overMaintenance = balance < 0;              // 維持超え（太る方向）
          const targetLine = Math.max(0, totalBurned - DAILY_TARGET_DEFICIT);
          // 理論値表示中に、体重が増加傾向なのに「不足」と出ている矛盾を検知
          const trendContradicts = !isAdaptive && isDeficit && energy.recentTrendKgPerWeek != null && energy.recentTrendKgPerWeek > 0.1;
          const maxVal = Math.max(totalBurned, totalAll, 1);
          const burnedPct = Math.min(100, (totalBurned / maxVal) * 100);
          const intakePct = Math.min(100, (totalAll / maxVal) * 100);
          const targetPct = Math.min(100, (targetLine / maxVal) * 100);
          return (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-black text-gray-400 mb-3">カロリー収支</p>
              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                    <span>🔥 消費（{isAdaptive ? "実測ベース" : `基礎代謝＋生活活動${exerciseBurned > 0 ? "＋運動" : ""}`}）</span>
                    <span className="text-teal-600">{Math.round(totalBurned)} kcal</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500"
                      style={{ width: `${burnedPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                    <span>🍽️ 摂取（食事）<span className="text-gray-400 text-[10px] font-normal">目標 {targetLine.toLocaleString()}まで</span></span>
                    <span className="text-orange-500">{totalAll} kcal</span>
                  </div>
                  <div className="relative w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${achieved ? "bg-gradient-to-r from-orange-300 to-orange-400" : "bg-gradient-to-r from-orange-400 to-red-500"}`}
                      style={{ width: `${intakePct}%` }} />
                    <div className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-teal-600" style={{ left: `${targetPct}%` }} />
                  </div>
                </div>
              </div>
              {trendContradicts ? (
                <div className="rounded-xl px-3 py-2 bg-amber-50 text-center">
                  <span className="text-xs font-black text-amber-600">体重は増加傾向です ⚠️ 消費は目安のため高めの可能性あり</span>
                </div>
              ) : achieved ? (
                <div className="rounded-xl px-3 py-2 flex items-center justify-between bg-teal-50">
                  <span className="text-xs font-black text-teal-600">🎉 ダイエットペース達成</span>
                  <span className="text-sm font-black text-teal-600">−{Math.round(balance)} kcal</span>
                </div>
              ) : !overMaintenance ? (
                <div className="rounded-xl px-3 py-2 flex items-center justify-between bg-amber-50">
                  <span className="text-xs font-black text-amber-600">あと {Math.round(DAILY_TARGET_DEFICIT - balance)} kcal でペース達成</span>
                  <span className="text-sm font-black text-amber-600">−{Math.round(balance)} kcal</span>
                </div>
              ) : (
                <div className="rounded-xl px-3 py-2 flex items-center justify-between bg-red-50">
                  <span className="text-xs font-black text-red-500">⚠️ オーバー</span>
                  <span className="text-sm font-black text-red-500">+{Math.round(Math.abs(balance))} kcal</span>
                </div>
              )}
              {isAdaptive && energy.adaptive ? (
                <p className="text-[10px] text-gray-400 text-center mt-2">過去{energy.adaptive.spanDays}日の体重と食事から算出（運動分も含む）</p>
              ) : exerciseBurned > 0 ? (
                <p className="text-[10px] text-gray-400 text-center mt-2">運動消費 {Math.round(exerciseBurned)} kcal 含む</p>
              ) : null}
            </div>
          );
        })()}

        {/* ── 食事スロット選択 ── */}
        <div className="grid grid-cols-4 gap-2">
          {SLOTS.map((sl) => {
            const kcal = meal[sl.key] || 0;
            const active = activeSlot === sl.key;
            return (
              <button
                key={sl.key}
                onClick={() => setSlot(sl.key)}
                className={`rounded-2xl py-3 px-1 text-center transition-all active:scale-95 ${
                  active ? `bg-gradient-to-br ${sl.grad} shadow-md` : "bg-white shadow"
                }`}
              >
                <div className="text-xl mb-0.5">{sl.icon}</div>
                <div className={`text-[11px] font-bold ${active ? "text-white" : "text-gray-600"}`}>{sl.label}</div>
                <div className={`text-[11px] font-black ${active ? "text-white" : "text-orange-500"}`}>
                  {isSkipped(sl.key) ? "🚫" : kcal > 0 ? `${kcal}` : "—"}
                </div>
                {(slotDishes[sl.key] ?? []).length > 0 && !isSkipped(sl.key) && (
                  <div className={`text-[9px] font-bold mt-0.5 ${active ? "text-white/70" : "text-gray-400"}`}>
                    {(slotDishes[sl.key] ?? []).length}品
                  </div>
                )}
                {isSkipped(sl.key) && (
                  <div className={`text-[9px] font-bold mt-0.5 ${active ? "text-white/70" : "text-gray-400"}`}>
                    抜き
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── 食事抜き（料理未記録のスロット選択直後に表示） ── */}
        {currentDishes.length === 0 && (
          <div className="text-center -mt-1">
            <button
              onClick={skipMeal}
              className="text-xs text-gray-400 underline underline-offset-2 active:text-gray-600 transition-colors"
            >
              🚫 この{SLOTS.find(s => s.key === activeSlot)?.label}を抜く
            </button>
          </div>
        )}

        {/* ── 昨日と同じ（目立つカラーボタン） ── */}
        {yesterdayDishCount() > 0 && (
          <button
            onClick={copyFromYesterday}
            className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
              flashDish === "昨日と同じ"
                ? "bg-green-400 text-white"
                : "bg-gradient-to-r from-orange-400 to-pink-400 text-white"
            }`}
          >
            <span className="text-lg">📋</span>
            <span>昨日と同じものをコピー</span>
            <span className="bg-white/20 text-white text-xs font-black px-1.5 py-0.5 rounded-full">{yesterdayDishCount()}品</span>
          </button>
        )}

        {/* ── ざっくり入力 ── */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-xs font-bold text-gray-500 mb-1">⚡ ざっくり入力（ワンタップ）</p>
          <p className="text-[10px] text-gray-400 mb-3">検索が面倒な時に。タップするだけで記録できます</p>
          <div className="grid grid-cols-4 gap-2">
            {roughOptions.map((o) => (
              <button
                key={o.label}
                onClick={() => addRough(o.label, o.kcal)}
                className={`py-2.5 px-1 rounded-xl text-center transition-all active:scale-95 ${
                  flashDish === `${o.label}（ざっくり）`
                    ? "bg-green-50 ring-2 ring-green-300"
                    : "bg-gray-50 hover:bg-orange-50"
                }`}
              >
                <div className="text-xs font-black text-gray-700">{o.label}</div>
                <div className="text-[10px] font-bold text-orange-500 mt-0.5">約{o.kcal}</div>
                <div className="text-[8px] text-gray-400">kcal</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── 食品検索 ── */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-xs font-bold text-gray-500 mb-1">🔍 食品を検索して追加</p>
          <p className="text-[10px] text-gray-400 mb-3">和食・洋食・お菓子・スーパー惣菜・ファストフード・コンビニ・飲み物など700種以上</p>
          <div className="relative mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="例：カレーライス、バナナ、コーラ…"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors pr-9"
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                aria-label="クリア"
              >
                ✕
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              {searchResults.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center border-b border-gray-50 last:border-0 transition-colors ${
                    flashDish === item.name ? "bg-green-50" : "hover:bg-orange-50"
                  }`}
                >
                  <button
                    onClick={() => addFromSearch(item)}
                    className="flex-1 flex items-center px-3 py-2.5 text-left active:bg-orange-100 transition-colors"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-bold text-gray-800">{item.name}</span>
                      <span className="text-[10px] text-gray-400 ml-2">{item.category}</span>
                    </div>
                    {flashDish === item.name
                      ? <span className="text-green-500 font-black text-sm">✓ 追加</span>
                      : <><span className="text-orange-500 font-black text-sm mr-1">{item.kcal}</span>
                         <span className="text-gray-400 text-xs">kcal</span></>
                    }
                  </button>
                  <button
                    onClick={() => toggleFavorite({ name: item.name, kcal: item.kcal })}
                    className="p-2.5 transition-colors"
                    aria-label="お気に入り"
                  >
                    <Star
                      size={16}
                      className={isFavorite(item.name) ? "text-amber-400" : "text-gray-300"}
                      fill={isFavorite(item.name) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
          {searchQuery.length > 0 && searchResults.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">見つかりませんでした。「新しく追加」から手動入力できます。</p>
          )}
        </div>

        {/* ── よく使う料理 ＋ 手動追加（統合カード） ── */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 pt-4 pb-1 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500">⭐ よく使う料理</p>
            <p className="text-[10px] text-gray-400">タップで追加</p>
          </div>

          {/* 料理リスト */}
          {customHistory.length > 0 ? (
            <div className="px-4 pb-3 space-y-1.5 mt-2">
              {(showAllHistory ? customHistory : customHistory.slice(0, 6)).map((dish) => (
                <div key={dish.name} className="flex items-center gap-2">
                  <button
                    onClick={() => addDish(dish)}
                    className={`flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all active:scale-95 ${
                      flashDish === dish.name
                        ? "bg-green-50 ring-2 ring-green-300"
                        : "bg-orange-50 hover:bg-orange-100"
                    }`}
                  >
                    <span className="text-sm font-bold text-gray-700 truncate">{dish.name}</span>
                    <span className="text-orange-500 font-black text-sm ml-2 shrink-0">{dish.kcal} kcal</span>
                  </button>
                  <button
                    onClick={() => deleteFromHistory(dish.name)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1.5"
                    aria-label="削除"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {customHistory.length > 6 && (
                <button
                  onClick={() => setShowAllHistory(v => !v)}
                  className="w-full text-xs text-gray-400 font-bold py-1.5 hover:text-gray-600 transition-colors"
                >
                  {showAllHistory ? "▲ 閉じる" : `▼ もっと見る（あと${customHistory.length - 6}件）`}
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">検索結果や記録した料理の ★ を押すと、ここに登録されます</p>
          )}

          {/* 区切り線＋追加フォーム */}
          <div className="border-t border-gray-100 px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 mb-2">✏️ 新しく追加</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomDish()}
                placeholder="料理名（任意）"
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
              />
              <input
                type="number"
                value={customKcal}
                onChange={(e) => setCustomKcal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomDish()}
                placeholder="kcal"
                className="w-20 border-2 border-gray-200 rounded-xl px-2 py-2 text-sm font-bold text-center outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <button
              onClick={addCustomDish}
              disabled={!customKcal || Number(customKcal) <= 0}
              className="w-full py-2.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold rounded-xl disabled:opacity-40 active:scale-95 transition-all text-sm"
            >
              追加する
            </button>
          </div>
        </div>


        {/* ── 選択中の料理一覧 ── */}
        {currentDishes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500">
                {SLOTS.find(s => s.key === activeSlot)?.icon} {SLOTS.find(s => s.key === activeSlot)?.label}の記録
              </p>
              <p className="text-orange-500 font-black text-sm">{slotTotal} kcal</p>
            </div>
            {currentDishes.map((dish, i) => (
              <div key={i} className="flex items-center px-4 py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <span className="text-sm font-bold text-gray-700">{dish.name}</span>
                </div>
                <span className="text-orange-500 font-bold text-sm mr-1">{dish.kcal} kcal</span>
                {dish.name !== "食事抜き" && (
                  <button
                    onClick={() => toggleFavorite(dish)}
                    className="p-1.5 transition-colors"
                    aria-label="お気に入り"
                  >
                    <Star
                      size={15}
                      className={isFavorite(dish.name) ? "text-amber-400" : "text-gray-300"}
                      fill={isFavorite(dish.name) ? "currentColor" : "none"}
                    />
                  </button>
                )}
                <button onClick={() => removeDish(i)} className="text-gray-300 hover:text-red-400 transition-colors p-1.5">
                  <X size={16} />
                </button>
              </div>
            ))}
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
