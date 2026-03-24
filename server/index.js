/**
 * thought-analyzer — Cloudflare Workers backend
 *
 * このファイルが受け取れるもの・保存できるものを
 * コードで証明するために全文公開しています。
 *
 * 受け取れないもの（物理的に）：
 *   - 生の会話ログ
 *   - 固有名詞・URL・コード
 *   - 定義外のフィールド
 *   - 2000バイトを超えるペイロード
 */

// ── 定数定義（許可リスト）────────────────────────────────────────

const ALLOWED_TOP_KEYS = new Set([
  'schema_version', 'analyzed_at', 'message_count', 'fingerprint'
]);

const ALLOWED_FINGERPRINT_KEYS = new Set([
  'judgment_order', 'number_usage', 'other_perspective',
  'problem_style', 'concept_bridges',
  'language_softness', 'abstraction_direction'
]);

const ALLOWED_VALUES = {
  judgment_order:        new Set(['affirm_first', 'problem_first', 'neutral', 'mixed']),
  number_usage:          new Set(['emotional_proof', 'comparison', 'precision', 'decoration', 'absent']),
  other_perspective:     new Set(['spontaneous', 'reactive', 'absent']),
  problem_style:         new Set(['pivot', 'fix', 'delegate', 'suspend']),
  abstraction_direction: new Set(['concrete_to_abstract', 'abstract_to_concrete', 'stays_concrete', 'stays_abstract']),
};

const MAX_PAYLOAD_BYTES = 2000;
const MAX_BRIDGE_TERM_LENGTH = 30;  // 「領域A × 領域B」の最大長
const MAX_BRIDGE_COUNT = 10;

// ── メインハンドラ ────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers });

    // ── POST /collect ─────────────────────────────────────────────
    if (request.method === 'POST' && url.pathname === '/collect') {
      return handleCollect(request, env, headers);
    }

    // ── GET /compare ──────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/compare') {
      return handleCompare(request, env, headers);
    }

    // ── GET /stats ────────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/stats') {
      return handleStats(request, env, headers);
    }

    return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers });
  }
};

// ── /collect ──────────────────────────────────────────────────────

async function handleCollect(request, env, headers) {

  // ① ペイロードサイズチェック（生ログが紛れていれば必ずここで弾かれる）
  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return json({ error: 'payload_too_large', max: MAX_PAYLOAD_BYTES }, 400, headers);
  }

  // ② JSONパース
  let body;
  try { body = JSON.parse(raw); }
  catch { return json({ error: 'invalid_json' }, 400, headers); }

  // ③ 許可キー以外を除去（定義外フィールドは物理的に保存されない）
  const data = {};
  for (const key of ALLOWED_TOP_KEYS) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  // ④ 必須フィールドチェック
  const required = ['analyzed_at', 'message_count', 'fingerprint'];
  for (const k of required) {
    if (!data[k]) return json({ error: `missing_field: ${k}` }, 400, headers);
  }

  // ⑤ analyzed_at フォーマット検証（YYYY-MM のみ）
  if (!/^\d{4}-\d{2}$/.test(data.analyzed_at)) {
    return json({ error: 'invalid analyzed_at format. expected YYYY-MM' }, 400, headers);
  }

  // ⑥ message_count 検証
  if (!Number.isInteger(data.message_count) || data.message_count < 1 || data.message_count > 10000) {
    return json({ error: 'invalid message_count' }, 400, headers);
  }

  // ⑦ fingerprint の許可キー以外を除去
  const fp = {};
  for (const key of ALLOWED_FINGERPRINT_KEYS) {
    if (data.fingerprint[key] !== undefined) fp[key] = data.fingerprint[key];
  }

  // ⑧ 列挙値の検証（定義外の値は保存されない）
  for (const [axis, allowed] of Object.entries(ALLOWED_VALUES)) {
    if (fp[axis] && !allowed.has(fp[axis])) {
      return json({ error: `invalid value for ${axis}: ${fp[axis]}` }, 400, headers);
    }
  }

  // ⑨ language_softness の範囲検証
  if (fp.language_softness !== undefined) {
    const v = fp.language_softness;
    if (typeof v !== 'number' || v < 0 || v > 1) {
      return json({ error: 'language_softness must be 0.0–1.0' }, 400, headers);
    }
    fp.language_softness = Math.round(v * 100) / 100;
  }

  // ⑩ concept_bridges の検証（領域名のみ。長文・URLを含む場合は弾く）
  if (fp.concept_bridges !== undefined) {
    if (!Array.isArray(fp.concept_bridges)) {
      return json({ error: 'concept_bridges must be array' }, 400, headers);
    }
    if (fp.concept_bridges.length > MAX_BRIDGE_COUNT) {
      return json({ error: `concept_bridges max ${MAX_BRIDGE_COUNT} items` }, 400, headers);
    }
    for (const term of fp.concept_bridges) {
      if (typeof term !== 'string' || term.length > MAX_BRIDGE_TERM_LENGTH) {
        return json({ error: `concept_bridges term too long (max ${MAX_BRIDGE_TERM_LENGTH} chars)` }, 400, headers);
      }
      // URLっぽい文字列を弾く
      if (/https?:\/\/|www\.|\.com|\.jp/.test(term)) {
        return json({ error: 'concept_bridges must not contain URLs' }, 400, headers);
      }
    }
  }

  // ⑪ D1 に保存（許可されたフィールドのみ）
  const payload_size = raw.length;
  await env.DB.prepare(`
    INSERT INTO fingerprints (
      schema_version, analyzed_at, message_count,
      judgment_order, number_usage, other_perspective,
      problem_style, concept_bridges,
      language_softness, abstraction_direction,
      payload_size
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.schema_version ?? '1.0',
    data.analyzed_at,
    data.message_count,
    fp.judgment_order ?? null,
    fp.number_usage ?? null,
    fp.other_perspective ?? null,
    fp.problem_style ?? null,
    JSON.stringify(fp.concept_bridges ?? []),
    fp.language_softness ?? null,
    fp.abstraction_direction ?? null,
    payload_size
  ).run();

  // concept_bridges を全文検索テーブルにも登録
  const id_row = await env.DB.prepare('SELECT last_insert_rowid() as id').first();
  if (id_row && fp.concept_bridges) {
    for (const term of fp.concept_bridges) {
      await env.DB.prepare(
        'INSERT INTO concept_bridges_fts (fingerprint_id, bridge_term) VALUES (?, ?)'
      ).bind(id_row.id, term).run();
    }
  }

  return json({ ok: true, payload_size }, 200, headers);
}

// ── /compare ──────────────────────────────────────────────────────
// 送信されたフィンガープリントが全体の分布の中でどこに位置するか返す

async function handleCompare(request, env, headers) {
  const url = new URL(request.url);
  const axis = url.searchParams.get('axis');
  const value = url.searchParams.get('value');

  if (!axis || !value) {
    return json({ error: 'required: axis, value' }, 400, headers);
  }
  if (!ALLOWED_FINGERPRINT_KEYS.has(axis)) {
    return json({ error: 'invalid axis' }, 400, headers);
  }

  // 全体の分布を取得
  const total = await env.DB.prepare('SELECT COUNT(*) as n FROM fingerprints').first();
  const match = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM fingerprints WHERE ${axis} = ?`
  ).bind(value).first();

  const total_n = total?.n ?? 0;
  const match_n = match?.n ?? 0;
  const pct = total_n > 0 ? Math.round((match_n / total_n) * 100) : null;

  return json({
    axis,
    value,
    match_count: match_n,
    total_count: total_n,
    percent: pct,
    note: total_n < 30 ? 'データが少ないため参考値です' : null
  }, 200, headers);
}

// ── /stats ────────────────────────────────────────────────────────
// 全体の分布サマリーを返す（個人を特定できる情報は含まない）

async function handleStats(request, env, headers) {
  const total = await env.DB.prepare('SELECT COUNT(*) as n FROM fingerprints').first();

  const axes = ['judgment_order', 'number_usage', 'other_perspective',
                 'problem_style', 'abstraction_direction'];
  const distributions = {};

  for (const axis of axes) {
    const rows = await env.DB.prepare(
      `SELECT ${axis} as val, COUNT(*) as n FROM fingerprints GROUP BY ${axis}`
    ).all();
    distributions[axis] = rows.results;
  }

  const avg_softness = await env.DB.prepare(
    'SELECT AVG(language_softness) as avg FROM fingerprints'
  ).first();

  return json({
    total_count: total?.n ?? 0,
    distributions,
    language_softness_avg: avg_softness?.avg ?? null
  }, 200, headers);
}

// ── ヘルパー ──────────────────────────────────────────────────────

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
