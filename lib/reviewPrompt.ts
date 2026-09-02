import { Capacitor } from "@capacitor/core";

/**
 * アプリ内レビュー依頼（App Storeの星評価ダイアログ）。
 *
 * - ネイティブ（iOS）でのみ動作。Web/PWAでは何もしない。
 * - iOSのSKStoreReviewController自体がOS側で年3回程度に自動制限するが、
 *   良いタイミング以外で無駄に呼ばないよう、自前でも前回依頼から一定期間空ける。
 * - プラグイン未導入・非対応環境でも決して例外を投げない（黙って無視）。
 *
 * 呼び出しは「目標達成」「連続記録の節目」など、ユーザーが満足している瞬間に限定する。
 */
const LAST_ASKED_KEY = "wm_review_last_asked";
const MIN_INTERVAL_DAYS = 120;

export async function requestAppReview(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!Capacitor.isNativePlatform()) return; // Web/PWAは対象外

  try {
    // 前回依頼から十分に間隔が空いていなければスキップ
    const last = localStorage.getItem(LAST_ASKED_KEY);
    if (last) {
      const days = (Date.now() - Number(last)) / 86_400_000;
      if (Number.isFinite(days) && days < MIN_INTERVAL_DAYS) return;
    }

    // 動的import：Web版のバンドルに含めない
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
    localStorage.setItem(LAST_ASKED_KEY, String(Date.now()));
  } catch {
    // 未対応環境・プラグイン未導入時は何もしない
  }
}
