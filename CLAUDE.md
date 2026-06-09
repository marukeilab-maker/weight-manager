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
| `wm_last_backup` | 最終バックアップ日 |
| `wm_show_meal_exercise` | 食事・運動タブ表示設定（"false"で非表示） |

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
| `lib/catMessages.ts` | こたろうの日替わりメッセージ |
| `lib/weeklyReport.ts` | 週次レポート生成 |

---

## 計算式

- **BMR（基礎代謝）**: Mifflin-St Jeor式
  - 男性: `10W + 6.25H - 5A + 5`
  - 女性: `10W + 6.25H - 5A - 161`
- **運動消費カロリー**: `MET × 体重(kg) × 時間(h) × 1.05`
- **BMI**: `体重(kg) / 身長(m)²`

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

## 設定連動ルール

`wm_show_meal_exercise` が `"false"` の時、以下を非表示にする：
- ホーム: カロリー収支カード
- 記録: 食事パターン分析・月間サマリーの平均摂取カロリー列
- グラフ: タイトルを「体重グラフ」に変更（通常は「体重 & カロリー収支」）
- BottomNav: 食事・運動タブ
