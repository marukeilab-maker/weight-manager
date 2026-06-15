"use client";

interface Props {
  progress: number;
  bmi?: number | null;       // 現在のBMI（体型段階の決定用）
  goalBmi?: number | null;   // 目標体重のBMI（不健康な目標での祝福抑制用）
}

// BMI（体型）に応じた猫の段階：日本肥満学会の区分に対応
// cat-1（一番ぽっちゃり）＝肥満3度 … cat-4＝普通体重 / skinny（万歳）＝低体重
function stageByBmi(bmi: number): number {
  if (bmi >= 35) return 1;   // 肥満(3度) → cat-1
  if (bmi >= 30) return 2;   // 肥満(2度) → cat-2
  if (bmi >= 25) return 3;   // 肥満(1度) → cat-3
  if (bmi >= 18.5) return 4; // 普通体重 → cat-4
  return 5;                  // 低体重 → skinny（万歳）
}

export default function WeightCat({ progress, bmi, goalBmi }: Props) {
  const p = Math.min(100, Math.max(0, progress));

  // 現在のBMIに応じた体型段階（肥満3度=1 … 普通体重=4 / 低体重=5）
  const currentStage = bmi != null && bmi > 0 ? stageByBmi(bmi) : 1;

  const isUnderweight = bmi != null && bmi > 0 && bmi < 18.5;
  // 現在体重が美容体重以下（18.5≤BMI<20）→ キラキラなし
  const isBelowBeautyCurrent = bmi != null && bmi > 0 && bmi >= 18.5 && bmi < 20;
  // 目標体重が健康範囲外（BMI 18.5未満）→ 祝福なし
  const isUnhealthyGoal = goalBmi != null && goalBmi > 0 && goalBmi < 18.5;
  // 目標体重が美容体重以下（BMI 20未満・健康範囲内）→ キラキラなし・スリムこたろう
  const isBelowBeautyGoal = goalBmi != null && goalBmi >= 18.5 && goalBmi < 20;
  const isWin = p >= 100 && !isUnderweight && !isUnhealthyGoal && !isBelowBeautyGoal && !isBelowBeautyCurrent;

  // 道中は現在のBMI区分に応じて cat-1〜cat-4 / skinny を表示する。
  // 達成時はキラキラ付きの cat-4 を特別表示。
  let stage: number;
  if (isWin) {
    stage = 4;
  } else if (p >= 100 && (isBelowBeautyGoal || isBelowBeautyCurrent) && !isUnderweight) {
    stage = 4; // cat-4をキラキラなしで使用
  } else {
    stage = currentStage; // 現在の体型をそのまま反映（1〜5）
  }

  // メッセージ
  let message: string;
  let highlight = false;
  if (isUnderweight || (p >= 100 && isUnhealthyGoal)) {
    message = "もう十分スリム！無理は禁物だよ🐱";
    highlight = true;
  } else if (p >= 100 && (isBelowBeautyGoal || isBelowBeautyCurrent)) {
    message = "目標達成！スリムでキレイだよ✨";
    highlight = true;
  } else if (isWin) {
    message = "目標達成！おめでとう🎉";
    highlight = true;
  } else {
    // 現在の体型（BMI区分）に応じた前向きメッセージ
    const stageMsg: Record<number, string> = {
      1: "一緒にコツコツがんばろう🐾",   // 肥満(3度)
      2: "いい調子！その調子で続けよう💪", // 肥満(2度)
      3: "あと少しで標準体重だよ⭐",       // 肥満(1度)
      4: "理想的な体型をキープ✨",         // 普通体重
    };
    message = stageMsg[stage] ?? "理想的な体型をキープ✨";
  }

  const showSparkle = isWin;

  const boxH = 170;
  const boxW = 210;

  const sparkles = [
    { left: "8%", top: "6%", size: 22, delay: "0s" },
    { left: "82%", top: "10%", size: 26, delay: "0.3s" },
    { left: "0%", top: "45%", size: 18, delay: "0.6s" },
    { left: "90%", top: "48%", size: 20, delay: "0.15s" },
    { left: "18%", top: "78%", size: 16, delay: "0.45s" },
    { left: "76%", top: "80%", size: 18, delay: "0.75s" },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative"
        style={{
          width: boxW,
          height: boxH,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        {showSparkle &&
          sparkles.map((s, i) => (
            <span
              key={i}
              className="sparkle pointer-events-none"
              style={{ left: s.left, top: s.top, fontSize: s.size, animationDelay: s.delay }}
            >
              ✨
            </span>
          ))}

        <img
          src={isUnderweight ? "/cats/cat-skinny.png" : `/cats/cat-${stage}.png`}
          alt="こたろう"
          draggable={false}
          className={`select-none ${showSparkle ? "win-bounce" : ""}`}
          style={{
            // 低体重のこたろうは他より一回り小さく（2/3サイズ）＆少し上に表示
            height: isUnderweight ? "66.7%" : "100%",
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            marginBottom: isUnderweight ? "20px" : undefined,
            transition: "opacity 0.4s ease-out",
          }}
        />
      </div>
      <p className={`text-xs font-bold ${highlight ? "text-teal-600" : "text-gray-500"}`}>
        {message}
      </p>
    </div>
  );
}
