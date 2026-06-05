"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, UtensilsCrossed, Dumbbell, Settings } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "ホーム" },
  { href: "/records", icon: BarChart2, label: "記録" },
  { href: "/meals", icon: UtensilsCrossed, label: "食事" },
  { href: "/exercise", icon: Dumbbell, label: "運動" },
  { href: "/settings", icon: Settings, label: "設定" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 max-w-md mx-auto">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                active
                  ? "text-orange-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${active ? "font-bold" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
