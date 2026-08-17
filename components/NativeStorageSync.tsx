"use client";
import { useEffect } from "react";
import { isNativeApp, restoreFromNative, seedNativeMirror, installNativeMirror } from "@/lib/nativePersist";

/**
 * iOSネイティブ版のデータ保護（詳細は lib/nativePersist.ts）。
 * Web/PWAでは何もしない。
 *
 * iOSはアプリ実行中でもストレージ逼迫時にWKWebViewのlocalStorageを削除することがある。
 * その場合、各ページが空のlocalStorageを読んで「記録できない・体重ページに行けない」等の
 * 不具合になる。以前は起動時（マウント時）にしか復元しておらず、実行中に消えると
 * 端末再起動（＝完全再起動）まで直らなかった。そこで前面復帰のたびにも復元をチェックする。
 */
export default function NativeStorageSync() {
  useEffect(() => {
    if (!isNativeApp()) return;

    let checking = false;
    // localStorageから消えたキーがあればPreferencesから復元する。
    // 実際に復元が発生した時だけ再読み込みして各ページに反映させる。
    // 復元はlocalStorageへ書き戻してからreloadするため、再読み込み後は
    // 欠損キーが無くなり復元は起きない＝リロードループにならない。
    const checkAndRestore = async () => {
      if (checking) return;
      checking = true;
      try {
        const restored = await restoreFromNative();
        if (restored > 0) {
          window.location.reload();
        }
      } finally {
        checking = false;
      }
    };

    (async () => {
      await checkAndRestore(); // 起動時
      installNativeMirror();
      await seedNativeMirror();
    })();

    // 前面復帰時にも復元チェック（実行中の消失に対応）。
    const onForeground = () => {
      if (document.visibilityState === "visible") void checkAndRestore();
    };
    document.addEventListener("visibilitychange", onForeground);
    window.addEventListener("focus", onForeground);
    return () => {
      document.removeEventListener("visibilitychange", onForeground);
      window.removeEventListener("focus", onForeground);
    };
  }, []);
  return null;
}
