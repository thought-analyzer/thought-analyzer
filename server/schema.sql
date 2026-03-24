-- thought-analyzer D1 schema v2.0
-- 保存されるのはフィンガープリントのみ
-- 生ログ・固有名詞・個人情報を受け取るカラムは存在しない

CREATE TABLE IF NOT EXISTS fingerprints (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),

  -- メタ情報（内容は含まない）
  schema_version  TEXT    NOT NULL DEFAULT '2.0',
  analyzed_at     TEXT    NOT NULL,   -- "YYYY-MM" 形式
  message_count   INTEGER NOT NULL,

  -- 9軸（値は定義済みの列挙値のみ / v2.0）
  abstraction_direction   TEXT,  -- concrete_to_abstract | abstract_to_concrete | stays_concrete | stays_abstract
  problem_style           TEXT,  -- pivot | fix | delegate | suspend
  perspective_taking      TEXT,  -- spontaneous | reactive | absent
  face_strategy_value     TEXT,  -- high_mitigation | moderate | low_mitigation
  face_strategy_score     REAL,  -- 0.0-1.0
  concept_distance_dist   TEXT,  -- near | mid | far
  concept_distance_count  INTEGER,
  evaluation_framing      TEXT,  -- gain_first | loss_first | neutral | mixed
  need_for_cognition      TEXT,  -- high | moderate | low
  integrative_complexity  INTEGER, -- 1-7
  epistemic_curiosity     TEXT,  -- interest_type | deprivation_type | mixed

  -- バリデーション用
  payload_size    INTEGER NOT NULL   -- 受け取ったJSONのバイト数
);

-- 比較クエリ用インデックス
CREATE INDEX IF NOT EXISTS idx_abstraction_dir   ON fingerprints(abstraction_direction);
CREATE INDEX IF NOT EXISTS idx_problem_style      ON fingerprints(problem_style);
CREATE INDEX IF NOT EXISTS idx_perspective        ON fingerprints(perspective_taking);
CREATE INDEX IF NOT EXISTS idx_face_strategy      ON fingerprints(face_strategy_value);
CREATE INDEX IF NOT EXISTS idx_eval_framing       ON fingerprints(evaluation_framing);
CREATE INDEX IF NOT EXISTS idx_need_cognition     ON fingerprints(need_for_cognition);
CREATE INDEX IF NOT EXISTS idx_integrative        ON fingerprints(integrative_complexity);
CREATE INDEX IF NOT EXISTS idx_epistemic          ON fingerprints(epistemic_curiosity);
CREATE INDEX IF NOT EXISTS idx_analyzed_at        ON fingerprints(analyzed_at);

-- concept_bridges は配列なので全文検索で対応
CREATE VIRTUAL TABLE IF NOT EXISTS concept_bridges_fts
  USING fts5(fingerprint_id, bridge_term);
