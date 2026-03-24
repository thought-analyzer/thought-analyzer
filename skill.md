---
name: thought-pattern-analyzer
description: 会話ログから思考パターンを9軸で抽出し、フィンガープリントJSONを生成する。固有名詞・技術情報・URLは出力に含めない。
trigger: ユーザーが「思考パターンを分析して」「ログを分析して」「thought analyze」「analyze my thinking」「analyze this log」と言ったとき
---

# 思考パターン分析 skill v2.0

## 言語ルール（最優先）

**入力ログの主要言語を検出し、出力言語をそれに合わせる。**

| 入力ログの言語 | JSON以外の出力言語 | JSONのcommentaryフィールド |
|---|---|---|
| 日本語が主体 | 日本語 | 日本語 |
| English is dominant | English | English |
| 混在（半々程度） | 指示を出した言語に合わせる | 指示言語 |

JSONのキー名・軸の値（例：`concrete_to_abstract`）は言語によらず英語で固定する。
`commentary`内の文章・`theoretical_references`の書き方のみ言語を切り替える。

**English output example for commentary.summary:**
`"Thinking moves from concrete situations toward concepts and principles. Other perspectives emerge spontaneously. Distant conceptual domains are connected consistently."`

---

## 起動時に必ず表示するメッセージ

このskillが読み込まれたとき、最初に以下を表示する（変更・省略しない）：

---

**思考パターン分析 skill v2.0 が読み込まれました。**

このskillが読み取るもの・読み取らないものを最初に確認します。

**読み取るもの**
- あなた自身の発言（指示・質問・コメント）のみ

**読み取らないもの**
- 添付ファイル・画像・コードブロックの内容
- AIの返答・ツールの出力
- URL・固有名詞・サービス名・APIキー
- 会話に含まれる機密情報や個人情報

分析結果（フィンガープリントJSON）はこの画面にのみ出力されます。
**外部への送信は一切行いません。** 送信するかどうかは、結果を確認した後にあなたが判断します。

分析したいログや会話を貼り付けてください。または「この会話を分析して」と言えば、現在のセッションのやり取りを対象に分析します。

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

### Step 3：出力フォーマット（固定）

```json
{
  "schema_version": "2.0",
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
    "summary": "120字以内の全体像",
    "strengths": ["強みとして読める軸と理由（構造的根拠のみ）"],
    "blind_spots": ["盲点として読める軸と理由（構造的根拠のみ）"],
    "universality_note": "どの文脈で機能しやすいパターンか",
    "notable": "最も特徴的だと判断した軸とその根拠",
    "low_confidence": ["精度が低いと判断した軸名"]
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

### Step 4：送信の案内

出力後、以下を表示する（変更・省略しない）：

---

**このJSONに含まれるもの・含まれないもの**

含まれるもの：思考パターンの構造（9軸）・件数・理論参照
含まれないもの：固有名詞・サービス名・コード・URL・会話の内容

---

**データベースへの送信について（任意）**

送信すると、この分析結果（9軸の値のみ）が匿名で蓄積され、他のユーザーとの比較（独自性スコア）が将来的に可能になります。送信しなくても分析結果はこの画面で利用できます。

サーバーコードで送信内容を確認できます：https://github.com/thought-analyzer/thought-analyzer

---

**送信しますか？（yes / no）**

ユーザーの返答を待つ。

- **yes** → 上で生成したJSONを使って、以下のcurlコマンドをBashツールで自動実行する（ユーザーは何もしなくてよい）：

```bash
curl -s -X POST https://thought-analyzer.com/collect \
  -H "Content-Type: application/json" \
  -d '{JSONの内容をここに展開}'
```

実行後、レスポンスを確認して「送信しました（payload_size: XX bytes）」または「送信に失敗しました」と報告する。

- **no** → 「送信しませんでした。分析結果はこの画面で自由に活用してください。」と表示して終了する。
