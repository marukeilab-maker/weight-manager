"use client";
import { useState } from "react";

// 年→月→日 の順に選べる誕生日セレクター（内部stateで部分選択を保持）
export default function BirthdateSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const init = value ? value.split("-") : ["", "", ""];
  const [y, setY] = useState(init[0] || "");
  const [m, setM] = useState(init[1] ? String(Number(init[1])) : "");
  const [d, setD] = useState(init[2] ? String(Number(init[2])) : "");

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => thisYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = y && m ? new Date(Number(y), Number(m), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const emit = (ny: string, nm: string, nd: string) => {
    if (ny && nm && nd) {
      onChange(`${ny}-${nm.padStart(2, "0")}-${nd.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  };

  const selCls =
    "w-24 border-2 border-gray-200 rounded-xl px-2 py-2.5 text-sm font-bold text-center bg-white focus:border-teal-500 outline-none appearance-none";

  return (
    <div className="flex gap-2 justify-center">
      <select
        className={selCls}
        value={y}
        onChange={(e) => { const v = e.target.value; setY(v); emit(v, m, d); }}
      >
        <option value="">年</option>
        {years.map((yy) => (
          <option key={yy} value={String(yy)}>{yy}</option>
        ))}
      </select>
      <select
        className={selCls}
        value={m}
        onChange={(e) => { const v = e.target.value; setM(v); emit(y, v, d); }}
      >
        <option value="">月</option>
        {months.map((mm) => (
          <option key={mm} value={String(mm)}>{mm}</option>
        ))}
      </select>
      <select
        className={selCls}
        value={d}
        onChange={(e) => { const v = e.target.value; setD(v); emit(y, m, v); }}
      >
        <option value="">日</option>
        {days.map((dd) => (
          <option key={dd} value={String(dd)}>{dd}</option>
        ))}
      </select>
    </div>
  );
}
