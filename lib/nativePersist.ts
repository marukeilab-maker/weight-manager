// iOSネイティブ版のデータ保護
//
// WKWebViewのlocalStorageはOSがストレージ逼迫時に削除することがあるため、
// ネイティブ実行時のみ、アプリデータを Capacitor Preferences（=UserDefaults、
// OSに消されない永続領域）へ自動ミラーリングする。
//
// - 書き込み: Storage.prototype をフックし、対象キーの setItem/removeItem/clear を
//   Preferences にも反映（fire-and-forget）
// - 起動時: localStorage に無いキーを Preferences から復元
// - Web/PWA では何もしない（isNativePlatform() が false）

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { BACKUP_KEYS } from "./constants";

/** ミラー対象キー（バックアップ対象＋最終バックアップ日） */
const MIRROR_KEYS: readonly string[] = [...BACKUP_KEYS, "wm_last_backup"];

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * 起動時の復元。localStorage が消えていた（キーが無い）場合のみ
 * Preferences から書き戻す。復元したキー数を返す。
 */
export async function restoreFromNative(): Promise<number> {
  let restored = 0;
  for (const key of MIRROR_KEYS) {
    if (localStorage.getItem(key) !== null) continue;
    const { value } = await Preferences.get({ key });
    if (value !== null) {
      localStorage.setItem(key, value);
      restored++;
    }
  }
  return restored;
}

/** 現在の localStorage の内容を Preferences へ一括コピー（導入直後の初期ミラー用） */
export async function seedNativeMirror(): Promise<void> {
  for (const key of MIRROR_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      await Preferences.set({ key, value });
    }
  }
}

/**
 * localStorage への書き込みを Preferences に自動ミラーするフックを仕込む。
 * アプリ起動中に一度だけ呼ぶこと。
 */
export function installNativeMirror(): void {
  const proto = Storage.prototype;
  const origSet = proto.setItem;
  const origRemove = proto.removeItem;
  const origClear = proto.clear;

  proto.setItem = function (key: string, value: string) {
    origSet.call(this, key, value);
    if (this === window.localStorage && MIRROR_KEYS.includes(key)) {
      void Preferences.set({ key, value });
    }
  };

  proto.removeItem = function (key: string) {
    origRemove.call(this, key);
    if (this === window.localStorage && MIRROR_KEYS.includes(key)) {
      void Preferences.remove({ key });
    }
  };

  // 全データリセット（設定ページ）時はミラーも消す。
  // 消さないと次回起動時に削除したはずのデータが復元されてしまう。
  proto.clear = function () {
    origClear.call(this);
    if (this === window.localStorage) {
      void Preferences.clear();
    }
  };
}
