"use client";
import { useRef, useLayoutEffect, useEffect } from "react";

const ITEM_H = 84;

// ── 通常ホイール（整数部：30〜200）─────────────
function Wheel({ items, value, onChange, width }: {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrolling = useRef(false);

  // value が外から変わった時だけ位置を合わせる（スクロール中は無視）
  // items を依存から除外 → 毎レンダーで位置リセットされる不具合を防ぐ
  useEffect(() => {
    const el = ref.current;
    if (!el || scrolling.current) return;
    const idx = items.indexOf(value);
    if (idx < 0) return;
    if (Math.abs(el.scrollTop - idx * ITEM_H) > 2) el.scrollTop = idx * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleScroll = () => {
    scrolling.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      scrolling.current = false;
      const el = ref.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      el.scrollTop = clamped * ITEM_H;
      if (items[clamped] !== value) onChange(items[clamped]);
    }, 150);
  };

  return (
    <Shell width={width}>
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <Row key={item} active={item === value}>{item}</Row>
        ))}
      </div>
    </Shell>
  );
}

// ── ループホイール（小数部：0〜9 が循環）────────
const REPEAT = 100;
function LoopWheel({ items, value, onChange, width }: {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  width?: number;
}) {
  const repeated = Array.from(
    { length: items.length * REPEAT },
    (_, i) => items[i % items.length]
  );
  const center = Math.floor(REPEAT / 2) * items.length;
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrolling = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = (center + items.indexOf(value)) * ITEM_H;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || scrolling.current) return;
    const idx = Math.max(0, Math.round(el.scrollTop / ITEM_H));
    if (repeated[idx] !== value) {
      el.scrollTop = (center + items.indexOf(value)) * ITEM_H;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleScroll = () => {
    scrolling.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      scrolling.current = false;
      const el = ref.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(repeated.length - 1, idx));
      el.scrollTop = clamped * ITEM_H;
      const v = repeated[clamped];
      if (v !== value) onChange(v);
    }, 150);
  };

  return (
    <Shell width={width}>
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none" }}
      >
        {repeated.map((item, i) => (
          <Row key={i} active={item === value}>{item}</Row>
        ))}
      </div>
    </Shell>
  );
}

// ── 共通パーツ ─────────────────────────────────
function Shell({ children, width }: { children: React.ReactNode; width?: number }) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-inner"
      style={{ height: ITEM_H, width: width ? `${width}px` : undefined, background: "rgba(255,255,255,0.92)" }}
    >
      {children}
    </div>
  );
}

function Row({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <div
      className={`flex items-center justify-center select-none ${
        active ? "" : "text-gray-200"
      }`}
      style={{
        height: ITEM_H,
        scrollSnapAlign: "center",
        fontFamily: "var(--font-bebas)",
        fontSize: "72px",
        letterSpacing: "0.03em",
        ...(active ? {
          color: "#1a1a1a",
          textShadow: "0 1px 0 #fff, 0 2px 4px rgba(0,0,0,0.35), 0 0 2px rgba(0,0,0,0.15)",
        } : {}),
      }}
    >
      {children}
    </div>
  );
}

// ── メイン ────────────────────────────────────
interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function WeightPicker({ value, onChange }: Props) {
  const num = parseFloat(value);
  const intPart = isNaN(num) ? 60 : Math.max(30, Math.min(200, Math.floor(num)));
  const decPart = isNaN(num) ? 0 : Math.round((num - Math.floor(num)) * 10) % 10;

  const intItems = Array.from({ length: 171 }, (_, i) => i + 30);
  const decItems = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="flex items-center justify-center gap-3 my-4">
      <Wheel
        items={intItems}
        value={intPart}
        onChange={(v) => onChange(`${v}.${decPart}`)}
        width={120}
      />
      <span className="text-4xl font-black text-white/70 select-none">.</span>
      <LoopWheel
        items={decItems}
        value={decPart}
        onChange={(v) => onChange(`${intPart}.${v}`)}
        width={70}
      />
      <span className="text-xl font-bold text-white/70 select-none">kg</span>
    </div>
  );
}
