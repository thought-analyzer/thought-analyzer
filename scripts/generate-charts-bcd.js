const { createCanvas } = require('canvas');
const fs = require('fs');

const SCALE = 2;

// ──────────────────────────────────────────────────────
// B. 統合的複雑性スケール（1〜7）段階図
// ──────────────────────────────────────────────────────
function generateIC() {
  const W = 1000, H = 480;
  const canvas = createCanvas(W * SCALE, H * SCALE);
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = '#fafaf8';
  ctx.fillRect(0, 0, W, H);

  // タイトル
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('統合的複雑性（Integrative Complexity）スケール', 50, 48);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('Suedfeld & Tetlock (1977) — テキストから客観的に測定できる思考複雑性の指標', 50, 72);

  const levels = [
    { score: 1, label: '一次元的', desc: '単一の視点のみ\n「〜は〜だ」', color: [180, 180, 180] },
    { score: 2, label: '移行期', desc: '別の見方がある\nことを認識し始める', color: [170, 185, 170] },
    { score: 3, label: '分化あり', desc: '複数の側面を\n認識する', color: [140, 180, 160] },
    { score: 4, label: '移行期', desc: '側面間の関係に\n気づき始める', color: [120, 170, 180] },
    { score: 5, label: '分化＋統合', desc: '複数の側面を\n相互に関連づける', color: [100, 155, 200] },
    { score: 6, label: '移行期', desc: '多次元的な\n枠組みを形成中', color: [90, 130, 210] },
    { score: 7, label: '高度な統合', desc: '多次元的な枠組みを\n自在に構築する', color: [70, 110, 220] },
  ];

  const barX = 50, barY = 120;
  const blockW = (W - 100) / 7;
  const maxH = 200;

  levels.forEach(({ score, label, desc, color }, i) => {
    const h = maxH * (score / 7) * 0.85 + maxH * 0.15;
    const x = barX + i * blockW;
    const y = barY + maxH - h;

    // バー
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},0.9)`);
    grad.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0.4)`);
    ctx.fillStyle = grad;
    const bw = blockW - 12;
    roundRect(ctx, x + 6, y, bw, h, 6);
    ctx.fill();

    // スコア数字（バーの上）
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(String(score), x + blockW / 2 - 9, y - 14);

    // ラベル（バーの中）
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 13px sans-serif';
    const labelW = ctx.measureText(label).width;
    ctx.fillText(label, x + blockW / 2 - labelW / 2, y + 22);

    // 説明（バー下）
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    desc.split('\n').forEach((line, li) => {
      const lw = ctx.measureText(line).width;
      ctx.fillText(line, x + blockW / 2 - lw / 2, barY + maxH + 26 + li * 16);
    });
  });

  // 矢印ライン
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(barX, barY + maxH + 8);
  ctx.lineTo(W - 50, barY + maxH + 8);
  ctx.stroke();
  ctx.setLineDash([]);

  // 補足
  ctx.fillStyle = '#9ca3af';
  ctx.font = '11px sans-serif';
  ctx.fillText('thought-analyzer — integrative_complexity', 50, H - 20);

  fs.writeFileSync('C:/Users/yoshi/Documents/skills/thought-analyzer/images/chart-b-ic-scale.png', canvas.toBuffer('image/png'));
  console.log('B saved');
}

// ──────────────────────────────────────────────────────
// C. サンプルフィンガープリント（レーダーチャート）
// ──────────────────────────────────────────────────────
function generateRadar() {
  const W = 760, H = 780;
  const canvas = createCanvas(W * SCALE, H * SCALE);
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = '#0f1623';
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 30;
  const R = 210;

  // タイトル
  ctx.fillStyle = '#f3f4f6';
  ctx.font = 'bold 20px sans-serif';
  const titleW = ctx.measureText('サンプル フィンガープリント').width;
  ctx.fillText('サンプル フィンガープリント', W / 2 - titleW / 2, 38);
  ctx.fillStyle = '#6b7280';
  ctx.font = '13px sans-serif';
  const subW = ctx.measureText('thought-analyzer — 架空ユーザーの例示').width;
  ctx.fillText('thought-analyzer — 架空ユーザーの例示', W / 2 - subW / 2, 60);

  const axes = [
    { label: 'abstraction\ndirection', val: 0.75 },
    { label: 'problem\nstyle', val: 0.85 },
    { label: 'perspective\ntaking', val: 1.0 },
    { label: 'face\nstrategy', val: 0.62 },
    { label: 'concept\ndistance', val: 0.90 },
    { label: 'evaluation\nframing', val: 0.7 },
    { label: 'need for\ncognition', val: 1.0 },
    { label: 'integrative\ncomplexity', val: 5 / 7 },
    { label: 'epistemic\ncuriosity', val: 0.6 },
  ];

  const n = axes.length;
  const angleStep = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2;

  // グリッド（同心多角形）
  [0.2, 0.4, 0.6, 0.8, 1.0].forEach(t => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = startAngle + i * angleStep;
      const x = cx + Math.cos(a) * R * t;
      const y = cy + Math.sin(a) * R * t;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(100,120,180,${t === 1.0 ? 0.25 : 0.12})`;
    ctx.lineWidth = t === 1.0 ? 1.2 : 0.8;
    ctx.stroke();
  });

  // 軸線
  for (let i = 0; i < n; i++) {
    const a = startAngle + i * angleStep;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.strokeStyle = 'rgba(100,120,200,0.2)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // データ多角形
  ctx.beginPath();
  axes.forEach(({ val }, i) => {
    const a = startAngle + i * angleStep;
    const x = cx + Math.cos(a) * R * val;
    const y = cy + Math.sin(a) * R * val;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(120,160,255,0.18)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,190,255,0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ノード
  axes.forEach(({ val }, i) => {
    const a = startAngle + i * angleStep;
    const x = cx + Math.cos(a) * R * val;
    const y = cy + Math.sin(a) * R * val;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180,210,255,0.95)';
    ctx.fill();
  });

  // 軸ラベル
  ctx.fillStyle = '#d1d5db';
  ctx.font = '13px monospace';
  axes.forEach(({ label }, i) => {
    const a = startAngle + i * angleStep;
    const lx = cx + Math.cos(a) * (R + 46);
    const ly = cy + Math.sin(a) * (R + 46);
    const lines = label.split('\n');
    lines.forEach((line, li) => {
      const lw = ctx.measureText(line).width;
      ctx.fillText(line, lx - lw / 2, ly + (li - (lines.length - 1) / 2) * 16);
    });
  });

  // 凡例
  ctx.fillStyle = '#6b7280';
  ctx.font = '10px sans-serif';
  ctx.fillText('* 値は0〜1に正規化。integrative_complexityは1〜7を0〜1にスケール変換', 40, H - 20);

  fs.writeFileSync('C:/Users/yoshi/Documents/skills/thought-analyzer/images/chart-c-radar.png', canvas.toBuffer('image/png'));
  console.log('C saved');
}

// ──────────────────────────────────────────────────────
// D. I型 vs D型（認識論的好奇心）対比図
// ──────────────────────────────────────────────────────
function generateCuriosity() {
  const W = 900, H = 400;
  const canvas = createCanvas(W * SCALE, H * SCALE);
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = '#fafaf8';
  ctx.fillRect(0, 0, W, H);

  // タイトル
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('認識論的好奇心の2類型', 50, 48);
  ctx.fillStyle = '#6b7280';
  ctx.font = '14px sans-serif';
  ctx.fillText('Litman & Spielberger (2003) — Epistemic Curiosity', 50, 70);

  const panels = [
    {
      type: 'I型（Interest-type）',
      color: [100, 170, 200],
      bg: [230, 245, 252],
      keyword: '興味・探索',
      motive: '知ること自体が目的',
      trigger: '「面白そう」「試してみたい」',
      behavior: '広く・横断的に探索する',
      strength: '知識の幅が広がりやすい',
    },
    {
      type: 'D型（Deprivation-type）',
      color: [180, 120, 200],
      bg: [245, 235, 252],
      keyword: '欠乏・補完',
      motive: 'ギャップを埋めることが目的',
      trigger: '「わからないと落ち着かない」',
      behavior: '深く・一点集中で掘り下げる',
      strength: '専門性が高まりやすい',
    },
  ];

  panels.forEach((p, pi) => {
    const x = 50 + pi * 430;
    const y = 90;
    const pw = 400, ph = 280;
    const [r, g, b] = p.bg;

    // パネル背景
    roundRect(ctx, x, y, pw, ph, 12);
    ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.4)`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, pw, ph, 12);
    ctx.stroke();

    // タイプ名
    ctx.fillStyle = `rgb(${p.color[0]},${p.color[1]},${p.color[2]})`;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(p.type, x + 24, y + 32);

    // キーワードバッジ
    ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.15)`;
    roundRect(ctx, x + 24, y + 44, 90, 22, 11);
    ctx.fill();
    ctx.fillStyle = `rgb(${p.color[0]},${p.color[1]},${p.color[2]})`;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(p.keyword, x + 36, y + 60);

    const items = [
      ['動機', p.motive],
      ['トリガー', p.trigger],
      ['行動', p.behavior],
      ['強み', p.strength],
    ];

    items.forEach(([key, val], ii) => {
      const iy = y + 90 + ii * 46;
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.fillText(key, x + 24, iy);
      ctx.fillStyle = '#1f2937';
      ctx.font = '13px sans-serif';
      ctx.fillText(val, x + 24, iy + 18);
      if (ii < items.length - 1) {
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 24, iy + 30);
        ctx.lineTo(x + pw - 24, iy + 30);
        ctx.stroke();
      }
    });
  });

  // 中央の「mixed」
  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('mixed', W / 2 - 20, H / 2 + 5);
  ctx.font = '10px sans-serif';
  ctx.fillText('両方が混在', W / 2 - 22, H / 2 + 20);

  // フッター
  ctx.fillStyle = '#9ca3af';
  ctx.font = '11px sans-serif';
  ctx.fillText('thought-analyzer — epistemic_curiosity', 50, H - 16);

  fs.writeFileSync('C:/Users/yoshi/Documents/skills/thought-analyzer/images/chart-d-curiosity.png', canvas.toBuffer('image/png'));
  console.log('D saved');
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

generateIC();
generateRadar();
generateCuriosity();
console.log('All done.');
