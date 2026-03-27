# thought-analyzer

**Thought pattern analysis grounded in cognitive psychology and philosophy of mind**

[日本語](#日本語) | [English](#english)

---

## 日本語

### これは何か

会話ログから**思考パターン**と**コーディング指示力**を分析するskillです。

「自分の考え方はどこまで独自で、どこまで他者と共通しているのか」という問いに、心理学・哲学の実証研究を根拠として答えを出します。

---

### 何を分析するか

#### 思考パターン分析（9軸）

| 軸 | 内容 |
|---|---|
| 抽象化の方向 | 具体から抽象へ向かうか、抽象から具体へ向かうか |
| 問題へのアプローチ | 修正優先か、代替・ピボット優先か |
| 他者視点の出現 | 自発的に他者の立場を想起するか |
| 言語の配慮戦略 | 断定型か、配慮・提案型か |
| 概念の接続距離 | 遠い領域を結びつける発想が出るか |
| 評価のフレーミング | 肯定から入るか、問題から入るか |
| 思考への欲求 | 複雑な問いを自発的に作るか |
| 統合的複雑性 | 複数の視点を一つの枠組みに統合するか |
| 認識論的好奇心 | 知ること自体が目的か、ギャップを埋めたいのか |

#### コーディング指示力分析（6軸）

「コードを書く能力」ではなく、「AIやエンジニアに技術的な実装を効果的に依頼・判断・制御する能力」を測定します。

| 軸 | 内容 |
|---|---|
| 要件定義の精度 | 制約・境界条件まで含めて伝えられるか |
| エラーの認識力 | 問題の構造を把握して指摘できるか |
| システム思考の抽象度 | コンポーネント間の依存関係を理解しているか |
| 技術的判断の質 | 状況に応じて判断の枠組みを変えられるか |
| 技術語彙の正確性 | 専門用語を適切な文脈で使えるか |
| 改善サイクルの回し方 | フィードバックを構造的に渡せるか |

---

### 使い方

#### Step 1：skillを読み込む

以下のいずれかの方法でClaudeにskillを読み込ませます。

**Claude.aiの場合（推奨）**
1. Claude.aiでProjectを作成する
2. Project instructionsに `skills/skill.md`（または `skills/coding-direction-skill.md`）の内容を貼り付ける
3. 以降そのProjectで行う会話すべてにskillが適用される

**Claude APIの場合**
- `skills/skill.md` の内容をsystem promptに含める

**Claude Codeの場合**
- `.claude/` にskillファイルを配置する（Claude Codeのskill機能を利用）

#### Step 2：会話を積み重ねる

skillを読み込んだ状態でClaudeと普段どおり会話します。
分析はskillが発動した**以降の会話**を対象にします。

**データ量と分析精度の目安：**

| 会話の量 | 精度 |
|---|---|
| 10件未満 | 分析不可（もう少し続けてください） |
| 10〜30件 | 低精度（参考値として出力） |
| 30〜100件 | 標準精度 |
| 100件以上 | 高精度 |

#### Step 3：分析を実行する

十分に会話が積まれたら、以下のように入力します。

```
思考パターンを分析して
```
```
analyze my thinking
```
```
コーディング指示力を分析して
```
```
analyze my coding direction
```

Claudeが会話を解析し、フィンガープリントJSON＋解説を出力します。

#### Step 4：結果を確認し、任意で送信する

出力されたJSONを確認し、内容に納得したうえで任意でデータベースに送信できます。

**送信されるもの：** 思考パターンの構造（9軸の値）・件数・分析日（年月のみ）
**送信されないもの：** 会話の内容・固有名詞・コード・URL・個人を特定できる情報

送信は任意です。確認してから判断してください。

---

### 引用している理論・論文

| 理論 | 著者・年 | 文献 |
|---|---|---|
| Construal Level Theory | Trope & Liberman (2010) | *Psychological Review* |
| Kirton Adaption-Innovation Inventory | Kirton (1976) | *Journal of Applied Psychology* |
| Empathizing-Systemizing Theory | Baron-Cohen (2003) | *The Essential Difference* |
| Politeness Theory | Brown & Levinson (1987) | *Politeness* |
| Conceptual Blending | Fauconnier & Turner (2002) | *The Way We Think* |
| Prospect Theory / Framing Effect | Kahneman & Tversky (1979) | *Econometrica* |
| Need for Cognition | Cacioppo & Petty (1982) | *Journal of Personality and Social Psychology* |
| Integrative Complexity | Suedfeld & Tetlock (1977) | — |
| Epistemic Curiosity | Litman & Spielberger (2003) | *Personality and Individual Differences* |
| Computational Thinking | Wing (2006) | *Communications of the ACM* |
| Expert-Novice Distinction | Chi, Feltovich & Glaser (1981) | *Cognitive Science* |
| Adaptive Expertise | Hatano & Inagaki (1986) | *Cognition and Instruction* |

---

### どのように役立つか

- **自己理解**：自分の思考パターンの強みと盲点を、直感ではなく理論的根拠とともに把握できる
- **他者との比較**：集積されたデータと照らして「どのくらい独自か」を客観的に知れる
- **AI協働スキルの把握**：コーディング指示力の分析で、AIと効果的に協働できる部分を可視化する
- **時系列変化の追跡**：定期的に分析することで、思考パターンの変化を記録できる

---

### プライバシーの設計：コードで証明する

このシステムは「信じてください」ではなく「コードを読めば分かる」という設計になっています。

**skillファイル（このリポジトリ）が証明するもの**
- 抽出する軸が全て定義されている（それ以外は抽出しない）
- 固有名詞・URL・コードを出力に含めないことが明示されている
- skillはローカルで完結し、自動送信しない

**サーバーコード（`server/index.js`）が証明するもの**

```javascript
const MAX_PAYLOAD_BYTES = 2000;
// 生ログが含まれれば必ずここで弾かれる（生ログは数万バイト）

const ALLOWED_TOP_KEYS = new Set([
  'schema_version', 'analyzed_at', 'message_count', 'fingerprint', 'user_token'
]);
// この5つ以外のフィールドは物理的に受け取れない
```

- ペイロード上限2000バイト → 生ログが紛れ込んでも必ず弾かれる
- 受け取れるフィールドが4つに限定されている
- データベースのスキーマ（`server/schema.sql`）に生ログを保存するカラムが存在しない
- URLを含む文字列はサーバー側でも検出・拒否する

**ユーザーが自分で確認できる方法**
1. このリポジトリのコードを読む
2. ブラウザのネットワークタブで送信内容を確認する（JSONのみ）
3. `/stats` エンドポイントで何が蓄積されているかを確認する

---

### データの使われ方

任意で送信されたフィンガープリントは、thought-analyzerオーガニゼーションが管理するデータベースに匿名で蓄積されます。

> **注記（現在）：** 本ツールはリリース初期段階にあり、蓄積データは少数のサンプルに基づいています。データが増えるにつれて比較精度が向上します。

**現在の使い方**
- `/stats` エンドポイント：軸ごとの分布を公開（誰でも確認可能）
- `/compare` エンドポイント：「あなたの値は全体の何%か」を返す比較機能
- データが増えるほど比較精度が向上し、独自性の判定が意味を持ち始める

**今後のアップデートへの活用**
蓄積されたデータは、分析軸の精度向上・新しい判定ロジックの開発・理論的根拠の検証に用いる予定です。データはパターンの統計としてのみ扱い、個人を特定する用途には使いません。

**将来的に検討している展開**
- より詳細な解析結果の提供（独自性スコア・強みの深掘り・時系列比較）
- 有料プランでの個別フィードバック

これらは現時点では未実装です。実装・提供の際は別途告知します。

送信は常に任意です。送信しなくても分析結果（ローカル出力）は利用できます。

---

### ライセンス

[CC BY-NC-SA 4.0](LICENSE) — 非商用は自由。商用利用は要許可。

---

## English

### What is this?

A skill that analyzes **thinking patterns** and **coding direction capability** from conversation logs.

It answers the question: *"How unique is the way I think, and how much do I share with others?"* — grounded in empirical research from cognitive psychology and philosophy of mind.

---

### What does it analyze?

#### Thought Pattern Analysis (9 axes)

| Axis | What it measures |
|---|---|
| Abstraction direction | Concrete-to-abstract vs. abstract-to-concrete thinking |
| Problem style | Fix-first vs. pivot-first approach |
| Perspective taking | Spontaneous consideration of others' viewpoints |
| Face strategy | Directive vs. mitigating language patterns |
| Concept distance | How far apart are the domains being connected |
| Evaluation framing | Gain-first vs. loss-first framing |
| Need for cognition | Tendency to generate complex questions spontaneously |
| Integrative complexity | Ability to integrate multiple perspectives into one framework |
| Epistemic curiosity | Interest-type vs. deprivation-type curiosity |

#### Coding Direction Analysis (6 axes)

Measures not "the ability to write code" but **"the ability to effectively direct, judge, and control technical implementation"** when working with AI or engineers.

| Axis | What it measures |
|---|---|
| Specification precision | Ability to define requirements with constraints and edge cases |
| Error recognition | Whether problems are identified structurally or behaviorally |
| System abstraction | Understanding of component dependencies |
| Decision quality | Adaptive vs. routine technical judgment |
| Technical vocabulary | Accuracy and context-appropriateness of terminology |
| Iteration style | Structure and clarity of feedback cycles |

---

### How to use

#### Step 1: Load the skill

Load the skill into Claude using one of the following methods.

**Claude.ai (recommended)**
1. Create a Project in Claude.ai
2. Paste the contents of `skills/skill.md` (or `skills/coding-direction-skill.md`) into the Project instructions
3. The skill will apply to all conversations in that Project going forward

**Claude API**
- Include the contents of `skills/skill.md` in the system prompt

**Claude Code**
- Place the skill file in `.claude/` and use Claude Code's skill feature

#### Step 2: Have conversations

Chat with Claude as you normally would. The skill analyzes the conversation that occurs **after** it is loaded.

**Data volume and analysis accuracy:**

| Conversation size | Accuracy |
|---|---|
| Fewer than 10 messages | Cannot analyze (continue the conversation) |
| 10–30 messages | Low confidence (output with caveats) |
| 30–100 messages | Standard accuracy |
| 100+ messages | High accuracy |

#### Step 3: Trigger analysis

When you have enough conversation, enter one of the following:

```
analyze my thinking
```
```
analyze my coding direction
```

Claude will analyze the conversation and output a fingerprint JSON with commentary.

#### Step 4: Review and optionally submit

Review the output JSON and, if you agree with its contents, optionally submit it to the database.

**What is submitted:** Thinking pattern structure (9 axis values), message count, analysis date (year and month only)
**What is never submitted:** Conversation content, proper nouns, code, URLs, or any personally identifiable information

Submission is always optional. Review the JSON before deciding.

---

### Theoretical References

| Theory | Author(s) | Source |
|---|---|---|
| Construal Level Theory | Trope & Liberman (2010) | *Psychological Review* |
| Kirton Adaption-Innovation Inventory | Kirton (1976) | *Journal of Applied Psychology* |
| Empathizing-Systemizing Theory | Baron-Cohen (2003) | *The Essential Difference* |
| Politeness Theory | Brown & Levinson (1987) | *Politeness* |
| Conceptual Blending | Fauconnier & Turner (2002) | *The Way We Think* |
| Prospect Theory / Framing Effect | Kahneman & Tversky (1979) | *Econometrica* |
| Need for Cognition | Cacioppo & Petty (1982) | *Journal of Personality and Social Psychology* |
| Integrative Complexity | Suedfeld & Tetlock (1977) | — |
| Epistemic Curiosity | Litman & Spielberger (2003) | *Personality and Individual Differences* |
| Computational Thinking | Wing (2006) | *Communications of the ACM* |
| Expert-Novice Distinction | Chi, Feltovich & Glaser (1981) | *Cognitive Science* |
| Adaptive Expertise | Hatano & Inagaki (1986) | *Cognition and Instruction* |

---

### How it helps

- **Self-understanding**: Identify cognitive strengths and blind spots, backed by theory rather than intuition
- **Comparison with others**: See how unique your thinking is against aggregated data
- **AI collaboration skills**: Visualize where you excel at directing AI and where there's room to grow
- **Longitudinal tracking**: Run periodically to observe how your thinking evolves over time

---

### Privacy by Design: Proved Through Code

This system is designed so you can **verify privacy through the code itself**, not just trust a policy statement.

**The skill files (this repository) prove:**
- Every extracted axis is explicitly defined — nothing outside these axes is extracted
- Proper nouns, URLs, and code are explicitly excluded from output
- The skill runs locally and does not auto-transmit anything

**The server code (`server/index.js`) proves:**

```javascript
const MAX_PAYLOAD_BYTES = 2000;
// Raw logs would be tens of thousands of bytes — always rejected here

const ALLOWED_TOP_KEYS = new Set([
  'schema_version', 'analyzed_at', 'message_count', 'fingerprint', 'user_token'
]);
// Only these 5 fields can physically be received
```

- 2000-byte payload limit — raw logs are always rejected
- Only 4 top-level fields can be received
- The database schema (`server/schema.sql`) has no column to store raw logs
- URL patterns are detected and rejected server-side as well

**How you can verify this yourself:**
1. Read the code in this repository
2. Check the browser network tab when submitting — only JSON is sent
3. Query the `/stats` endpoint to see exactly what is being stored

---

### How your data is used

Fingerprints you choose to submit are stored anonymously in a database managed by the thought-analyzer organization.

> **Note (current status):** This tool is in its early release stage. The accumulated data is based on a small number of samples. Comparison accuracy will improve as more data is collected.

**Current use**
- `/stats` endpoint: Axis-level distributions, publicly readable by anyone
- `/compare` endpoint: Returns what percentage of users share your value on a given axis
- The more data accumulates, the more meaningful the uniqueness comparisons become

**Use for future improvements**
Accumulated data will be used to improve analysis accuracy, develop new judgment logic, and validate theoretical grounding. Data is used only as statistical patterns — never to identify individuals.

**Future possibilities under consideration**
- More detailed analysis results (uniqueness scores, strength deep-dives, longitudinal comparisons)
- Individual feedback via a premium tier

These are not yet implemented. Any new offering will be announced separately.

Submission is always optional. You can use the local analysis output without submitting anything.

---

### License

[CC BY-NC-SA 4.0](LICENSE) — Free for non-commercial use. Commercial use requires permission.
