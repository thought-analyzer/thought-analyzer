# ペア分析 - AIとユーザーの対話ループ分析

> **このファイルの役割：** `skill.md` の統合分析フロー Step 3 として呼ばれる。
> (AI返答 → ユーザー反応) ペアを adopt/modify/reject/ignore に分類し JSON-C を生成する。
> 送信・HTML生成は `skill.md` が担う。

統合分析フローの一部として自動実行される。ログにAIの返答が含まれている場合に適用。

**読み取るもの**
- AIの返答（出力の内容ではなく、ユーザーが何にどう反応したかを把握するために使用）
- ユーザー自身の発言（反応・修正・却下）

**読み取らないもの**
- コードブロックの内容・URL・固有名詞・APIキー

分析結果はサーバーへの送信を行わない（現バージョンのDBスキーマ外）。

---

## Step 1：ログのペア化

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

## Step 2：反応の分類

各ペアについて、ユーザーの反応を以下の4種類に分類する。

| 反応 | 判定基準 |
|------|---------|
| `adopt` | AI出力への言及なく次の指示へ進む、または「OK」「ありがとう」等で受け取る |
| `modify` | AI出力の一部を引用・参照しながら修正・追加指示を出す |
| `reject` | 否定・別方向の指示を明示する（「違う」「それじゃない」等） |
| `ignore` | AI出力の内容と無関係に別の話題へ移る |

---

## Step 3：reaction_patterns の抽出

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

## Step 4：出力フォーマット（固定）

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

## Step 5：フィードバック出力

JSONの出力後、`commentary.prescription` の内容を以下の形式で**必ず別ブロックとして表示**する。

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

ペア分析の結果は統合フローの送信ステップ（skill.md）でまとめて送信される。送信JSONには `commentary` と `theoretical_references` を除いた以下のフィールドを含める：

```json
{
  "schema_version": "3.0",
  "analysis_type": "pair_analysis",
  "lang": "ja",
  "analyzed_at": "YYYY-MM",
  "pair_count": N,
  "reaction_patterns": {
    "reaction_distribution": { ... },
    "delegation_boundary": { ... },
    "correction_precision": "...",
    "blind_spot_patterns": [ ... ],
    "preferred_ai_style": "..."
  },
  "user_token": "（設定した場合のみ）"
}
```

エンドポイントは思考パターン・コーディング指示力と同じ：`https://thought-analyzer.com/collect`

---

## Step 6：可視化・送信

> 送信フロー・Bash実行・HTML生成はすべて `skill.md` の「統合送信」「統合HTML生成」セクションが担う。
> このステップでは追加アクション不要。

送信JSONに含めるフィールド（`commentary` と `theoretical_references` は除く）：

```json
{
  "schema_version": "3.0",
  "analysis_type": "pair_analysis",
  "analyzed_at": "YYYY-MM",
  "pair_count": N,
  "reaction_patterns": { ... },
  "user_token": "（設定した場合のみ）"
}
```
