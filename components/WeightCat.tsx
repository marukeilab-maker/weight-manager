"use client";

interface Props {
  progress: number;
  bmi?: number | null;       // 現在のBMI（痩せ型保護用）
  startBmi?: number | null;  // 開始時のBMI（スタート段階の決定用）
  goalBmi?: number | null;   // 目標体重のBMI（不健康な目標での祝福抑制用）
}

// BMI（体型）に応じた猫の段階：肥満ほど cat-0（太）、痩せるほど cat-4（細）
function stageByBmi(bmi: number): number {
  if (bmi >= 30) return 0; // 高度肥満
  if (bmi >= 25) return 1; // 肥満
  if (bmi >= 22) return 2; // 普通（やや上）
  if (bmi >= 18.5) return 3; // 普通
  return 4; // 痩せ型
}

export default function WeightCat({ progress, bmi, startBmi, goalBmi }: Props) {
  const p = Math.min(100, Math.max(0, progress));

  // 開始時の体型に応じたスタート段階
  const startStage = startBmi != null && startBmi > 0 ? stageByBmi(startBmi) : 0;

  const isUnderweight = bmi != null && bmi > 0 && bmi < 18.5;
  // 目標体重が健康範囲外（BMI 18.5未満）→ 祝福なし
  const isUnhealthyGoal = goalBmi != null && goalBmi > 0 && goalBmi < 18.5;
  // 目標体重が美容体重以下（BMI 20未満・健康範囲内）→ キラキラなし・スリムこたろう
  const isBelowBeautyGoal = goalBmi != null && goalBmi >= 18.5 && goalBmi < 20;
  const isWin = p >= 100 && !isUnderweight && !isUnhealthyGoal && !isBelowBeautyGoal;

  // cat-4 は「達成時」だけの特別な画像（手を上げてキラキラ）。
  // 道中は cat-0〜cat-3 のみを使い、達成率に応じて cat-3 へ近づく。
  let stage: number;
  if (isWin) {
    stage = 4;
  } else if (p >= 100 && isBelowBeautyGoal && !isUnderweight) {
    stage = 4; // cat-4をキラキラなしで使用
  } else {
    const start = Math.min(3, startStage);
    stage = Math.round(start + (3 - start) * (p / 100));
    stage = Math.min(3, Math.max(start, stage));
    if (isUnderweight) stage = 3;
  }

  // メッセージ
  let message: string;
  let highlight = false;
  if (isUnderweight || (p >= 100 && isUnhealthyGoal)) {
    message = "もう十分スリム！無理は禁物だよ🐱";
    highlight = true;
  } else if (p >= 100 && isBelowBeautyGoal) {
    message = "目標達成！スリムでキレイだよ✨";
    highlight = true;
  } else if (isWin) {
    message = "目標達成！おめでとう🎉";
    highlight = true;
  } else {
    const stageMsg = [
      "まだまだこれから…😴",
      "少しずつ動き出した！🐾",
      "折り返し地点！いい調子⭐",
      "あと少し！スリム目前🏁",
      "理想の体型をキープ✨",
    ];
    message = stageMsg[stage];
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
            height: "100%",
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
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
