"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// ボトムナビと同じ順番
const ORDER = ["/", "/records", "/meals", "/exercise", "/settings"];

export default function SwipeNavigator() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let tracking = false;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        tracking = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
      tracking = true;
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startT;

      // 横スワイプ判定：横移動が十分大きく、縦移動は小さめ、素早い操作
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8 && dt < 700) {
        const idx = ORDER.indexOf(pathname);
        if (idx === -1) return;
        if (dx < 0 && idx < ORDER.length - 1) {
          router.push(ORDER[idx + 1]); // 左スワイプ → 次のページ
        } else if (dx > 0 && idx > 0) {
          router.push(ORDER[idx - 1]); // 右スワイプ → 前のページ
        }
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [pathname, router]);

  return null;
}
