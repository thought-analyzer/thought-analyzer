#!/usr/bin/env node
/**
 * thought-analyzer — 統合分析結果 HTML ジェネレーター v4.0
 * 使い方: node generate-unified-html.js '<unified JSON>' [output-path]
 *
 * 入力JSON構造:
 * {
 *   "schema_version": "3.0",
 *   "analysis_type": "unified",
 *   "lang": "ja|en",
 *   "analyzed_at": "YYYY-MM",
 *   "thought":  { ...thought_pattern JSON... },
 *   "coding":   { ...coding_direction JSON... },
 *   "pair":     { ...pair_analysis JSON... },
 *   "ai_comment": "...",
 *   "ai_comment_depth": "蓄積と今回の観察から | ..."
 * }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadImgBase64(relPath) {
  const abs = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(abs)) return '';
  return 'data:image/png;base64,' + fs.readFileSync(abs).toString('base64');
}

const jsonStr    = process.argv[2];
const outputPath = process.argv[3] || path.join(
  'C:/Users/yoshi/Documents/skills/thought-analyzer',
  'result-unified-' + Date.now() + '.html'
);

if (!jsonStr) { console.error('Usage: node generate-unified-html.js \'<json>\' [output-path]'); process.exit(1); }

let data;
try { data = JSON.parse(jsonStr); }
catch (e) { console.error('Invalid JSON:', e.message); process.exit(1); }

const thought = data.thought  || {};
const coding  = data.coding   || {};
const pair    = data.pair     || {};
const aiComment      = data.ai_comment       || '';
const aiCommentDepth = data.ai_comment_depth || '';

const tfp = thought.fingerprint || {};
const cfp = coding.coding_direction || coding.fingerprint || {};
const prp = pair.reaction_patterns  || {};
const tCom = thought.commentary || {};
const cCom = coding.commentary  || {};
const pCom = pair.commentary    || {};

const lang = data.lang || thought.lang || 'ja';
const t    = (ja, en) => lang === 'en' ? en : ja;

// ── 正規化 ───────────────────────────────────────
function normalize(axis, value) {
  const maps = {
    abstraction_direction: { stays_concrete:0.25, concrete_to_abstract:0.5, abstract_to_concrete:0.75, stays_abstract:1.0 },
    problem_style:         { fix:0.25, suspend:0.5, delegate:0.75, pivot:1.0 },
    perspective_taking:    { absent:0.0, reactive:0.5, spontaneous:1.0 },
    evaluation_framing:    { loss_first:0.0, neutral:0.33, mixed:0.67, gain_first:1.0 },
    need_for_cognition:    { low:0.0, moderate:0.5, high:1.0 },
    epistemic_curiosity:   { deprivation_type:0.0, mixed:0.5, interest_type:1.0 },
  };
  if (axis === 'face_strategy') {
    const v = typeof value === 'object' ? value.score : parseFloat(value);
    return isNaN(v) ? 0.5 : v;
  }
  if (axis === 'concept_distance') {
    const d = typeof value === 'object' ? value.distance : value;
    return { near:0.33, mid:0.67, far:1.0 }[d] ?? 0.5;
  }
  if (axis === 'integrative_complexity') {
    return (parseFloat(value) - 1) / 6;
  }
  return maps[axis]?.[value] ?? 0.5;
}

// ── キャラクター ────────────────────────────────
function generateCharacter(fp) {
  const ps = fp.problem_style;
  const ic = parseInt(fp.integrative_complexity) || 3;
  const pt = fp.perspective_taking;
  const ec = fp.epistemic_curiosity;
  const cd = typeof fp.concept_distance === 'object' ? fp.concept_distance?.distance : fp.concept_distance;
  if (ps === 'pivot' && ic >= 5)                     return { code:'ARCHITECT', ja:'設計者型',  en:'Architect',  color:'#f97316' };
  if (ps === 'fix'   && ic >= 5)                     return { code:'ANALYST',   ja:'解析者型',  en:'Analyst',    color:'#3dd68c' };
  if (cd === 'far')                                  return { code:'BRIDGER',   ja:'橋渡し型',  en:'Bridger',    color:'#e879f9' };
  if (pt === 'spontaneous' && ec === 'interest_type')return { code:'EXPLORER',  ja:'探索者型',  en:'Explorer',   color:'#fbbf24' };
  if (ps === 'pivot')                                return { code:'PIONEER',   ja:'開拓者型',  en:'Pioneer',    color:'#a78bfa' };
  if (ps === 'fix')                                  return { code:'ENGINEER',  ja:'工学者型',  en:'Engineer',   color:'#60a5fa' };
  if (ps === 'delegate')                             return { code:'CONDUCTOR', ja:'指揮者型',  en:'Conductor',  color:'#34d399' };
  return                                               { code:'NAVIGATOR', ja:'航行者型',  en:'Navigator',  color:'#00e5ff' };
}

function generateCodingMode(cd) {
  const sp = parseInt(cd.specification_precision) || 1;
  const er = cd.error_recognition;
  const sa = cd.system_abstraction;
  const dq = cd.decision_quality;
  const tv = cd.technical_vocabulary;
  const is = cd.iteration_style;
  if (sp >= 4 && (sa === 'architecture' || sa === 'component'))
    return { code:'SPECIFIER',  ja:'設計指示',   en:'Specifier',   color:'#f97316' };
  if (er === 'structural' && sp >= 3)
    return { code:'DEBUGGER',   ja:'構造診断',   en:'Debugger',    color:'#3dd68c' };
  if (dq === 'adaptive' && (is === 'batch_clear' || is === 'incremental_clear'))
    return { code:'STRATEGIST', ja:'戦略委任',   en:'Strategist',  color:'#e879f9' };
  if (is === 'incremental_clear')
    return { code:'ITERATOR',   ja:'反復精錬',   en:'Iterator',    color:'#fbbf24' };
  if (dq === 'routine' && sp >= 3)
    return { code:'PATTERN',    ja:'パターン適用',en:'Pattern',     color:'#a78bfa' };
  if ((tv === 'lay' || tv === 'mixed') && dq !== 'deferred')
    return { code:'INQUIRER',   ja:'対話探索',   en:'Inquirer',    color:'#60a5fa' };
  return   { code:'DELEGATOR',  ja:'一任',        en:'Delegator',   color:'#00e5ff' };
}

const tChar  = generateCharacter(tfp);
const cMode  = generateCodingMode(cfp);
const prefStyle = prp.preferred_ai_style || null;

// ── ペルソナ画像 ────────────────────────────────
const PERSONA_MAP = {
  ARCHITECT:'assets/images/persona-ARCHITECT.png', ANALYST:'assets/images/persona-ANALYST.png',
  BRIDGER:'assets/images/persona-BRIDGER.png',     EXPLORER:'assets/images/persona-EXPLORER.png',
  PIONEER:'assets/images/persona-PIONEER.png',     ENGINEER:'assets/images/persona-ENGINEER.png',
  CONDUCTOR:'assets/images/persona-CONDUCTOR.png', NAVIGATOR:'assets/images/persona-NAVIGATOR.png',
};
const personaImg = loadImgBase64(PERSONA_MAP[tChar.code] || 'assets/images/char-subject-v2.png');

// ── ペルソナラベル ────────────────────────────────
function personaLabel() {
  const cd = typeof tfp.concept_distance === 'object' ? tfp.concept_distance?.distance : tfp.concept_distance;
  const pt = tfp.perspective_taking; const ec = tfp.epistemic_curiosity;
  switch (tChar.code) {
    case 'ARCHITECT': return t('複雑系を再設計する思想設計者', 'Visionary architect bridging distant domains');
    case 'ANALYST':   return t('深層まで追う構造解析者', 'Deep structural analyst');
    case 'BRIDGER':
      if (pt === 'spontaneous') return t('異分野を繋ぐ思想設計者', 'Cross-domain thought connector');
      return t('遠い概念を接続する発想者', 'Connector of distant conceptual domains');
    case 'EXPLORER':  return t('好奇心で世界を広げる探索者', 'Curiosity-driven explorer');
    case 'PIONEER':   return t('発想転換を得意とする開拓者', 'Pioneer skilled at reframing');
    case 'ENGINEER':  return t('原因を特定する実装型思考者', 'Root-cause engineering thinker');
    case 'CONDUCTOR': return t('実行を委ねる全体指揮者', 'Strategic director who delegates');
    default:          return t('状況に応じて舵を切る航行型', 'Adaptive navigator');
  }
}

// ── 軸の表示ラベル ────────────────────────────────
const AX_LABELS_JA = {
  abstraction_direction: { stays_concrete:'具体にとどまる', concrete_to_abstract:'具体→抽象', abstract_to_concrete:'抽象→具体', stays_abstract:'抽象にとどまる' },
  problem_style:         { fix:'根本解決', suspend:'保留', delegate:'委任', pivot:'方向転換' },
  perspective_taking:    { absent:'限定的', reactive:'反応的', spontaneous:'自発的' },
  evaluation_framing:    { loss_first:'損失優先', neutral:'中立', mixed:'混在', gain_first:'利益優先' },
  need_for_cognition:    { low:'低', moderate:'中', high:'高' },
  epistemic_curiosity:   { deprivation_type:'欠乏型(D)', mixed:'混在', interest_type:'関心型(I)' },
};
const AX_LABELS_EN = {
  abstraction_direction: { stays_concrete:'stays concrete', concrete_to_abstract:'concrete→abstract', abstract_to_concrete:'abstract→concrete', stays_abstract:'stays abstract' },
  problem_style:         { fix:'root fix', suspend:'suspend', delegate:'delegate', pivot:'pivot' },
  perspective_taking:    { absent:'limited', reactive:'reactive', spontaneous:'spontaneous' },
  evaluation_framing:    { loss_first:'loss first', neutral:'neutral', mixed:'mixed', gain_first:'gain first' },
  need_for_cognition:    { low:'low', moderate:'moderate', high:'high' },
  epistemic_curiosity:   { deprivation_type:'D-type', mixed:'mixed', interest_type:'I-type' },
};
const AX_LABELS = lang === 'en' ? AX_LABELS_EN : AX_LABELS_JA;

function axVal_lang(axis, raw, l) {
  const AL = l === 'en' ? AX_LABELS_EN : AX_LABELS_JA;
  if (axis === 'face_strategy') {
    const v = typeof raw === 'object' ? raw.value : raw;
    const s = typeof raw === 'object' ? raw.score : null;
    const label = l === 'en'
      ? { high_mitigation:'high', moderate:'moderate', low_mitigation:'low' }[v] || v
      : { high_mitigation:'高配慮', moderate:'中程度', low_mitigation:'低配慮' }[v] || v;
    return s != null ? `${label} ${s.toFixed(2)}` : label;
  }
  if (axis === 'concept_distance') {
    const dist = typeof raw === 'object' ? raw.distance : raw;
    const cnt  = typeof raw === 'object' ? raw.count   : null;
    return cnt != null ? `${dist} ×${cnt}` : dist;
  }
  if (axis === 'integrative_complexity') return `${raw} / 7`;
  return AL[axis]?.[raw] || raw || '—';
}
function axVal(axis, raw) { return axVal_lang(axis, raw, lang); }

// ── コーディングバーのパーセント ──────────────────
function codingPct(axis, raw) {
  const maps = {
    error_recognition:  { result_only:25, behavioral:60, structural:100 },
    system_abstraction: { blackbox:25, interface:50, component:75, architecture:100 },
    decision_quality:   { deferred:25, routine:60, adaptive:100 },
    technical_vocabulary:{ lay:25, approximate:60, precise:100, mixed:50 },
    iteration_style:    { batch_vague:10, incremental_vague:35, batch_clear:65, incremental_clear:100 },
  };
  if (axis === 'specification_precision') return ((parseInt(raw) - 1) / 4) * 100;
  return maps[axis]?.[raw] ?? 50;
}

const CODING_VAL_JA = {
  error_recognition:   { result_only:'結果のみ', behavioral:'挙動レベル', structural:'構造レベル' },
  system_abstraction:  { blackbox:'ブラックボックス', interface:'インターフェース', component:'コンポーネント', architecture:'アーキテクチャ' },
  decision_quality:    { deferred:'委任', routine:'ルーティン', adaptive:'適応的' },
  technical_vocabulary:{ lay:'日常語', approximate:'近似的', precise:'精確', mixed:'混在' },
  iteration_style:     { batch_vague:'一括・曖昧', incremental_vague:'小刻み・曖昧', batch_clear:'一括・明確', incremental_clear:'小刻み・明確' },
};
const CODING_VAL_EN = {
  error_recognition:   { result_only:'result only', behavioral:'behavioral', structural:'structural' },
  system_abstraction:  { blackbox:'blackbox', interface:'interface', component:'component', architecture:'architecture' },
  decision_quality:    { deferred:'deferred', routine:'routine', adaptive:'adaptive' },
  technical_vocabulary:{ lay:'lay terms', approximate:'approximate', precise:'precise', mixed:'mixed' },
  iteration_style:     { batch_vague:'batch·vague', incremental_vague:'incr·vague', batch_clear:'batch·clear', incremental_clear:'incr·clear' },
};
function codingValLabel_lang(axis, raw, l) {
  if (axis === 'specification_precision') return `${raw} / 5`;
  return (l === 'en' ? CODING_VAL_EN : CODING_VAL_JA)[axis]?.[raw] || raw;
}
function codingValLabel(axis, raw) { return codingValLabel_lang(axis, raw, lang); }

// ── レーダーデータ ────────────────────────────────
const radarData = [
  normalize('abstraction_direction', tfp.abstraction_direction),
  normalize('problem_style',         tfp.problem_style),
  normalize('perspective_taking',    tfp.perspective_taking),
  normalize('face_strategy',         tfp.face_strategy),
  normalize('concept_distance',      tfp.concept_distance),
  normalize('evaluation_framing',    tfp.evaluation_framing),
  normalize('need_for_cognition',    tfp.need_for_cognition),
  normalize('integrative_complexity',tfp.integrative_complexity),
  normalize('epistemic_curiosity',   tfp.epistemic_curiosity),
];

const radarLabels = lang === 'en'
  ? ['Abstract.','Problem','Perspective','Face','Concept','Framing','NFC','IC','Curiosity']
  : ['抽象化','問題\nスタイル','他者\n視点','言語\n配慮','概念\n距離','評価\n枠組','思考\n欲求','統合\n複雑性','好奇心'];

const AXIS_COLORS = ['#00e5ff','#a78bfa','#3dd68c','#f97316','#fb7185','#fbbf24','#60a5fa','#34d399','#e879f9'];

// ── 9軸タグ HTML ─────────────────────────────────
const AXES_JA = ['abstraction_direction','problem_style','perspective_taking','face_strategy','concept_distance','evaluation_framing','need_for_cognition','integrative_complexity','epistemic_curiosity'];
const AXIS_NAMES_JA = ['抽象化方向','問題スタイル','他者視点','言語配慮','概念距離','評価枠組','思考欲求','統合複雑性','認識論的好奇心'];
const AXIS_NAMES_EN = ['Abstraction','Problem style','Perspective','Face strategy','Concept dist.','Eval framing','NFC','Int. complexity','Epist. curiosity'];
const AXIS_NAMES = lang === 'en' ? AXIS_NAMES_EN : AXIS_NAMES_JA;

const AXIS_TIPS_JA = {
  abstraction_direction: '思考の方向性：具体→抽象か、抽象→具体か（Construal Level Theory）',
  problem_style:         '問題への対処スタイル：根本解決 / 保留 / 委任 / 方向転換（KAI）',
  perspective_taking:    '他者視点の取り込み：自発的か反応的か（ES Theory）',
  face_strategy:         '言語的配慮のレベル・丁寧さの度合い（Politeness Theory）',
  concept_distance:      '接続する概念の遠さ：近傍〜遠隔領域（Conceptual Blending）',
  evaluation_framing:    '評価の枠組み：利益優先か損失優先か（Prospect Theory）',
  need_for_cognition:    '思考への欲求・認知的複雑さへの親和性（NFC Scale）',
  integrative_complexity:'多角的思考と統合の度合い 1〜7（Suedfeld & Tetlock）',
  epistemic_curiosity:   '知識欲の動機：欠乏型(D) vs 関心型(I)（Litman & Spielberger）',
};
const AXIS_TIPS_EN = {
  abstraction_direction: 'Direction of thought: concrete→abstract or abstract→concrete (CLT)',
  problem_style:         'Problem approach: fix / suspend / delegate / pivot (KAI)',
  perspective_taking:    'Empathy style: spontaneous vs reactive (E-S Theory)',
  face_strategy:         'Linguistic politeness level (Politeness Theory)',
  concept_distance:      'Distance of conceptual connections (Conceptual Blending)',
  evaluation_framing:    'Evaluation frame: gain-first vs loss-first (Prospect Theory)',
  need_for_cognition:    'Drive for cognitive complexity (NFC Scale)',
  integrative_complexity:'Multi-perspective integration 1–7 (Suedfeld & Tetlock)',
  epistemic_curiosity:   'Curiosity motivation: D-type (gap) vs I-type (interest)',
};
const AXIS_TIPS = lang === 'en' ? AXIS_TIPS_EN : AXIS_TIPS_JA;

function axisTagsHTML() {
  return AXES_JA.map((ax, i) => {
    const pct   = Math.round(normalize(ax, tfp[ax]) * 100);
    const enName = AXIS_NAMES_EN[i], jaName = AXIS_NAMES_JA[i];
    const enVal  = axVal_lang(ax, tfp[ax], 'en');
    const jaVal  = axVal_lang(ax, tfp[ax], 'ja');
    return `
    <div class="axis-tag" data-tip-en="${AXIS_TIPS_EN[ax]||''}" data-tip-ja="${AXIS_TIPS_JA[ax]||''}">
      <span class="ax-name" data-en="${enName}" data-ja="${jaName}">${enName}</span>
      <div class="ax-bar-wrap"><div class="ax-bar" style="width:${pct}%;background:${AXIS_COLORS[i]}"></div></div>
      <span class="ax-val" data-en="${enVal}" data-ja="${jaVal}" style="color:${AXIS_COLORS[i]}">${enVal}</span>
    </div>`;
  }).join('');
}

// ── コーディングバー HTML ─────────────────────────
const CODING_AXES = [
  ['specification_precision', 'Spec precision',   '要件定義精度'],
  ['error_recognition',       'Error recog.',      'エラー認識'],
  ['system_abstraction',      'Sys abstraction',   'システム抽象度'],
  ['decision_quality',        'Decision quality',  '技術的判断'],
  ['technical_vocabulary',    'Tech vocabulary',   '技術語彙'],
  ['iteration_style',         'Iteration style',   '反復スタイル'],
];

const CODING_TIPS_JA = {
  specification_precision: '指示の具体性・要件定義の細かさ（1=曖昧 〜 5=精密）',
  error_recognition:       '問題認識の深さ：結果のみ → 挙動レベル → 構造レベル',
  system_abstraction:      'システムの捉え方：ブラックボックス → アーキテクチャ',
  decision_quality:        '技術的判断の質：委任 → ルーティン → 適応的',
  technical_vocabulary:    '技術語彙の使用精度：日常語 → 近似 → 精確',
  iteration_style:         '反復スタイル：一括/小刻み × 明確/曖昧の組み合わせ',
};
const CODING_TIPS_EN = {
  specification_precision: 'Instruction specificity (1=vague to 5=precise)',
  error_recognition:       'Problem depth: result-only → behavioral → structural',
  system_abstraction:      'System view: blackbox → interface → component → architecture',
  decision_quality:        'Decision style: deferred → routine → adaptive',
  technical_vocabulary:    'Tech vocab precision: lay → approximate → precise',
  iteration_style:         'Iteration: batch/incremental × vague/clear',
};
const CODING_TIPS = lang === 'en' ? CODING_TIPS_EN : CODING_TIPS_JA;

function codingBarsHTML() {
  return CODING_AXES.map(([ax, enLabel, jaLabel]) => {
    const raw = cfp[ax];
    const pct = codingPct(ax, raw);
    const enVal = codingValLabel_lang(ax, raw, 'en');
    const jaVal = codingValLabel_lang(ax, raw, 'ja');
    return `<div class="bar-row" data-tip-en="${CODING_TIPS_EN[ax]||''}" data-tip-ja="${CODING_TIPS_JA[ax]||''}">
      <div class="bar-header">
        <span class="br-name" data-en="${enLabel}" data-ja="${jaLabel}">${enLabel}</span>
        <span class="br-val" data-en="${enVal}" data-ja="${jaVal}">${enVal}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

// ── ペア分析 HTML ─────────────────────────────────
function reactionBarsHTML() {
  const rd = prp.reaction_distribution || {};
  return ['adopt','modify','reject','ignore'].map(k => {
    const pct = Math.round((rd[k] || 0) * 100);
    return `<div class="r-row" data-tip="${PAIR_TIPS_JA[k] || ''}">
      <span class="r-label">${k}</span>
      <div class="r-track"><div class="r-fill ${k}" style="width:${pct}%"></div></div>
      <span class="r-pct ${k}">${pct}%</span>
    </div>`;
  }).join('');
}

const PAIR_TIPS_JA = {
  adopt:          'AI出力をそのまま受け取り、次の指示へ進む割合',
  modify:         'AI出力の一部を修正・追加指示して調整する割合',
  reject:         '否定して別の方向に切り替える割合',
  ignore:         'AI出力の内容と無関係に別の話題へ移る割合',
  correction_precision: '修正指示の粒度：surgical（特定箇所をピンポイントで）/ directional（方向感だけ伝える）/ holistic（全体を作り直す）',
  blind_spots:    'AI出力の中で3回以上一貫してスルーされた要素のタイプ。AIへの好みのサインとして読む',
  delegation:     '会話全体を通じた役割分担の傾向。どんな種類の判断をAIに任せ、どこを自分で握っているか',
  preferred_style:'reaction_patternsと盲点パターンから推定した、このユーザーが最も快適に前進できるAIの返し方',
};

function delegationHTML() {
  const db = prp.delegation_boundary || {};
  const delegates = (db.delegates || []).map(d => `<span class="deleg-tag d">${d}</span>`).join('');
  const retains   = (db.retains   || []).map(d => `<span class="deleg-tag r">${d}</span>`).join('');
  return `
    <div class="deleg-title" data-tip="${PAIR_TIPS_JA.delegation}">▸ ${t('AIに任せている範囲','Delegated to AI')}</div>
    <div class="deleg-row">${delegates || '<span class="deleg-tag d">—</span>'}</div>
    <div class="deleg-title">▸ ${t('自分で判断している範囲','User-retained decisions')}</div>
    <div class="deleg-row">${retains || '<span class="deleg-tag r">—</span>'}</div>`;
}

function correctionPrecisionHTML() {
  const cp = prp.correction_precision;
  if (!cp || cp === 'null') return '';
  const info = {
    surgical:    { label: t('surgical — ピンポイント', 'surgical — pinpoint'),   color: '#3dd68c' },
    directional: { label: t('directional — 方向修正',  'directional — reorientation'), color: '#60a5fa' },
    holistic:    { label: t('holistic — 全体再構築',   'holistic — full rebuild'),  color: '#e0e0e0' },
  }[cp] || { label: cp, color: '#8b949e' };
  return `<div class="cp-badge" style="border-color:${info.color}33;background:${info.color}11" data-tip="${PAIR_TIPS_JA.correction_precision}">
    <span class="cpb-label">${t('修正粒度','Correction precision')}</span>
    <span class="cpb-value" style="color:${info.color}">${info.label}</span>
  </div>`;
}

const BS_TIPS_JA = {
  alternatives:   'AIが複数案を提示しても比較せず最初の案を採用する傾向。「1つに絞って断言してほしい」というサインでもある',
  caveats:        'AI出力の注意書きや制限事項を読み飛ばす傾向。簡潔な出力を好む',
  questions_back: 'AIから問い返されても答えずに前進する傾向。問いより断言された提案を好む',
  summary:        'AI出力の最後のまとめ・整理部分を読み飛ばす傾向。結論より先に次の行動へ移る',
};

function blindSpotsHTML() {
  const bsp = prp.blind_spot_patterns || [];
  if (bsp.length === 0) return '';
  const labels = {
    alternatives:   t('複数案の比較は省く傾向',     'skips comparing alternatives'),
    caveats:        t('注意書きは読み飛ばす傾向',   'skips caveats'),
    questions_back: t('断言を好む（問い返し不要）', 'prefers assertion over questions'),
    summary:        t('まとめは読み飛ばす傾向',     'skips summaries'),
  };
  const tags = bsp.map(p => `<span class="bs-tag" data-tip="${BS_TIPS_JA[p] || ''}">${labels[p] || p}</span>`).join('');
  return `<div class="bs-section">
    <div class="deleg-title">⚠️ ${t('AIの出力でスルーしがちな要素','Output types often skipped')}</div>
    <div class="deleg-row">${tags}</div>
  </div>`;
}

// ── insights ─────────────────────────────────────
function insightItems(arr) {
  return (arr || []).map(s => `<div class="ic-item">${s}</div>`).join('');
}

// ── 統合メッセージ（仮） ──────────────────────────
const unifiedProfile = tCom.holistic_profile || '';
const unifiedPrescription = pCom.prescription || '';
const unifiedCollaboration = cCom.collaboration_profile || cCom.holistic_profile || '';

const prefStyleLabel = {
  decisive: t('decisive — 断言型', 'decisive'),
  exploratory: t('exploratory — 深掘り型', 'exploratory'),
  concise: t('concise — 簡潔型', 'concise'),
  structured: t('structured — 構造化型', 'structured'),
}[prefStyle] || (prefStyle || '—');

// ── counts ───────────────────────────────────────
const tCount = thought.message_count || '—';
const cCount = coding.message_count  || '—';
const pCount = pair.pair_count       || '—';

// ── panel icons (SVG) ────────────────────────────
function iconSVG(type, color) {
  const glow = `drop-shadow(0 0 6px ${color}bb)`;
  const circle = `<circle cx="40" cy="40" r="35" fill="#0d1117" stroke="${color}" stroke-width="1.5" style="filter:${glow}"/>`;
  const stroke = `stroke="${color}" stroke-width="1.5" stroke-linecap="round" fill="none"`;
  const figures = {
    thought: `
      <ellipse cx="40" cy="19" rx="7" ry="8" ${stroke}/>
      <line x1="40" y1="27" x2="40" y2="32" ${stroke}/>
      <path d="M24 37 Q32 32 40 32 Q48 32 56 37" ${stroke}/>
      <path d="M25 38 L25 32 Q26 28 32 27 L40 27" ${stroke} stroke-linejoin="round"/>
      <path d="M55 38 L56 50" stroke="${color}" stroke-width="1.1" stroke-linecap="round" fill="none" opacity="0.45"/>`,
    coding: `
      <ellipse cx="36" cy="19" rx="7" ry="8" ${stroke}/>
      <line x1="36" y1="27" x2="36" y2="32" ${stroke}/>
      <path d="M21 37 Q28 32 36 32 Q44 32 51 37" ${stroke}/>
      <path d="M22 38 L21 50" stroke="${color}" stroke-width="1.1" stroke-linecap="round" fill="none" opacity="0.45"/>
      <path d="M50 38 L63 57" ${stroke}/>
      <circle cx="64" cy="58" r="2.5" fill="${color}" opacity="0.9"/>`,
    pair: `
      <ellipse cx="23" cy="19" rx="6" ry="7" ${stroke}/>
      <line x1="23" y1="26" x2="23" y2="30" ${stroke}/>
      <path d="M12 35 Q17 30 23 30 Q29 30 33 34" ${stroke}/>
      <path d="M32 35 L35 46" stroke="${color}" stroke-width="1.1" stroke-linecap="round" fill="none" opacity="0.45"/>
      <ellipse cx="57" cy="19" rx="6" ry="7" ${stroke}/>
      <line x1="57" y1="26" x2="57" y2="30" ${stroke}/>
      <path d="M47 34 Q51 30 57 30 Q63 30 68 35" ${stroke}/>
      <path d="M48 35 L45 46" stroke="${color}" stroke-width="1.1" stroke-linecap="round" fill="none" opacity="0.45"/>
      <path d="M31 16 Q40 10 49 16" stroke="${color}" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.7"/>
      <path d="M31 22 Q40 16 49 22" stroke="${color}" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.45"/>
      <path d="M31 28 Q40 22 49 28" stroke="${color}" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.25"/>`,
  };
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" width="64" height="64">${circle}${figures[type]||''}</svg>`;
}

// ── HTML ─────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Thought Analyzer — Unified Analysis v4.0</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0d1117;--bg2:#161b22;--bg3:#1c2333;--border:#30363d;
    --text:#e6edf3;--text2:#8b949e;
    --a1:#e0e0e0;--a2:#3dd68c;--a3:#60a5fa;--gold:#fbbf24;
    --adopt:#3dd68c;--modify:#60a5fa;--reject:#fb7185;--ignore:#8b949e;
    --font-body:'Inter','Segoe UI',sans-serif;
    --font-display:'Space Grotesk','Segoe UI',sans-serif;
  }
  body{background:var(--bg);color:var(--text);font-family:var(--font-body);font-size:13px;padding:14px}
  /* header */
  .header{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;gap:12px}
  .persona-img{width:68px;height:68px;border-radius:8px;object-fit:cover;border:2px solid var(--a1);flex-shrink:0}
  .header-center{flex:1}
  .type-row{display:flex;align-items:center;gap:8px;margin-bottom:4px}
  .type-badge{display:flex;flex-direction:column;background:var(--bg3);border-radius:6px;padding:4px 10px;border:1px solid var(--border);text-align:center}
  .type-badge .tb-label{font-size:9px;color:var(--text2);letter-spacing:.07em;text-transform:uppercase}
  .type-badge .tb-value{font-size:13px;font-weight:700;margin-top:1px}
  .type-badge.th .tb-value{color:var(--a1)}.type-badge.cd .tb-value{color:var(--a2)}.type-badge.pa .tb-value{color:var(--a3)}
  .sep{color:var(--border);font-size:18px}
  .persona-name{font-size:17px;font-weight:700;color:var(--a1);font-family:var(--font-display)}
  .persona-sub{font-size:11px;color:var(--text2);margin-top:2px}
  .header-right{text-align:right;font-size:11px;color:var(--text2);line-height:1.8;flex-shrink:0}
  .v-badge{display:inline-block;font-size:10px;padding:1px 7px;border-radius:10px;background:rgba(224,224,224,.1);color:var(--a1);border:1px solid rgba(224,224,224,.25);letter-spacing:.06em;margin-bottom:3px}
  .lang-toggle{display:inline-flex;align-items:center;gap:0;border-radius:8px;overflow:hidden;border:1px solid var(--border);margin-bottom:4px}
  .lang-toggle button{background:none;border:none;color:var(--text2);font-size:10px;font-weight:600;padding:3px 9px;cursor:pointer;letter-spacing:.06em;transition:background .15s,color .15s}
  .lang-toggle button.active{background:rgba(255,255,255,.1);color:var(--text)}
  .lang-toggle button:hover:not(.active){background:rgba(255,255,255,.05);color:var(--text)}
  /* top grid */
  .top-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px}
  .panel{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px;position:relative;overflow:hidden;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
  .panel::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;border-radius:10px 10px 0 0;transition:opacity .2s ease}
  .panel.th::before{background:var(--a1)}.panel.cd::before{background:var(--a2)}.panel.pa::before{background:var(--a3)}
  .panel.th:hover{transform:translateY(-3px);border-color:rgba(224,224,224,.65);box-shadow:0 0 0 1px rgba(224,224,224,.18),0 10px 30px rgba(224,224,224,.14)}
  .panel.cd:hover{transform:translateY(-3px);border-color:rgba(61,214,140,.65);box-shadow:0 0 0 1px rgba(61,214,140,.18),0 10px 30px rgba(61,214,140,.18)}
  .panel.pa:hover{transform:translateY(-3px);border-color:rgba(96,165,250,.65);box-shadow:0 0 0 1px rgba(96,165,250,.18),0 10px 30px rgba(96,165,250,.18)}
  .panel-icon{display:flex;justify-content:center;margin:-2px auto 8px;position:relative;z-index:2}
  .panel-title{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--text2);margin-bottom:10px;text-align:center;font-family:var(--font-body)}
  /* thought */
  .thought-inner{display:grid;grid-template-columns:170px 1fr;gap:8px;align-items:start}
  .axis-tags{display:flex;flex-direction:column;gap:3px}
  .axis-tag{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:5px;background:var(--bg3);border-radius:4px;padding:4px 7px;font-size:11px}
  .ax-name{color:var(--text2);white-space:nowrap}
  .ax-bar-wrap{height:3px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden}
  .ax-bar{height:100%;border-radius:2px;opacity:0.85}
  .ax-val{font-weight:700;font-size:10px;white-space:nowrap;text-align:right;font-family:var(--font-display)}
  /* hero bar */
  .hero-bar{position:relative;overflow:hidden;border:1px solid var(--border);border-radius:10px;padding:20px 24px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:24px}
  .hero-bar::before{content:'';position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.045) 1px,transparent 1px);background-size:22px 22px;pointer-events:none}
  .hero-type{display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;z-index:1}
  .hero-code{font-size:30px;font-weight:800;letter-spacing:.05em;line-height:1;text-shadow:0 0 24px currentColor;font-family:var(--font-display)}
  .hero-label{font-size:9px;color:var(--text2);text-transform:uppercase;letter-spacing:.12em;font-family:var(--font-body)}
  .hero-sep{font-size:22px;color:rgba(255,255,255,0.15);font-weight:300;margin-top:-6px;position:relative;z-index:1}
  /* commentary collapse */
  .cp-collapse{max-height:72px;overflow:hidden;position:relative;transition:max-height .35s ease}
  .cp-collapse::after{content:'';position:absolute;bottom:0;left:0;right:0;height:28px;background:linear-gradient(transparent,var(--bg2));pointer-events:none}
  .cp-collapse.open{max-height:600px}
  .cp-collapse.open::after{display:none}
  .cp-toggle{background:none;border:none;color:var(--text2);font-size:10px;cursor:pointer;padding:4px 0 0;letter-spacing:.04em;display:block}
  .cp-toggle:hover{color:var(--text)}
  /* coding bars */
  .coding-bars{display:flex;flex-direction:column;gap:6px}
  .bar-row{display:flex;flex-direction:column;gap:2px}
  .bar-header{display:flex;justify-content:space-between;font-size:11px}
  .br-name{color:var(--text2)}.br-val{color:var(--a2);font-weight:600}
  .bar-track{height:6px;background:var(--bg3);border-radius:3px;overflow:hidden}
  .bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--a2),rgba(61,214,140,.4))}
  .mode-badge{margin-top:10px;background:var(--bg3);border:1px solid var(--a2);border-radius:6px;padding:6px 10px;text-align:center}
  .mb-label{font-size:9px;color:var(--text2);letter-spacing:.07em}
  .mb-name{font-size:13px;font-weight:700;color:var(--a2);margin-top:2px}
  .mb-sub{font-size:10px;color:var(--text2);margin-top:1px}
  /* pair */
  .reaction-bars{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
  .r-row{display:flex;align-items:center;gap:7px}
  .r-label{width:42px;font-size:11px;color:var(--text2);text-align:right;flex-shrink:0}
  .r-track{flex:1;height:12px;background:var(--bg3);border-radius:3px;overflow:hidden}
  .r-fill{height:100%;border-radius:3px}
  .r-fill.adopt{background:var(--adopt)}.r-fill.modify{background:var(--modify)}.r-fill.reject{background:var(--reject)}.r-fill.ignore{background:var(--ignore)}
  .r-pct{width:28px;font-size:11px;font-weight:600;text-align:right;flex-shrink:0}
  .r-pct.adopt{color:var(--adopt)}.r-pct.modify{color:var(--modify)}.r-pct.reject{color:var(--reject)}.r-pct.ignore{color:var(--ignore)}
  .deleg-title{font-size:10px;color:var(--text2);margin-bottom:4px;letter-spacing:.04em}
  .deleg-row{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px}
  .deleg-tag{font-size:11px;padding:2px 7px;border-radius:10px}
  .deleg-tag.d{background:rgba(96,165,250,.15);color:var(--a3);border:1px solid rgba(96,165,250,.3)}
  .deleg-tag.r{background:rgba(251,191,36,.12);color:var(--gold);border:1px solid rgba(251,191,36,.3)}
  .pref-badge{background:var(--bg3);border:1px solid var(--a3);border-radius:6px;padding:6px 10px;text-align:center}
  .pb-label{font-size:9px;color:var(--text2);letter-spacing:.07em}
  .pb-value{font-size:13px;font-weight:700;color:var(--a3);margin-top:2px}
  .cp-badge{border:1px solid;border-radius:6px;padding:5px 10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}
  .cpb-label{font-size:9px;color:var(--text2);letter-spacing:.06em}
  .cpb-value{font-size:11px;font-weight:600}
  .bs-section{margin-bottom:7px}
  .bs-tag{font-size:11px;padding:2px 7px;border-radius:10px;background:rgba(251,113,133,.12);color:#fb7185;border:1px solid rgba(251,113,133,.3)}
  /* insights */
  .insights-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px}
  .insight-card{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:11px;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
  .insight-card:hover{transform:translateY(-2px);border-color:rgba(251,191,36,.55);box-shadow:0 0 0 1px rgba(251,191,36,.12),0 8px 22px rgba(251,191,36,.12)}
  .ic-title{font-size:11px;color:var(--text2);margin-bottom:7px}
  .ic-item{padding:3px 0;border-bottom:1px solid var(--bg3);font-size:11px;line-height:1.5}
  .ic-item:last-child{border-bottom:none}
  /* bottom */
  .bottom-section{display:flex;flex-direction:column;gap:10px}
  .commentary-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
  .commentary-panel{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px;position:relative;overflow:hidden}
  .commentary-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;border-radius:10px 10px 0 0}
  .commentary-panel.th::before{background:var(--a1)}.commentary-panel.cd::before{background:var(--a2)}.commentary-panel.pa::before{background:var(--a3)}
  .cp-title{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text2);margin-bottom:8px}
  .cp-body{font-size:12px;line-height:1.7;color:var(--text)}
  /* AI comment */
  .ai-panel{background:var(--bg2);border:1px solid rgba(251,191,36,.3);border-radius:10px;padding:14px 18px;position:relative;overflow:hidden}
  .ai-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),rgba(251,191,36,.2))}
  .ai-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
  .ai-title{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}
  .ai-note{font-size:10px;color:var(--text2);background:var(--bg3);padding:2px 8px;border-radius:10px}
  .ai-body{font-size:13px;line-height:1.8;color:var(--text);border-left:2px solid rgba(251,191,36,.4);padding-left:12px}
  /* tooltips — JS-driven, see script */
  [data-tip]{cursor:help}
  #g-tip{position:fixed;pointer-events:none;z-index:9999;opacity:0;transition:opacity .15s ease;background:#13181f;border:1px solid rgba(255,255,255,.12);color:#c9d1d9;font-size:11px;line-height:1.55;padding:6px 10px;border-radius:7px;max-width:220px;white-space:normal;box-shadow:0 4px 16px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.04);letter-spacing:.01em;backdrop-filter:blur(4px)}
  /* char badge in thought panel */
  .char-badge{margin-top:10px;background:var(--bg3);border:1px solid rgba(224,224,224,.2);border-radius:6px;padding:6px 10px;text-align:center}
  .cb-label{font-size:9px;color:var(--text2);letter-spacing:.07em}
  .cb-name{font-size:13px;font-weight:700;color:var(--a1);margin-top:2px}
  .cb-sub{font-size:10px;color:var(--text2);margin-top:1px}
  /* unified */
  .unified-panel{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 18px;position:relative;overflow:hidden}
  .unified-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--a1) 0%,var(--a3) 50%,var(--a2) 100%)}
  .unified-header{display:flex;align-items:center;gap:10px;margin-bottom:10px}
  .unified-title{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text2)}
  .badge-kari{font-size:10px;padding:2px 8px;border-radius:10px;background:rgba(251,191,36,.15);color:var(--gold);border:1px solid rgba(251,191,36,.4)}
  .unified-body{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .ub-section .ub-label{font-size:11px;color:var(--text2);margin-bottom:5px}
  .ub-section .ub-text{font-size:12px;line-height:1.7;color:var(--text)}
</style>
</head>
<body>

<div class="header">
  ${personaImg ? `<img class="persona-img" src="${personaImg}" alt="${tChar.code}">` : `<div class="persona-img" style="background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:28px">🧠</div>`}
  <div class="header-center">
    <div class="persona-name">${personaLabel()}</div>
    <div class="persona-sub">${tCom.summary || ''}</div>
  </div>
  <div class="header-right">
    <div class="lang-toggle">
      <button id="btn-en" class="active" onclick="setLang('en')">EN</button>
      <button id="btn-ja" onclick="setLang('ja')">JA</button>
    </div><br>
    <span class="v-badge">v4.0 unified</span><br>
    ${data.analyzed_at || thought.analyzed_at || '—'} | skill v4.0<br>
    Thought ${tCount} &nbsp; Coding ${cCount} &nbsp; Pairs ${pCount}
  </div>
</div>

<div class="hero-bar" style="background:linear-gradient(130deg,${tChar.color}28 0%,var(--bg2) 38%,${cMode.color}1e 68%,#60a5fa22 100%)">
  <div class="hero-type">
    <span class="hero-code" style="color:${tChar.color}">${tChar.code}</span>
    <span class="hero-label">${t('思考パターン','Thinking type')}</span>
  </div>
  <span class="hero-sep">×</span>
  <div class="hero-type">
    <span class="hero-code" style="color:${cMode.color}">${cMode.code}</span>
    <span class="hero-label">${t('指示モード','Coding mode')}</span>
  </div>
  <span class="hero-sep">×</span>
  <div class="hero-type">
    <span class="hero-code" style="color:var(--a3)">${prefStyle ? prefStyle.toUpperCase() : '—'}</span>
    <span class="hero-label">${t('対話スタイル','Dialogue style')}</span>
  </div>
</div>

<div class="top-grid">
  <div class="panel th">
    <div class="panel-icon">${iconSVG('thought','#f97316')}</div>
    <div class="panel-title">Thinking patterns — 9 axes</div>
    <div class="thought-inner">
      <canvas id="radarChart" width="170" height="170"></canvas>
      <div class="axis-tags">${axisTagsHTML()}</div>
    </div>
    <div class="char-badge">
      <div class="cb-label">${t('思考タイプ','Thinking type')}</div>
      <div class="cb-name" style="color:${tChar.color}">${tChar.code} — ${lang === 'en' ? tChar.en : tChar.ja}</div>
      <div class="cb-sub">${personaLabel()}</div>
    </div>
  </div>
  <div class="panel cd">
    <div class="panel-icon">${iconSVG('coding','#3dd68c')}</div>
    <div class="panel-title">Coding direction — 6 axes</div>
    <div class="coding-bars">${codingBarsHTML()}</div>
    <div class="mode-badge">
      <div class="mb-label">${t('指示モード','Coding mode')}</div>
      <div class="mb-name" style="color:var(--a2)">${cMode.code} — ${lang === 'en' ? cMode.en : cMode.ja}</div>
      <div class="mb-sub">${cCom.summary || ''}</div>
    </div>
  </div>
  <div class="panel pa">
    <div class="panel-icon">${iconSVG('pair','#60a5fa')}</div>
    <div class="panel-title">Pair analysis — dialogue loop</div>
    <div class="reaction-bars">${reactionBarsHTML()}</div>
    ${correctionPrecisionHTML()}
    ${blindSpotsHTML()}
    ${delegationHTML()}
    <div class="pref-badge" data-tip="${PAIR_TIPS_JA.preferred_style}">
      <div class="pb-label">${t('あなたに合うAIの返し方','Best AI response style for you')}</div>
      <div class="pb-value">${prefStyleLabel}</div>
    </div>
  </div>
</div>

<div class="insights-grid">
  <div class="insight-card">
    <div class="ic-title">💪 ${t('強み（思考）','Strengths')}</div>
    ${insightItems(tCom.strengths)}
  </div>
  <div class="insight-card">
    <div class="ic-title">⚠️ ${t('盲点・注意点','Blind spots')}</div>
    ${insightItems(tCom.blind_spots)}
  </div>
  <div class="insight-card">
    <div class="ic-title">🔧 ${t('指示スタイルの特徴','Instruction style')}</div>
    ${insightItems(cCom.strengths)}
  </div>
  <div class="insight-card">
    <div class="ic-title">🗣️ ${t('対話志向','Dialogue tendency')}</div>
    ${insightItems(cCom.growth_areas)}
  </div>
</div>

<div class="bottom-section">
  <div class="commentary-grid">
    <div class="commentary-panel th">
      <div class="cp-title" data-tip-en="Thinking pattern holistic profile" data-tip-ja="思考パターンの総合プロフィール">🧠 Thinking — holistic profile</div>
      <div class="cp-body cp-collapse" id="comm-th">${tCom.holistic_profile || ''}</div>
      <button class="cp-toggle" onclick="toggleComm('comm-th',this)">show more ▾</button>
    </div>
    <div class="commentary-panel cd">
      <div class="cp-title" data-tip-en="Coding direction collaboration profile" data-tip-ja="コーディング指示力の協働スタイル">⚙️ Coding — collaboration profile</div>
      <div class="cp-body cp-collapse" id="comm-cd">${cCom.collaboration_profile || cCom.holistic_profile || ''}</div>
      <button class="cp-toggle" onclick="toggleComm('comm-cd',this)">show more ▾</button>
    </div>
    <div class="commentary-panel pa">
      <div class="cp-title" data-tip-en="Pair analysis — how you interact with AI output" data-tip-ja="AIの出力に対する対話パターンの分析">🔄 Pair analysis — interaction style</div>
      <div class="cp-body cp-collapse" id="comm-pa">${pCom.interaction_style || ''}${pCom.prescription ? `<br><br><strong style="color:var(--a3)">→ ${pCom.prescription}</strong>` : ''}</div>
      <button class="cp-toggle" onclick="toggleComm('comm-pa',this)">show more ▾</button>
    </div>
  </div>

  ${aiComment ? `
  <div class="ai-panel">
    <div class="ai-header">
      <span class="ai-title">💬 ${t('AIからの個人コメント','Personal note from Claude')}</span>
      <span class="ai-note">${aiCommentDepth || (t('このセッションの観察から','From this session only'))} / ${t('分析JSONには含まれません','Not in analysis JSON')}</span>
    </div>
    <div class="ai-body">${aiComment}</div>
  </div>` : ''}

  <div class="unified-panel">
    <div class="unified-header">
      <span class="unified-title">📋 ${t('統合解釈','Unified interpretation')}</span>
      <span class="badge-kari">${t('仮 — 将来は組み合わせマトリクスで定義','provisional — combination matrix TBD')}</span>
    </div>
    <div class="unified-body" style="grid-template-columns:1fr">
      <div class="ub-section">
        <div class="ub-label">${tChar.code} × ${cMode.code} × ${prefStyle || '—'} — ${t('あなたの思考と対話のパターン','Your thinking and dialogue pattern')}</div>
        <div class="ub-text">${unifiedProfile}</div>
      </div>
    </div>
  </div>
</div>

<script>
const lang = '${lang}';

/* ── 言語トグル ── */
let currentLang = 'en';

function setLang(l) {
  currentLang = l;
  // ボタン状態
  document.getElementById('btn-en').classList.toggle('active', l === 'en');
  document.getElementById('btn-ja').classList.toggle('active', l === 'ja');
  // data-en / data-ja を持つ要素を切り替え
  document.querySelectorAll('[data-en],[data-ja]').forEach(el => {
    const val = el.getAttribute('data-' + l);
    if (val != null) el.textContent = val;
  });
  // data-tip-en / data-tip-ja を data-tip に書き換え（tooltip用）
  document.querySelectorAll('[data-tip-en],[data-tip-ja]').forEach(el => {
    const tip = el.getAttribute('data-tip-' + (l === 'en' ? 'ja' : 'en')); // 反対言語をtipに
    if (tip != null) el.setAttribute('data-tip', tip);
  });
}

// 初期化: EN表示、tip=JA
document.querySelectorAll('[data-tip-en],[data-tip-ja]').forEach(el => {
  const tip = el.getAttribute('data-tip-ja') || el.getAttribute('data-tip-en') || '';
  el.setAttribute('data-tip', tip);
});

/* ── グローバル tooltip ── */
const gTip = document.createElement('div');
gTip.id = 'g-tip';
document.body.appendChild(gTip);

document.querySelectorAll('[data-tip]').forEach(el => {
  el.addEventListener('mouseenter', e => {
    const txt = el.getAttribute('data-tip');
    if (!txt) return;
    gTip.textContent = txt;
    gTip.style.opacity = '1';
    moveTip(e);
  });
  el.addEventListener('mousemove', moveTip);
  el.addEventListener('mouseleave', () => { gTip.style.opacity = '0'; });
});

function moveTip(e) {
  const pad = 12, tw = gTip.offsetWidth || 220, th = gTip.offsetHeight || 36;
  let x = e.clientX + 14;
  let y = e.clientY - th - 10;
  if (x + tw > window.innerWidth - pad) x = e.clientX - tw - 14;
  if (y < pad) y = e.clientY + 18;
  gTip.style.left = x + 'px';
  gTip.style.top  = y + 'px';
}

function toggleComm(id, btn) {
  const el = document.getElementById(id);
  el.classList.toggle('open');
  const isOpen = el.classList.contains('open');
  btn.textContent = isOpen
    ? (lang === 'en' ? 'show less ▴' : '閉じる ▴')
    : (lang === 'en' ? 'show more ▾' : 'もっと見る ▾');
}
const ctx = document.getElementById('radarChart').getContext('2d');
new Chart(ctx, {
  type: 'radar',
  data: {
    labels: ${JSON.stringify(radarLabels)},
    datasets: [{
      data: ${JSON.stringify(radarData)},
      borderColor: '${tChar.color}',
      backgroundColor: '${tChar.color}1a',
      borderWidth: 1.5,
      pointBackgroundColor: ${JSON.stringify(AXIS_COLORS)},
      pointRadius: 3,
    }]
  },
  options: {
    responsive: false,
    scales: { r: {
      min: 0, max: 1,
      ticks: { display: false },
      grid: { color: 'rgba(255,255,255,0.06)' },
      angleLines: { color: 'rgba(255,255,255,0.06)' },
      pointLabels: { color: '#8b949e', font: { size: 9 } }
    }},
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  }
});
</script>
</body>
</html>`;

fs.writeFileSync(outputPath, html, 'utf8');
console.log('saved:', outputPath);
