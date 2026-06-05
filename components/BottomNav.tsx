"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, BarChart2, UtensilsCrossed, Dumbbell, Settings } from "lucide-react";

const allTabs = [
  { href: "/", icon: Home, label: "ホーム", always: true },
  { href: "/records", icon: BarChart2, label: "記録", always: true },
  { href: "/meals", icon: UtensilsCrossed, label: "食事", always: false },
  { href: "/exercise", icon: Dumbbell, label: "運動", always: false },
  { href: "/settings", icon: Settings, label: "設定", always: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [showMealExercise, setShowMealExercise] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("wm_show_meal_exercise");
    if (stored !== null) setShowMealExercise(stored !== "false");
    const onStorage = () => {
      const v = localStorage.getItem("wm_show_meal_exercise");
      setShowMealExercise(v !== "false");
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("wm_settings_changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("wm_settings_changed", onStorage);
    };
  }, []);

  const tabs = allTabs.filter(t => t.always || showMealExercise);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 max-w-md mx-auto">
      <div className="flex items-center h-16 px-2" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all active:scale-95 ${
                active ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] leading-none ${active ? "font-bold" : "font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
