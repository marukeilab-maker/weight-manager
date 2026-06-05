import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";

export const metadata = {
  title: "プライバシーポリシー | こたろうダイエット",
  description: "こたろうダイエットのプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-br from-gray-600 to-gray-800 pt-10 pb-6 px-4 rounded-b-3xl shadow-lg">
        <Link href="/settings" className="inline-flex items-center gap-1 text-white/80 text-xs mb-2 font-bold">
          <ChevronLeft size={14} /> 設定にもどる
        </Link>
        <h1 className="text-white text-2xl font-black flex items-center gap-2">
          <Shield size={22} /> プライバシーポリシー
        </h1>
        <p className="text-white/60 text-[11px] mt-1">最終更新日：2026年6月1日</p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-5 text-sm text-gray-700 leading-relaxed">
          <p>
            MARUKEI LAB.（以下「当方」）が提供するアプリ「こたろうダイエット」（以下「本アプリ」）における、利用者の個人情報の取扱いおよび利用条件について、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。利用者は本アプリを利用することにより、本ポリシーに同意したものとみなされます。
          </p>

          <section>
            <h2 className="font-black text-gray-800 mb-1">1. 取得する情報と保存場所</h2>
            <p>
              本アプリで入力された次の情報は、すべて<strong>ご利用の端末内（ブラウザの localStorage）にのみ保存</strong>されます。当方のサーバーや外部サービスへ送信されることはありません。
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li>プロフィール（性別、生年月日、身長、目標体重、目標期限など）</li>
              <li>体重・食事・運動の記録</li>
              <li>アプリ設定（目標カロリー、活動レベル等）</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">2. 第三者への提供</h2>
            <p>取得した情報を、当方が第三者へ提供・販売・共有することは一切ありません。広告配信や行動分析のための情報送信も行いません。</p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">3. データのバックアップ・削除</h2>
            <p>
              利用者は本アプリの設定画面から、いつでもデータをエクスポート（書き出し）・インポート（復元）・全削除（リセット）できます。アプリのアンインストールやブラウザのデータ消去によっても、保存されたデータは削除されます。データは端末内のみに存在するため、復旧は当方では行えません。バックアップは利用者の責任で適宜実施してください。
            </p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">4. クッキー・トラッキング</h2>
            <p>本アプリは、利用者を識別・追跡するための Cookie やトラッキング技術を使用していません。Apple の App Tracking Transparency（ATT）に基づくトラッキングも行いません。</p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">5. 安全管理</h2>
            <p>データは端末内のみで管理されます。端末紛失や盗難時の情報漏えいを防ぐため、画面ロックなど端末側のセキュリティ設定をおすすめします。</p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">6. 未成年の利用について</h2>
            <p>
              本アプリは13歳未満の方の利用を想定していません。未成年の方が利用する場合は、保護者の同意・監督のもとでご利用ください。13歳未満の方の情報を当方が意図的に取得することはありません。
            </p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">7. 健康情報の位置づけ</h2>
            <p>
              本アプリは健康管理のサポートを目的としたものであり、<strong>医療機器・医薬品・治療・診断・栄養指導のいずれでもありません</strong>。Apple HealthKit など他社の健康データプラットフォームとは連携しておらず、当該データへのアクセスも行いません。表示される基礎代謝・消費カロリー・健康範囲・減量ペース等は一般的な計算式に基づく目安であり、医学的な正確性を保証するものではありません。健康状態・体重管理に関する判断は、必ず医師・管理栄養士など医療専門家にご相談ください。
            </p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">8. 課金・購入情報の取扱</h2>
            <p>
              本アプリの購入および返金処理は Apple Inc.（App Store）が行います。当方が決済情報・クレジットカード情報・購入者の氏名・住所等を取得することはありません。返金のご相談は Apple へ直接お申し込みください（サポートページに案内があります）。
            </p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">9. 利用者の権利（開示・訂正・削除）</h2>
            <p>
              本アプリで扱う情報はすべて利用者ご自身の端末内にあり、設定画面およびアプリ内の各種編集機能から、<strong>利用者ご自身でいつでも閲覧・訂正・削除・出力（エクスポート）</strong>できます。当方は外部にデータを保有しておりませんので、開示・訂正・削除等のご請求にお応えする情報を保有していません。
            </p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">10. 免責事項</h2>
            <p>本アプリの利用に関し、以下を免責事項とします。</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>本アプリで表示される計算結果・推奨値・グラフ等は目安であり、正確性・完全性・適合性を保証しません。</li>
              <li>本アプリの利用または利用不能に起因して利用者または第三者に生じた損害（健康被害、データの消失、機会損失、精神的損害等を含みます）について、当方は責任を負いません。ただし、当方の故意または重大な過失による場合を除きます。</li>
              <li>前項の責任が認められる場合であっても、当方の賠償責任は、利用者が本アプリの購入のために実際に支払った金額を上限とします。</li>
              <li>端末の故障・OS や OS 機能の仕様変更・データ削除・通信障害等によりデータが失われた場合、当方は復旧義務を負いません。</li>
              <li>本アプリは現状有姿（AS IS）で提供され、商品性、特定目的への適合性、第三者の権利を侵害しないことについて、明示・黙示を問わず保証しません。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">11. 準拠法および管轄</h2>
            <p>
              本ポリシーおよび本アプリの利用に関する紛争については、<strong>日本国の法令</strong>を準拠法とし、<strong>東京地方裁判所</strong>を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">12. サービスの提供・変更・終了</h2>
            <p>
              当方は、本アプリの内容・機能・仕様を、利用者への事前通知なく変更・追加・削除することがあります。また、運営上または技術上の理由により、本アプリの提供を中断・停止または終了することがあります。提供の中断・停止・終了に伴って利用者または第三者に生じた損害（データの利用不能・喪失、機会損失等を含みます）について、当方は責任を負いません。終了に際して購入代金の返金や補償は行いません（Appleの返金ポリシーが別途適用される場合があります）。
            </p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">13. 本ポリシーの変更</h2>
            <p>本ポリシーの内容は、法令変更・サービス改善等のため、必要に応じて変更することがあります。重要な変更がある場合はアプリ内またはサポートページにてお知らせします。変更後も本アプリを継続してご利用になった場合、変更に同意したものとみなされます。</p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 mb-1">14. お問い合わせ</h2>
            <p>本ポリシー、本アプリ、個人情報の取扱いに関するお問い合わせは下記までお願いいたします。</p>
            <p className="mt-2">
              <strong>運営者：</strong>MARUKEI LAB.<br />
              <strong>連絡先：</strong>
              <a href="mailto:marukeilab@gmail.com" className="text-blue-600 underline">marukeilab@gmail.com</a>
            </p>
          </section>
        </div>

        <div className="pt-4 pb-4 text-center">
          <Link href="/support" className="text-xs font-bold text-gray-500">← 使い方・サポートにもどる</Link>
        </div>
        <div className="text-center pb-2">
          <p className="text-[10px] text-gray-400">© 2026 MARUKEI LAB.</p>
        </div>
      </div>
    </div>
  );
}
