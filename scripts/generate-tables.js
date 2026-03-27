const { createCanvas } = require('canvas');
const fs = require('fs');

const SCALE = 2;
const W = 900;
const PADDING = 40;
const ROW_H = 62;
const HEADER_H = 88;

const axes = [
  {
    num: 1, en: 'abstraction_direction',
    ja: '抽象化の方向',
    theory: 'Construal Level Theory — Trope & Liberman (2010)',
    color: [100, 160, 200],
    rows: [
      ['concrete_to_abstract', '具体的な出来事や問題から出発し、概念・原則へ向かう'],
      ['abstract_to_concrete', 'アイデア・概念から出発し、実装・具体へ向かう'],
      ['stays_concrete', '終始、具体的な話の中にとどまる'],
      ['stays_abstract', '終始、概念・方針レベルの話にとどまる'],
    ],
  },
  {
    num: 2, en: 'problem_style',
    ja: '問題へのアプローチ',
    theory: 'Kirton Adaption-Innovation Inventory — Kirton (1976)',
    color: [180, 120, 100],
    rows: [
      ['pivot', '別の方法・代替案を先に探す（Innovator寄り）'],
      ['fix', '根本原因を特定して修正する（Adaptor寄り）'],
      ['delegate', '解決を相手（AIやエンジニアなど）に委ねる'],
      ['suspend', '判断を保留して後で考える'],
    ],
  },
  {
    num: 3, en: 'perspective_taking',
    ja: '他者視点の出現',
    theory: 'Empathizing-Systemizing Theory — Baron-Cohen (2003)',
    color: [160, 100, 180],
    rows: [
      ['spontaneous', '求められていなくても自然と他者の立場が出てくる'],
      ['reactive', '関連する話題が出たとき・促されたときに出てくる'],
      ['absent', 'ほとんど出てこない'],
    ],
  },
  {
    num: 4, en: 'face_strategy',
    ja: '言語の配慮戦略',
    theory: 'Politeness Theory — Brown & Levinson (1987)',
    color: [100, 170, 160],
    rows: [
      ['high_mitigation (0.7〜1.0)', '「〜かな」「〜かも」など和らげる表現が多い'],
      ['moderate (0.4〜0.7)', '断定と配慮が混在する'],
      ['low_mitigation (0.0〜0.4)', '断定・直接的な表現が多い'],
    ],
  },
  {
    num: 5, en: 'concept_distance',
    ja: '概念接続の距離',
    theory: 'Conceptual Blending — Fauconnier & Turner (2002)',
    color: [140, 180, 100],
    rows: [
      ['near', '隣接する領域どうしを結びつける'],
      ['mid', 'やや距離のある領域を結びつける'],
      ['far', '通常は接続されない領域を結びつける'],
    ],
  },
  {
    num: 6, en: 'evaluation_framing',
    ja: '評価のフレーミング',
    theory: 'Framing Effect / Prospect Theory — Kahneman & Tversky (1979)',
    color: [200, 150, 80],
    rows: [
      ['gain_first', '肯定・方向確認を先に出し、問題・修正を後から加える'],
      ['loss_first', '問題点・懸念を先に出す'],
      ['neutral', '価値判断を前面に出さず、情報を提供する'],
      ['mixed', '文脈によって変わる'],
    ],
  },
  {
    num: 7, en: 'need_for_cognition',
    ja: '思考への欲求',
    theory: 'Need for Cognition Scale — Cacioppo & Petty (1982)',
    color: [100, 130, 200],
    rows: [
      ['high', '自発的に問いを立て、複雑な考察を展開する'],
      ['moderate', '必要に応じて熟考するが、自発的な問いは少なめ'],
      ['low', '簡潔な答えと明確な指示を好む'],
    ],
  },
  {
    num: 8, en: 'integrative_complexity',
    ja: '統合的複雑性',
    theory: 'Integrative Complexity — Suedfeld & Tetlock (1977)',
    color: [80, 140, 180],
    rows: [
      ['1〜2', '一次元的。単一の視点・価値軸で判断する'],
      ['3〜4', '複数の側面を認識しているが、統合はしない'],
      ['5〜6', '複数の側面を認識し、相互関係まで考える'],
      ['7', '多次元的な枠組みを自在に構築する'],
    ],
  },
  {
    num: 9, en: 'epistemic_curiosity',
    ja: '認識論的好奇心',
    theory: 'Epistemic Curiosity (I/D型) — Litman & Spielberger (2003)',
    color: [160, 120, 200],
    rows: [
      ['interest_type', '知ること自体への喜び。「面白そう」が出発点'],
      ['deprivation_type', 'ギャップを埋めたい不快感。「わからないと落ち着かない」'],
      ['mixed', '両方の動機が状況によって混在する'],
    ],
  },
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

axes.forEach(({ num, en, ja, theory, color, rows }) => {
  const H = HEADER_H + (ROW_H * 0.6) + rows.length * ROW_H + 36;
  const canvas = createCanvas(W * SCALE, H * SCALE);
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  const [r, g, b] = color;

  // 背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // 左カラーバー
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, 5, H);

  // ヘッダー背景
  ctx.fillStyle = `rgba(${r},${g},${b},0.07)`;
  ctx.fillRect(5, 0, W - 5, HEADER_H);

  // 軸番号バッジ
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  roundRect(ctx, PADDING, 16, 34, 26, 5);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(String(num), PADDING + 10, 34);

  // 軸名（日本語）
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(ja, PADDING + 46, 34);

  // 軸名（英語キー）
  ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
  ctx.font = '12px monospace';
  ctx.fillText(en, PADDING + 46, 54);

  // 理論
  ctx.fillStyle = '#9ca3af';
  ctx.font = '11px sans-serif';
  ctx.fillText(theory, PADDING, HEADER_H - 12);

  // テーブルヘッダー行
  const thY = HEADER_H + 4;
  ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
  ctx.fillRect(PADDING, thY, W - PADDING * 2, ROW_H * 0.56);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('値', PADDING + 16, thY + 22);
  ctx.fillText('意味', PADDING + 236, thY + 22);

  // 区切り線（ヘッダー下）
  ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, thY + ROW_H * 0.56);
  ctx.lineTo(W - PADDING, thY + ROW_H * 0.56);
  ctx.stroke();

  // データ行
  rows.forEach(([val, desc], i) => {
    const rowY = HEADER_H + ROW_H * 0.56 + 4 + i * ROW_H;

    // 偶数行背景
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.02)';
      ctx.fillRect(PADDING, rowY, W - PADDING * 2, ROW_H);
    }

    // 値（左列）
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(val, PADDING + 16, rowY + ROW_H / 2 + 6);

    // 縦区切り
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING + 220, rowY + 8);
    ctx.lineTo(PADDING + 220, rowY + ROW_H - 8);
    ctx.stroke();

    // 説明（右列）
    ctx.fillStyle = '#374151';
    ctx.font = '14px sans-serif';
    ctx.fillText(desc, PADDING + 236, rowY + ROW_H / 2 + 6);

    // 行区切り
    if (i < rows.length - 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING, rowY + ROW_H);
      ctx.lineTo(W - PADDING, rowY + ROW_H);
      ctx.stroke();
    }
  });

  // 外枠
  ctx.strokeStyle = `rgba(${r},${g},${b},0.2)`;
  ctx.lineWidth = 1;
  roundRect(ctx, PADDING, 0, W - PADDING * 2, H - 4, 6);
  ctx.stroke();

  const outPath = `C:/Users/yoshi/Documents/skills/thought-analyzer/images/tables/table-axis-${num}.png`;
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log(`saved: table-axis-${num}.png`);
});

console.log('All tables done.');
