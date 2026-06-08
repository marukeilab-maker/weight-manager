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
        a: "①「設定」タブを開く → ②身長・性別・生年月日を入力 → ③現在の体重を「記録」タブで登録 → ④目標体重と達成日を設定 → ⑤「目標カロリーを自動計算」をタップ。これだけで準備完了です！あとは毎日の体重・食事・運動を記録していくだけです。",
      },
      {
        q: "ホーム画面に追加するには？（iPhoneの場合）",
        a: "Safari でアプリを開いた状態で、画面下の「共有」ボタン（□に↑のアイコン）→「ホーム画面に追加」→「追加」をタップしてください。アイコンがホーム画面に追加され、アプリのように起動できます。Chromeをお使いの場合は、右上の「…」→「ホーム画面に追加」から同様に追加できます。",
      },
      {
        q: "体重はどこで記録しますか？",
        a: "画面下の「記録」タブをタップすると体重入力画面が開きます。数値を入力して「記録する」ボタンをタップするだけです。毎朝起床後・トイレ後・食事前のタイミングで測ると、より正確な変化が把握できます。",
      },
      {
        q: "食事はどうやって記録しますか？",
        a: "画面下の「食事」タブから記録できます。朝食・昼食・夕食・間食のタブを選んで、①ワンタップ入力（軽め約300kcal〜食べすぎ約1200kcalから選ぶ）、②食品検索（700種以上から検索してタップするだけ）、③手動入力（料理名とカロリーを直接入力）の3通りの方法があります。",
      },
    ],
  },
  {
    title: "💾 データのバックアップと復元",
    items: [
      {
        q: "バックアップはどうやってとりますか？",
        a: "「設定」タブ →「データのバックアップ」→「データをエクスポート（JSON）」をタップすると、記録データが JSON ファイルとしてダウンロードされます。ファイルは iCloud Drive・Google ドライブ・メールなど、安全な場所に保管しておいてください。月に1回程度のバックアップをおすすめします。",
      },
      {
        q: "機種変更・ブラウザ変更でデータを引き継ぐには？",
        a: "【エクスポート（旧端末）】設定 →「データをエクスポート（JSON）」でファイルを書き出し、クラウドやメールなどで保存。【インポート（新端末）】新しい端末でアプリを開き、設定 →「データをインポート」→ 保存したJSONファイルを選択。これだけで体重・食事・運動の全記録が復元されます。",
      },
      {
        q: "ブラウザのキャッシュを消去するとデータは消えますか？",
        a: "はい、消えます。データはブラウザの localStorage に保存されているため、「キャッシュ・Cookieを全削除」や「履歴の全削除」を実行するとデータが失われます。定期的なエクスポートで必ずバックアップを取っておいてください。",
      },
      {
        q: "iCloud バックアップでデータは守られますか？",
        a: "いいえ、守られません。iCloud バックアップはネイティブアプリのデータを対象としており、ブラウザの localStorage は含まれません。データ保護にはアプリ内の「エクスポート機能」を必ず使ってください。",
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
        q: "ホームのキャラクターの体型はどう変わりますか？",
        a: "達成率（開始時からどれだけ目標に近づいたか）に応じて段階的にスリムになります。スタート時のBMIによって出発点が変わり、達成率100%で特別なご褒美バージョン（手を上げてキラキラ）が登場します。痩せ型の方には体型を変化させず、健康を優先したメッセージを表示します。",
      },
      {
        q: "「目標カロリーの自動計算」は何をしていますか？",
        a: "性別・年齢・身長・現在の体重と、選んだ活動量から基礎代謝（Mifflin-St Jeor 式）と消費目安（TDEE）を計算し、そこから約500kcal/日を差し引いた値（健康的に約0.5kg/週減るペース）を提案します。下限は1,200kcalにしています。",
      },
      {
        q: "目標が「無理がある」と警告が出ました。なぜ？",
        a: "週に体重の1%以上を減らす計画は、筋肉量の減少・体調不良・リバウンドのリスクが高くなります。安全に達成できる目安の日付も表示しているので、目標体重か期限の見直しをご検討ください。",
      },
      {
        q: "データはどこに保存されますか？",
        a: "ご利用の端末内（ブラウザの localStorage）にのみ保存されます。MARUKEI LAB. のサーバーには一切送信されず、第三者にも提供しません。詳しくは「プライバシーポリシー」をご覧ください。",
      },
      {
        q: "インターネットがなくても使えますか？",
        a: "はい。データは端末内に保存されるため、オフラインでも記録・閲覧できます。ただし初回起動時はインターネット接続が必要です。",
      },
    ],
  },
  {
    title: "❓ その他",
    items: [
      {
        q: "広告は出ますか？追加課金はありますか？",
        a: "広告も追加課金もありません。アプリ購入時の代金以外は一切いただきません。",
      },
      {
        q: "動作環境を教えてください",
        a: "iPhone（iOS 16 以降推奨）の Safari、または最新の Chrome / Edge / Firefox に対応しています。古い OS や非対応ブラウザでは一部機能が正しく動作しない場合があります。",
      },
      {
        q: "返金してほしい場合はどうすればいいですか？",
        a: "アプリの購入・返金処理はすべて Apple（App Store）が行っています。当方では返金処理ができませんので、お手数ですが Apple のサポート（reportaproblem.apple.com）より直接お申し込みください。判断はAppleが行います。",
      },
      {
        q: "不具合を見つけました。どう報告すれば？",
        a: "下記のお問い合わせメールまでご連絡ください。次の情報を添えていただけると、より早く解決できます：(1) 機種名（例：iPhone 15）、(2) OSバージョン、(3) アプリのバージョン、(4) 発生時の操作手順、(5) スクリーンショット。",
      },
      {
        q: "医療・栄養相談はできますか？",
        a: "申し訳ありませんが、当方は個別の医療相談・診断・栄養指導には対応できません。本アプリは健康管理のサポートツールであり、医療行為ではないためです。健康に関するご相談は医師・管理栄養士など専門家にお願いいたします。",
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

        <p className="text-xs font-black text-gray-400 tracking-wide pt-3 pl-1">お問い合わせ</p>
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            ご質問・ご要望・不具合のご報告は、下記のメールまでお気軽にどうぞ。3日以内を目安に返信いたします。
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

        <p className="text-xs font-black text-gray-400 tracking-wide pt-3 pl-1">関連情報</p>
        <Link
          href="/privacy"
          className="block bg-white rounded-2xl shadow-lg p-4 text-sm font-bold text-gray-700 active:scale-[0.98] transition-transform"
        >
          プライバシーポリシー →
        </Link>

        <div className="pt-6 pb-4 text-center">
          <p className="text-[10px] text-gray-400">© 2026 MARUKEI LAB.</p>
        </div>
      </div>
    </div>
  );
}
