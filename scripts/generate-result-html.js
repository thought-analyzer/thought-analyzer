#!/usr/bin/env node
/**
 * thought-analyzer — 分析結果HTMLビジュアライザー
 * 使い方: node generate-result-html.js '<JSON文字列>' [output-path]
 */

const fs = require('fs');
const path = require('path');

const jsonStr = process.argv[2];
const outputPath = process.argv[3] || path.join('C:/Users/yoshi/Documents/skills/thought-analyzer', `result-${Date.now()}.html`);

if (!jsonStr) {
  console.error('Usage: node generate-result-html.js \'<json>\' [output-path]');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(jsonStr);
} catch (e) {
  console.error('Invalid JSON:', e.message);
  process.exit(1);
}

// ── 軸の正規化（0〜1に変換） ────────────────────────
const fp = data.fingerprint || data.coding_direction || {};
const commentary = data.commentary || {};
const isCoding = !!data.coding_direction;

function normalize(axis, value) {
  const maps = {
    // 思考パターン 9軸
    abstraction_direction: { stays_concrete: 0.25, concrete_to_abstract: 0.5, abstract_to_concrete: 0.75, stays_abstract: 1.0 },
    problem_style:         { fix: 0.25, suspend: 0.5, delegate: 0.75, pivot: 1.0 },
    perspective_taking:    { absent: 0.0, reactive: 0.5, spontaneous: 1.0 },
    evaluation_framing:    { loss_first: 0.0, neutral: 0.33, mixed: 0.67, gain_first: 1.0 },
    need_for_cognition:    { low: 0.0, moderate: 0.5, high: 1.0 },
    epistemic_curiosity:   { deprivation_type: 0.0, mixed: 0.5, interest_type: 1.0 },
    // コーディング指示力 6軸
    error_recognition:     { result_only: 0.25, behavioral: 0.6, structural: 1.0 },
    system_abstraction:    { blackbox: 0.25, interface: 0.5, component: 0.75, architecture: 1.0 },
    decision_quality:      { deferred: 0.25, routine: 0.6, adaptive: 1.0 },
    technical_vocabulary:  { lay: 0.25, approximate: 0.6, precise: 1.0, mixed: 0.5 },
    iteration_style:       { batch_vague: 0.1, incremental_vague: 0.35, batch_clear: 0.65, incremental_clear: 1.0 },
  };

  if (axis === 'face_strategy') {
    const v = typeof value === 'object' ? value.score : parseFloat(value);
    return isNaN(v) ? 0.5 : v;
  }
  if (axis === 'concept_distance') {
    const dist = typeof value === 'object' ? value.distance : value;
    return { near: 0.33, mid: 0.67, far: 1.0 }[dist] ?? 0.5;
  }
  if (axis === 'face_strategy_score') return parseFloat(value) || 0.5;
  if (axis === 'integrative_complexity' || axis === 'specification_precision') {
    const max = axis === 'integrative_complexity' ? 7 : 5;
    return (parseFloat(value) - 1) / (max - 1);
  }
  if (maps[axis]) return maps[axis][value] ?? 0.5;
  return 0.5;
}

// ── 軸リスト定義 ────────────────────────────────────
const thoughtAxes = [
  { key: 'abstraction_direction', label: 'abstraction\ndirection', ja: '抽象化の方向' },
  { key: 'problem_style',         label: 'problem\nstyle',        ja: '問題アプローチ' },
  { key: 'perspective_taking',    label: 'perspective\ntaking',   ja: '他者視点' },
  { key: 'face_strategy',         label: 'face\nstrategy',        ja: '配慮戦略' },
  { key: 'concept_distance',      label: 'concept\ndistance',     ja: '概念距離' },
  { key: 'evaluation_framing',    label: 'evaluation\nframing',   ja: '評価フレーミング' },
  { key: 'need_for_cognition',    label: 'need for\ncognition',   ja: '思考への欲求' },
  { key: 'integrative_complexity',label: 'integrative\ncomplexity', ja: '統合的複雑性' },
  { key: 'epistemic_curiosity',   label: 'epistemic\ncuriosity',  ja: '認識論的好奇心' },
];

const codingAxes = [
  { key: 'specification_precision', label: 'specification\nprecision',  ja: '要件定義の精度' },
  { key: 'error_recognition',       label: 'error\nrecognition',        ja: 'エラー認識力' },
  { key: 'system_abstraction',      label: 'system\nabstraction',       ja: 'システム抽象度' },
  { key: 'decision_quality',        label: 'decision\nquality',         ja: '技術的判断の質' },
  { key: 'technical_vocabulary',    label: 'technical\nvocabulary',      ja: '技術語彙の正確性' },
  { key: 'iteration_style',         label: 'iteration\nstyle',          ja: '改善サイクル' },
];

const axes = isCoding ? codingAxes : thoughtAxes;

const radarValues = axes.map(({ key }) => {
  const raw = fp[key];
  return Math.round(normalize(key, raw) * 100) / 100;
});

const radarLabels = axes.map(a => a.label.replace('\n', ' '));

// ── 軸値テーブル行 ───────────────────────────────────
function displayValue(key, val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') {
    if (val.value !== undefined) return `${val.value} (${val.score ?? ''})`;
    if (val.distance !== undefined) return `${val.distance} (n=${val.count ?? '?'})`;
    return JSON.stringify(val);
  }
  return String(val);
}

const axisRows = axes.map(({ key, ja }) => {
  const raw = fp[key];
  const pct = Math.round(normalize(key, raw) * 100);
  return `
    <tr>
      <td class="axis-name">${ja}<span class="axis-key">${key}</span></td>
      <td class="axis-val">${displayValue(key, raw)}</td>
      <td class="axis-bar-cell"><div class="axis-bar"><div class="axis-bar-fill" style="width:${pct}%"></div></div></td>
    </tr>`;
}).join('');

// ── コメンタリーセクション ───────────────────────────
function commentarySection() {
  const items = [];
  const block = (label, content, highlight = false) =>
    `<div class="c-block${highlight ? ' highlight' : ''}"><div class="c-label">${label}</div>${content}</div>`;
  const p = (text) => `<p>${text}</p>`;
  const ul = (arr) => `<ul>${arr.map(s => `<li>${s}</li>`).join('')}</ul>`;

  if (commentary.summary)          items.push(block('総評', p(commentary.summary)));
  if (commentary.holistic_profile) items.push(block('ホリスティックプロファイル', p(commentary.holistic_profile), true));
  if (commentary.notable)          items.push(block('最も特徴的な軸', p(commentary.notable)));
  if (commentary.strengths?.length) items.push(block('強み', ul(commentary.strengths)));
  if (commentary.blind_spots?.length) items.push(block('盲点', ul(commentary.blind_spots)));
  if (commentary.growth_areas?.length) items.push(block('伸びしろ', ul(commentary.growth_areas)));
  if (commentary.universality_note) items.push(block('機能しやすい文脈', p(commentary.universality_note)));
  if (commentary.collaboration_profile) items.push(block('協働スタイル', p(commentary.collaboration_profile)));
  if (commentary.low_confidence?.length) items.push(block('低信頼軸', ul(commentary.low_confidence)));
  return items.join('');
}

const title = isCoding ? 'コーディング指示力分析' : '思考パターン分析';
const analyzedAt = data.analyzed_at || '—';
const msgCount = data.message_count ?? '—';

// ── HTML生成 ─────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>thought-analyzer — ${title}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d1117; color: #e6edf3; font-family: -apple-system, 'Segoe UI', sans-serif; min-height: 100vh; padding: 40px 20px; }
  .container { max-width: 860px; margin: 0 auto; }

  header { margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #21262d; }
  .logo { font-size: 11px; font-family: monospace; color: #8b949e; letter-spacing: 0.1em; margin-bottom: 10px; }
  h1 { font-size: 22px; font-weight: 600; color: #e6edf3; margin-bottom: 6px; }
  .meta { font-size: 12px; color: #8b949e; }
  .meta span { margin-right: 16px; }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }

  .card { background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 24px; }
  .card-title { font-size: 12px; font-weight: 600; color: #8b949e; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px; }

  .radar-wrap { position: relative; height: 280px; }

  table { width: 100%; border-collapse: collapse; }
  tr { border-bottom: 1px solid #21262d; }
  tr:last-child { border-bottom: none; }
  td { padding: 10px 8px; vertical-align: middle; }
  .axis-name { font-size: 13px; color: #e6edf3; width: 40%; }
  .axis-key { display: block; font-family: monospace; font-size: 10px; color: #484f58; margin-top: 2px; }
  .axis-val { font-family: monospace; font-size: 12px; color: #79c0ff; width: 30%; }
  .axis-bar-cell { width: 30%; }
  .axis-bar { background: #21262d; border-radius: 3px; height: 6px; overflow: hidden; }
  .axis-bar-fill { height: 100%; background: linear-gradient(90deg, #388bfd, #79c0ff); border-radius: 3px; transition: width 0.3s; }

  .commentary { margin-bottom: 32px; }
  .c-block { background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 20px 24px; margin-bottom: 12px; }
  .c-block.highlight { border-color: #388bfd44; background: #0d1117; }
  .c-label { font-size: 11px; font-weight: 600; color: #8b949e; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }
  .c-block p { font-size: 14px; line-height: 1.7; color: #c9d1d9; }
  .c-block ul { padding-left: 18px; }
  .c-block li { font-size: 14px; line-height: 1.7; color: #c9d1d9; margin-bottom: 4px; }

  footer { font-size: 11px; color: #484f58; text-align: center; padding-top: 20px; border-top: 1px solid #21262d; }
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="logo">thought-analyzer</div>
    <h1>${title}</h1>
    <div class="meta">
      <span>📅 ${analyzedAt}</span>
      <span>💬 ${msgCount} messages</span>
      <span>v${data.schema_version || '—'}</span>
    </div>
  </header>

  <div class="grid">
    <div class="card">
      <div class="card-title">フィンガープリント</div>
      <div class="radar-wrap">
        <canvas id="radar"></canvas>
      </div>
    </div>
    <div class="card">
      <div class="card-title">軸の値</div>
      <table>${axisRows}</table>
    </div>
  </div>

  ${commentary && Object.keys(commentary).length ? `
  <div class="commentary">
    <div class="card-title" style="margin-bottom:12px">コメンタリー</div>
    ${commentarySection()}
  </div>` : ''}

  <footer>thought-analyzer — generated ${new Date().toLocaleString('ja-JP')}</footer>
</div>

<script>
const ctx = document.getElementById('radar').getContext('2d');
new Chart(ctx, {
  type: 'radar',
  data: {
    labels: ${JSON.stringify(radarLabels)},
    datasets: [{
      data: ${JSON.stringify(radarValues)},
      backgroundColor: 'rgba(56,139,253,0.15)',
      borderColor: 'rgba(121,192,255,0.85)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(180,210,255,0.95)',
      pointRadius: 4,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0, max: 1,
        ticks: { display: false, stepSize: 0.2 },
        grid: { color: 'rgba(100,120,180,0.15)' },
        angleLines: { color: 'rgba(100,120,200,0.2)' },
        pointLabels: {
          color: '#8b949e',
          font: { size: 11, family: 'monospace' }
        }
      }
    },
    plugins: { legend: { display: false } }
  }
});
<\/script>
</body>
</html>`;

fs.writeFileSync(outputPath, html, 'utf-8');
console.log('saved:', outputPath);
