---
name: coding-direction-analyzer
description: 会話ログからAI・エンジニアへのコーディング指示力を6軸で分析する。コード品質ではなく「技術的意図の伝達・判断・制御の能力」を測定する。
trigger: ユーザーが「コーディング指示力を分析して」「技術指示を分析して」「analyze my coding direction」「analyze my technical direction」と言ったとき
---

# コーディング指示力分析 skill v1.0

> **このファイルの役割：** `skill.md` の統合分析フロー Step 2 として呼ばれる。
> ユーザーの技術的指示のみを対象に6軸を抽出し JSON-B を生成する。
> 送信・HTML生成は `skill.md` が担う。

## 言語ルール（最優先）

**入力ログの主要言語を検出し、出力言語をそれに合わせる。**

| 入力ログの言語 | JSON以外の出力言語 | JSONのcommentaryフィールド |
|---|---|---|
| 日本語が主体 | 日本語 | 日本語 |
| English is dominant | English | English |
| 混在（半々程度） | 指示を出した言語に合わせる | 指示言語 |

JSONのキー名・軸の値（例：`adaptive`、`batch_clear`）は言語によらず英語で固定する。
`commentary`内の文章のみ言語を切り替える。

**English output example for commentary.summary:**
`"Requirements are specified precisely and delivered in batches. Technical decisions are adaptive. Errors are recognized at the behavioral level, with a preference for pivoting over diagnosing root causes."`

**English output example for commentary.collaboration_profile:**
`"Organizes requirements, hands them off in batches, and pivots quickly based on results. Uses AI as an implementation partner. Better at redirecting than root-cause analysis."`

---

## このskillが測るもの

**コーディング指示力（Technical Direction Capability）**とは：
「自分でコードを書く能力」ではなく、
「AIやエンジニアに技術的な実装を効果的に依頼・判断・制御する能力」。

AI協働時代に重要性が増している、これまで体系的に測定されてこなかったスキルセット。

### 補助シグナル：マークダウンの書き方

指示の**内容**に加えて、**構造化の様式**も補助的な診断シグナルとして参照する。

| 書き方の特徴 | 読み取れること |
|---|---|
| ヘッダー・セクションで構造化している | 問題を分解して伝えられる（decomposition） |
| コードブロックで期待する入出力を示す | 要件を具体化できる（specification_precision に寄与） |
| 箇条書きで制約・優先順位を列挙する | 境界条件を意識している |
| 自然文・散文で投げる | 意図を先に伝えて対話で詰めるスタイル |
| 定型テンプレートを使い回している | 指示を抽象化・再利用している |

ただし**形式と中身は別**であるため、構造化されていても内容が曖昧な場合は `specification_precision` を高く評価しない。マークダウン構造はあくまで補助情報として、`commentary` に反映する。

## 理論的根拠

| 軸 | 理論・研究 | 文献 |
|---|---|---|
| specification_precision | Computational Thinking | Wing (2006), *Communications of the ACM* |
| error_recognition | Expert-Novice distinction | Chi, Feltovich & Glaser (1981), *Cognitive Science* |
| system_abstraction | Computational Thinking（抽象化） | Wing (2006) |
| decision_quality | Adaptive Expertise | Hatano & Inagaki (1986), *Cognition and Instruction* |
| technical_vocabulary | Domain-specific knowledge transfer | Ericsson (1993), *Psychological Review* |
| iteration_style | Self-Regulated Learning | Zimmerman (2000), *Educational Psychologist* |

---

## データ量チェック（分析前に必ず実行）

このskillが発動した以降の会話を対象に、ユーザー発言の件数と総文字数を数える。

| 件数 | 総文字数（目安） | 判定 |
|---|---|---|
| < 10件 | < 500字 | **分析不可**。「技術的な指示が少なすぎます。コーディング指示を含む会話をもう少し続けてから再実行してください（目安：30件以上）」と伝えて終了する |
| 10〜30件 | 500〜2000字 | **低信頼**。分析は実行するが、全軸に `low_confidence` を付与し、その旨を明記する |
| 30〜100件 | 2000〜8000字 | **標準**。通常どおり分析を実行する |
| 100件以上 | 8000字以上 | **高精度**。分析結果の冒頭に「十分なデータ量で高精度な分析が可能です」と明記する |

**重要：** コーディング指示が含まれない発言（雑談・質問のみなど）は件数にカウントしない。

---

## 6軸の定義

### 軸1：specification_precision（要件定義の精度）
**理論：Computational Thinking — Decomposition（Wing, 2006）**
「何を作りたいか」を分解して正確に伝えられるか。

スコア：1〜5

| スコア | 特徴 |
|---|---|
| 1 | 目的・制約が曖昧。「いい感じにして」レベル |
| 2 | 目的はあるが制約・境界条件が不明 |
| 3 | 目的と主要な制約を伝えられる |
| 4 | 目的・制約・優先順位を構造的に伝えられる |
| 5 | エッジケース・非機能要件まで含めて精密に定義できる |

---

### 軸2：error_recognition（エラー・誤りの認識力）
**理論：Expert-Novice distinction（Chi, Feltovich & Glaser, 1981）**
専門家は表面的な特徴ではなく構造的なパターンで問題を認識する。
出力が正しいか誤りかを、内容ではなく「何を見て判断しているか」で測る。

| 値 | 定義 |
|---|---|
| `structural` | エラーの構造・原因を推定して指摘できる |
| `behavioral` | 動作・見た目が期待と違うことは分かるが原因は不明 |
| `result_only` | 最終結果の正否のみで判断する |

---

### 軸3：system_abstraction（システム思考の抽象度）
**理論：Computational Thinking — Abstraction（Wing, 2006）**
コンポーネント間の関係・依存関係をどのレベルで把握しているか。

| 値 | 定義 |
|---|---|
| `architecture` | システム全体の構成・依存関係を把握して指示する |
| `component` | 個別のコンポーネントの役割を理解して指示する |
| `interface` | 入出力・操作レベルで理解している |
| `blackbox` | 中身を問わず結果のみで判断する |

---

### 軸4：decision_quality（技術的判断の質）
**理論：Adaptive Expertise（Hatano & Inagaki, 1986）**
手順の習熟（Routine Expertise）ではなく、新しい状況で適切に判断できるか（Adaptive Expertise）。

評価対象：ツール選択・ライブラリ選定・ピボットのタイミング・スコープの切り方

| 値 | 定義 |
|---|---|
| `adaptive` | 状況に応じて判断の枠組み自体を変えられる |
| `routine` | 既知のパターンを適用する |
| `deferred` | 判断を相手（AI・エンジニア）に委ねる |

---

### 軸5：technical_vocabulary（技術語彙の正確性）
**理論：Domain-specific knowledge transfer（Ericsson, 1993）**
専門用語を正確に・適切な文脈で使えるかどうか。
誤用・過少使用・過剰使用を区別して評価する。

| 値 | 定義 |
|---|---|
| `precise` | 専門用語を正確な意味で使う |
| `approximate` | 概念は正しく掴んでいるが表現が近似的 |
| `lay` | 日常語で説明する（正確さより分かりやすさ優先） |
| `mixed` | 文脈によって使い分けている |

---

### 軸6：iteration_style（改善サイクルの回し方）
**理論：Self-Regulated Learning（Zimmerman, 2000）**
フィードバックを与えて改善していく際のパターン。

| 値 | 定義 |
|---|---|
| `incremental_clear` | 小さく・明確なフィードバックを積み重ねる |
| `batch_clear` | まとめて・明確なフィードバックを一度に出す |
| `incremental_vague` | 小刻みだが指示が曖昧になりやすい |
| `batch_vague` | まとめて出すが優先順位が不明確 |

---

## 出力フォーマット（固定）

```json
{
  "schema_version": "1.0",
  "analysis_type": "coding_direction",
  "analyzed_at": "YYYY-MM",
  "message_count": N,
  "coding_direction": {
    "specification_precision": N,
    "error_recognition": "...",
    "system_abstraction": "...",
    "decision_quality": "...",
    "technical_vocabulary": "...",
    "iteration_style": "..."
  },
  "commentary": {
    "summary": "120字以内の全体像",
    "holistic_profile": "軸の言葉を使わず、この会話全体を通じて見えてきたAIへの指示スタイルの癖・傾向を200字以内で自然に記述する。軸分析では捉えられない文脈・質感・一貫性を補完する。",
    "strengths": ["強みとして読める軸と根拠"],
    "growth_areas": ["伸びしろとして読める軸と根拠"],
    "collaboration_profile": "軸の言葉を使わず、AIやエンジニアとの協働スタイルの質感・傾向を400字以内で自然に記述する。",
    "low_confidence": ["精度が低いと判断した軸名"]
  },
  "theoretical_references": [
    "Wing (2006) Computational Thinking",
    "Chi, Feltovich & Glaser (1981) Expert-Novice distinction",
    "Hatano & Inagaki (1986) Adaptive Expertise",
    "Ericsson (1993) Deliberate Practice",
    "Zimmerman (2000) Self-Regulated Learning"
  ]
}
```

---

## 送信・可視化

> 送信フロー・Bash実行・HTML生成はすべて `skill.md` の「統合送信」「統合HTML生成」セクションが担う。
> このステップでは追加アクション不要。

送信JSONに含めるフィールド（`skill.md` 側で参照）：

```json
{
  "schema_version": "1.0",
  "analysis_type": "coding_direction",
  "analyzed_at": "YYYY-MM",
  "message_count": N,
  "coding_direction": { ...6軸の値のみ... },
  "user_token": "（設定した場合のみ）"
}
```
