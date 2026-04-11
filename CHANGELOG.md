# CHANGELOG

変更点を日付ごとに記録する。セッション終了時に追記する。

---

## 2026-04-11

**skill v4.0（GitHub公開対応版）**

- **Phase 1：Bash承認削減**
  - 統合送信（curl×3 + JSONL削除）を1 Bashブロックに統合
  - HTML生成 + ブラウザ起動を1 Bashブロックに統合
  - 承認回数を最大8回 → 最大3回に削減
- **Phase 2：開発者向け整備**
  - skill.md に「クイックリファレンス」セクションを追加（ファイル構成テーブル・Bash呼び出し数サマリー・JSONサマリー）
  - 実行フローをMermaid記法に変換（GitHub上でグラフ表示対応）
  - フロントマターの description / trigger をマルチライン形式で整理
  - 各サブスキルファイル冒頭に役割注記を追加
- **Phase 3：トークン削減**
  - `thought-pattern-skill.md`：Step 4「送信の案内」本文を削除（skill.mdに移管済み）→ 約85行削減
  - `coding-direction-skill.md`：起動メッセージ + 送信の案内 + 結果の可視化を削除 → 約90行削減
  - `pair-analysis-skill.md`：Step 6「可視化」詳細を削除 → 約7行削減
  - 合計 約180行削減。各ファイルは送信JSONスキーマ定義のみ残す

---

## 2026-04-09

**HTMLビジュアライザー v3.1（generate-unified-html.js）**
- ヒーローバー追加：BRIDGER × STRATEGIST × EXPLORATORY を大型表示（28px・Space Grotesk）
  - タイプカラーのグラデーション背景＋ドットグリッドパターン、文字glow効果
- パネルアイコン：3種のSVGカスタムイラストを追加
  - 思考パターン：顎に手を当てて考える人のシルエット（オレンジglow）
  - 指示力：斜め下を指差す人のシルエット（グリーンglow）
  - ペア分析：向き合う二人と対話の弧線（ブルーglow）
- 9軸タグにミニスペクトルバー追加（normalize済みスコアをバーで表示）
- コメント欄を折りたたみ式に（72px表示、「show more ▾」で展開）
- パネル・インサイトカードのホバーエフェクト追加
  - translateY(-3px) + カラーglow（内側リング + 外側shadow）
- EN/JAバイリンガルトグル実装（ヘッダー右上のEN/JAピル）
  - ENモード：英語ラベル＋日本語tooltipを表示
  - JAモード：日本語ラベル＋英語tooltipに切り替え
  - 軸タグ・コーディングバーに data-en / data-ja 属性を追加
- JStooltiをbody直下のグローバルfloating方式に変更
  - overflow:hiddenによるクリッピング問題を解消
  - viewport端での自動反転（左右・上下）
  - デザイン刷新（backdrop-blur、border、box-shadow）
- フォント刷新：Inter（本文）＋ Space Grotesk（ヒーロー・軸値・ペルソナ名）
- ヘッダーからtype-row（小バッジ）を削除してスリム化

**Medium記事**
- #08「Most People Who Use AI Every Day Have Never Seen How They Use It」投稿
  - 出典：OpenAI研究（1.5M会話分析）
  - 個人体験：夫のフレーミングでAI出力が一変したエピソードを追加

**Zenn**
- 実践編（thought-analyzer-vol2）公開（7章構成）

---

## 2026-03-29

**サーバー v2.3（デプロイ済み）**
- `country` カラム追加：CF-IPCountry ヘッダーから取得
- `language` カラム追加：Accept-Language が `ja` で始まる場合 `'ja'`、それ以外 `'other'`
- `character_type` カラム追加：fingerprint から `deriveCharacterType()` で算出して保存
- D1 マイグレーション実施（country/language/character_type カラム追加）
- Cloudflare Workers デプロイ完了

**HTMLビジュアライザー v6（generate-result-html.js）**
- キャラクター画像（人間：char-subject-v2.png / AI：char-axiom9-v2.png）をデフォルト表示に変更
- 背景を白〜薄青のグラデーション（`linear-gradient(160deg, #ffffff 0%, #dde6f5 100%)`）に変更
- フォント：英語テキストは Inter、日本語テキストは Meiryo に分離
- 全体フォントサイズを拡大（body 16px、本文 15px、軸ラベル 14px）
- レーダーチャートのグリッド・角度線を暗色（`rgba(0,0,0,0.1)`）に変更
- ペルソナラベル追加（19パターン、character_type から分岐）
- 詳細ブロックのラベルを英語化：STRENGTHS / FRICTION / POTENTIAL / OVERVIEW / KEY AXIS / BEST CONTEXT / COLLABORATION / LOW CONFIDENCE
- 概念接続キーワードを CONCEPT BRIDGES ブロックとして詳細セクションに追加
- AIフィードバックセクション：「YOUR AI / Thinking Partner」に変更、「AI FEEDBACK FROM YOUR AI」ラベル、吹き出し下に注記テキスト追加

---

## 2026-03-27

**記事公開**
- 「同じAIでも『指示の質』で結果が変わる ── コーディング指示力を6軸で測る」note公開（2本目）
- 「Claudeユーザー1890万人の実態 ── 構造化プロンプトを使っているのは約10〜20%だった」は1本目として投稿済み

**記事執筆ガイドライン整備**
- SEO/ライティング調査（Backlinko・HubSpot・Copyblogger準拠）をもとにガイドライン策定
- フック導入・H2主張型・2〜3文段落・データ出典明記・CTA必須・「いかがでしたか」禁止
- `draft_narrative-layer-and-continuity.md` をガイドラインに従い書き直し

**サーバー v2.2**
- `record_id`（UUID）追加：送信ごとにサーバーが発行、ユーザーが保存すれば後から照合可能
- `user_token_hash` 追加：ユーザーが任意トークンを送信→SHA-256ハッシュ化して保存→時系列照合が可能
- `/export` エンドポイント追加（認証必須・全データJSON取得）
- `/record?id=` エンドポイント追加（認証不要・UUID照合）
- `/user?token=` エンドポイント追加（認証必須・トークンで時系列取得）
- APIキーをローテーション（旧キー露出のため）
- D1マイグレーション実施（record_id・user_token_hashカラム追加）

**skill.md 更新**
- 送信フローに user_token 任意入力ステップを追加
- 送信成功後に record_id を表示・保存を促すメッセージを追加

**データ確認**
- total_count: 6（前回5から+1）

---

## 2026-03-25

**分析品質**
- `holistic_profile`（ナラティブ層）を両skillに追加 → 離散軸で失われた文脈・質感を補完
- `blind_spots` / `universality_note` / `notable` を skill.md commentaryに整備

**可視化**
- `scripts/generate-result-html.js` 作成 → 分析後にブラウザでレーダーチャート＋コメンタリーを表示
- 両skillに「送信後に自動でHTMLを開く」ステップを追加
- HTMLジェネレーターが全commentaryフィールド（holistic_profile / notable / blind_spots / universality_note / collaboration_profile / low_confidence）に対応

**チャート品質**
- レーダーチャート（chart-c-radar.png）：タイトルと軸ラベルの重なりを解消、フォント大きく、SCALE=2で高解像度化
- ICスケール（chart-b-ic-scale.png）・Curiosity対比図（chart-d-curiosity.png）も同様に高解像度化
- テーブル画像（table-axis-1〜9.png）：フォントサイズ・余白を調整し文字重なりを解消

**ディレクトリ整理**
- `skills/` `scripts/` `images/` `images/tables/` `articles/` に分類
- スクリプトの出力パスを新構造に更新
- setsuyaku-blog管理だった記事をthought-analyzer/articles/に移管

**記事・アイデア管理**
- `articles/050_2026-03-25_thought-analyzer-coding-direction.md` 作成（コーディング指示力分析の解説記事）
- `articles/draft_narrative-layer-and-continuity.md` 作成（ナラティブ層・軸連続化の構想メモ）

**マークダウン診断（補助シグナル）**
- coding-direction-skill にマークダウンの書き方を補助的な診断シグナルとして追加
- 「形式と中身は別」「単発セッションの限界」を設計根拠として明記

**サーバー・データ確認**
- `/stats` エンドポイントでサンプル数を確認：total_count=5、ユニークユーザー2名
- 2名の共通点（7軸一致）と差異（evaluation_framing / epistemic_curiosity）を分析
