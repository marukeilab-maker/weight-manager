@AGENTS.md

# こたろうダイエット — 開発ガイド

## プロジェクト概要

- **アプリ名**: こたろうダイエット
- **リポジトリ**: marukeilab-maker/weight-manager
- **本番URL**: https://weight-manager-nu.vercel.app
- **技術スタック**: Next.js 14 (App Router) / TypeScript / Tailwind CSS
- **デプロイ**: Vercel (`vercel deploy --prod`)
- **iOS対応**: Capacitor（別途ビルド）

---

## データ構造

すべてのデータは `localStorage` に保存される。サーバーDBなし。

| キー | 内容 |
|---|---|
| `wm_profile` | プロフィール（身長・目標体重・誕生日・性別など） |
| `wm_records` | 体重記録（日付・体重・BMI） |
| `wm_meals` | 食事カロリー記録（日付・朝昼夜間食） |
| `wm_exercises` | 運動記録（日付・種目・時間・消費kcal） |
| `wm_meal_dishes` | 各食事スロットの料理詳細 |
| `wm_custom_food_history` | よく使う料理（★お気に入り） |
| `wm_last_backup` | 最終バックアップ日 |
| `wm_show_meal_exercise` | 食事・運動タブ表示設定（"false"で非表示） |
| `wm_activity_level` | 活動レベル（"low"等の生文字列。JSONではない点に注意） |
| `wm_maintenance` | 維持モード `{startDate, baseWeight}`。存在＝維持モードON |
| `wm_goal_celebrated` | お祝い済みの目標体重値（同じ目標で再度お祝いしないため） |

---

## ⚠️ 過去に起きた重大トラブルと原因・対処法

### 1. iOSでデータが全消失する

**原因**: iOSのPWAはホーム画面のアイコンを削除すると `localStorage` が完全に消える。Safariのデータ消去では消えない。

**対処**:
- ホーム画面にバックアップ警告バナーを実装済み（7日以上バックアップなしで表示）
- ユーザーにアイコンを削除しないよう案内する
- データが消えた場合、バックアップJSONファイルから設定ページでインポートできる

---

### 2. `output: "export"` をnext.config.tsに追加するとVercelが壊れる

**原因**: Capacitor用のビルドには `output: "export"` が必要だが、これを追加するとVercelのPWAサービスワーカーが壊れ、アプリが表示されなくなる。

**絶対にやってはいけないこと**:
```typescript
// next.config.ts に以下を追加してはいけない
const nextConfig: NextConfig = {
  output: "export",  // ← これがVercelを壊す
};
```

**正しい状態**:
```typescript
const nextConfig: NextConfig = {
  turbopack: {},
  // output: "export" は書かない
};
```

**Capacitorビルド時のみ**一時的に追加し、Vercelデプロイ前に必ず元に戻す。

---

### 3. `capacitor.config.ts` がVercelのTypeScriptビルドエラーを起こす

**原因**: CapacitorのAPIがVercelの型チェックに通らない。

**対処**: `tsconfig.json` の `exclude` に追加済み。
```json
"exclude": ["node_modules", "capacitor.config.ts", "ios"]
```
この設定を消さないこと。

---

### 4. PWAキャッシュが古いバージョンのまま残る

**原因**: サービスワーカーがキャッシュした壊れたバージョンをiPhoneが使い続ける。

**対処**:
1. SafariでURLを直接開く（PWAアイコンではなく）
2. Safari設定 → このWebサイトの設定 → キャッシュをクリア
3. または `vercel deploy --prod` で再デプロイするとキャッシュバスティングが走る

---

### 5. `git stash` でコードを巻き戻す方法

変更が多すぎて壊れた場合は最後のコミット状態に戻せる:
```bash
git stash          # 現在の変更を一時退避
git stash drop     # 退避した変更を完全に捨てる場合
```

---

## 主要ファイル

| ファイル | 役割 |
|---|---|
| `app/page.tsx` | ホーム（体重入力・目標・カロリー収支・BMI） |
| `app/meals/page.tsx` | 食事記録ページ |
| `app/exercise/page.tsx` | 運動記録ページ |
| `app/records/page.tsx` | 体重グラフ・記録一覧・月間サマリー |
| `app/settings/page.tsx` | 設定・バックアップ・インポート |
| `components/WeightChart.tsx` | 体重グラフ（Recharts使用） |
| `components/WeightCat.tsx` | こたろうキャラクター表示 |
| `lib/storage.ts` | localStorage 読み書き関数 |
| `lib/calculations.ts` | BMI・BMR・カロリー計算 |
| `lib/energy.ts` | 今日の消費カロリー算出（実測ベース＝アダプティブTDEE／理論値） |
| `lib/catMessages.ts` | こたろうの日替わりメッセージ |
| `lib/weeklyReport.ts` | 週次レポート生成 |

---

## 計算式

- **BMR（基礎代謝）**: Mifflin-St Jeor式
  - 男性: `10W + 6.25H - 5A + 5`
  - 女性: `10W + 6.25H - 5A - 161`
- **運動消費カロリー**: `MET × 体重(kg) × 時間(h) × 1.05`
- **BMI**: `体重(kg) / 身長(m)²`

### 今日の消費カロリー（カロリー収支の「消費」）

`lib/energy.ts` の `calcDailyExpenditure()` に一元化。ホーム・食事ページ・グラフはすべてこれを使う（バラバラに計算しないこと）。

1. **実測ベース（アダプティブTDEE）優先** — `calcAdaptiveMaintenance()`
   - 過去28日の体重を線形回帰しトレンド(kg/日)を算出
   - `維持カロリー = 平均摂取 −（体重変化kg/日 × 7200）`
   - 体重の動きから逆算するため、基礎代謝・活動係数・運動・記録漏れの誤差をまとめて吸収する
   - **運動記録は別途加算しない**（実測値に既に含まれるため）
   - 発動条件: 体重記録4件以上・期間7日以上・食事記録5日以上、かつ維持カロリーが 800〜5000 の範囲
2. **理論値フォールバック** — 上記の条件を満たさない時のみ
   - `消費 = 基礎代謝 × 活動係数 + 運動記録`
   - 活動係数は「運動以外の日常活動量」（`lib/constants.ts` の `ACTIVITY_LEVELS`）

UIは `energy.mode`（`"adaptive"` / `"estimate"`）で表示を分岐する。

**目標ライン方式（ダイエット判定）**: 維持を下回るだけでは「成功」とせず、`消費 − DAILY_TARGET_DEFICIT`（`lib/constants.ts`、既定 -500kcal/日 ≒ 週0.5kg減）を「目標ライン」とし、摂取がそれを下回って初めて「ダイエットペース達成🎉」とする。ホーム・食事ページは収支を3段階で表示：
- `balance >= DAILY_TARGET_DEFICIT` → 達成🎉（teal）
- `0 <= balance < DAILY_TARGET_DEFICIT` → もう少し👍（amber）
- `balance < 0` → オーバー⚠️（red）
摂取バーには目標ラインの位置に緑の縦マーカーを表示する。

**矛盾検知（重要）**: 理論値は消費を高く見積もりがちで、「体重が増えているのに収支マイナス（緑）」という矛盾が起きうる。対策として：
- `energy.recentTrendKgPerWeek`（直近14日の体重トレンド）を持ち、estimate表示中に増加傾向(>0.1kg/週)なのに「不足」と出る時は、ホーム・食事ページで警告（「体重は増加傾向です」）に切り替える。
- グラフ（`WeightChart`）は `calcChartMaintenance()` を使う。これは厳密な実測ベースが出ない時でも、体重トレンドに合わせて維持カロリーを逆算するため、バーの平均がトレンドと一致し「増加中に緑へ偏る」矛盾が構造的に起きない。

---

## デプロイ手順

```bash
# 型チェック（必ず通してからデプロイ）
npx tsc --noEmit

# Vercelにデプロイ
vercel deploy --prod

# GitHubに保存
git add <変更ファイル>
git commit -m "変更内容"
git push origin main
```

---

## 維持モード・お祝い画面の仕組み

- ホームで体重記録時、`体重 <= goalWeight` かつ `wm_goal_celebrated !== String(goalWeight)` かつ維持モードOFFなら、フルスクリーンお祝い画面を表示
- お祝い画面の「維持モードをはじめる」で `wm_maintenance` に `{startDate, baseWeight: goalWeight}` を保存
- 維持モード中はホームの目標カードの代わりに維持モードカード（基準±1kgバンド）を表示
- 解除は設定ページの維持モードバナーから（`wm_maintenance` を削除）
- 解除後、**別の目標体重**を設定すれば再びお祝いが出る（同じ目標では出ない）

---

## 設定連動ルール

`wm_show_meal_exercise` が `"false"` の時、以下を非表示にする：
- ホーム: カロリー収支カード
- 記録: 食事パターン分析・月間サマリーの平均摂取カロリー列
- グラフ: タイトルを「体重グラフ」に変更（通常は「体重 & カロリー収支」）
- BottomNav: 食事・運動タブ

設定変更をページをまたいで即時反映させるには、localStorage書き込み後に必ず以下を実行する：
```typescript
window.dispatchEvent(new Event("wm_settings_changed"));
```
BottomNav・RecordsPage・HomePageがこのイベントをリッスンして再描画する。

---

## ⚠️ 日付処理の注意点

**`new Date("YYYY-MM-DD")` はタイムゾーンのずれで前日になる場合がある。**  
必ず末尾に `T00:00:00` をつけてローカル時刻として解釈させること。

```typescript
// ❌ 危険（UTCで解釈される → 日本では前日になることがある）
new Date("2025-06-09")

// ✅ 安全（ローカル時刻で解釈される）
new Date("2025-06-09T00:00:00")
```

`addDays()` や `today()` など `lib/calculations.ts` の関数は全てこの形式で統一済み。  
新しく日付処理を書く時も必ず `T00:00:00` をつけること。

---

## バージョン管理

バージョンは2箇所で管理されており、両方を同時に更新すること：

```
lib/version.ts    → APP_VERSION = "x.x.x"
package.json      → "version": "x.x.x"
```

設定ページのアプリ情報欄に `APP_VERSION` が表示される。

---

## バックアップ対象キーの管理

バックアップ・インポートの対象キーは `lib/constants.ts` の `BACKUP_KEYS` で一元管理している。  
新しいデータをlocalStorageに追加した場合は `BACKUP_KEYS` に追記すること。

```typescript
export const BACKUP_KEYS = [
  "wm_profile",
  "wm_records",
  "wm_meals",
  "wm_exercises",
  "wm_meal_dishes",
  "wm_custom_food_history",
  "wm_show_meal_exercise",
  "wm_activity_level",
] as const;
```

ホーム（handleBackup）と設定ページの両方がこの定数をimportして使っている。
独自の配列を作らないこと。なお `wm_activity_level` は生文字列のため、
エクスポート時は `try { JSON.parse } catch { 生文字列のまま }`、
インポート時は `typeof val === "string" ? そのまま : JSON.stringify` で処理する。

---

## iOS / Capacitor ビルド

**App情報**:
- App ID: `com.marukeilab.kotarodiet`
- App名: `こたろうダイエット`
- Xcodeプロジェクト: `ios/App/App.xcodeproj`

**Capacitorビルド手順**（Vercelとは独立して行う）:
```bash
# 1. next.config.ts に一時的に output: "export" を追加
# 2. ビルド
npm run build
# 3. iOSに同期
npx cap sync ios
# 4. Xcodeで開く
npx cap open ios
# 5. ビルド後、next.config.ts から output: "export" を必ず削除して戻す
# 6. vercel deploy --prod で再デプロイ（Vercel側を壊したままにしない）
```

**アイコン元ファイル**: `public/` にあるダンベルを持った猫の画像  
生成コマンド: `sips -z <size> <size> source.png --out dest.png`

---

## MET値（運動強度）

`lib/calculations.ts` の `MET_VALUES` で定義。新しい運動を追加する時はここに追記する。

| 運動 | MET |
|---|---|
| ウォーキング | 3.5 |
| 速歩 | 4.5 |
| ランニング | 8.0 |
| 水泳 | 8.0 |
| サイクリング | 6.0 |
| 筋トレ | 4.0 |
| ストレッチ | 2.5 |
| その他 | 3.0 |

---

## App Store 申請状況（2025年6月時点）

- Apple Developer Program: 登録済み（12,980円/年）
- App Store Connect: 未設定
- スクリーンショット: 未作成
- 審査提出: 未実施
- 現状: PWA（Safari経由）としてのみ使用可能

---

## こたろうのメッセージ管理

- **日替わりメッセージ**: `lib/catMessages.ts` — 今日の日付をシードに毎日変わる
- **週次レポートメッセージ**: `lib/weeklyReport.ts` の `buildMessage()` — 体重変化・記録日数・運動日数に応じて自動生成
- メッセージを追加・変更する場合はそれぞれのファイルを編集する
