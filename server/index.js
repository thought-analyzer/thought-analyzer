/**
 * thought-analyzer — Cloudflare Workers backend v2.2
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
  'schema_version', 'analyzed_at', 'message_count', 'fingerprint', 'user_token'
]);

const MAX_USER_TOKEN_LENGTH = 128;

const ALLOWED_FINGERPRINT_KEYS = new Set([
  'abstraction_direction',
  'problem_style',
  'perspective_taking',
  'face_strategy',        // { value, score }
  'concept_distance',     // { bridges, distance, count }
  'evaluation_framing',
  'need_for_cognition',
  'integrative_complexity',
  'epistemic_curiosity',
]);

const ALLOWED_VALUES = {
  abstraction_direction: new Set(['concrete_to_abstract', 'abstract_to_concrete', 'stays_concrete', 'stays_abstract']),
  problem_style:         new Set(['pivot', 'fix', 'delegate', 'suspend']),
  perspective_taking:    new Set(['spontaneous', 'reactive', 'absent']),
  face_strategy_value:   new Set(['high_mitigation', 'moderate', 'low_mitigation']),
  concept_distance_dist: new Set(['near', 'mid', 'far']),
  evaluation_framing:    new Set(['gain_first', 'loss_first', 'neutral', 'mixed']),
  need_for_cognition:    new Set(['high', 'moderate', 'low']),
  epistemic_curiosity:   new Set(['interest_type', 'deprivation_type', 'mixed']),
};

const MAX_PAYLOAD_BYTES    = 2000;
const MAX_BRIDGE_TERM_LENGTH = 30;
const MAX_BRIDGE_COUNT       = 10;

// ── メインハンドラ ────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers });

    if (request.method === 'POST' && url.pathname === '/collect') {
      return handleCollect(request, env, headers);
    }
    if (request.method === 'GET' && url.pathname === '/compare') {
      if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401, headers);
      return handleCompare(request, env, headers);
    }
    if (request.method === 'GET' && url.pathname === '/stats') {
      if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401, headers);
      return handleStats(request, env, headers);
    }
    if (request.method === 'GET' && url.pathname === '/export') {
      if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401, headers);
      return handleExport(request, env, headers);
    }
    if (request.method === 'GET' && url.pathname === '/record') {
      return handleRecord(request, env, headers);
    }
    if (request.method === 'GET' && url.pathname === '/user') {
      if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401, headers);
      return handleUser(request, env, headers);
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

  // ③ 許可キー以外を除去
  const data = {};
  for (const key of ALLOWED_TOP_KEYS) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  // ④ 必須フィールドチェック
  for (const k of ['analyzed_at', 'message_count', 'fingerprint']) {
    if (!data[k]) return json({ error: `missing_field: ${k}` }, 400, headers);
  }

  // ⑤ analyzed_at フォーマット検証
  if (!/^\d{4}-\d{2}$/.test(data.analyzed_at)) {
    return json({ error: 'invalid analyzed_at format. expected YYYY-MM' }, 400, headers);
  }

  // ⑥ message_count 検証
  if (!Number.isInteger(data.message_count) || data.message_count < 1 || data.message_count > 10000) {
    return json({ error: 'invalid message_count' }, 400, headers);
  }

  // ⑦ fingerprint の許可キー以外を除去
  const fp_raw = data.fingerprint;
  const fp = {};
  for (const key of ALLOWED_FINGERPRINT_KEYS) {
    if (fp_raw[key] !== undefined) fp[key] = fp_raw[key];
  }

  // ⑧ 列挙値の検証
  for (const [axis, allowed] of Object.entries(ALLOWED_VALUES)) {
    if (axis === 'face_strategy_value') {
      const v = fp.face_strategy?.value;
      if (v && !allowed.has(v)) return json({ error: `invalid face_strategy.value: ${v}` }, 400, headers);
    } else if (axis === 'concept_distance_dist') {
      const v = fp.concept_distance?.distance;
      if (v && !allowed.has(v)) return json({ error: `invalid concept_distance.distance: ${v}` }, 400, headers);
    } else {
      if (fp[axis] && !allowed.has(fp[axis])) {
        return json({ error: `invalid value for ${axis}: ${fp[axis]}` }, 400, headers);
      }
    }
  }

  // ⑨ face_strategy.score の検証
  const face_score = fp.face_strategy?.score;
  if (face_score !== undefined) {
    if (typeof face_score !== 'number' || face_score < 0 || face_score > 1) {
      return json({ error: 'face_strategy.score must be 0.0-1.0' }, 400, headers);
    }
  }

  // ⑩ integrative_complexity の検証（1-7）
  const ic = fp.integrative_complexity;
  if (ic !== undefined) {
    if (!Number.isInteger(ic) || ic < 1 || ic > 7) {
      return json({ error: 'integrative_complexity must be integer 1-7' }, 400, headers);
    }
  }

  // ⑪ concept_distance.bridges の検証（領域名のみ。長文・URLを含む場合は弾く）
  const bridges = fp.concept_distance?.bridges;
  if (bridges !== undefined) {
    if (!Array.isArray(bridges)) return json({ error: 'concept_distance.bridges must be array' }, 400, headers);
    if (bridges.length > MAX_BRIDGE_COUNT) return json({ error: `bridges max ${MAX_BRIDGE_COUNT} items` }, 400, headers);
    for (const term of bridges) {
      if (typeof term !== 'string' || term.length > MAX_BRIDGE_TERM_LENGTH) {
        return json({ error: `bridge term too long (max ${MAX_BRIDGE_TERM_LENGTH} chars)` }, 400, headers);
      }
      if (/https?:\/\/|www\.|\.com|\.jp/.test(term)) {
        return json({ error: 'bridges must not contain URLs' }, 400, headers);
      }
    }
  }

  // ⑫ user_token の検証とハッシュ化（任意）
  const raw_token = data.user_token;
  let user_token_hash = null;
  if (raw_token !== undefined) {
    if (typeof raw_token !== 'string' || raw_token.length === 0 || raw_token.length > MAX_USER_TOKEN_LENGTH) {
      return json({ error: `user_token must be 1-${MAX_USER_TOKEN_LENGTH} chars` }, 400, headers);
    }
    // SHA-256ハッシュ化（元の文字列は保存しない）
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw_token));
    user_token_hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ⑬ record_id を生成（サーバーサイドUUID）
  const record_id = crypto.randomUUID();
  const payload_size = raw.length;

  // ⑭ D1 に保存（許可されたフィールドのみ）
  await env.DB.prepare(`
    INSERT INTO fingerprints (
      record_id, user_token_hash,
      schema_version, analyzed_at, message_count,
      abstraction_direction, problem_style, perspective_taking,
      face_strategy_value, face_strategy_score,
      concept_distance_dist, concept_distance_count,
      evaluation_framing, need_for_cognition,
      integrative_complexity, epistemic_curiosity,
      payload_size
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    record_id,
    user_token_hash,
    data.schema_version ?? '2.0',
    data.analyzed_at,
    data.message_count,
    fp.abstraction_direction      ?? null,
    fp.problem_style              ?? null,
    fp.perspective_taking         ?? null,
    fp.face_strategy?.value       ?? null,
    fp.face_strategy?.score       ?? null,
    fp.concept_distance?.distance ?? null,
    fp.concept_distance?.count    ?? null,
    fp.evaluation_framing         ?? null,
    fp.need_for_cognition         ?? null,
    fp.integrative_complexity     ?? null,
    fp.epistemic_curiosity        ?? null,
    payload_size
  ).run();

  // concept_bridges を全文検索テーブルにも登録
  const id_row = await env.DB.prepare('SELECT last_insert_rowid() as id').first();
  if (id_row && bridges?.length) {
    for (const term of bridges) {
      await env.DB.prepare(
        'INSERT INTO concept_bridges_fts (fingerprint_id, bridge_term) VALUES (?, ?)'
      ).bind(id_row.id, term).run();
    }
  }

  return json({ ok: true, payload_size, record_id }, 200, headers);
}

// ── /record ───────────────────────────────────────────────────────
// record_id（UUID）でレコードを1件取得する（認証不要・UUIDが鍵）

async function handleRecord(request, env, headers) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return json({ error: 'required: id' }, 400, headers);

  // UUID形式のバリデーション
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
    return json({ error: 'invalid id format' }, 400, headers);
  }

  const row = await env.DB.prepare(
    'SELECT * FROM fingerprints WHERE record_id = ?'
  ).bind(id).first();

  if (!row) return json({ error: 'not found' }, 404, headers);

  return json(row, 200, headers);
}

// ── /user ─────────────────────────────────────────────────────────
// user_tokenのハッシュが一致するレコードを時系列で返す（認証必須）

async function handleUser(request, env, headers) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) return json({ error: 'required: token' }, 400, headers);

  // トークンをハッシュ化して照合
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

  const rows = await env.DB.prepare(
    'SELECT * FROM fingerprints WHERE user_token_hash = ? ORDER BY created_at ASC'
  ).bind(hash).all();

  if (!rows.results.length) return json({ error: 'not found' }, 404, headers);

  return json({
    count: rows.results.length,
    token_hash: hash,
    records: rows.results
  }, 200, headers);
}

// ── /export ───────────────────────────────────────────────────────
// 全レコードをJSONで返す（認証必須）

async function handleExport(request, env, headers) {
  const url = new URL(request.url);
  const limit  = Math.min(parseInt(url.searchParams.get('limit')  ?? '1000'), 1000);
  const offset = parseInt(url.searchParams.get('offset') ?? '0');

  const rows = await env.DB.prepare(
    'SELECT * FROM fingerprints ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all();

  const total = await env.DB.prepare('SELECT COUNT(*) as n FROM fingerprints').first();

  return json({
    total_count: total?.n ?? 0,
    returned: rows.results.length,
    offset,
    records: rows.results
  }, 200, headers);
}

// ── /compare ──────────────────────────────────────────────────────

async function handleCompare(request, env, headers) {
  const url = new URL(request.url);
  const axis  = url.searchParams.get('axis');
  const value = url.searchParams.get('value');

  const COMPARABLE_AXES = new Set([
    'abstraction_direction', 'problem_style', 'perspective_taking',
    'face_strategy_value', 'concept_distance_dist',
    'evaluation_framing', 'need_for_cognition',
    'integrative_complexity', 'epistemic_curiosity'
  ]);

  if (!axis || !value) return json({ error: 'required: axis, value' }, 400, headers);
  if (!COMPARABLE_AXES.has(axis)) return json({ error: 'invalid axis' }, 400, headers);

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

async function handleStats(request, env, headers) {
  const total = await env.DB.prepare('SELECT COUNT(*) as n FROM fingerprints').first();

  const axes = [
    'abstraction_direction', 'problem_style', 'perspective_taking',
    'face_strategy_value', 'concept_distance_dist',
    'evaluation_framing', 'need_for_cognition',
    'integrative_complexity', 'epistemic_curiosity'
  ];
  const distributions = {};

  for (const axis of axes) {
    const rows = await env.DB.prepare(
      `SELECT ${axis} as val, COUNT(*) as n FROM fingerprints WHERE ${axis} IS NOT NULL GROUP BY ${axis}`
    ).all();
    distributions[axis] = rows.results;
  }

  const avg_ic = await env.DB.prepare(
    'SELECT AVG(integrative_complexity) as avg FROM fingerprints'
  ).first();

  const avg_face = await env.DB.prepare(
    'SELECT AVG(face_strategy_score) as avg FROM fingerprints'
  ).first();

  return json({
    total_count: total?.n ?? 0,
    distributions,
    integrative_complexity_avg: avg_ic?.avg ?? null,
    face_strategy_score_avg:    avg_face?.avg ?? null
  }, 200, headers);
}

// ── ヘルパー ──────────────────────────────────────────────────────

function isAuthorized(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return token === env.API_KEY;
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
