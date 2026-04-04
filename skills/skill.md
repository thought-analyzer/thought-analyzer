---
name: thought-pattern-analyzer
description: 会話ログから思考パターンを9軸で抽出し、フィンガープリントJSONを生成する。固有名詞・技術情報・URLは出力に含めない。
trigger: ユーザーが「思考パターンを分析して」「ログを分析して」「thought analyze」「analyze my thinking」「analyze this log」と言ったとき。または「両方分析して」「dual analyze」「思考パターンとコーディング指示力を分析して」と言ったとき（この場合は後述の「デュアル分析モード」を実行する）。または「ペア分析して」「pair analyze」「AIとの返答も含めて分析して」「対話ループを分析して」と言ったとき（この場合は後述の「ペア分析モード」を実行する）
---

# 思考パターン分析 skill v3.0

## 言語ルール（最優先）

**入力ログの主要言語を検出し、出力言語をそれに合わせる。**

| 入力ログの言語 | JSON以外の出力言語 | JSONのcommentaryフィールド |
|---|---|---|
| 日本語が主体 | 日本語 | 日本語 |
| English is dominant | English | English |
| 混在（半々程度） | 指示を出した言語に合わせる | 指示言語 |

JSONのキー名・軸の値（例：`concrete_to_abstract`）は言語によらず英語で固定する。
`commentary`内の文章・`theoretical_references`の書き方のみ言語を切り替える。
**起動メッセージ・送信案内・すべての対話プロンプトも同じ言語ルールに従う。**

**English output example for commentary.summary:**
`"Thinking moves from concrete situations toward concepts and principles. Other perspectives emerge spontaneously. Distant conceptual domains are connected consistently."`

---

## 起動時に必ず表示するメッセージ

このskillが読み込まれたとき、**トリガーの言語に合わせて**以下のいずれかを表示する（変更・省略しない）：

---

**【日本語トリガーの場合】**

**思考パターン分析 skill v3.0 が読み込まれました。**

分析対象のログを貼り付けてください。
（思考パターン・コーディング指示力・ペア分析の3種類を統合実行します）

---

**【English trigger の場合】**

**Thinking Pattern Analyzer skill v3.0 loaded.**

Paste the conversation log you want to analyze.
(Runs all 3 analyses: thinking patterns, coding direction, and pair analysis)

---

## このskillが行うこと・行わないこと

**行うこと**
- 会話ログからユーザーの発言のみを対象に思考パターンを9軸で抽出する
- 各軸に理論的根拠（論文・定説）を明示する
- 結果をJSON（フィンガープリント）と自然言語の解説で出力する

**行わないこと（コードと合わせて確認可能）**
- 固有名詞・人名・サービス名・URLを出力に含めない
- ソースコード・APIキー・技術的な実装内容を出力に含めない
- 個人を特定できる情報を抽出しない
- ログ全文を外部に送信しない（このskillはローカルで完結する）

---

## 理論的根拠

このskillの9軸は以下の実証研究・理論に基づいている。
出力時には該当する理論名と文献を必ず明示すること。

| 軸 | 理論・研究 | 文献 |
|---|---|---|
| abstraction_direction | Construal Level Theory | Trope & Liberman (2010), *Psychological Review* |
| problem_style | Kirton Adaption-Innovation Inventory (KAI) | Kirton (1976), *Journal of Applied Psychology* |
| perspective_taking | Empathizing-Systemizing Theory | Baron-Cohen (2003), *The Essential Difference* |
| face_strategy | Politeness Theory | Brown & Levinson (1987), *Politeness* |
| concept_distance | Conceptual Blending / Remote Associates | Fauconnier & Turner (2002); Mednick (1962) |
| evaluation_framing | Framing Effect / Prospect Theory | Kahneman & Tversky (1979), *Econometrica* |
| need_for_cognition | Need for Cognition Scale | Cacioppo & Petty (1982), *Journal of Personality and Social Psychology* |
| integrative_complexity | Integrative Complexity | Suedfeld & Tetlock (1977) |
| epistemic_curiosity | Epistemic Curiosity (I/D型) | Litman & Spielberger (2003), *Personality and Individual Differences* |

---

## 分析手順

### Step 0：データ量チェック（分析前に必ず実行）

このskillが発動した以降の会話を対象に、ユーザー発言の件数と総文字数を数える。
以下の基準で分析の可否と信頼度を判定する。

| 件数 | 総文字数（目安） | 判定 |
|---|---|---|
| < 10件 | < 300字 | **分析不可**。「まだデータが少なすぎます。もう少し会話を続けてから再度実行してください（目安：50件以上）」と伝えて終了する |
| 10〜30件 | 300〜1000字 | **低信頼**。分析は実行するが、全軸に `low_confidence` を付与し、その旨を明記する |
| 30〜100件 | 1000〜5000字 | **標準**。通常どおり分析を実行する |
| 100件以上 | 5000字以上 | **高精度**。分析結果の冒頭に「十分なデータ量で高精度な分析が可能です」と明記する |

**重要：** ユーザーが外部ログを貼り付けた場合は、そのログの件数・文字数でこの基準を適用する。

---

### Step 1：ログの前処理

入力されたログからユーザーの発言のみを抽出する。
AIの返答・ツール出力・コードブロック・URLは無視する。

### Step 2：9軸の抽出

以下の定義に従って各軸を判定する。
**必ずこの9軸のみを出力する。それ以外の情報を加えない。**

---

#### 軸1：abstraction_direction（抽象〜具体の移動方向）
**理論：Construal Level Theory（Trope & Liberman, 2010）**
心理的距離が遠いほど抽象的・原則的な思考に向かう傾向。

| 値 | 定義 |
|---|---|
| `concrete_to_abstract` | 具体的な事象・課題から始まり、概念・原則へ向かう |
| `abstract_to_concrete` | 概念・アイデアから始まり、実装・具体へ向かう |
| `stays_concrete` | 終始具体的な話の中にとどまる |
| `stays_abstract` | 終始概念・方針レベルにとどまる |

---

#### 軸2：problem_style（問題へのアプローチ）
**理論：Kirton Adaption-Innovation Inventory / KAI（Kirton, 1976）**
Adaptor（既存の枠内で修正）vs Innovator（枠を変える・代替を探す）の連続体。

| 値 | 定義 |
|---|---|
| `pivot` | 別の方法・代替案を先に探す（Innovator寄り） |
| `fix` | 原因を特定して修正しようとする（Adaptor寄り） |
| `delegate` | 解決を相手に委ねる |
| `suspend` | 保留して後で判断する |

---

#### 軸3：perspective_taking（他者視点の出現）
**理論：Empathizing-Systemizing Theory（Baron-Cohen, 2003）**
他者の内的状態・立場への自発的な注意の程度。

| 値 | 定義 |
|---|---|
| `spontaneous` | 求められていないのに自然に出てくる |
| `reactive` | 促されたり関連話題が出たときに出てくる |
| `absent` | ほとんど出てこない |

---

#### 軸4：face_strategy（言語の配慮戦略）
**理論：Politeness Theory（Brown & Levinson, 1987）**
Faceへの配慮（Positive face: 承認欲求 / Negative face: 自律欲求）と言語ストラテジーの関係。

| 値 | 定義 |
|---|---|
| `high_mitigation` | 「〜かな」「〜かも」「〜ていい？」など配慮表現が多い |
| `moderate` | 断定と配慮が混在 |
| `low_mitigation` | 断定・命令形が多い |

スコアも付与：0.0（低配慮）〜 1.0（高配慮）

---

#### 軸5：concept_distance（概念接続の距離・数）
**理論：Conceptual Blending（Fauconnier & Turner, 2002）/ Remote Associates（Mednick, 1962）**
接続される概念領域の意味的な遠さと多様さ。創造性・発散的思考の指標。

出力形式：
- `bridges`：接続された領域ペアのリスト（**領域名のみ。固有名詞・内容は含めない**）
- `distance`：`near`（隣接領域）/ `mid`（やや遠い）/ `far`（通常接続されない領域）
- `count`：検出されたブリッジ数

領域の例（これに限らない）：
`経済`, `感情`, `技術`, `文学`, `哲学`, `デザイン`, `育成`, `記録`, `空間`, `時間`, `他者`, `自己`, `数字`, `形而上学`, `身体`, `習慣`, `言語`

---

#### 軸6：evaluation_framing（評価のフレーミング）
**理論：Framing Effect / Prospect Theory（Kahneman & Tversky, 1979）**
同じ情報をどの枠組みで提示するかが判断に影響する。発言の評価順序・強調点に現れる。

| 値 | 定義 |
|---|---|
| `gain_first` | 肯定・方向確認を先に出してから修正・問題を加える |
| `loss_first` | 問題点・懸念を先に出す |
| `neutral` | 情報提供型。価値判断を前面に出さない |
| `mixed` | 文脈によって変わる |

---

#### 軸7：need_for_cognition（思考への欲求）
**理論：Need for Cognition Scale（Cacioppo & Petty, 1982）**
複雑な問題を考えることに喜びを感じ、自発的に問いを作る程度。
高NFC：情報を自ら探し、問いを構築し、熟考する。低NFC：シンプルな答えを好む。

| 値 | 定義 |
|---|---|
| `high` | 自発的に問いを立て、複雑な考察を展開する |
| `moderate` | 必要に応じて熟考するが、自発的な問いは少ない |
| `low` | 簡潔な答えと明確な指示を好む |

---

#### 軸8：integrative_complexity（統合的複雑性）
**理論：Integrative Complexity（Suedfeld & Tetlock, 1977）**
思考の**分化**（複数の側面を見る）と**統合**（それらを接続する）の程度。
テキストから客観的に測定できる唯一の思考複雑性指標。

スコア：1〜7
- 1：一次元的。単一の視点のみ
- 3：分化あり。複数の側面を認識するが統合しない
- 5：分化＋統合。複数の側面を認識し、相互関係を考える
- 7：高度な統合。多次元的な枠組みを構築する

---

#### 軸9：epistemic_curiosity（認識論的好奇心）
**理論：Epistemic Curiosity（Litman & Spielberger, 2003）**
知らないことへの探索欲の種類。
- **I型（Interest）**：新しい情報それ自体への喜び
- **D型（Deprivation）**：知識のギャップを埋めたい不快感からの探索

| 値 | 定義 |
|---|---|
| `interest_type` | 「面白そう」「試してみたい」が動機。知ること自体が目的 |
| `deprivation_type` | 「わからないと気持ち悪い」が動機。ギャップを埋めることが目的 |
| `mixed` | 両方の動機が混在 |

---

### influence_map の判定ルール

各軸について、スコア判定に最も寄与した発言の特徴を `primary_source` に簡潔に記述する。
`confidence` は以下の基準で決定する：

| confidence | 基準 |
|---|---|
| `high` | ログ全体を通じて一貫したパターンが確認でき、特定の発言への依存が低い |
| `medium` | 複数の発言から読み取れるが、特定の区間や発話スタイルの影響を受けている |
| `low` | 判定根拠が少数の発言に偏っている、またはログ量が不足している |

`primary_source` の記述例：
- `"全体を通じて一貫。特に技術的な問題提起の場面で顕著"`
- `"冒頭の自己紹介的な発言に影響を受けている可能性あり"`
- `"ログ量が少なく、後半の2〜3件からの推定"`

**注意**：`influence_map` はユーザー向けの透明性フィールドであり、サーバーには送信されない。

---

### Step 3：出力フォーマット（固定）

```json
{
  "schema_version": "3.0",
  "analysis_type": "thought_pattern",
  "lang": "ja",
  "analyzed_at": "YYYY-MM",
  "message_count": N,
  "fingerprint": {
    "abstraction_direction": "...",
    "problem_style": "...",
    "perspective_taking": "...",
    "face_strategy": {
      "value": "...",
      "score": 0.XX
    },
    "concept_distance": {
      "bridges": ["領域A × 領域B"],
      "distance": "...",
      "count": N
    },
    "evaluation_framing": "...",
    "need_for_cognition": "...",
    "integrative_complexity": N,
    "epistemic_curiosity": "..."
  },
  "commentary": {
    "summary": "（言語ルールに従い120字/words以内の全体像）",
    "holistic_profile": "（言語ルールに従い400字/words以内。軸の言葉を使わず思考の癖・傾向を自然に記述する）",
    "strengths": ["（言語ルールに従い記述）"],
    "blind_spots": ["（言語ルールに従い記述）"],
    "universality_note": "（言語ルールに従い記述）",
    "notable": "（言語ルールに従い記述）",
    "low_confidence": ["（軸名は英語固定）"]
  },
  "influence_map": {
    "abstraction_direction": { "primary_source": "（主に影響した発言の特徴・位置を簡潔に）", "confidence": "high|medium|low" },
    "problem_style":         { "primary_source": "...", "confidence": "high|medium|low" },
    "perspective_taking":    { "primary_source": "...", "confidence": "high|medium|low" },
    "face_strategy":         { "primary_source": "...", "confidence": "high|medium|low" },
    "concept_distance":      { "primary_source": "...", "confidence": "high|medium|low" },
    "evaluation_framing":    { "primary_source": "...", "confidence": "high|medium|low" },
    "need_for_cognition":    { "primary_source": "...", "confidence": "high|medium|low" },
    "integrative_complexity":{ "primary_source": "...", "confidence": "high|medium|low" },
    "epistemic_curiosity":   { "primary_source": "...", "confidence": "high|medium|low" }
  },
  "theoretical_references": [
    "Trope & Liberman (2010) Construal Level Theory",
    "Kirton (1976) KAI",
    "Baron-Cohen (2003) E-S Theory",
    "Brown & Levinson (1987) Politeness Theory",
    "Fauconnier & Turner (2002) Conceptual Blending",
    "Kahneman & Tversky (1979) Prospect Theory",
    "Cacioppo & Petty (1982) Need for Cognition",
    "Suedfeld & Tetlock (1977) Integrative Complexity",
    "Litman & Spielberger (2003) Epistemic Curiosity"
  ]
}
```

---

### Step 3.5：AIパーソナルフィードバック

JSONの出力後、以下の順でコンテキストを確認してからコメントを書く。

#### コンテキスト確認（優先順位順）

**① メモリファイルの確認**
`C:\Users\yoshi\.claude\projects\[project]\memory\` 配下に関連するメモリファイルが存在するか確認する。
- 存在する → そのユーザーについて蓄積された文脈（思考スタイル・フィードバック履歴・プロジェクト背景・過去の分析結果）を参照してコメントを書く
- 存在しない／少ない → セッション内の観察のみを使用する

**② user_token（個人スケール）の確認**
今回の分析でユーザーが `user_token` を設定したか確認する。
- トークンあり → DBに過去の分析が蓄積されている可能性がある。「前回との変化」「継続しているパターン」への言及が可能になる（ただし実際のDB参照はできないため、メモリに保存された過去分析結果を参照する）
- トークンなし・初回 → 今回のスナップショットとして扱う

#### 観察の深度ラベル（必ず明示する）

| 状況 | ラベル |
|---|---|
| メモリ豊富 ＋ 過去分析あり | `蓄積と今回の観察から` |
| メモリあり・過去分析なし | `文脈と今回の観察から` |
| メモリなし・セッションのみ | `このセッションの観察から` |

コメントの冒頭に必ずこのラベルを付ける。

**プライバシー上の注意：** このコメントは固有名詞・コード・URLを含めない。分析結果と会話から観察したパターンのみを対象とする。ユーザーの同意のもと `analysis-log.md` に保存することを推奨する。

#### 出力形式（JSONの後、送信案内の前に必ず表示）

---

**【日本語の場合】**

---

**💬 AIからの個人コメント**
*[深度ラベル] ／ 分析JSONには含まれません*

（150〜300字。軸の名前を使わず、ユーザーへの直接的なメッセージとして書く。「あなたは〜」の形式。数値では測れないパターン・矛盾・伸びしろを自然な文章で。メモリが少ない場合は断定を避け「このセッションでは〜に見えた」の形にする）

---

**【English の場合】**

---

**💬 Personal note from Claude**
*[depth label] / Not included in the analysis JSON*

（150–300 words. Written directly to the user as "you". Natural language, no axis names. Surface patterns, tensions, or growth areas the numbers can't capture. If memory is sparse, soften assertions: "in this session, it seemed like…"）

---

### Step 4：送信の案内

出力後、**言語ルールに従い**以下のいずれかを表示する（変更・省略しない）：

---

**【日本語の場合】**

**このJSONに含まれるもの・含まれないもの**

含まれるもの：思考パターンの構造（9軸）・件数・理論参照・influence_map（各軸の判定根拠と信頼度）
含まれないもの：固有名詞・サービス名・コード・URL・会話の内容
※ influence_map はローカルのみ。サーバーには送信されません。

---

**データベースへの送信について（任意）**

送信すると、この分析結果（9軸の値のみ）が匿名で蓄積され、他のユーザーとの比較（独自性スコア）が将来的に可能になります。送信しなくても分析結果はこの画面で利用できます。

サーバーコードで送信内容を確認できます：https://github.com/thought-analyzer/thought-analyzer

---

**送信しますか？** トークンを設定する場合は一緒に返答してください（例：`yes hapi` / `yes` / `no`）

トークンは次回以降の分析を同一人物として照合するための任意の文字列です。サーバーにはハッシュ値のみが保存されます。

ユーザーの返答を待つ。

- **`yes [トークン]`** → トークンあり・なし両方を処理してそのまま送信する
- **`yes`（トークンなし）** → トークンフィールドを省略して送信する
- **`no`** → 「送信しませんでした。分析結果はこの画面で自由に活用してください。」と表示する。

---

**【English の場合】**

**What this JSON contains — and what it does not**

Contains: thinking pattern structure (9 axes), message count, theoretical references, influence_map (source and confidence per axis)
Does not contain: proper nouns, service names, code, URLs, conversation content
※ influence_map stays local only — it is not sent to the server.

---

**About database submission (optional)**

Submitting stores this result (axis values only) anonymously. As data accumulates, comparison with other users (uniqueness score) will become possible. You can use the results on this screen without submitting.

You can verify what is sent via the server code: https://github.com/thought-analyzer/thought-analyzer

---

**Would you like to submit?** Include a token if you want time-series tracking (e.g., `yes mytoken` / `yes` / `no`)

The token links future analyses to you. Only the hash is stored — the original string is never retained.

Wait for the user's response.

- **`yes [token]`** → Process with or without token and submit immediately
- **`yes`** (no token) → Submit without token field
- **`no`** → Display: "Not submitted. Feel free to use the analysis results on this screen."

---

ユーザーのトークン返答を受け取ったあと、`commentary` と `theoretical_references` を除いた送信用JSONを構築してBashツールで自動実行する。

送信するJSONのフィールド（2000バイト以内）：

```json
{
  "schema_version": "3.0",
  "analysis_type": "thought_pattern",
  "analyzed_at": "YYYY-MM",
  "message_count": N,
  "fingerprint": { ...9軸の値のみ... },
  "user_token": "（設定した場合のみ含める。スキップの場合はフィールドごと省略）"
}
```

Bashツールで以下を実行する：

```bash
curl -s -X POST https://thought-analyzer.com/collect \
  -H "Content-Type: application/json" \
  -d '{上記の送信用JSONをここに展開}'
```

実行後、レスポンスを確認して言語ルールに従い以下を表示する：

**送信成功 / Submission successful：**
```
（日本語）送信しました（payload_size: XX bytes）
（English）Submitted successfully (payload_size: XX bytes)

record_id：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

（日本語）このIDを手元に控えておくと、後からこのデータを照合・取り出せます。
（English）Save this ID to retrieve or verify your data later.
```

**送信失敗 / Submission failed：**
（日本語）「送信に失敗しました」
（English）"Submission failed."

---

## 統合分析フロー（ログ受け取り後に必ず実行）

ログが貼り付けられたら、以下の順で3つの分析を実行する。

1. **思考パターン分析**（Step 0〜3）→ JSON-A を生成（`analysis_type: "thought_pattern"`）
2. **コーディング指示力分析**（coding-direction-skill.md の定義に従う）→ JSON-B を生成（`analysis_type: "coding_direction"`）
3. **ペア分析**（本skillの「ペア分析モード」の Step 1〜4）→ JSON-C を生成（`analysis_type: "pair_analysis"`）
4. **Step 3.5**（AIパーソナルフィードバック）を実行し、`ai_comment` と `ai_comment_depth` を取得

3つのJSONと個人コメントを画面に出力した後、送信について1行で確認する：

```
3つの分析が完了しました。送信しますか？（両方 / 思考パターン / 指示力 / なし）トークンがあれば末尾に添えてください（例：「両方 hapi」）
```

※ ペア分析はDB非対応のため送信対象外。「両方」は思考パターン＋コーディング指示力を指す。

ユーザー返答に応じてcurlを実行。両方送信の場合は以下のように報告する：

```
送信完了：
- 思考パターン  record_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- コーディング指示力  record_id: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

### 統合HTML生成（送信の yes/no に関わらず必ず自動実行）

以下の統合JSONを `/tmp/unified-result.json` に書き出してから、Bashツールで生成・開く（許可確認不要）：

```json
{
  "thought": { ...JSON-A 完全版（commentary含む）... },
  "coding": { ...JSON-B 完全版（commentary含む）... },
  "pair": { ...JSON-C 完全版（commentary含む）... },
  "ai_comment": "（Step 3.5で生成したコメント本文）",
  "ai_comment_depth": "（深度ラベル）"
}
```

```bash
cat > /tmp/unified-result.json << 'ENDJSON'
{ ...統合JSONをここに展開... }
ENDJSON

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTFILE="C:/Users/yoshi/Documents/skills/thought-analyzer/result-unified-${TIMESTAMP}.html"
node C:/Users/yoshi/Documents/skills/thought-analyzer/scripts/generate-unified-html.js \
  "$(cat /tmp/unified-result.json)" \
  "$OUTFILE"
start "$OUTFILE"
```

実行後「ブラウザで統合ビジュアライザーを開きました」と報告する。

---

## ペア分析モード（AIとユーザーの対話ループ分析）

統合分析フローの一部として自動実行される。ログにAIの返答が含まれている場合に適用。

**読み取るもの**
- AIの返答（出力の内容ではなく、ユーザーが何にどう反応したかを把握するために使用）
- ユーザー自身の発言（反応・修正・却下）

**読み取らないもの**
- コードブロックの内容・URL・固有名詞・APIキー

分析結果はサーバーへの送信を行わない（現バージョンのDBスキーマ外）。

---

### Step 1：ログのペア化

入力されたログから、(AI返答 → ユーザー反応) のペアを順に抽出する。

- AI返答の直後に来るユーザー発言を「反応」として識別する
- AI返答が来る前のユーザー発言（先行指示）はペアには含めず、文脈として参照する
- ペア数（`pair_count`）を記録する

形式の識別例：
```
Human: ...（先行指示）
Assistant: ...（AI返答）
Human: ...（← これが反応。ペアの単位）
```

---

### Step 2：反応の分類

各ペアについて、ユーザーの反応を以下の4種類に分類する。

| 反応 | 判定基準 |
|------|---------|
| `adopt` | AI出力への言及なく次の指示へ進む、または「OK」「ありがとう」等で受け取る |
| `modify` | AI出力の一部を引用・参照しながら修正・追加指示を出す |
| `reject` | 否定・別方向の指示を明示する（「違う」「それじゃない」等） |
| `ignore` | AI出力の内容と無関係に別の話題へ移る |

---

### Step 3：reaction_patterns の抽出

#### `reaction_distribution`

反応4種の分布を0.0〜1.0のスコアで算出する（合計1.0）。

#### `delegation_boundary`

会話全体を通じて、どのような種類の課題をAIに委任し、どのような判断をユーザーが保持しているかを抽象的なカテゴリラベルで記録する。

- `delegates`：adopt・modifyが多い課題領域の抽象ラベル
- `retains`：reject・ユーザー主導で進む判断領域の抽象ラベル
- 固有名詞・技術名・サービス名は含めない

理論的根拠：Risko & Gilbert（2016）認知的オフローディング

#### `correction_precision`

modifyと判定されたペアについて、修正の粒度を判定する。

| 値 | 定義 |
|---|---|
| `surgical` | 特定の語・文・ロジックへの的確な置き換え・追加 |
| `directional` | 「この方向で」「もっと〜に」等の大まかな再指示 |
| `holistic` | 前の出力を破棄し、最初から構築し直すような指示 |

modifyペアが少ない（全体の10%未満）場合は `null` とする。

理論的根拠：Hattie & Timperley（2007）フィードバック処理研究

#### `blind_spot_patterns`

AIの出力のうち、ユーザーが一貫して反応しない要素のパターンを記録する。3件以上の一貫したパターンが確認できた場合のみ記録する。

| 値 | 定義 |
|---|---|
| `alternatives` | AIが提示した複数案のうち常に最初の案のみ採用 |
| `caveats` | 注意書き・制限・免責の記述を一貫してスキップ |
| `questions_back` | AIからの問い返しを一貫して無視 |
| `summary` | まとめ・整理部分を一貫してスキップ |

パターンが確認できない場合は `[]` とする。

#### `preferred_ai_style`

`blind_spot_patterns`と`reaction_distribution`の組み合わせから、そのユーザーが快適に前進できるAIの出力スタイルを推定する。

| 値 | 定義 | 推定基準 |
|---|---|---|
| `decisive` | 最善案を一つ。選択肢より断言 | `blind_spot_patterns`に`alternatives`が一貫して出る |
| `exploratory` | 可能性を広げる。問いを深める | `modify`率が高く、別の角度を常に求めている |
| `concise` | 短く直接的に。詳細より結論 | AI出力後半をスキップ、または`modify`で短縮指示が繰り返す |
| `structured` | 段階的に整理。一気より手順 | `adopt`率が高く、構造化出力への反応が安定している |

**`ignore`の解釈**：ignoreは「別の話題へ移った」とも読めるが、AIの出力スタイルとユーザーの期待がズレているときにも発生する。`ignore`率が高く特定のパターンに偏る場合、「納得していないサイン」として`preferred_ai_style`の推定に加味する。

推定が難しい場合は `null` とする。

---

### Step 4：出力フォーマット（固定）

```json
{
  "schema_version": "3.0",
  "analysis_type": "pair_analysis",
  "lang": "ja",
  "analyzed_at": "YYYY-MM",
  "pair_count": N,
  "reaction_patterns": {
    "reaction_distribution": {
      "adopt": 0.XX,
      "modify": 0.XX,
      "reject": 0.XX,
      "ignore": 0.XX
    },
    "delegation_boundary": {
      "delegates": ["（抽象カテゴリラベル）"],
      "retains": ["（抽象カテゴリラベル）"]
    },
    "correction_precision": "surgical | directional | holistic | null",
    "blind_spot_patterns": ["..."],
    "preferred_ai_style": "decisive | exploratory | concise | structured | null"
  },
  "commentary": {
    "summary": "（言語ルールに従い120字/words以内）",
    "interaction_style": "（このユーザーがAIとどういう対話を求めているかを200字/words以内で記述。軸の名前を使わず自然な文章で）",
    "prescription": "（reaction_patternsに基づく具体的な改善提案を200字/words以内で。preferred_ai_styleを中心に「あなたは〜の傾向があります。プロンプトに〜を加えると効果的です」の形式）"
  },
  "theoretical_references": [
    "Risko & Gilbert (2016) Cognitive Offloading",
    "Hattie & Timperley (2007) Feedback Processing",
    "Parasuraman, Sheridan & Wickens (2000) Levels of Automation"
  ]
}
```

---

### Step 5：フィードバック出力

JSONの出力後、`commentary.prescription` の内容を以下の形式で**必ず別ブロックとして表示**する（JSONに埋め込まれているだけでは不十分）。

---

**【日本語の場合】**

---

**📋 あなたへのフィードバック**

> （`commentary.prescription` の内容をそのまま表示）

**対話スタイル：** （`commentary.interaction_style` の内容を1〜2文で要約）

---

**【English の場合】**

---

**📋 Feedback for you**

> （`commentary.prescription` の内容をそのまま表示）

**Interaction style:** （`commentary.interaction_style` の内容を1〜2文で要約）

---

ペア分析の結果はサーバーへの送信を行わない（現バージョンのDBスキーマ外）。「ペア分析が完了しました。この結果はローカルのみで利用できます。」と表示する。

---

### Step 6：可視化

**【開発中・スキップ】** ペア分析のHTMLビジュアライザーは現在開発中のため、このステップは実行しない。
