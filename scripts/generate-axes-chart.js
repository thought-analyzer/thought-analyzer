const { createCanvas } = require('canvas');
const fs = require('fs');

const SCALE = 2; // 高解像度化
const W = 1200;
const PADDING = 60;
const LABEL_W = 220;
const BAR_H = 18;
const ROW_H = 108;
const HEADER_H = 90;
const FOOTER_H = 50;

const axes = [
  {
    num: 1,
    ja: '抽象化の方向',
    en: 'abstraction_direction',
    type: 'spectrum',
    values: ['stays_concrete', 'concrete_to_abstract', 'abstract_to_concrete', 'stays_abstract'],
    labels: ['終始具体', '具体→抽象', '抽象→具体', '終始抽象'],
    colorL: [120, 180, 120],
    colorR: [100, 140, 220],
  },
  {
    num: 2,
    ja: '問題へのアプローチ',
    en: 'problem_style',
    type: 'spectrum',
    values: ['fix', 'suspend', 'delegate', 'pivot'],
    labels: ['fix\n修正優先', 'suspend\n保留', 'delegate\n委任', 'pivot\n代替優先'],
    colorL: [180, 120, 100],
    colorR: [100, 160, 200],
  },
  {
    num: 3,
    ja: '他者視点の出現',
    en: 'perspective_taking',
    type: 'spectrum',
    values: ['absent', 'reactive', 'spontaneous'],
    labels: ['absent\nほぼ出ない', 'reactive\n促されて出る', 'spontaneous\n自発的'],
    colorL: [160, 160, 170],
    colorR: [200, 140, 200],
  },
  {
    num: 4,
    ja: '言語の配慮戦略',
    en: 'face_strategy',
    type: 'scale',
    scaleMin: '0.0\nlow_mitigation\n断定的',
    scaleMax: '1.0\nhigh_mitigation\n配慮的',
    colorL: [200, 140, 100],
    colorR: [100, 180, 180],
  },
  {
    num: 5,
    ja: '概念接続の距離',
    en: 'concept_distance',
    type: 'spectrum',
    values: ['near', 'mid', 'far'],
    labels: ['near\n隣接領域', 'mid\nやや遠い', 'far\n通常非接続'],
    colorL: [160, 200, 140],
    colorR: [200, 100, 140],
  },
  {
    num: 6,
    ja: '評価のフレーミング',
    en: 'evaluation_framing',
    type: 'spectrum',
    values: ['loss_first', 'neutral', 'mixed', 'gain_first'],
    labels: ['loss_first\n問題から入る', 'neutral\n情報提供型', 'mixed\n文脈依存', 'gain_first\n肯定から入る'],
    colorL: [200, 120, 100],
    colorR: [100, 180, 140],
  },
  {
    num: 7,
    ja: '思考への欲求',
    en: 'need_for_cognition',
    type: 'spectrum',
    values: ['low', 'moderate', 'high'],
    labels: ['low\n簡潔を好む', 'moderate\n必要時に熟考', 'high\n自発的に問いを立てる'],
    colorL: [160, 160, 160],
    colorR: [100, 140, 220],
  },
  {
    num: 8,
    ja: '統合的複雑性',
    en: 'integrative_complexity',
    type: 'numeric',
    min: 1, max: 7,
    minLabel: '1\n一次元的',
    maxLabel: '7\n多次元統合',
    midLabels: [
      { v: 3, label: '3\n分化あり' },
      { v: 5, label: '5\n分化+統合' },
    ],
    colorL: [180, 180, 140],
    colorR: [80, 120, 200],
  },
  {
    num: 9,
    ja: '認識論的好奇心',
    en: 'epistemic_curiosity',
    type: 'spectrum',
    values: ['deprivation_type', 'mixed', 'interest_type'],
    labels: ['deprivation\nギャップを埋めたい', 'mixed\n混在', 'interest\n知ること自体が目的'],
    colorL: [180, 140, 100],
    colorR: [100, 180, 200],
  },
];

const H = HEADER_H + axes.length * ROW_H + FOOTER_H + 20;
const canvas = createCanvas(W * SCALE, H * SCALE);
const ctx = canvas.getContext('2d');
ctx.scale(SCALE, SCALE);

// ── 背景 ────────────────────────────────────────
ctx.fillStyle = '#fafaf8';
ctx.fillRect(0, 0, W, H);

// ── ヘッダー ─────────────────────────────────────
ctx.fillStyle = '#111827';
ctx.font = 'bold 22px sans-serif';
ctx.fillText('思考パターン 9軸スペクトル図', PADDING, 42);
ctx.font = '13px sans-serif';
ctx.fillStyle = '#6b7280';
ctx.fillText('thought-analyzer — Cognitive Axes Reference', PADDING, 64);

// ── 区切り線 ──────────────────────────────────────
ctx.strokeStyle = '#e5e7eb';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(PADDING, HEADER_H - 10);
ctx.lineTo(W - PADDING, HEADER_H - 10);
ctx.stroke();

// ── ヘルパー関数 ──────────────────────────────────
function lerpColor(cL, cR, t) {
  return [
    Math.round(cL[0] + (cR[0] - cL[0]) * t),
    Math.round(cL[1] + (cR[1] - cL[1]) * t),
    Math.round(cL[2] + (cR[2] - cL[2]) * t),
  ];
}

function drawBar(x, y, w, h, cL, cR) {
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, `rgba(${cL[0]},${cL[1]},${cL[2]},0.75)`);
  grad.addColorStop(1, `rgba(${cR[0]},${cR[1]},${cR[2]},0.75)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
}

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

function wrapText(text, x, y, lineH) {
  const lines = text.split('\n');
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineH));
}

// ── 各軸を描画 ────────────────────────────────────
const barX = PADDING + LABEL_W;
const barW = W - PADDING * 2 - LABEL_W;

axes.forEach((axis, i) => {
  const rowY = HEADER_H + i * ROW_H;
  const barY = rowY + 22;
  const isEven = i % 2 === 0;

  // 偶数行に薄い背景
  if (isEven) {
    ctx.fillStyle = 'rgba(0,0,0,0.018)';
    ctx.fillRect(PADDING - 10, rowY + 2, W - PADDING * 2 + 20, ROW_H - 4);
  }

  // 軸番号 + 日本語名
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`${axis.num}. ${axis.ja}`, PADDING, barY + 2);

  // 英語キー名
  ctx.fillStyle = '#9ca3af';
  ctx.font = '10px monospace';
  ctx.fillText(axis.en, PADDING, barY + 17);

  // バー描画
  drawBar(barX, barY - 9, barW, BAR_H, axis.colorL, axis.colorR);

  // 値ラベル
  ctx.fillStyle = '#374151';
  ctx.font = '10px sans-serif';

  if (axis.type === 'spectrum') {
    const n = axis.values.length;
    axis.values.forEach((val, j) => {
      const tx = barX + (barW / (n - 1)) * j;
      // ノード
      ctx.beginPath();
      ctx.arc(tx, barY - 1, 4.5, 0, Math.PI * 2);
      const c = lerpColor(axis.colorL, axis.colorR, j / (n - 1));
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // ラベル（交互に上下）
      ctx.fillStyle = '#374151';
      const labelLines = axis.labels[j].split('\n');
      const above = j % 2 === 0;
      if (above) {
        labelLines.forEach((line, li) => {
          ctx.fillText(line, tx - ctx.measureText(line).width / 2, barY - 18 - (labelLines.length - 1 - li) * 12);
        });
      } else {
        labelLines.forEach((line, li) => {
          ctx.fillText(line, tx - ctx.measureText(line).width / 2, barY + 22 + li * 12);
        });
      }
    });

  } else if (axis.type === 'scale') {
    // face_strategy: 連続スケール 0.0〜1.0
    [0, 0.5, 1.0].forEach((t, j) => {
      const tx = barX + barW * t;
      ctx.beginPath();
      ctx.arc(tx, barY - 1, 4.5, 0, Math.PI * 2);
      const c = lerpColor(axis.colorL, axis.colorR, t);
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    const minLines = axis.scaleMin.split('\n');
    const maxLines = axis.scaleMax.split('\n');
    ctx.fillStyle = '#374151';
    minLines.forEach((line, li) => ctx.fillText(line, barX - ctx.measureText(line).width / 2, barY - 20 + li * 12));
    maxLines.forEach((line, li) => ctx.fillText(line, barX + barW - ctx.measureText(line).width / 2, barY + 20 + li * 12));
    const midLabel = 'moderate';
    ctx.fillText(midLabel, barX + barW / 2 - ctx.measureText(midLabel).width / 2, barY - 20);

  } else if (axis.type === 'numeric') {
    // integrative_complexity 1〜7
    for (let v = axis.min; v <= axis.max; v++) {
      const t = (v - axis.min) / (axis.max - axis.min);
      const tx = barX + barW * t;
      ctx.beginPath();
      ctx.arc(tx, barY - 1, 4.5, 0, Math.PI * 2);
      const c = lerpColor(axis.colorL, axis.colorR, t);
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // 数字
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px sans-serif';
      ctx.fillText(String(v), tx - 3, barY - 16);
    }
    // 端ラベル
    ctx.fillStyle = '#374151';
    ctx.font = '10px sans-serif';
    axis.minLabel.split('\n').forEach((line, li) => ctx.fillText(line, barX - ctx.measureText(line).width / 2, barY + 18 + li * 12));
    axis.maxLabel.split('\n').forEach((line, li) => ctx.fillText(line, barX + barW - ctx.measureText(line).width / 2, barY + 18 + li * 12));
    axis.midLabels.forEach(({ v, label }) => {
      const t = (v - axis.min) / (axis.max - axis.min);
      const tx = barX + barW * t;
      label.split('\n').forEach((line, li) => {
        ctx.fillText(line, tx - ctx.measureText(line).width / 2, barY - 20 + li * 12);
      });
    });
  }

  // 区切り線
  if (i < axes.length - 1) {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(PADDING, rowY + ROW_H);
    ctx.lineTo(W - PADDING, rowY + ROW_H);
    ctx.stroke();
  }
});

// ── フッター ──────────────────────────────────────
const footerY = HEADER_H + axes.length * ROW_H + 24;
ctx.strokeStyle = '#e5e7eb';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(PADDING, footerY - 10);
ctx.lineTo(W - PADDING, footerY - 10);
ctx.stroke();

ctx.font = '11px sans-serif';
ctx.fillStyle = '#9ca3af';
ctx.fillText('thought-analyzer — github.com/thought-analyzer/thought-analyzer', PADDING, footerY + 12);
ctx.fillStyle = '#d1d5db';
ctx.font = '10px sans-serif';
const theories = 'Construal Level Theory · KAI · E-S Theory · Politeness Theory · Conceptual Blending · Prospect Theory · NFC · Integrative Complexity · Epistemic Curiosity';
ctx.fillText(theories, PADDING, footerY + 28);

// ── 保存 ──────────────────────────────────────────
const out = 'C:/Users/yoshi/Documents/skills/thought-analyzer/images/axes-spectrum.png';
fs.writeFileSync(out, canvas.toBuffer('image/png'));
console.log('saved:', out);
