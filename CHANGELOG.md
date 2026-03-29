# CHANGELOG

変更点を日付ごとに記録する。セッション終了時に追記する。

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
