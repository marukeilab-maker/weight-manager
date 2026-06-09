import Link from "next/link";
import { Mail, ChevronLeft, HelpCircle } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

export const metadata = {
  title: "使い方・サポート | こたろうダイエット",
  description: "こたろうダイエットの使い方・よくある質問・お問い合わせ",
};

const FAQ_SECTIONS = [
  {
    title: "🚀 はじめにやること",
    items: [
      {
        q: "まず何を設定すればいいですか？",
        a: "①「設定」タブを開く → ②身長・性別・生年月日を入力 → ③「スタート体重」に現在の体重を入力して記録（基礎代謝・カロリー計算の基準になります）→ ④目標体重と達成日を設定 → ⑤「目標カロリーを自動計算」をタップ。これだけで準備完了です！あとは毎日の体重・食事・運動を記録していくだけです。",
      },
      {
        q: "体重はどこで記録しますか？",
        a: "ホーム画面の体重入力欄が毎日の記録場所です。数値を入力して「記録する」ボタンをタップするだけです。毎朝起床後・トイレ後・食事前のタイミングで測ると、より正確な変化が把握できます。「設定」タブの「スタート体重」でも記録でき、初回セットアップ時に特に便利です。",
      },
      {
        q: "食事はどうやって記録しますか？",
        a: "画面下の「食事」タブから記録できます。朝食・昼食・夕食・間食のタブを選んで、①ざっくり入力（軽め約300kcal〜食べすぎ約1200kcalからワンタップ）、②食品検索（700種以上から検索してタップするだけ）、③よく使う料理（過去に追加した料理を素早く再入力）、④手動入力（料理名とカロリーを直接入力）の4通りの方法があります。前日と同じ食事の場合は「昨日と同じものをコピー」ボタンも使えます。",
      },
      {
        q: "運動はどうやって記録しますか？",
        a: "画面下の「運動」タブから記録できます。種目（ウォーキング・ランニング・筋トレなど）を選び、運動時間（分）を入力するだけで、消費カロリーが自動計算されます。",
      },
    ],
  },
  {
    title: "💾 データのバックアップと復元",
    items: [
      {
        q: "バックアップはどうやってとりますか？",
        a: "「設定」タブ →「データのバックアップ」→「データをエクスポート（JSON）」をタップすると、記録データが JSON ファイルとして書き出されます。ファイルは iCloud Drive・Google ドライブ・メールなど、安全な場所に保管しておいてください。月に1回程度のバックアップをおすすめします。",
      },
      {
        q: "機種変更でデータを引き継ぐには？",
        a: "【旧端末】設定 →「データをエクスポート（JSON）」でファイルを書き出し、iCloud Drive・AirDrop・メールなどで新端末に転送。【新端末】アプリをインストール後、設定 →「データをインポート」→ 保存した JSON ファイルを選択。体重・食事・運動の全記録が復元されます。",
      },
      {
        q: "アプリを削除するとデータは消えますか？",
        a: "はい、アプリを削除するとデータは消えます。事前に必ず「設定 → データをエクスポート」でバックアップを取ってください。再インストール後にインポートすることでデータを復元できます。",
      },
      {
        q: "iCloud バックアップでデータは守られますか？",
        a: "iCloud バックアップでアプリデータが自動保存される場合がありますが、保証はされません。確実なデータ保護には、アプリ内の「エクスポート機能」を使って手動でバックアップすることをおすすめします。",
      },
      {
        q: "インポートすると、既存のデータはどうなりますか？",
        a: "インポートしたデータで上書きされます。現在のデータが消えてしまうため、インポート前に必ず現在のデータをエクスポートして保存しておくことをおすすめします。",
      },
      {
        q: "全データをリセットするには？",
        a: "設定の一番下にある「全データをリセット」から、2段階の確認のうえ実行できます。取り消せませんので、念のため事前にエクスポートをおすすめします。",
      },
    ],
  },
  {
    title: "⚙️ 機能について",
    items: [
      {
        q: "ホームのキャラクター（こたろう）の体型はどう変わりますか？",
        a: "達成率（開始時からどれだけ目標に近づいたか）に応じて段階的にスリムになります。スタート時のBMIによって出発点が変わり、目標達成で特別バージョンが登場します。BMIが低体重（18.5未満）の方には、健康を優先したメッセージを表示します。",
      },
      {
        q: "「スタート体重」は何のために必要ですか？",
        a: "基礎代謝（BMR）・カロリー収支・消費カロリーの計算に使われます。体重記録がない状態だと正確な計算ができないため、設定画面の「スタート体重」で現在の体重を登録してください。入力した値は体重記録にも自動追加されます。",
      },
      {
        q: "「目標カロリーの自動計算」は何をしていますか？",
        a: "性別・年齢・身長・スタート体重と、選んだ活動量から基礎代謝（Mifflin-St Jeor 式）と消費目安（TDEE）を計算し、そこから約500kcal/日を差し引いた値（健康的に約0.5kg/週減るペース）を提案します。下限は1,200kcalにしています。",
      },
      {
        q: "目標が「無理がある」と警告が出ました。なぜ？",
        a: "週に体重の1%以上を減らす計画は、筋肉量の減少・体調不良・リバウンドのリスクが高くなります。安全に達成できる目安の日付も表示しているので、目標体重か期限の見直しをご検討ください。",
      },
      {
        q: "データはどこに保存されますか？",
        a: "ご利用の端末内にのみ保存されます。MARUKEI LAB. のサーバーには一切送信されず、第三者にも提供しません。詳しくは「プライバシーポリシー」をご覧ください。",
      },
      {
        q: "インターネットがなくても使えますか？",
        a: "はい。データは端末内に保存されるため、オフラインでも記録・閲覧できます。",
      },
      {
        q: "週次レポートとは何ですか？",
        a: "先週（月〜日）の体重変化・平均カロリー・運動日数をもとに、こたろうがコメントを届けます。ホーム画面に毎週月曜日以降に表示され、×ボタンで閉じると今週は再表示されません。",
      },
    ],
  },
  {
    title: "🔄 アップデートについて",
    items: [
      {
        q: "アプリはどうやってアップデートしますか？",
        a: "App Store アプリを開き、右上のアカウントアイコンをタップ →「利用可能なアップデート」一覧から「こたろうダイエット」の「アップデート」ボタンをタップしてください。「自動アップデート」をオンにしておくと自動で最新版になります（設定 → App Store → アプリのアップデート）。",
      },
      {
        q: "アップデートするとデータは消えますか？",
        a: "通常のアップデートではデータは消えません。ただし万が一に備え、アップデート前にエクスポートでバックアップを取っておくと安心です。",
      },
      {
        q: "現在のアプリバージョンはどこで確認できますか？",
        a: "この画面の下部「お問い合わせ」欄にバージョン番号が表示されています。また「設定」タブの一番下にも記載されています。",
      },
    ],
  },
  {
    title: "🛒 購入・返金・App Storeについて",
    items: [
      {
        q: "広告は出ますか？追加課金はありますか？",
        a: "広告も追加課金もありません。アプリ購入時の代金以外は一切いただきません。すべての機能を制限なくご利用いただけます。",
      },
      {
        q: "返金してほしい場合はどうすればいいですか？",
        a: "アプリの購入・返金処理はすべて Apple（App Store）が行っています。当方では返金処理ができませんので、Apple のサポートページ（reportaproblem.apple.com）より直接お申し込みください。返金の可否はAppleの判断によります。",
      },
      {
        q: "家族共有（ファミリーシェアリング）はできますか？",
        a: "はい、App Store のファミリーシェアリングに対応しています。購入者のご家族（最大5名）は追加料金なしでご利用いただけます。ただしデータは各端末で独立して管理されます。",
      },
      {
        q: "アプリを気に入った場合、レビューはどこで書けますか？",
        a: "App Store でのレビュー・評価はとても励みになります！App Store の「こたろうダイエット」ページを開き、「評価とレビュー」セクションから投稿いただけます。ありがとうございます🐱",
      },
    ],
  },
  {
    title: "❓ その他",
    items: [
      {
        q: "動作環境を教えてください",
        a: "iPhone・iPad（iOS / iPadOS 16.0 以降）に対応しています。古い OS では一部機能が正しく動作しない場合があります。最新の iOS へのアップデートをおすすめします。",
      },
      {
        q: "不具合を見つけました。どう報告すれば？",
        a: "下記のお問い合わせメールまでご連絡ください。次の情報を添えていただけると、より早く解決できます：(1) 機種名（例：iPhone 15）、(2) iOS バージョン、(3) アプリのバージョン、(4) 発生時の操作手順、(5) スクリーンショット。",
      },
      {
        q: "医療・栄養相談はできますか？",
        a: "申し訳ありませんが、当方は個別の医療相談・診断・栄養指導には対応できません。本アプリは健康管理のサポートツールであり、医療行為ではないためです。健康に関するご相談は医師・管理栄養士など専門家にお願いいたします。",
      },
      {
        q: "本アプリは17歳以上が対象とのことですが、なぜですか？",
        a: "ダイエット・体重管理という内容が成長期の青少年に与える影響を考慮し、App Store のレーティングを17+に設定しています。18歳未満の方は保護者の指導・監督のもとでご利用ください。",
      },
    ],
  },
];

export default function SupportPage() {
  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 pt-10 pb-6 px-4 rounded-b-3xl shadow-lg">
        <Link href="/settings" className="inline-flex items-center gap-1 text-white/80 text-xs mb-2 font-bold">
          <ChevronLeft size={14} /> 設定にもどる
        </Link>
        <h1 className="text-white text-2xl font-black flex items-center gap-2">
          <HelpCircle size={22} /> 使い方・サポート
        </h1>
        <p className="text-white/80 text-xs mt-1">こたろうと一緒に、ゆるく続けるために</p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        <p className="text-xs font-black text-gray-400 tracking-wide pl-1">よくある質問</p>

        {FAQ_SECTIONS.map((section, si) => (
          <div key={si} className="space-y-2">
            <p className="text-xs font-black text-gray-500 pt-3 pl-1">{section.title}</p>
            {section.items.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-4">
                <p className="text-sm font-black text-gray-800 mb-1.5">Q. {f.q}</p>
                <p className="text-xs text-gray-600 leading-relaxed">A. {f.a}</p>
              </div>
            ))}
          </div>
        ))}

        {/* お問い合わせ */}
        <p className="text-xs font-black text-gray-400 tracking-wide pt-3 pl-1">お問い合わせ</p>
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            ご質問・ご要望・不具合のご報告は、下記のメールまでお気軽にどうぞ。3営業日以内を目安に返信いたします。
          </p>
          <a
            href={`mailto:marukeilab@gmail.com?subject=%E3%81%93%E3%81%9F%E3%82%8D%E3%81%86%E3%83%80%E3%82%A4%E3%82%A8%E3%83%83%E3%83%88%20%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B%20(v${APP_VERSION})`}
            className="w-full py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-700 text-white font-bold rounded-xl active:scale-95 transition-all text-sm"
          >
            <Mail size={16} /> marukeilab@gmail.com
          </a>
          <p className="text-[10px] text-gray-400 text-center mt-3">
            アプリのバージョン：<span className="font-bold text-gray-500">v{APP_VERSION}</span>
            <br />
            <span className="text-gray-400">（お問い合わせ時に添えていただけると助かります）</span>
          </p>
        </div>

        {/* 関連情報 */}
        <p className="text-xs font-black text-gray-400 tracking-wide pt-3 pl-1">関連情報</p>
        <div className="space-y-2">
          <Link
            href="/privacy"
            className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-4 text-sm font-bold text-gray-700 active:scale-[0.98] transition-transform"
          >
            <span>🔒 プライバシーポリシー</span>
            <span className="text-gray-400 text-xs">→</span>
          </Link>
          <a
            href="https://www.apple.com/legal/internet-services/itunes/jp/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-4 text-sm font-bold text-gray-700 active:scale-[0.98] transition-transform"
          >
            <span>📄 Apple メディアサービス利用規約</span>
            <span className="text-gray-400 text-xs">↗</span>
          </a>
          <a
            href="https://reportaproblem.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-4 text-sm font-bold text-gray-700 active:scale-[0.98] transition-transform"
          >
            <span>💰 購入・返金のお申し込み（Apple）</span>
            <span className="text-gray-400 text-xs">↗</span>
          </a>
        </div>

        <div className="pt-6 pb-4 text-center">
          <p className="text-[10px] text-gray-400">© 2026 MARUKEI LAB.</p>
        </div>
      </div>
    </div>
  );
}
