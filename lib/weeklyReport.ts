// こたろうの週次レポート生成

import { WeightRecord, MealRecord, ExerciseRecord } from "./types";

export interface WeeklyReport {
  /** 先週の開始日（月曜） */
  weekStart: string;
  /** 先週の終了日（日曜） */
  weekEnd: string;
  /** 記録した日数 */
  recordDays: number;
  /** 体重変化 (kg)。null = 計測不能 */
  weightDiff: number | null;
  /** 週平均カロリー (kcal)。0 = 記録なし */
  avgCalories: number;
  /** 運動した日数 */
  exerciseDays: number;
  /** こたろうのメッセージ */
  message: string;
  /** サブメッセージ（データ要約） */
  summary: string;
}

/** YYYY-MM-DD を返す */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 先週の月曜〜日曜を返す */
function getLastWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dow = now.getDay(); // 0=日, 1=月...
  // 今週月曜
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - ((dow + 6) % 7));
  thisMonday.setHours(0, 0, 0, 0);
  // 先週月曜〜日曜
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);
  return { start: toDateStr(lastMonday), end: toDateStr(lastSunday) };
}

/** 日付の配列（startからend）を生成 */
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cur <= last) {
    dates.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** 体重変化に応じたこたろうのコメント */
function buildMessage(
  weightDiff: number | null,
  recordDays: number,
  avgCalories: number,
  exerciseDays: number
): { message: string; summary: string } {
  const totalDays = 7;

  // 記録が全くない
  if (recordDays === 0) {
    return {
      message: "先週は体重の記録がなかったにゃ😿\n今週こそ、毎日ちょこっと記録してみて！",
      summary: "記録ゼロの週でした。小さな一歩から始めよう🐾",
    };
  }

  // 記録日数が少ない
  if (recordDays <= 2) {
    return {
      message: `先週は${recordDays}日しか記録できなかったにゃ…\nでも続けてる時点でえらい！今週はもう少しだけ増やしてみよう😺`,
      summary: `記録${recordDays}日 / 7日。まずは週4日を目標に🌱`,
    };
  }

  // 体重の評価
  let weightMsg = "";
  if (weightDiff === null) {
    weightMsg = "体重の比較データが少ないにゃ";
  } else if (weightDiff < -1.5) {
    weightMsg = `体重が${Math.abs(weightDiff).toFixed(1)}kgも減ったにゃ！すごすぎる🎉\nでも急ぎすぎは体に負担がかかるから、ペースに気をつけてね`;
  } else if (weightDiff < -0.3) {
    weightMsg = `先週は${Math.abs(weightDiff).toFixed(1)}kg減ったにゃ🎉\nいい調子！この調子で続けよう✨`;
  } else if (weightDiff < 0.3) {
    weightMsg = `先週は体重がほぼキープできたにゃ👍\n変化がないように見えても、続けることが大事だよ🌱`;
  } else if (weightDiff < 1.0) {
    weightMsg = `先週は${weightDiff.toFixed(1)}kg増えたにゃ…\n気にしすぎなくていいよ。今週リセットしよう😊`;
  } else {
    weightMsg = `先週は${weightDiff.toFixed(1)}kg増えてしまったにゃ😿\nでも、また記録してることが大事！一緒に巻き返そう💪`;
  }

  // サブメッセージ（データサマリー）
  const parts: string[] = [];
  parts.push(`体重記録 ${recordDays}日`);
  if (avgCalories > 0) {
    parts.push(`平均${avgCalories}kcal/日`);
  }
  if (exerciseDays > 0) {
    parts.push(`運動 ${exerciseDays}日`);
  }

  // ボーナスメッセージ
  let bonus = "";
  if (recordDays === totalDays) {
    bonus = "\n7日連続記録、パーフェクトにゃ！🏆";
  } else if (exerciseDays >= 5) {
    bonus = "\n運動5日以上！体が喜んでるにゃ💪";
  } else if (avgCalories > 0 && avgCalories <= 1800) {
    bonus = "\nカロリー管理もバッチリだにゃ✨";
  }

  return {
    message: weightMsg + bonus,
    summary: parts.join("　/　"),
  };
}

/**
 * 先週のレポートを生成する。
 * データが全くない場合は null を返す。
 */
export function getWeeklyReport(
  allRecords: WeightRecord[],
  allMeals: MealRecord[],
  allExercises: ExerciseRecord[]
): WeeklyReport | null {
  const { start, end } = getLastWeekRange();
  const days = dateRange(start, end);

  // 先週の体重記録
  const weekRecords = allRecords.filter((r) => r.date >= start && r.date <= end);
  const recordDays = weekRecords.length;

  // 体重変化（先週最初と最後）
  let weightDiff: number | null = null;
  if (weekRecords.length >= 2) {
    const sorted = [...weekRecords].sort((a, b) => a.date.localeCompare(b.date));
    weightDiff = +(sorted[sorted.length - 1].weight - sorted[0].weight).toFixed(1);
  } else if (weekRecords.length === 1) {
    // 先週1日だけなら先々週末と比較
    const beforeStart = allRecords
      .filter((r) => r.date < start)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (beforeStart.length > 0) {
      weightDiff = +(weekRecords[0].weight - beforeStart[0].weight).toFixed(1);
    }
  }

  // 食事カロリー（先週平均）
  const weekMeals = allMeals.filter((m) => m.date >= start && m.date <= end);
  const totalCalories = weekMeals.reduce(
    (s, m) => s + m.breakfast + m.lunch + m.dinner + m.snack,
    0
  );
  // 記録した日数で割る（7日で割ると記録のない日が低く見える）
  const avgCalories = weekMeals.length > 0 ? Math.round(totalCalories / weekMeals.length) : 0;

  // 運動日数
  const weekExercises = allExercises.filter(
    (e) => e.date >= start && e.date <= end && e.entries.length > 0
  );
  const exerciseDays = weekExercises.length;

  const { message, summary } = buildMessage(weightDiff, recordDays, avgCalories, exerciseDays);

  return {
    weekStart: start,
    weekEnd: end,
    recordDays,
    weightDiff,
    avgCalories,
    exerciseDays,
    message,
    summary,
  };
}
