-- thought-analyzer D1 schema
-- 保存されるのはフィンガープリントのみ
-- 生ログ・固有名詞・個人情報を受け取るカラムは存在しない

CREATE TABLE IF NOT EXISTS fingerprints (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),

  -- メタ情報（内容は含まない）
  schema_version  TEXT    NOT NULL DEFAULT '1.0',
  analyzed_at     TEXT    NOT NULL,   -- "YYYY-MM" 形式
  message_count   INTEGER NOT NULL,

  -- 7軸（値は定義済みの列挙値のみ）
  judgment_order        TEXT NOT NULL,
  number_usage          TEXT NOT NULL,
  other_perspective     TEXT NOT NULL,
  problem_style         TEXT NOT NULL,
  concept_bridges       TEXT NOT NULL,  -- JSON配列として保存
  language_softness     REAL NOT NULL,
  abstraction_direction TEXT NOT NULL,

  -- バリデーション用
  payload_size    INTEGER NOT NULL   -- 受け取ったJSONのバイト数
);

-- 比較クエリ用インデックス
CREATE INDEX IF NOT EXISTS idx_judgment_order    ON fingerprints(judgment_order);
CREATE INDEX IF NOT EXISTS idx_number_usage      ON fingerprints(number_usage);
CREATE INDEX IF NOT EXISTS idx_other_perspective ON fingerprints(other_perspective);
CREATE INDEX IF NOT EXISTS idx_problem_style     ON fingerprints(problem_style);
CREATE INDEX IF NOT EXISTS idx_abstraction       ON fingerprints(abstraction_direction);
CREATE INDEX IF NOT EXISTS idx_analyzed_at       ON fingerprints(analyzed_at);

-- concept_bridges は配列なので全文検索で対応
CREATE VIRTUAL TABLE IF NOT EXISTS concept_bridges_fts
  USING fts5(fingerprint_id, bridge_term);
