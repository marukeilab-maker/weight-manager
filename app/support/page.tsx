import Link from "next/link";
import { Mail, ChevronLeft, HelpCircle } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

export const metadata = {
  title: "使い方・サポート | こたろうダイエット",
  description: "こたろうダイエットの使い方・よくある質問・お問い合わせ",
};

const FAQS = [
  {
    q: "データはどこに保存されますか？",
    a: "ご利用の端末内（ブラウザの localStorage）にのみ保存されます。MARUKEI LAB. のサーバーには一切送信されず、第三者にも提供しません。詳しくは「プライバシーポリシー」をご覧ください。",
  },
  {
    q: "機種変更するとき、データは引き継げますか？",
    a: "はい。設定 →「データのバックアップ」→「データをエクスポート（JSON）」で書き出したファイルを、新しい端末で「インポート」すれば復元できます。月1回程度のバックアップをおすすめします。",
  },
  {
    q: "ホームの「こたろう」の体型はどう変わりますか？",
    a: "達成率（開始時からどれだけ目標に近づいたか）に応じて段階的にスリムになります。スタート時のBMIによって出発点が変わり、達成率100%で特別なご褒美バージョン（手を上げてキラキラ）が登場します。痩せ型の方には体型を変化させず、健康を優先したメッセージを表示します。",
  },
  {
    q: "「目標カロリーの自動計算」は何をしていますか？",
    a: "性別・年齢・身長・現在の体重と、選んだ活動量から基礎代謝（Mifflin-St Jeor 式）と消費目安（TDEE）を計算し、そこから約500kcal/日を差し引いた値（健康的に約0.5kg/週減るペース）を提案します。下限は1,200kcalにしています。",
  },
  {
    q: "全データをリセットするには？",
    a: "設定の一番下にある「全データをリセット」から、2段階の確認のうえ実行できます。取り消せませんので、念のため事前にエクスポートをおすすめします。",
  },
  {
    q: "目標が「無理がある」と警告が出ました。なぜ？",
    a: "週に体重の1%以上を減らす計画は、筋肉量の減少・体調不良・リバウンドのリスクが高くなります。安全に達成できる目安の日付も表示しているので、目標体重か期限の見直しをご検討ください。",
  },
  {
    q: "広告は出ますか？追加課金はありますか？",
    a: "広告も追加課金もありません。アプリ購入時の代金以外は一切いただきません。",
  },
  {
    q: "インターネットがなくても使えますか？",
    a: "はい。データは端末内に保存されるため、オフラインでも記録・閲覧できます。",
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

        {FAQS.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg p-4">
            <p className="text-sm font-black text-gray-800 mb-1.5">Q. {f.q}</p>
            <p className="text-xs text-gray-600 leading-relaxed">A. {f.a}</p>
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
