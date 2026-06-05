"use client";

// ページ遷移のたびに再マウントされ、アニメーションが再生される
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
