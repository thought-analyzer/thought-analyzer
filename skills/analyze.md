---
name: analyze
description: 思考パターン・コーディング指示力の分析を起動する入口。分析種別とログソースを選択して対応するskillに引き渡す。
trigger: ユーザーが「分析して」「/analyze」「analyzeして」「分析を始めて」と言ったとき
---

# 分析ランチャー v1.1

**言語はトリガーの言語に合わせる。以下すべての案内文に適用する。**

---

## ステップ1：分析種別の選択

起動時に以下を表示してユーザーの返答を待つ。

**【日本語】**

```
どの分析を実行しますか？

1. 思考パターン分析     — 9軸（抽象化・問題アプローチ・好奇心など）
2. コーディング指示力分析 — 6軸（要件定義・エラー認識・判断力など）
3. 両方

番号または名前で答えてください。
```

**【English】**

```
Which analysis would you like to run?

1. Thinking Pattern Analysis   — 9 axes (abstraction, problem style, curiosity, etc.)
2. Coding Direction Analysis   — 6 axes (specification, error recognition, judgment, etc.)
3. Both

Reply with a number or name.
```

---

## ステップ2：ログソースの選択

ステップ1の返答を受け取ったら、続けて以下を表示してユーザーの返答を待つ。

**【日本語】**

```
どのログを分析しますか？

A. この会話（今のセッションのやり取りを対象にする）
B. 貼り付ける（ログのテキストをこの後貼り付けてください）
C. ファイルを指定する（ファイルパスを教えてください）

A / B / C で答えてください。
```

**【English】**

```
Which log would you like to analyze?

A. This conversation (use the current session)
B. Paste a log (paste the text after this message)
C. Specify a file (provide the file path)

Reply with A, B, or C.
```

### ログソース別の動作

| 選択 | 動作 |
|---|---|
| A | そのまま次のステップへ進む。各skillのログ取得手順で「現在のセッション」として処理する |
| B | 「貼り付けてください」と案内し、ユーザーの貼り付けを待ってから次のステップへ進む |
| C | 「ファイルパスを教えてください」と案内し、パスを受け取ったら Read ツールでファイルを読み込んでから次のステップへ進む |

---

## ステップ3：各skillへの引き渡し

ステップ1・2の選択を確定したら、以下のファイルを Read ツールで読み込み、各ファイルの **「データ量チェック」** から処理を再開する。
起動メッセージ・ログ取得の案内は**スキップ**する（ランチャーで完了済みのため）。

| ステップ1の選択 | 読み込むファイル |
|---|---|
| 1 / 思考パターン / thinking / thought | `C:/Users/yoshi/Documents/skills/thought-analyzer/skills/skill.md` |
| 2 / コーディング指示力 / 指示力 / coding / direction | `C:/Users/yoshi/Documents/skills/thought-analyzer/skills/coding-direction-skill.md` |
| 3 / 両方 / both / dual | 両ファイルを読み込み、`skill.md` の「デュアル分析モード」に従って実行する |

言語ルール・データ量チェック・軸の定義・送信フロー・HTML生成はすべて各ファイルの定義に従う。

---

## このファイルが担当しないこと

- 軸の定義・分析ロジック
- 送信・HTML生成

これらはすべて各skillファイルに定義されている。このファイルは入口と引き渡しのみ。
