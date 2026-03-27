const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1280, H = 670;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// ── 背景 ────────────────────────────────────────────────
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0,   '#090e1a');
bg.addColorStop(0.5, '#0c1220');
bg.addColorStop(1,   '#07090f');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

// ── 中心点（やや左上寄り）───────────────────────────────
const cx = W * 0.42, cy = H * 0.46;

// ── 同心円（干渉パターン）──────────────────────────────
for (let i = 1; i <= 12; i++) {
  const r = i * 38;
  const alpha = 0.03 + (12 - i) * 0.004;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(160, 180, 255, ${alpha})`;
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

// ── 9軸の定義（角度・長さ・明度）──────────────────────
const axes = [
  { angle: -72,  len: 0.90, bright: 1.00, color: [255, 220, 140] }, // abstraction_direction
  { angle: -38,  len: 0.75, bright: 0.80, color: [200, 220, 255] }, // problem_style
  { angle: -10,  len: 0.95, bright: 0.95, color: [255, 230, 160] }, // perspective_taking
  { angle:  22,  len: 0.60, bright: 0.55, color: [180, 210, 255] }, // face_strategy
  { angle:  55,  len: 0.85, bright: 0.85, color: [255, 215, 130] }, // concept_distance
  { angle:  92,  len: 0.50, bright: 0.45, color: [160, 200, 255] }, // evaluation_framing
  { angle: 138,  len: 0.80, bright: 0.70, color: [240, 225, 175] }, // need_for_cognition
  { angle: 185,  len: 0.70, bright: 0.60, color: [190, 215, 255] }, // integrative_complexity
  { angle: 235,  len: 0.88, bright: 0.82, color: [255, 222, 145] }, // epistemic_curiosity
];

const maxLen = Math.sqrt(W * W + H * H) * 0.62;

axes.forEach(({ angle, len, bright, color }) => {
  const rad = (angle * Math.PI) / 180;
  const ex = cx + Math.cos(rad) * maxLen * len;
  const ey = cy + Math.sin(rad) * maxLen * len;

  const grad = ctx.createLinearGradient(cx, cy, ex, ey);
  grad.addColorStop(0,    `rgba(${color[0]},${color[1]},${color[2]},${bright * 0.9})`);
  grad.addColorStop(0.35, `rgba(${color[0]},${color[1]},${color[2]},${bright * 0.5})`);
  grad.addColorStop(0.7,  `rgba(${color[0]},${color[1]},${color[2]},${bright * 0.15})`);
  grad.addColorStop(1,    `rgba(${color[0]},${color[1]},${color[2]},0)`);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = grad;
  ctx.lineWidth = bright > 0.8 ? 1.2 : 0.8;
  ctx.stroke();

  // 端点のノード
  if (len > 0.7) {
    const nx = cx + Math.cos(rad) * maxLen * len * 0.88;
    const ny = cy + Math.sin(rad) * maxLen * len * 0.88;
    ctx.beginPath();
    ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${bright * 0.7})`;
    ctx.fill();
  }
});

// ── 中心グロー（青紫）──────────────────────────────────
const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
glow.addColorStop(0,    'rgba(140, 160, 255, 0.22)');
glow.addColorStop(0.4,  'rgba(100, 120, 220, 0.08)');
glow.addColorStop(1,    'rgba(80,  100, 200, 0)');
ctx.fillStyle = glow;
ctx.beginPath();
ctx.arc(cx, cy, 90, 0, Math.PI * 2);
ctx.fill();

// ── 中心点 ──────────────────────────────────────────────
ctx.beginPath();
ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(255, 240, 200, 0.95)';
ctx.fill();

ctx.beginPath();
ctx.arc(cx, cy, 7, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(200, 220, 255, 0.12)';
ctx.fill();

// ── 日本語テキスト「思考の輪郭」──────────────────────
ctx.save();
ctx.font = '500 15px sans-serif';
ctx.fillStyle = 'rgba(180, 200, 255, 0.18)';
ctx.letterSpacing = '0.3em';
ctx.fillText('思考の輪郭', W * 0.64, H * 0.82);
ctx.restore();

// ── "thought-analyzer"（右下）────────────────────────
ctx.save();
ctx.font = '300 13px monospace';
ctx.fillStyle = 'rgba(200, 215, 255, 0.35)';
ctx.fillText('thought-analyzer', W - 180, H - 28);
ctx.restore();

// ── 保存 ────────────────────────────────────────────────
const outPath = 'C:/Users/yoshi/Documents/skills/thought-analyzer/images/header-thought-analyzer.png';
const buf = canvas.toBuffer('image/png');
fs.writeFileSync(outPath, buf);
console.log('saved:', outPath);
