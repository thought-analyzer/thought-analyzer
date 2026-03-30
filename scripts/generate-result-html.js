#!/usr/bin/env node
/**
 * thought-analyzer — 分析結果HTMLビジュアライザー v6.0
 * 使い方: node generate-result-html.js '<JSON文字列>' [output-path]
 */

const fs = require('fs');
const path = require('path');

// キャラ画像を base64 埋め込み（ローカルファイル CORS 回避）
function loadImgBase64(relPath) {
  const abs = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(abs)) return '';
  return 'data:image/png;base64,' + fs.readFileSync(abs).toString('base64');
}

const jsonStr = process.argv[2];
const outputPath = process.argv[3] || path.join('C:/Users/yoshi/Documents/skills/thought-analyzer', 'result-' + Date.now() + '.html');

if (!jsonStr) { console.error('Usage: node generate-result-html.js \'<json>\' [output-path]'); process.exit(1); }

let data;
try { data = JSON.parse(jsonStr); }
catch (e) { console.error('Invalid JSON:', e.message); process.exit(1); }

const fp = data.fingerprint || data.coding_direction || {};
const commentary = data.commentary || {};
const isCoding = !!data.coding_direction;

// ── 軸カラー ─────────────────────────────────────
const AXIS_COLORS = ['#00e5ff','#a78bfa','#3dd68c','#f97316','#fb7185','#fbbf24','#60a5fa','#34d399','#e879f9'];

// ── 正規化 ───────────────────────────────────────
function normalize(axis, value) {
  const maps = {
    abstraction_direction: { stays_concrete:0.25, concrete_to_abstract:0.5, abstract_to_concrete:0.75, stays_abstract:1.0 },
    problem_style:         { fix:0.25, suspend:0.5, delegate:0.75, pivot:1.0 },
    perspective_taking:    { absent:0.0, reactive:0.5, spontaneous:1.0 },
    evaluation_framing:    { loss_first:0.0, neutral:0.33, mixed:0.67, gain_first:1.0 },
    need_for_cognition:    { low:0.0, moderate:0.5, high:1.0 },
    epistemic_curiosity:   { deprivation_type:0.0, mixed:0.5, interest_type:1.0 },
    error_recognition:     { result_only:0.25, behavioral:0.6, structural:1.0 },
    system_abstraction:    { blackbox:0.25, interface:0.5, component:0.75, architecture:1.0 },
    decision_quality:      { deferred:0.25, routine:0.6, adaptive:1.0 },
    technical_vocabulary:  { lay:0.25, approximate:0.6, precise:1.0, mixed:0.5 },
    iteration_style:       { batch_vague:0.1, incremental_vague:0.35, batch_clear:0.65, incremental_clear:1.0 },
  };
  if (axis === 'face_strategy') { const v = typeof value === 'object' ? value.score : parseFloat(value); return isNaN(v) ? 0.5 : v; }
  if (axis === 'concept_distance') { const d = typeof value === 'object' ? value.distance : value; return {near:0.33,mid:0.67,far:1.0}[d] ?? 0.5; }
  if (axis === 'face_strategy_score') return parseFloat(value) || 0.5;
  if (axis === 'integrative_complexity' || axis === 'specification_precision') { const max = axis === 'integrative_complexity' ? 7 : 5; return (parseFloat(value)-1)/(max-1); }
  if (maps[axis]) return maps[axis][value] ?? 0.5;
  return 0.5;
}

// ── キャラクター生成 ──────────────────────────────
function generateCharacter(fp) {
  const ps  = fp.problem_style;
  const ic  = parseInt(fp.integrative_complexity) || 3;
  const pt  = fp.perspective_taking;
  const ec  = fp.epistemic_curiosity;
  const cd  = typeof fp.concept_distance === 'object' ? fp.concept_distance?.distance : fp.concept_distance;
  if (ps === 'pivot' && ic >= 5)                              return { code:'ARCHITECT', ja:'設計者型',  color:'#f97316' };
  if (ps === 'fix'   && ic >= 5)                              return { code:'ANALYST',   ja:'解析者型',  color:'#3dd68c' };
  if (cd === 'far')                                           return { code:'BRIDGER',   ja:'橋渡し型',  color:'#e879f9' };
  if (pt === 'spontaneous' && ec === 'interest_type')         return { code:'EXPLORER',  ja:'探索者型',  color:'#fbbf24' };
  if (ps === 'pivot')                                         return { code:'PIONEER',   ja:'開拓者型',  color:'#a78bfa' };
  if (ps === 'fix')                                           return { code:'ENGINEER',  ja:'工学者型',  color:'#60a5fa' };
  if (ps === 'delegate')                                      return { code:'CONDUCTOR', ja:'指揮者型',  color:'#34d399' };
  return { code:'NAVIGATOR', ja:'航行者型', color:'#00e5ff' };
}

const subject = generateCharacter(fp);
const charImgData = loadImgBase64('assets/images/char-subject-v2.png');

// ── ペルソナラベル生成（19パターン） ────────────────
function generatePersonaLabel(fp, charCode) {
  const ps  = fp.problem_style;
  const ic  = parseInt(fp.integrative_complexity) || 3;
  const pt  = fp.perspective_taking;
  const ec  = fp.epistemic_curiosity;
  const cd  = typeof fp.concept_distance === 'object' ? fp.concept_distance?.distance : fp.concept_distance;
  switch (charCode) {
    case 'ARCHITECT':
      if (cd === 'far')                  return '異分野を繋ぐ思想設計者';
      if (pt === 'spontaneous')          return '探索プロジェクトの構造家';
      return '複雑系を再設計するアーキテクト';
    case 'ANALYST':
      if (cd === 'far')                  return '深層まで追う構造解析者';
      if (ec === 'deprivation_type')     return '精密に詰める知識解析者';
      return '技術課題の根本解決者';
    case 'BRIDGER':
      if (pt === 'spontaneous' && ec === 'interest_type') return '概念を橋渡しするビジョナリー';
      if (pt === 'spontaneous')          return '異領域を繋ぐ架け橋型思考者';
      return '遠い概念を接続する発想者';
    case 'EXPLORER':
      if (ps === 'pivot')                return '創造的課題の開拓探索者';
      return '好奇心で世界を広げる探索者';
    case 'PIONEER':
      if (ec === 'interest_type')        return '発想転換を得意とする開拓者';
      return '柔軟に再設計する問題解決者';
    case 'ENGINEER':
      if (ec === 'deprivation_type')     return '知識ギャップを詰める実装者';
      return '原因を特定する実装型思考者';
    case 'CONDUCTOR':
      if (pt === 'spontaneous')          return 'チームを束ねる協働コーディネーター';
      return '実行を委ねる全体指揮者';
    case 'NAVIGATOR':
    default:
      if (ic >= 5)                       return '情報を熟成させる深慮型プランナー';
      return '状況に応じて舵を切る航行型思考者';
  }
}

const personaLabel = generatePersonaLabel(fp, subject.code);

// ── 値の日本語表示 ─────────────────────────────────
const jaValues = {
  abstraction_direction: { stays_concrete:'具体にとどまる', concrete_to_abstract:'具体 → 抽象', abstract_to_concrete:'抽象 → 具体', stays_abstract:'抽象にとどまる' },
  problem_style:         { fix:'根本解決', suspend:'保留', delegate:'委任', pivot:'方向転換' },
  perspective_taking:    { absent:'限定的', reactive:'反応的', spontaneous:'自発的' },
  evaluation_framing:    { loss_first:'損失優先', neutral:'中立', mixed:'混在', gain_first:'利益優先' },
  need_for_cognition:    { low:'低', moderate:'中', high:'高' },
  epistemic_curiosity:   { deprivation_type:'欠乏型(D)', mixed:'混在', interest_type:'関心型(I)' },
  error_recognition:     { result_only:'結果のみ', behavioral:'挙動レベル', structural:'構造レベル' },
  system_abstraction:    { blackbox:'ブラックボックス', interface:'インターフェース', component:'コンポーネント', architecture:'アーキテクチャ' },
  decision_quality:      { deferred:'委任', routine:'ルーティン', adaptive:'適応的' },
  technical_vocabulary:  { lay:'日常語', approximate:'近似的', precise:'精確', mixed:'混在' },
  iteration_style:       { batch_vague:'一括・曖昧', incremental_vague:'小刻み・曖昧', batch_clear:'一括・明確', incremental_clear:'小刻み・明確' },
};

const axisDescriptions = {
  abstraction_direction: { stays_concrete:'終始、操作・事象・結果の話にとどまり抽象化には向かいにくい。', concrete_to_abstract:'具体的な事象・課題から出発し、概念や原則へと向かう思考の流れ。', abstract_to_concrete:'概念・アイデアから始まり、実装や具体的な行動へと降りていく。', stays_abstract:'終始、理念・方向性・フレームの話にとどまり具体には降りにくい。' },
  problem_style:         { fix:'原因を特定して修正しようとする。根本から解決するAdaptor寄りのスタイル。', pivot:'別の方法・代替案を先に探す。既存の枠にとらわれず再設計するInnovator寄りのスタイル。', delegate:'解決を相手（AIなど）に委ねる。判断よりも実行速度を優先する場面に多い。', suspend:'保留して後で判断する。複数の情報が揃うまで決定を先送りする傾向。' },
  perspective_taking:    { spontaneous:'求められていないのに自然に他者視点が出てくる。共感性・設計思考が高い。', reactive:'話題の文脈から促されたときに他者視点が出てくる。状況依存の共感スタイル。', absent:'自己・システム・作業が中心で他者があまり登場しない。タスク集中型の傾向。' },
  face_strategy:         { high_mitigation:'「〜かな」「〜かも」「もしよければ」など配慮表現が多い。スコア: 0.7〜1.0。', moderate:'断定と配慮が混在。場面によって使い分けるバランス型。スコア: 0.4〜0.69。', low_mitigation:'「〜して」「〜にして」など断定・命令形が多い。スコア: 0.0〜0.39。' },
  concept_distance:      { near:'隣接領域の接続（技術×ビジネス、設計×実装など）。', mid:'やや遠い領域の接続（技術×教育、経済×行動など）。', far:'通常接続されない領域を橋渡しする（技術×哲学、経済×感情×空間など）。' },
  evaluation_framing:    { gain_first:'「いいと思う、ただここを変えて」——肯定を先に出してから修正を加えるスタイル。', loss_first:'問題点・懸念を先に出し、その後に良い点を補足するスタイル。', neutral:'情報提供型。価値判断を前面に出さず、事実・条件を並べる。', mixed:'文脈によって gain_first と loss_first が切り替わる。' },
  need_for_cognition:    { high:'自発的に問いを立て、複雑な考察を展開する。求められていない問いが複数回出てくる。', moderate:'必要に応じて熟考するが、問い自体をさらに展開することは少ない。', low:'簡潔な答えと明確な指示を好む。考察より実行速度を優先する傾向。' },
  integrative_complexity:{ '1':'一次元的。単一の視点・基準のみで判断する。', '2':'複数視点の萌芽はあるが統合には至らない。', '3':'複数の側面を認識するが接続・統合はしない。', '4':'複数の側面を詳細に認識している。統合は部分的。', '5':'複数の側面を認識し、その相互関係を考える（分化＋統合）。', '6':'複数の枠組みが関連付けられ、複雑な統合が行われる。', '7':'多次元的な枠組みを構築し、矛盾する視点を高次で統合する。' },
  epistemic_curiosity:   { interest_type:'新しい情報それ自体への喜び（I型）。話題が自然に広がる探索的スタイル。', deprivation_type:'知識のギャップを埋めたい不快感（D型）。解決しないと前に進めない収束型。', mixed:'両方の動機が混在。文脈によって探索的・収束的が切り替わる。' },
};

function getDesc(key, val) {
  if (!val) return '';
  if (key === 'face_strategy') { const v = typeof val === 'object' ? val.value : val; return axisDescriptions.face_strategy[v] || ''; }
  if (key === 'concept_distance') { const d = typeof val === 'object' ? val.distance : val; return axisDescriptions.concept_distance[d] || ''; }
  if (key === 'integrative_complexity') return axisDescriptions.integrative_complexity[String(val)] || '';
  return axisDescriptions[key]?.[val] || '';
}

function displayValueJa(key, val) {
  if (val === null || val === undefined) return '—';
  if (key === 'face_strategy') { const v = typeof val==='object'?val.value:val; const s=typeof val==='object'?val.score:null; const m={high_mitigation:'高配慮',moderate:'中程度',low_mitigation:'低配慮'}; return s!==null?(m[v]||v)+'（'+s+'）':(m[v]||v); }
  if (key === 'concept_distance') { const d=typeof val==='object'?val.distance:val; const c=typeof val==='object'?val.count:null; const m={near:'近距離',mid:'中距離',far:'遠距離'}; return c!==null?(m[d]||d)+'（n='+c+'）':(m[d]||d); }
  if (key === 'integrative_complexity' || key === 'specification_precision') return String(val);
  return jaValues[key]?.[val] || String(val);
}

// ── 軸定義 ────────────────────────────────────────
const thoughtAxes = [
  { key:'abstraction_direction',  ja:'抽象〜具体の移動方向',  label:'abstraction direction' },
  { key:'problem_style',          ja:'問題へのアプローチ',    label:'problem style' },
  { key:'perspective_taking',     ja:'他者視点の出現',        label:'perspective taking' },
  { key:'face_strategy',          ja:'言語の配慮戦略',        label:'face strategy' },
  { key:'concept_distance',       ja:'概念接続の距離・数',    label:'concept distance' },
  { key:'evaluation_framing',     ja:'評価のフレーミング',    label:'evaluation framing' },
  { key:'need_for_cognition',     ja:'思考への欲求',          label:'need for cognition' },
  { key:'integrative_complexity', ja:'統合的複雑性',          label:'integrative complexity' },
  { key:'epistemic_curiosity',    ja:'認識論的好奇心',        label:'epistemic curiosity' },
];
const codingAxes = [
  { key:'specification_precision', ja:'要件定義の精度',   label:'specification precision' },
  { key:'error_recognition',       ja:'エラー認識力',     label:'error recognition' },
  { key:'system_abstraction',      ja:'システム抽象度',   label:'system abstraction' },
  { key:'decision_quality',        ja:'技術的判断の質',   label:'decision quality' },
  { key:'technical_vocabulary',    ja:'技術語彙の正確性', label:'technical vocabulary' },
  { key:'iteration_style',         ja:'改善サイクル',     label:'iteration style' },
];

const axes = isCoding ? codingAxes : thoughtAxes;
const radarValues = axes.map(({ key }) => Math.round(normalize(key, fp[key]) * 100) / 100);
const radarLabels = axes.map((_, i) => String(i + 1));
const pointColors = axes.map((_, i) => AXIS_COLORS[i % AXIS_COLORS.length]);

// ── 主要trait抽出 ─────────────────────────────────
function subjectTraits(fp) {
  const tags = [];
  const ps  = jaValues.problem_style?.[fp.problem_style];
  const ic  = fp.integrative_complexity;
  const cd  = typeof fp.concept_distance==='object' ? fp.concept_distance?.distance : fp.concept_distance;
  const pt  = jaValues.perspective_taking?.[fp.perspective_taking];
  if (ps)  tags.push(ps);
  if (ic)  tags.push('IC: ' + ic + '/7');
  if (cd)  tags.push({ near:'概念-近距離', mid:'概念-中距離', far:'概念-遠距離' }[cd] || cd);
  if (pt)  tags.push('視点: ' + pt);
  return tags.slice(0, 4);
}

// ── 軸リスト HTML ─────────────────────────────────
const axisRows = axes.map(({ key, ja, label }, i) => {
  const raw = fp[key];
  const pct = Math.round(normalize(key, raw) * 100);
  const jaVal = displayValueJa(key, raw);
  const desc = getDesc(key, raw);
  const color = AXIS_COLORS[i % AXIS_COLORS.length];
  return '<div class="axis-row">'
    + '<div class="axis-header">'
    + '<span class="axis-num" style="color:' + color + ';border-color:' + color + '66">' + (i+1) + '</span>'
    + '<span class="axis-ja">' + ja + '</span>'
    + '<span class="axis-pct" style="color:' + color + '">' + pct + '%</span>'
    + '</div>'
    + '<div class="axis-val-text" style="color:' + color + '">' + jaVal + '</div>'
    + '<div class="axis-bar"><div class="axis-bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>'
    + (desc ? '<div class="axis-desc">' + desc + '</div>' : '')
    + '<div class="axis-key-label">' + label + '</div>'
    + '</div>';
}).join('');

// ── コメンタリー HTML ─────────────────────────────
function cblock(label, content, cls) {
  return '<div class="c-block ' + cls + '"><div class="c-label">' + label + '</div>' + content + '</div>';
}
const p = t => '<p>' + t + '</p>';
const ul = arr => '<ul>' + arr.map(s => '<li>' + s + '</li>').join('') + '</ul>';

// ── 概念接続キーワードブロック ────────────────────
function conceptBridgeBlock(cd) {
  if (!cd) return null;
  const dist = typeof cd === 'object' ? cd.distance : cd;
  const count = typeof cd === 'object' ? cd.count : null;
  const bridges = typeof cd === 'object' ? (cd.bridges || cd.examples || []) : [];
  const distLabel = { near:'Near', mid:'Mid', far:'Far' }[dist] || dist;
  let inner = '<div class="bridge-meta">' + distLabel + (count != null ? ' &nbsp;n = ' + count : '') + '</div>';
  if (bridges.length) {
    inner += '<div class="bridge-tags">'
      + bridges.map(b => '<span class="bridge-tag">' + b + '</span>').join('')
      + '</div>';
  } else {
    const descMap = { near:'Adjacent domain connections (tech × business, design × implementation)', mid:'Moderately distant connections (tech × education, economics × behavior)', far:'Cross-domain bridges across normally unrelated fields (tech × philosophy, economics × emotion × space)' };
    inner += p(descMap[dist] || '');
  }
  return cblock('CONCEPT BRIDGES', inner, 'c-cyan');
}

// シェアカード用データ（Node.js側で計算してJSに埋め込む）
const shareAxesData = JSON.stringify(axes.slice(0, 4).map((ax, i) => ({
  label: ax.label,
  pct: Math.round(normalize(ax.key, fp[ax.key]) * 100),
  color: AXIS_COLORS[i % AXIS_COLORS.length]
})));
const shareRadarValues = JSON.stringify(radarValues);
const sharePointColors = JSON.stringify(pointColors);

const AXIS_SHORT_LABELS_MAP = {
  abstraction_direction: '抽象-具体', problem_style: '問題解決',
  perspective_taking: '他者視点', face_strategy: '配慮戦略',
  concept_distance: '概念接続', evaluation_framing: '評価枠組',
  need_for_cognition: '思考欲求', integrative_complexity: '複雑統合',
  epistemic_curiosity: '知的好奇心',
  specification_precision: '要件精度', error_recognition: 'エラー認識',
  system_abstraction: 'システム抽象', decision_quality: '技術判断',
  technical_vocabulary: '技術語彙', iteration_style: '改善サイクル',
};
const shareAxisShortLabels = JSON.stringify(axes.map(ax => AXIS_SHORT_LABELS_MAP[ax.key] || ax.label));
const shareAxisEngLabels   = JSON.stringify(axes.map(ax => ax.label));

const detailBlocks = [];
if (commentary.strengths?.length)     detailBlocks.push(cblock('STRENGTHS', ul(commentary.strengths), 'c-green'));
if (commentary.blind_spots?.length)   detailBlocks.push(cblock('FRICTION', ul(commentary.blind_spots), 'c-orange'));
if (commentary.growth_areas?.length)  detailBlocks.push(cblock('POTENTIAL', ul(commentary.growth_areas), 'c-purple'));
if (commentary.summary)               detailBlocks.push(cblock('OVERVIEW', p(commentary.summary), 'c-blue'));
if (commentary.notable)               detailBlocks.push(cblock('KEY AXIS', p(commentary.notable), 'c-cyan'));
const cdBlock = conceptBridgeBlock(fp.concept_distance);
if (cdBlock) detailBlocks.push(cdBlock);
if (commentary.universality_note)     detailBlocks.push(cblock('BEST CONTEXT', p(commentary.universality_note), 'c-dim'));
if (commentary.collaboration_profile) detailBlocks.push(cblock('COLLABORATION', p(commentary.collaboration_profile), 'c-dim'));
if (commentary.low_confidence?.length) detailBlocks.push(cblock('LOW CONFIDENCE', ul(commentary.low_confidence), 'c-dim'));

const traits = subjectTraits(fp);
const shareTraits = JSON.stringify(traits);
const title = isCoding ? '6軸 コーディング指示力分析結果' : '9軸 思考パターン分析結果';
const analyzedAt = data.analyzed_at || '—';
const msgCount = data.message_count ?? '—';

// ── HTML v6 ───────────────────────────────────────
const html = '<!DOCTYPE html>\n<html lang="ja">\n<head>\n'
+ '<meta charset="UTF-8">\n'
+ '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
+ '<title>Thought Analyzer</title>\n'
+ '<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">\n'
+ '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>\n'
+ '<style>\n'
+ '* { box-sizing: border-box; margin: 0; padding: 0; }\n'
+ 'body { background: linear-gradient(160deg, #ffffff 0%, #dde6f5 100%); color: #1e1a35; font-family: "Inter", "Meiryo", "Yu Gothic", "Hiragino Sans", system-ui, sans-serif; font-size: 16px; min-height: 100vh; padding: 52px 20px 80px; }\n'
+ '.container { max-width: 960px; margin: 0 auto; }\n'
+ '.en { font-family: "Inter", sans-serif; }\n'
+ '.ja { font-family: "Meiryo", "Yu Gothic", "Hiragino Sans", sans-serif; }\n'

+ '/* ── ヘッダー ── */\n'
+ '.site-logo { font-family: "Orbitron", sans-serif; font-size: 32px; font-weight: 900; color: #6a5acd; letter-spacing: 0.05em; margin-bottom: 10px; }\n'
+ '.page-title { font-size: 20px; font-weight: 500; color: #6a68a0; letter-spacing: 0.02em; margin-bottom: 20px; font-family: "Meiryo", "Yu Gothic", sans-serif; }\n'
+ '.meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 56px; }\n'
+ '.meta-ver { font-family: "Inter", sans-serif; font-size: 13px; font-weight: 500; color: #6a5acd; background: rgba(106,90,205,0.1); border: 1px solid rgba(106,90,205,0.25); border-radius: 20px; padding: 3px 14px; }\n'
+ '.meta-sep { color: rgba(0,0,0,0.2); }\n'
+ '.meta-date { font-family: "Inter", sans-serif; font-size: 14px; color: #7a7898; font-weight: 400; }\n'

+ '/* ── Section 1: プロファイル ── */\n'
+ '.profile-section { display: grid; grid-template-columns: 220px 1fr; gap: 48px; margin-bottom: 64px; align-items: start; }\n'
+ '@media (max-width: 700px) { .profile-section { grid-template-columns: 1fr; } }\n'
+ '.char-col { display: flex; flex-direction: column; align-items: center; text-align: center; }\n'
+ '.char-img { width: 100%; max-width: 200px; height: auto; border-radius: 14px; display: block; margin: 0 auto 20px; box-shadow: 0 12px 48px rgba(180,120,30,0.3), 0 2px 12px rgba(0,0,0,0.7); }\n'
+ '.char-type-code { font-family: "Orbitron", sans-serif; font-size: 24px; font-weight: 900; color: ' + subject.color + '; letter-spacing: 0.08em; margin-bottom: 5px; }\n'
+ '.char-type-ja { font-family: "Meiryo", "Yu Gothic", sans-serif; font-size: 14px; font-weight: 400; color: #8a80a8; margin-bottom: 14px; }\n'
+ '.persona-label { font-family: "Meiryo", "Yu Gothic", sans-serif; font-size: 16px; font-weight: 600; color: #1e1a35; background: rgba(0,0,0,0.04); border-radius: 8px; padding: 8px 14px; margin-bottom: 16px; line-height: 1.5; }\n'
+ '.char-tags { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }\n'
+ '.char-tag { font-family: "Meiryo", "Yu Gothic", sans-serif; font-size: 14px; font-weight: 500; border: 1px solid; border-radius: 20px; padding: 5px 14px; }\n'

+ '.charts-col { display: flex; flex-direction: column; gap: 20px; }\n'
+ '.chart-card { background: rgba(255,255,255,0.7); border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 22px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }\n'
+ '.chart-label { font-family: "Inter", sans-serif; font-size: 12px; font-weight: 500; color: #8a88a8; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 16px; }\n'
+ '.radar-wrap { position: relative; height: 300px; }\n'

+ '/* ── 軸リスト ── */\n'
+ '.axis-list { display: flex; flex-direction: column; gap: 16px; }\n'
+ '.axis-row { display: flex; flex-direction: column; gap: 4px; }\n'
+ '.axis-header { display: flex; align-items: center; gap: 8px; }\n'
+ '.axis-num { font-family: "Inter", sans-serif; font-size: 11px; font-weight: 600; border: 1px solid; border-radius: 4px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }\n'
+ '.axis-ja { font-family: "Meiryo", "Yu Gothic", sans-serif; font-size: 14px; font-weight: 500; color: #2e2a48; flex: 1; }\n'
+ '.axis-pct { font-family: "Inter", sans-serif; font-size: 14px; font-weight: 600; }\n'
+ '.axis-val-text { font-family: "Meiryo", "Yu Gothic", sans-serif; font-size: 13px; font-weight: 500; margin-left: 30px; }\n'
+ '.axis-bar { background: rgba(0,0,0,0.08); height: 4px; border-radius: 2px; overflow: hidden; margin-left: 30px; }\n'
+ '.axis-bar-fill { height: 100%; border-radius: 2px; }\n'
+ '.axis-desc { font-family: "Meiryo", "Yu Gothic", sans-serif; font-size: 12px; color: #8a88a8; line-height: 1.6; margin-left: 30px; }\n'
+ '.axis-key-label { font-family: "Inter", sans-serif; font-size: 11px; color: #b0aec8; margin-left: 30px; }\n'

+ '/* ── Section 2: AI フィードバック ── */\n'
+ '.ai-section { display: grid; grid-template-columns: 160px 1fr; gap: 32px; margin-bottom: 64px; align-items: start; }\n'
+ '@media (max-width: 700px) { .ai-section { grid-template-columns: 1fr; } }\n'
+ '.ai-portrait-col { display: flex; flex-direction: column; align-items: center; text-align: center; }\n'
+ '.ai-img { width: 100%; max-width: 140px; height: auto; border-radius: 14px; display: block; margin: 0 auto 12px; box-shadow: 0 12px 48px rgba(60,150,255,0.25), 0 2px 12px rgba(0,0,0,0.7); }\n'
+ '.ai-name { font-family: "Orbitron", sans-serif; font-size: 14px; font-weight: 700; color: #4ecaff; letter-spacing: 0.1em; }\n'
+ '.ai-role { font-family: "Inter", sans-serif; font-size: 12px; color: #4a6888; margin-top: 3px; }\n'
+ '.speech-bubble { background: rgba(255,255,255,0.75); border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 28px 32px; position: relative; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }\n'
+ '.speech-bubble::before { content: ""; position: absolute; left: -11px; top: 40px; border-width: 9px 11px 9px 0; border-style: solid; border-color: transparent rgba(0,0,0,0.08) transparent transparent; }\n'
+ '.speech-bubble::after  { content: ""; position: absolute; left: -8px; top: 42px; border-width: 7px 9px 7px 0; border-style: solid; border-color: transparent rgba(255,255,255,0.75) transparent transparent; }\n'
+ '.speech-col { display: flex; flex-direction: column; gap: 10px; }\n'
+ '.speech-label { font-family: "Inter", sans-serif; font-size: 12px; font-weight: 500; color: #6a5acd; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 14px; }\n'
+ '.speech-text { font-family: "Meiryo", "Yu Gothic", "Hiragino Sans", sans-serif; font-size: 16px; line-height: 1.9; color: #2e2a48; font-weight: 400; }\n'
+ '.speech-note { font-family: "Meiryo", "Yu Gothic", "Hiragino Sans", sans-serif; font-size: 12px; color: #9a98b8; line-height: 1.7; padding: 0 4px; }\n'

+ '/* ── Section 3: 詳細 ── */\n'
+ '.detail-section { margin-bottom: 56px; }\n'
+ '.detail-title { font-family: "Inter", sans-serif; font-size: 12px; font-weight: 500; color: #5a5080; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 18px; }\n'
+ '.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }\n'
+ '@media (max-width: 700px) { .detail-grid { grid-template-columns: 1fr; } }\n'
+ '.c-block { background: rgba(255,255,255,0.7); border: 1px solid rgba(0,0,0,0.07); border-left: 3px solid; border-radius: 10px; padding: 20px 22px; box-shadow: 0 1px 6px rgba(0,0,0,0.05); }\n'
+ '.c-block p { font-family: "Meiryo", "Yu Gothic", "Hiragino Sans", sans-serif; font-size: 15px; line-height: 1.85; color: #4a4868; font-weight: 400; }\n'
+ '.c-block ul { padding-left: 18px; }\n'
+ '.c-block li { font-family: "Meiryo", "Yu Gothic", "Hiragino Sans", sans-serif; font-size: 15px; line-height: 1.8; color: #4a4868; margin-bottom: 6px; font-weight: 400; }\n'
+ '.c-label { font-family: "Inter", sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; }\n'
+ '.c-blue   { border-left-color: #3d9bff; } .c-blue   .c-label { color: #3d9bff; }\n'
+ '.c-cyan   { border-left-color: #4ecaff; } .c-cyan   .c-label { color: #4ecaff; }\n'
+ '.c-green  { border-left-color: #3dd68c; } .c-green  .c-label { color: #3dd68c; }\n'
+ '.c-orange { border-left-color: #f97316; } .c-orange .c-label { color: #f97316; }\n'
+ '.c-purple { border-left-color: #a78bfa; } .c-purple .c-label { color: #a78bfa; }\n'
+ '.c-dim    { border-left-color: rgba(0,0,0,0.1); } .c-dim .c-label { color: #8a88a8; }\n'
+ '.bridge-meta { font-family: "Inter", sans-serif; font-size: 14px; font-weight: 600; color: #4ecaff; margin-bottom: 10px; }\n'
+ '.bridge-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }\n'
+ '.bridge-tag { font-family: "Meiryo", "Yu Gothic", sans-serif; font-size: 13px; background: rgba(78,202,255,0.1); border: 1px solid rgba(78,202,255,0.3); border-radius: 20px; padding: 4px 14px; color: #2a7aaa; }\n'

+ '/* ── 開発中バナー ── */\n'
+ '.dev-notice { background: rgba(255,255,255,0.6); border: 1px solid rgba(167,139,250,0.2); border-radius: 10px; padding: 16px 20px; margin-bottom: 48px; }\n'
+ '.dev-notice-label { font-family: "Inter", sans-serif; font-size: 11px; font-weight: 600; color: #a78bfa; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 7px; }\n'
+ '.dev-notice-text { font-family: "Meiryo", "Yu Gothic", sans-serif; font-size: 14px; line-height: 1.75; color: #7a78a0; font-weight: 400; }\n'

+ 'footer { font-size: 11px; color: #a0a0c0; text-align: center; padding-top: 24px; border-top: 1px solid rgba(0,0,0,0.07); }\n'

+ '/* ── シェアボタン ── */\n'
+ '.share-btn { display: inline-flex; align-items: center; gap: 8px; font-family: "Inter", sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; color: #fff; background: linear-gradient(135deg, #6a5acd 0%, #4ecaff 100%); border: none; border-radius: 24px; padding: 10px 22px; cursor: pointer; box-shadow: 0 4px 16px rgba(106,90,205,0.3); transition: opacity 0.2s; margin-bottom: 40px; }\n'
+ '.share-btn:hover { opacity: 0.85; }\n'
+ '.share-btn svg { width: 15px; height: 15px; flex-shrink: 0; }\n'

+ '</style>\n</head>\n<body>\n<div class="container">\n'

+ '<div class="site-logo">Thought Analyzer</div>\n'
+ '<div class="page-title">' + title + '</div>\n'
+ '<div class="meta-row">\n'
+ '  <span class="meta-ver">v' + (data.schema_version || '—') + '</span>\n'
+ '  <span class="meta-sep">·</span>\n'
+ '  <span class="meta-date">' + analyzedAt + '</span>\n'
+ '  <span class="meta-sep">·</span>\n'
+ '  <span class="meta-date">' + msgCount + ' messages</span>\n'
+ '</div>\n'
+ '<button class="share-btn" onclick="captureCard()">'
+ '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>'
+ 'Share Result</button>\n'


+ '<!-- Section 1: ユーザープロファイル -->\n'
+ '<div class="profile-section">\n'
+ '  <div class="char-col">\n'
+ '    <img src="assets/images/char-subject-v2.png" alt="SUBJECT" class="char-img">\n'
+ '    <div class="char-type-code">' + subject.code + '</div>\n'
+ '    <div class="char-type-ja">' + subject.ja + '</div>\n'
+ '    <div class="persona-label">' + personaLabel + '</div>\n'
+ '    <div class="char-tags">\n'
+ traits.map(t => '      <span class="char-tag" style="color:' + subject.color + ';border-color:' + subject.color + '44">' + t + '</span>').join('\n') + '\n'
+ '    </div>\n'
+ '  </div>\n'
+ '  <div class="charts-col">\n'
+ '    <div class="chart-card">\n'
+ '      <div class="chart-label">Fingerprint Radar — 番号は下の軸スコアと対応</div>\n'
+ '      <div class="radar-wrap"><canvas id="radar"></canvas></div>\n'
+ '    </div>\n'
+ '    <div class="chart-card">\n'
+ '      <div class="chart-label">Axis Scores</div>\n'
+ '      <div class="axis-list">' + axisRows + '</div>\n'
+ '    </div>\n'
+ '  </div>\n'
+ '</div>\n'

+ '<!-- Section 2: AI フィードバック -->\n'
+ (commentary.holistic_profile
  ? '<div class="ai-section">\n'
  + '  <div class="ai-portrait-col">\n'
  + '    <img src="assets/images/char-axiom9-v2.png" alt="YOUR AI" class="ai-img">\n'
  + '    <div class="ai-name">YOUR AI</div>\n'
  + '    <div class="ai-role">Thinking Partner</div>\n'
  + '  </div>\n'
  + '  <div class="speech-col">\n'
  + '  <div class="speech-bubble">\n'
  + '    <div class="speech-label">AI Feedback from Your AI</div>\n'
  + '    <div class="speech-text">' + commentary.holistic_profile + '</div>\n'
  + '  </div>\n'
  + '  <div class="speech-note">あなたのことを最もよく知っているパートナーのAIからのフィードバックです。このコメントは、あなたが実際に会話したAIが、あなたの診断結果を受けて、会話全体の文脈をもとに生成したものです。</div>\n'
  + '  </div>\n'
  + '</div>\n'
  : '')

+ '<!-- Section 3: 詳細分析 -->\n'
+ (detailBlocks.length
  ? '<div class="detail-section">\n'
  + '  <div class="detail-title">Detail Analysis</div>\n'
  + '  <div class="detail-grid">\n'
  + detailBlocks.join('\n') + '\n'
  + '  </div>\n'
  + '</div>\n'
  : '')

+ '<div class="dev-notice">\n'
+ '  <div class="dev-notice-label">Under Development</div>\n'
+ '  <div class="dev-notice-text">この分析は現時点での絶対評価です。他ユーザーとの相対比較はまだできません。データの集積が進むにつれて、パーセンタイル評価・精度向上を予定しています。</div>\n'
+ '</div>\n'

+ '<footer>Thought Analyzer — generated ' + new Date().toLocaleString('ja-JP') + '</footer>\n'
+ '</div>\n\n'
+ '<script>\n'
+ 'const colors = ' + JSON.stringify(pointColors) + ';\n'
+ 'const ctx = document.getElementById("radar").getContext("2d");\n'
+ 'new Chart(ctx, {\n'
+ '  type: "radar",\n'
+ '  data: {\n'
+ '    labels: ' + JSON.stringify(radarLabels) + ',\n'
+ '    datasets: [{\n'
+ '      data: ' + JSON.stringify(radarValues) + ',\n'
+ '      backgroundColor: "rgba(78,202,255,0.06)",\n'
+ '      borderColor: "rgba(78,202,255,0.4)",\n'
+ '      borderWidth: 1.5,\n'
+ '      pointBackgroundColor: colors,\n'
+ '      pointBorderColor: colors,\n'
+ '      pointRadius: 5,\n'
+ '      pointHoverRadius: 8,\n'
+ '    }]\n'
+ '  },\n'
+ '  options: {\n'
+ '    responsive: true,\n'
+ '    maintainAspectRatio: false,\n'
+ '    scales: { r: {\n'
+ '      min: 0, max: 1,\n'
+ '      ticks: { display: false },\n'
+ '      grid: { color: "rgba(0,0,0,0.1)" },\n'
+ '      angleLines: { color: "rgba(0,0,0,0.12)" },\n'
+ '      pointLabels: { color: colors, font: { size: 15, weight: "700" } }\n'
+ '    }},\n'
+ '    plugins: {\n'
+ '      legend: { display: false },\n'
+ '      tooltip: { callbacks: { label: (ctx) => " " + Math.round(ctx.raw * 100) + "%" } }\n'
+ '    },\n'
+ '    animation: { duration: 700, easing: "easeInOutQuart" }\n'
+ '  }\n'
+ '});\n'
+ '\n'
+ 'var SHARE_RADAR        = ' + shareRadarValues     + ';\n'
+ 'var SHARE_COLORS       = ' + sharePointColors     + ';\n'
+ 'var SHARE_AXES         = ' + shareAxesData        + ';\n'
+ 'var SHARE_AXIS_LABELS  = ' + shareAxisShortLabels + ';\n'
+ 'var SHARE_AXIS_ENG     = ' + shareAxisEngLabels   + ';\n'
+ 'var SHARE_TRAITS       = ' + shareTraits          + ';\n'
+ '\n'
+ 'function drawRadarOnCanvas(ctx, cx, cy, radius, values, ptColors, axisLabels, engLabels) {\n'
+ '  var n = values.length, step = (Math.PI*2)/n, start = -Math.PI/2;\n'
+ '  // グリッド（5段階）\n'
+ '  for (var lv = 1; lv <= 5; lv++) {\n'
+ '    var r = radius * lv / 5;\n'
+ '    ctx.beginPath();\n'
+ '    for (var i = 0; i < n; i++) {\n'
+ '      var a = start + i*step, x = cx + r*Math.cos(a), y = cy + r*Math.sin(a);\n'
+ '      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);\n'
+ '    }\n'
+ '    ctx.closePath();\n'
+ '    ctx.strokeStyle = lv===5 ? "rgba(0,0,0,0.13)" : "rgba(0,0,0,0.05)";\n'
+ '    ctx.lineWidth = 1; ctx.stroke();\n'
+ '  }\n'
+ '  // 軸線\n'
+ '  for (var i = 0; i < n; i++) {\n'
+ '    var a = start + i*step;\n'
+ '    ctx.beginPath(); ctx.moveTo(cx, cy);\n'
+ '    ctx.lineTo(cx + radius*Math.cos(a), cy + radius*Math.sin(a));\n'
+ '    ctx.strokeStyle = "rgba(0,0,0,0.09)"; ctx.lineWidth = 1; ctx.stroke();\n'
+ '  }\n'
+ '  // データ塗り\n'
+ '  ctx.beginPath();\n'
+ '  for (var i = 0; i < n; i++) {\n'
+ '    var a = start+i*step, r = radius*Math.max(0,Math.min(1,values[i]));\n'
+ '    var x = cx+r*Math.cos(a), y = cy+r*Math.sin(a);\n'
+ '    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);\n'
+ '  }\n'
+ '  ctx.closePath();\n'
+ '  ctx.fillStyle = "rgba(78,202,255,0.09)"; ctx.fill();\n'
+ '  ctx.strokeStyle = "rgba(78,202,255,0.5)"; ctx.lineWidth = 2; ctx.stroke();\n'
+ '  // データ点\n'
+ '  for (var i = 0; i < n; i++) {\n'
+ '    var a = start+i*step, r = radius*Math.max(0,Math.min(1,values[i]));\n'
+ '    ctx.beginPath(); ctx.arc(cx+r*Math.cos(a), cy+r*Math.sin(a), 6, 0, Math.PI*2);\n'
+ '    ctx.fillStyle = ptColors[i]; ctx.fill();\n'
+ '  }\n'
+ '  // 軸キャプション（日本語大 + 英語小・縦に固定行間）\n'
+ '  var labelR = radius + 56;\n'
+ '  var jaSize = 19, engSize = 12, lineGap = 18;\n'
+ '  for (var i = 0; i < n; i++) {\n'
+ '    var a = start + i*step;\n'
+ '    var lx = cx + labelR*Math.cos(a), ly = cy + labelR*Math.sin(a);\n'
+ '    var cosA = Math.cos(a), sinA = Math.sin(a);\n'
+ '    var tAlign = cosA > 0.28 ? "left" : (cosA < -0.28 ? "right" : "center");\n'
+ '    var eng = engLabels && engLabels[i] ? engLabels[i] : "";\n'
+ '    var jy, ey;\n'
+ '    if (sinA > 0.28) {\n'
+ '      // 下側: 日本語 → 英語（下向き）\n'
+ '      jy = ly; ey = ly + jaSize + lineGap;\n'
+ '      ctx.textBaseline = "top";\n'
+ '    } else if (sinA < -0.28) {\n'
+ '      // 上側: 英語 → 日本語（上向き）\n'
+ '      jy = ly; ey = ly - jaSize - lineGap;\n'
+ '      ctx.textBaseline = "bottom";\n'
+ '    } else {\n'
+ '      // 横: 日本語 middle、英語 middle+lineGap\n'
+ '      jy = ly - lineGap/2; ey = ly + jaSize/2 + lineGap/2;\n'
+ '      ctx.textBaseline = "top";\n'
+ '    }\n'
+ '    // 日本語ラベル\n'
+ '    ctx.font = "700 " + jaSize + "px Meiryo, sans-serif";\n'
+ '    ctx.fillStyle = ptColors[i];\n'
+ '    ctx.textAlign = tAlign;\n'
+ '    ctx.fillText(axisLabels[i] || String(i+1), lx, jy);\n'
+ '    // 英語ラベル\n'
+ '    if (eng) {\n'
+ '      ctx.font = "400 " + engSize + "px Inter, sans-serif";\n'
+ '      ctx.globalAlpha = 0.5;\n'
+ '      ctx.textBaseline = sinA < -0.28 ? "bottom" : "top";\n'
+ '      ctx.fillText(eng, lx, ey);\n'
+ '      ctx.globalAlpha = 1.0;\n'
+ '    }\n'
+ '  }\n'
+ '  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";\n'
+ '}\n'
+ '\n'
+ 'function captureCard() {\n'
+ '  var btn = document.querySelector(".share-btn");\n'
+ '  var orig = btn.innerHTML;\n'
+ '  btn.textContent = "Generating..."; btn.disabled = true;\n'
+ '\n'
+ '  var W = 1200, H = 630;\n'
+ '  var canvas = document.createElement("canvas");\n'
+ '  canvas.width = W; canvas.height = H;\n'
+ '  var ctx = canvas.getContext("2d");\n'
+ '\n'
+ '  var subjectColor = ' + JSON.stringify(subject.color) + ';\n'
+ '  var subjectCode  = ' + JSON.stringify(subject.code)  + ';\n'
+ '  var subjectJa    = ' + JSON.stringify(subject.ja)    + ';\n'
+ '  var persona      = ' + JSON.stringify(personaLabel)  + ';\n'
+ '  var imgSrc       = ' + JSON.stringify(charImgData)   + ';\n'
+ '  var now = new Date();\n'
+ '  var dateStr = now.getFullYear()+"年"+(now.getMonth()+1)+"月"+now.getDate()+"日";\n'
+ '\n'
+ '  function draw(charImg) {\n'
+ '    // ── 背景（ページと同じ）\n'
+ '    var bg = ctx.createLinearGradient(0, 0, W, H);\n'
+ '    bg.addColorStop(0, "#ffffff"); bg.addColorStop(1, "#dde6f5");\n'
+ '    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);\n'
+ '\n'
+ '    // ── 左ゾーン(幅272): キャラ画像（上部）\n'
+ '    var LEFT = 272;\n'
+ '    if (charImg) {\n'
+ '      var ih = 330, iw = charImg.naturalWidth*(ih/charImg.naturalHeight);\n'
+ '      ctx.drawImage(charImg, LEFT/2 - iw/2, 16, iw, ih);\n'
+ '    }\n'
+ '\n'
+ '    // ── 豪華な枠（左下）: タイプ + ペルソナ + タグ\n'
+ '    var bx = 12, by = 354, bw = LEFT-24, bh = H-by-12;\n'
+ '    // 外枠グロー\n'
+ '    ctx.shadowColor = subjectColor; ctx.shadowBlur = 16;\n'
+ '    ctx.fillStyle = subjectColor + "1e";\n'
+ '    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 14); ctx.fill();\n'
+ '    ctx.shadowBlur = 0; ctx.shadowColor = "transparent";\n'
+ '    // 内白面\n'
+ '    ctx.fillStyle = "rgba(255,255,255,0.9)";\n'
+ '    ctx.beginPath(); ctx.roundRect(bx+2, by+2, bw-4, bh-4, 12); ctx.fill();\n'
+ '    // 上部カラーバー\n'
+ '    ctx.fillStyle = subjectColor;\n'
+ '    ctx.beginPath(); ctx.roundRect(bx+2, by+2, bw-4, 5, [12,12,0,0]); ctx.fill();\n'
+ '    // タイプコード\n'
+ '    ctx.textAlign = "center";\n'
+ '    ctx.font = "900 26px Orbitron, sans-serif";\n'
+ '    ctx.fillStyle = subjectColor;\n'
+ '    ctx.fillText(subjectCode, bx+bw/2, by+44);\n'
+ '    // タイプ日本語\n'
+ '    ctx.font = "400 13px Meiryo, sans-serif";\n'
+ '    ctx.fillStyle = "#8a80a8";\n'
+ '    ctx.fillText(subjectJa, bx+bw/2, by+62);\n'
+ '    // 区切り\n'
+ '    ctx.strokeStyle = "rgba(0,0,0,0.08)"; ctx.lineWidth = 1;\n'
+ '    ctx.beginPath(); ctx.moveTo(bx+18, by+75); ctx.lineTo(bx+bw-18, by+75); ctx.stroke();\n'
+ '    // ペルソナラベル（17px・折り返し対応）\n'
+ '    ctx.font = "700 17px Meiryo, sans-serif";\n'
+ '    ctx.fillStyle = "#1e1a35";\n'
+ '    var maxPW = bw - 20;\n'
+ '    if (ctx.measureText(persona).width <= maxPW) {\n'
+ '      ctx.fillText(persona, bx+bw/2, by+100);\n'
+ '    } else {\n'
+ '      var mid = Math.ceil(persona.length/2);\n'
+ '      while (mid < persona.length && ctx.measureText(persona.slice(0,mid)).width > maxPW) mid--;\n'
+ '      ctx.fillText(persona.slice(0,mid), bx+bw/2, by+92);\n'
+ '      ctx.fillText(persona.slice(mid), bx+bw/2, by+114);\n'
+ '    }\n'
+ '    // タグ（方向転換・IC: 6/7 など）\n'
+ '    var tagY = by + 132;\n'
+ '    var tagPadX = 10, tagPadY = 5, tagH = 24, tagGapX = 6, tagGapY = 6;\n'
+ '    ctx.font = "500 12px Meiryo, Inter, sans-serif";\n'
+ '    var tagX = bx + 12;\n'
+ '    SHARE_TRAITS.forEach(function(tag, i) {\n'
+ '      var tw = ctx.measureText(tag).width + tagPadX*2;\n'
+ '      // 右端超えたら折り返し\n'
+ '      if (tagX + tw > bx + bw - 12) { tagX = bx + 12; tagY += tagH + tagGapY; }\n'
+ '      ctx.fillStyle = subjectColor + "1a";\n'
+ '      ctx.beginPath(); ctx.roundRect(tagX, tagY - tagH + tagPadY, tw, tagH, 20); ctx.fill();\n'
+ '      ctx.strokeStyle = subjectColor + "55"; ctx.lineWidth = 1;\n'
+ '      ctx.beginPath(); ctx.roundRect(tagX, tagY - tagH + tagPadY, tw, tagH, 20); ctx.stroke();\n'
+ '      ctx.fillStyle = subjectColor;\n'
+ '      ctx.textAlign = "left";\n'
+ '      ctx.textBaseline = "middle";\n'
+ '      ctx.fillText(tag, tagX + tagPadX, tagY - tagH/2 + tagPadY);\n'
+ '      ctx.textBaseline = "alphabetic";\n'
+ '      tagX += tw + tagGapX;\n'
+ '    });\n'
+ '    // 日付\n'
+ '    ctx.textAlign = "center";\n'
+ '    ctx.font = "400 11px Inter, sans-serif";\n'
+ '    ctx.fillStyle = "#b0aec8";\n'
+ '    ctx.fillText(dateStr, bx+bw/2, by+bh-12);\n'
+ '\n'
+ '    // ── 右ゾーン: 白カード（レーダーメイン）\n'
+ '    var cx0 = LEFT+10, cy0 = 16, cw = W-cx0-16, ch = H-32;\n'
+ '    ctx.shadowColor = "rgba(0,0,0,0.07)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3;\n'
+ '    ctx.fillStyle = "rgba(255,255,255,0.78)";\n'
+ '    ctx.beginPath(); ctx.roundRect(cx0, cy0, cw, ch, 16); ctx.fill();\n'
+ '    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;\n'
+ '\n'
+ '    // Thought Analyzer ロゴ\n'
+ '    ctx.textAlign = "left";\n'
+ '    ctx.font = "900 26px Orbitron, sans-serif";\n'
+ '    ctx.fillStyle = "#6a5acd";\n'
+ '    ctx.fillText("Thought Analyzer", cx0+26, cy0+46);\n'
+ '\n'
+ '    // 右上: 分析情報\n'
+ '    ctx.font = "400 13px Inter, sans-serif";\n'
+ '    ctx.fillStyle = "#9a98b8"; ctx.textAlign = "right";\n'
+ '    ctx.fillText("9-axis thinking pattern", cx0+cw-22, cy0+32);\n'
+ '    ctx.fillText(dateStr+" 分析", cx0+cw-22, cy0+50);\n'
+ '\n'
+ '    // レーダーチャート（カード中央、ラベル込みで収まるサイズ）\n'
+ '    var rcx = cx0 + cw/2, rcy = cy0 + ch/2 + 10, rRadius = 140;\n'
+ '    drawRadarOnCanvas(ctx, rcx, rcy, rRadius, SHARE_RADAR, SHARE_COLORS, SHARE_AXIS_LABELS, SHARE_AXIS_ENG);\n'
+ '\n'
+ '    // thought-analyzer.com\n'
+ '    ctx.font = "400 11px Inter, sans-serif";\n'
+ '    ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.textAlign = "right";\n'
+ '    ctx.fillText("thought-analyzer.com", cx0+cw-18, cy0+ch-10);\n'
+ '\n'
+ '    canvas.toBlob(function(blob) {\n'
+ '      var url = URL.createObjectURL(blob);\n'
+ '      var a = document.createElement("a"); a.download = "thought-analyzer-result.png";\n'
+ '      a.href = url; a.click();\n'
+ '      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);\n'
+ '      btn.innerHTML = orig; btn.disabled = false;\n'
+ '    }, "image/png");\n'
+ '  }\n'
+ '\n'
+ '  document.fonts.ready.then(function() {\n'
+ '    if (imgSrc) {\n'
+ '      var img = new Image();\n'
+ '      img.onload = function() { draw(img); };\n'
+ '      img.onerror = function() { draw(null); };\n'
+ '      img.src = imgSrc;\n'
+ '    } else { draw(null); }\n'
+ '  });\n'
+ '}\n'
+ '<\/script>\n</body>\n</html>';

fs.writeFileSync(outputPath, html, 'utf-8');
console.log('saved:', outputPath);
