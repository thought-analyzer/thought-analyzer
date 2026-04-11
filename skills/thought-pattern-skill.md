# 思考パターン分析 - 9軸定義・分析手順

> **このファイルの役割：** `skill.md` の統合分析フロー Step 1 として呼ばれる。
> ユーザー発言のみを対象に9軸を抽出し JSON-A を生成する。Step 3.5 でAIコメントも出力する。
> 送信・HTML生成は `skill.md` が担う。

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

## Step 0：データ量チェック（分析前に必ず実行）

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

## Step 1：ログの前処理

入力されたログからユーザーの発言のみを抽出する。
AIの返答・ツール出力・コードブロック・URLは無視する。

以下の発言は分析対象から除外する（ノイズ除去）：

- **応答的一言返し**：意味のある情報を含まない短い反応
  - 例：「ありがとう」「了解」「OK」「わかった」「なるほど」「はい」「いいえ」「そうですね」「ですね」
  - 判定基準：10文字以下 かつ 新たな指示・意図・評価を含まない発言
- **ただし以下は除外しない**：
  - 「違う」「待って」「やっぱり」「まって」「wait」「actually」など、方向転換の可能性がある発言（`pivot` 候補として含める）
  - 短くても具体的な修正・評価・追加要求を含む発言

## Step 2：9軸の抽出

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

## influence_map の判定ルール

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

## Step 3：出力フォーマット（固定）

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

## Step 3.5：AIパーソナルフィードバック

JSONの出力後、以下の順でコンテキストを確認してからコメントを書く。

#### コンテキスト確認（優先順位順）

**① メモリファイルの確認**
`C:\Users\yoshi\.claude\projects\[project]\memory\` 配下に関連するメモリファイルが存在するか確認する。
- 存在する → そのユーザーについて蓄積された文脈（思考スタイル・フィードバック履歴・プロジェクト背景・過去の分析結果）を参照してコメントを書く
- 存在しない／少ない → セッション内の観察のみを使用する

**② user_token（個人スケール）の確認**
今回の分析でユーザーが `user_token` を設定したか確認する。
- トークンあり → メモリファイルに過去の分析結果が存在すれば、**差分ハイライト**を出力する（後述）
- トークンなし・初回 → 今回のスナップショットとして扱う

**差分ハイライト（トークンあり・過去分析あり の場合のみ出力）**

JSONの直後、AIコメントの前に以下のブロックを挿入する：

```
📊 前回（YYYY-MM-DD）との変化 ／ token: [token]

| 軸 | 前回 | 今回 | 変化 |
|---|---|---|---|
| [変化した軸のみ列挙] | [前回値] | [今回値] | [🔄 逆転 / ↑ / ↓ / 変化] |

変化なし（N軸）: [軸名リスト]

💬 変化のメモ：
（変化した軸の意味を1〜3文で解釈。短期コンテキスト依存か継続傾向かに言及する。固有名詞・コード不使用）
```

変化なし（9軸すべて同値）の場合は「前回との差分なし。安定したパターンが継続しています。」と1行で済ませる。

#### 観察の深度ラベル（必ず明示する）

| 状況 | ラベル |
|---|---|
| メモリ豊富 ＋ 過去分析あり | `蓄積と今回の観察から` |
| メモリあり・過去分析なし | `文脈と今回の観察から` |
| メモリなし・セッションのみ | `このセッションの観察から` |

コメントの冒頭に必ずこのラベルを付ける。

**プライバシー上の注意：** このコメントは固有名詞・コード・URLを含めない。

#### 出力形式（JSONの後、送信案内の前に必ず表示）

**【日本語の場合】**

---

**💬 AIからの個人コメント**
*[深度ラベル] ／ 分析JSONには含まれません*

（150〜300字。軸の名前を使わず、ユーザーへの直接的なメッセージとして書く。「あなたは〜」の形式。）

---

**【English の場合】**

---

**💬 Personal note from Claude**
*[depth label] / Not included in the analysis JSON*

（150–300 words. Written directly to the user as "you". Natural language, no axis names.）

---

## Step 4：送信の案内

> 送信フロー・Bash実行・HTML生成はすべて `skill.md` の「統合送信」「統合HTML生成」セクションが担う。
> このステップでは追加アクション不要。

送信JSONに含めるフィールド（`skill.md` 側で参照）：

```json
{
  "schema_version": "3.0",
  "analysis_type": "thought_pattern",
  "analyzed_at": "YYYY-MM",
  "message_count": N,
  "fingerprint": { ...9軸の値のみ... },
  "user_token": "（設定した場合のみ）"
}
```
