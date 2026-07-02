"use client";
import { useEffect } from "react";
import { isNativeApp, restoreFromNative, seedNativeMirror, installNativeMirror } from "@/lib/nativePersist";

/**
 * iOSネイティブ版のデータ保護（詳細は lib/nativePersist.ts）。
 * Web/PWAでは何もしない。復元が発生した場合のみ、各ページが
 * 空のlocalStorageを読んでしまった可能性があるため一度だけ再読み込みする。
 */
export default function NativeStorageSync() {
  useEffect(() => {
    if (!isNativeApp()) return;
    (async () => {
      const restored = await restoreFromNative();
      installNativeMirror();
      await seedNativeMirror();
      if (restored > 0 && sessionStorage.getItem("wm_native_restored") !== "1") {
        sessionStorage.setItem("wm_native_restored", "1");
        window.location.reload();
      }
    })();
  }, []);
  return null;
}
