/* Nocturne — rendu : ciel nocturne, notes de lumière, clavier, particules, halo */
'use strict';
(function () {
  const N = window.N;
  const R = (N.renderer = {});
  let cv, ctx, W = 1, H = 1, dpr = 1;
  let glowCv, glowCtx, blurA, blurACtx, blurB, blurBCtx, auroraCv, auroraCtx;
  const GLOW = 0.25;

  const L = (R.layout = { kbH: 160, kbTop: 0, hitY: 0, felt: 6, ww: 30, bw: 18, bh: 100 });
  const view = { start: 28, count: 36, tStart: 28, tCount: 36 };
  const keyPress = new Float32Array(128);
  const keyGlow = new Float32Array(128);
  const keyDown = new Uint8Array(128); // bit 1 joueur, bit 2 automatique
  const keyHand = new Array(128).fill('F');
  const keyWrong = new Float32Array(128);
  const keyHint = new Float32Array(128);
  const hintHand = new Array(128).fill('R');
  let energy = 0;

  // ---------- particules ----------
  const MAXP = 1400;
  const parts = [];
  for (let i = 0; i < MAXP; i++) parts.push({ on: false });
  let pHead = 0;
  const sprites = new Map();
  function sprite(color) {
    let s = sprites.get(color);
    if (s) return s;
    s = document.createElement('canvas');
    s.width = s.height = 64;
    const g = s.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.18, color);
    gr.addColorStop(0.45, color.replace('rgb(', 'rgba(').replace(')', ',0.35)'));
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    sprites.set(color, s);
    return s;
  }
  const rgbStr = (c) => `rgb(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]})`;
  const rgba = (c, a) => `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${a})`;

  function spawn(x, y, vx, vy, life, size, color) {
    const p = parts[pHead];
    pHead = (pHead + 1) % MAXP;
    p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.max = life; p.size = size; p.col = color;
  }
  const qMul = () => (N.settings.quality === 'low' ? 0.35 : N.settings.quality === 'medium' ? 0.7 : 1);

  // ---------- textes flottants ----------
  const pops = [];
  const rings = [];

  // ---------- étoiles ----------
  const stars = [];
  for (let i = 0; i < 150; i++) stars.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7, ph: Math.random() * 6.28, sp: 0.004 + Math.random() * 0.012 });

  R.init = function (canvas) {
    cv = canvas;
    ctx = cv.getContext('2d', { alpha: false });
    glowCv = document.createElement('canvas'); glowCtx = glowCv.getContext('2d');
    blurA = document.createElement('canvas'); blurACtx = blurA.getContext('2d');
    blurB = document.createElement('canvas'); blurBCtx = blurB.getContext('2d');
    auroraCv = document.createElement('canvas'); auroraCtx = auroraCv.getContext('2d');
    window.addEventListener('resize', R.resize);
    R.resize();
  };

  let gradWhite, gradBlack, gradBg, gradPanel, gradFelt, gradHaze, gradVignette;
  R.resize = function () {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(320, window.innerWidth);
    H = Math.max(240, window.innerHeight);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    glowCv.width = Math.ceil(W * GLOW); glowCv.height = Math.ceil(H * GLOW);
    blurA.width = glowCv.width; blurA.height = glowCv.height;
    blurB.width = Math.ceil(W * GLOW * 0.5); blurB.height = Math.ceil(H * GLOW * 0.5);
    auroraCv.width = Math.ceil(W / 6); auroraCv.height = Math.ceil(H / 6);
    computeLayout();
    gradBg = ctx.createLinearGradient(0, 0, 0, H);
    gradBg.addColorStop(0, '#05060d');
    gradBg.addColorStop(0.55, '#080a18');
    gradBg.addColorStop(1, '#0c0f22');
    gradVignette = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.45, Math.max(W, H) * 0.8);
    gradVignette.addColorStop(0, 'rgba(0,0,0,0)');
    gradVignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    document.documentElement.style.setProperty('--kb-h', Math.round(H - L.hitY) + 'px');
  };

  function computeLayout() {
    const ww = W / Math.max(10, view.count);
    let kbH = N.clamp(H * 0.2, 96, 230);
    kbH = Math.min(kbH, Math.max(110, ww * 7));
    L.kbH = kbH;
    L.felt = 7;
    L.kbTop = H - kbH;
    L.hitY = L.kbTop - L.felt;
    gradWhite = ctx.createLinearGradient(0, L.kbTop, 0, H);
    gradWhite.addColorStop(0, '#d9dae3');
    gradWhite.addColorStop(0.06, '#f7f7fa');
    gradWhite.addColorStop(0.82, '#ececf2');
    gradWhite.addColorStop(1, '#c9cad6');
    gradBlack = ctx.createLinearGradient(0, L.kbTop, 0, L.kbTop + kbH * 0.63);
    gradBlack.addColorStop(0, '#08080c');
    gradBlack.addColorStop(0.75, '#1d1e27');
    gradBlack.addColorStop(0.9, '#2c2d38');
    gradBlack.addColorStop(1, '#121219');
    gradPanel = ctx.createLinearGradient(0, L.hitY, 0, H);
    gradPanel.addColorStop(0, '#0b0c14');
    gradPanel.addColorStop(1, '#040408');
    gradFelt = ctx.createLinearGradient(0, L.hitY, 0, L.kbTop);
    gradFelt.addColorStop(0, '#5a1426');
    gradFelt.addColorStop(1, '#25060e');
    gradHaze = ctx.createLinearGradient(0, L.hitY - 140, 0, L.hitY);
    gradHaze.addColorStop(0, 'rgba(70,110,255,0)');
    gradHaze.addColorStop(1, 'rgba(90,140,255,0.11)');
  }

  // ---------- plage visible ----------
  R.setRange = function (lo, hi, instant) {
    lo = N.clamp(lo, 21, 108); hi = N.clamp(hi, 21, 108);
    if (N.isBlack(lo)) lo--;
    if (N.isBlack(hi)) hi++;
    const s = N.whiteIndex(lo), e = N.whiteIndex(hi) + 1;
    view.tStart = s; view.tCount = Math.max(7, e - s);
    if (instant) { view.start = view.tStart; view.count = view.tCount; computeLayout(); R.resize(); }
  };
  R.range = () => ({ start: view.tStart, count: view.tCount });

  function geom(m) {
    const ww = W / view.count;
    const cx = (N.whiteIndex(m) + 0.5 - view.start) * ww;
    if (!N.isBlack(m)) return { x: cx - ww / 2, w: ww, cx, black: false };
    const bw = ww * 0.58;
    const pc = N.pc(m);
    const shift = pc === 1 ? -0.12 : pc === 3 ? 0.12 : pc === 6 ? -0.14 : pc === 10 ? 0.14 : 0;
    const c = cx + shift * bw;
    return { x: c - bw / 2, w: bw, cx: c, black: true };
  }
  R.geom = geom;
  function visibleMidiRange() {
    // de la première à la dernière touche visible
    let lo = 21, hi = 108;
    for (let m = 21; m <= 108; m++) { const g = geom(m); if (g.x + g.w >= 0) { lo = m; break; } }
    for (let m = 108; m >= 21; m--) { const g = geom(m); if (g.x <= W) { hi = m; break; } }
    return [lo, hi];
  }

  R.keyAt = function (x, y) {
    if (y < L.kbTop || y > H) return null;
    const [lo, hi] = visibleMidiRange();
    const bh = L.kbH * 0.63;
    if (y < L.kbTop + bh) {
      for (let m = lo; m <= hi; m++) {
        if (!N.isBlack(m)) continue;
        const g = geom(m);
        if (x >= g.x && x <= g.x + g.w) return { midi: m, depth: (y - L.kbTop) / bh };
      }
    }
    for (let m = lo; m <= hi; m++) {
      if (N.isBlack(m)) continue;
      const g = geom(m);
      if (x >= g.x && x < g.x + g.w) return { midi: m, depth: (y - L.kbTop) / L.kbH };
    }
    return null;
  };

  // ---------- évènements visuels ----------
  R.pressKey = function (m, hand, src) {
    if (m < 0 || m > 127) return;
    keyDown[m] |= src === 'auto' ? 2 : 1;
    keyHand[m] = hand;
    keyGlow[m] = 1;
    energy = Math.min(1.6, energy + 0.12);
  };
  R.releaseKey = function (m, src) {
    if (m < 0 || m > 127) return;
    keyDown[m] &= src === 'auto' ? ~2 : ~1;
  };
  R.clearKeys = function () { keyDown.fill(0); };
  R.wrong = function (m) { if (m >= 0 && m < 128) keyWrong[m] = 1; };
  R.setHint = function (m, v, hand) { if (m >= 0 && m < 128) { keyHint[m] = Math.max(keyHint[m], v); hintHand[m] = hand; } };
  R.burst = function (m, hand, strength) {
    const g = geom(m);
    const c = rgbStr(N.colorFor(hand, m));
    const n = Math.round((10 + 14 * (strength || 1)) * qMul());
    for (let i = 0; i < n; i++) {
      spawn(g.cx + N.rand(-g.w * 0.4, g.w * 0.4), L.hitY - N.rand(0, 6), N.rand(-70, 70), N.rand(-420, -110), N.rand(0.45, 1.2), N.rand(1.6, 3.6), c);
    }
  };
  R.popup = function (m, text, color, big) {
    const g = geom(m);
    pops.push({ x: g.cx, y: L.hitY - 26, text, color, t: 0, big: !!big });
    if (pops.length > 24) pops.shift();
  };
  R.ring = function (color) { rings.push({ t: 0, color }); };
  R.fireworks = function () {
    const cols = ['rgb(63,220,255)', 'rgb(183,123,255)', 'rgb(255,210,122)'];
    for (let k = 0; k < 5; k++) {
      const x = N.rand(W * 0.2, W * 0.8), y = N.rand(L.hitY * 0.2, L.hitY * 0.6), c = N.pick(cols);
      for (let i = 0; i < 46 * qMul(); i++) {
        const a = Math.random() * 6.283, s = N.rand(60, 320);
        spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, N.rand(0.8, 1.8), N.rand(1.5, 3.2), c);
      }
    }
  };

  // ---------- dessin ----------
  function roundRect(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r);
    else c.rect(x, y, w, h);
  }

  function drawBackground(t) {
    ctx.fillStyle = gradBg;
    ctx.fillRect(0, 0, W, H);
    // aurore à basse résolution
    const aw = auroraCv.width, ah = auroraCv.height;
    auroraCtx.clearRect(0, 0, aw, ah);
    auroraCtx.globalCompositeOperation = 'lighter';
    const e = 0.55 + Math.min(1, energy) * 0.45;
    const blobs = [
      [0.22 + 0.08 * Math.sin(t * 0.07), 0.35 + 0.06 * Math.sin(t * 0.11), 0.55, [20, 120, 150], 0.30],
      [0.72 + 0.07 * Math.cos(t * 0.05), 0.28 + 0.05 * Math.sin(t * 0.09), 0.6, [70, 40, 170], 0.32],
      [0.5 + 0.18 * Math.sin(t * 0.04), 0.62 + 0.04 * Math.cos(t * 0.08), 0.5, [120, 30, 120], 0.16],
      [0.9 + 0.05 * Math.sin(t * 0.06), 0.7, 0.4, [20, 80, 160], 0.14],
    ];
    for (const [bx, by, br, col, a] of blobs) {
      const x = bx * aw, y = by * ah, r = br * Math.max(aw, ah);
      const g = auroraCtx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a * e})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      auroraCtx.fillStyle = g;
      auroraCtx.fillRect(0, 0, aw, ah);
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(auroraCv, 0, 0, W, L.hitY + 40);
    // étoiles
    for (const s of stars) {
      s.y -= s.sp * 0.016 * (0.4 + energy * 0.6);
      if (s.y < 0) { s.y = 1; s.x = Math.random(); }
      const tw = 0.5 + 0.5 * Math.sin(t * (0.8 + s.z) + s.ph);
      const a = (0.12 + 0.5 * tw) * s.z * 0.8;
      const y = s.y * L.hitY;
      ctx.fillStyle = `rgba(200,220,255,${a})`;
      const sz = s.z * 1.6;
      ctx.fillRect(s.x * W, y, sz, sz);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawLanes(lo, hi, subtle) {
    if (!subtle) {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      for (let m = lo; m <= hi; m++) {
        if (!N.isBlack(m)) continue;
        const g = geom(m);
        ctx.fillRect(g.x, 0, g.w, L.hitY);
      }
    }
    for (let m = lo; m <= hi; m++) {
      const pc = N.pc(m);
      if (pc !== 0 && (pc !== 5 || subtle)) continue;
      const g = geom(m);
      if (subtle) {
        const gr = ctx.createLinearGradient(0, 0, 0, L.hitY);
        gr.addColorStop(0, 'rgba(160,180,255,0)');
        gr.addColorStop(1, 'rgba(160,180,255,0.07)');
        ctx.fillStyle = gr;
      } else ctx.fillStyle = pc === 0 ? 'rgba(160,180,255,0.075)' : 'rgba(160,180,255,0.035)';
      ctx.fillRect(Math.round(g.x), 0, 1, L.hitY);
    }
  }

  function noteLabel(n, usingPc) {
    if (usingPc && N.settings.showPcLabels) {
      const l = N.input.labelForMidi(n.midi, n.hand === 'L' ? 'L' : 'R');
      if (l) return l;
    }
    if (N.settings.namesOnNotes || !usingPc) return N.noteName(n.midi);
    return '';
  }
  R.noteLabel = noteLabel;

  // pastille en forme de touche de clavier : lettre bien lisible
  const PUNCT = /^[;:,.!'^$*<>=\-ù²&()_]$/i;
  function keycap(c2, cx, y, s, text, st) {
    const fs = Math.round(s * (text.length > 2 ? 0.4 : text.length > 1 ? 0.48 : PUNCT.test(text) ? 0.8 : 0.6));
    c2.font = `800 ${fs}px Manrope, "Segoe UI", sans-serif`;
    const tw = c2.measureText(text).width;
    const w = Math.max(s, tw + s * 0.45), h = s, r = s * 0.24;
    const x = cx - w / 2;
    if (st.shadow) { c2.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(c2, x, y + s * 0.09, w, h, r); c2.fill(); }
    c2.fillStyle = st.bg;
    roundRect(c2, x, y, w, h, r); c2.fill();
    if (st.border) {
      c2.strokeStyle = st.border; c2.lineWidth = Math.max(1.2, s * 0.07);
      roundRect(c2, x + 0.5, y + 0.5, w - 1, h - 1, r); c2.stroke();
    }
    c2.fillStyle = st.color;
    c2.textAlign = 'center';
    c2.textBaseline = 'middle';
    c2.fillText(text, cx, y + h * 0.54);
    c2.textBaseline = 'alphabetic';
    return w;
  }

  function drawSong(S, now) {
    const t = S.t;
    const pps = R.pps(S);
    const [lo, hi] = visibleMidiRange();
    drawLanes(lo, hi);
    // barres de mesure
    if (N.settings.showBars && S.song.bars) {
      ctx.font = '600 11px Manrope, "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      const bars = S.song.bars;
      let i = 0, hiI = bars.length;
      while (i < hiI) { const mid = (i + hiI) >> 1; if (bars[mid] < t - 0.05) i = mid + 1; else hiI = mid; }
      const first = S.song.hasPickup ? 0 : 1;
      for (; i < bars.length; i++) {
        const y = L.hitY - (bars[i] - t) * pps;
        if (y > L.hitY) continue;
        if (y < -10) break;
        ctx.fillStyle = 'rgba(170,190,255,0.08)';
        ctx.fillRect(0, Math.round(y), W, 1);
        ctx.fillStyle = 'rgba(170,190,255,0.28)';
        ctx.fillText(String(i + first), 8, y - 4);
      }
    }
    // boucle A-B
    if (S.loop.on) {
      const ya = L.hitY - (S.loop.a - t) * pps, yb = L.hitY - (S.loop.b - t) * pps;
      ctx.fillStyle = 'rgba(255,210,122,0.05)';
      ctx.fillRect(0, Math.max(0, yb), W, Math.min(L.hitY, ya) - Math.max(0, yb));
      ctx.fillStyle = 'rgba(255,210,122,0.45)';
      if (ya > 0 && ya < L.hitY) ctx.fillRect(0, ya, W, 1.5);
      if (yb > 0 && yb < L.hitY) ctx.fillRect(0, yb, W, 1.5);
    }
    // notes
    const usingPc = N.input.usingPc();
    const topT = t + (L.hitY + 20) / pps;
    const notes = S.notes;
    const i0 = N.lowerBound(notes, t - S.maxDur - 0.2);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, L.hitY); ctx.clip();
    const pulse = 0.5 + 0.5 * Math.sin(now * 7);
    for (let i = i0; i < notes.length; i++) {
      const n = notes[i];
      if (n.t > topT) break;
      const yb = L.hitY - (n.t - t) * pps;
      const yt = L.hitY - (n.t + n.d - t) * pps;
      if (yt > L.hitY && n.state !== 2) continue;
      if (n.midi < lo - 1 || n.midi > hi + 1) continue;
      const g = geom(n.midi);
      const c = N.colorFor(n.hand, n.midi);
      const nw = g.black ? g.w * 0.86 : g.w * 0.8;
      const x = g.cx - nw / 2;
      const h = Math.max(7, yb - yt);
      const y = yb - h;
      const accomp = n.role === 'auto' && S.play !== 'demo';
      const autoLit = n.role === 'auto' && t >= n.t && t <= n.t + n.d && !(S.waiting && n.t >= t - 0.001);
      const lit = (n.state === 1 && t <= n.t + n.d + 0.02) || autoLit;
      let alpha = 1;
      if (accomp) alpha = autoLit ? 0.62 : 0.4;
      if (n.role === 'mute') alpha = 0.16;
      if (n.state === 2) alpha = 0.28;
      ctx.globalAlpha = alpha;
      const r = Math.min(7, nw * 0.3);
      if (n.state === 2) {
        ctx.fillStyle = '#4a4f66';
        roundRect(ctx, x, y, nw, h, r); ctx.fill();
      } else if (accomp) {
        ctx.fillStyle = autoLit ? c.main : c.deep;
        roundRect(ctx, x, y, nw, h, r); ctx.fill();
        ctx.strokeStyle = c.main; ctx.lineWidth = 1;
        roundRect(ctx, x + 0.5, y + 0.5, nw - 1, h - 1, r); ctx.stroke();
      } else if (lit) {
        const gr = ctx.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, c.main);
        gr.addColorStop(Math.max(0, 1 - 40 / h), c.main);
        gr.addColorStop(1, c.core);
        ctx.fillStyle = gr;
        roundRect(ctx, x, y, nw, h, r); ctx.fill();
      } else {
        // corps sombre et saturé + bord lumineux : on lit la lettre sans être ébloui
        ctx.fillStyle = g.black ? c.bodyB : c.body;
        roundRect(ctx, x, y, nw, h, r); ctx.fill();
        ctx.strokeStyle = c.main;
        ctx.lineWidth = 1.6;
        roundRect(ctx, x + 0.8, y + 0.8, nw - 1.6, h - 1.6, r); ctx.stroke();
        ctx.fillStyle = rgba(c, 0.5);
        ctx.fillRect(x + r * 0.6, y + 2, nw - r * 1.2, 2);
        if (n.role === 'player' && n.state === 0 && S.waiting && n.t <= t + 0.03) {
          ctx.globalAlpha = 0.45 + 0.55 * pulse;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          roundRect(ctx, x - 2, y - 2, nw + 4, h + 4, r + 2); ctx.stroke();
        }
      }
      // étiquettes (dessinées après le halo pour rester nettes)
      if ((n.role === 'player' || S.play === 'demo') && n.state !== 2) {
        const lab = noteLabel(n, usingPc);
        const s = N.clamp(nw * 0.68, 16, 38);
        let top = yb - s - 5;
        if (top < y + 3 && h < s + 8) top = yb - s - 2;
        labelQueue.push({ cx: g.cx, top, s, lab, lit, finger: n.finger && h > s * 1.9 + 10 ? n.finger : 0, yb });
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  const labelQueue = [];
  function drawLabels() {
    if (!labelQueue.length) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, L.hitY); ctx.clip();
    for (const q of labelQueue) {
      if (q.lab) {
        keycap(ctx, q.cx, q.top, q.s, q.lab, q.lit
          ? { bg: 'rgba(255,255,255,0.94)', color: '#071226', border: null }
          : { bg: 'rgba(5,8,20,0.85)', color: '#ffffff', border: 'rgba(255,255,255,0.6)', shadow: true });
      }
      if (q.finger) {
        const fy = (q.lab ? q.top : q.yb) - q.s * 0.4;
        ctx.font = `800 ${Math.round(q.s * 0.42)}px Manrope, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(String(q.finger), q.cx, fy);
      }
    }
    ctx.restore();
    labelQueue.length = 0;
  }

  // grosses pastilles sur les touches du piano à jouer bientôt
  function drawKeyTargets(lo, hi) {
    const usingPc = N.input.usingPc();
    const top = L.kbTop, kbH = L.kbH, bh = kbH * 0.63;
    for (let m = lo; m <= hi; m++) {
      const hv = keyHint[m];
      if (hv < 0.06) continue;
      const g = geom(m);
      const c = N.colorFor(hintHand[m], m);
      const lab = usingPc && N.settings.showPcLabels ? N.input.labelForMidi(m, hintHand[m]) : N.noteName(m);
      if (!lab) continue;
      const s = g.black ? N.clamp(g.w * 1.05, 18, 30) : N.clamp(g.w * 0.74, 18, 38);
      const y = g.black ? top + bh - s - 8 : top + kbH * 0.62 - s / 2;
      const strong = hv > 0.82;
      ctx.globalAlpha = N.clamp(0.35 + hv * 0.75, 0, 1);
      if (strong) {
        ctx.shadowColor = c.main; ctx.shadowBlur = 18;
        keycap(ctx, g.cx, y, s, lab, { bg: c.main, color: '#04101f', border: 'rgba(255,255,255,0.95)' });
        ctx.shadowBlur = 0;
      } else keycap(ctx, g.cx, y, s, lab, { bg: 'rgba(6,10,24,0.88)', color: '#ffffff', border: c.main });
    }
    ctx.globalAlpha = 1;
  }

  function drawGlowSong(S) {
    const t = S.t, pps = R.pps(S);
    const topT = t + (L.hitY + 20) / pps;
    const notes = S.notes;
    const i0 = N.lowerBound(notes, t - S.maxDur - 0.2);
    for (let i = i0; i < notes.length; i++) {
      const n = notes[i];
      if (n.t > topT) break;
      if (n.state === 2 || n.role === 'mute') continue;
      const yb = Math.min(L.hitY, L.hitY - (n.t - t) * pps);
      const yt = L.hitY - (n.t + n.d - t) * pps;
      if (yt >= L.hitY) continue;
      const g = geom(n.midi);
      const c = N.colorFor(n.hand, n.midi);
      const accomp = n.role === 'auto' && S.play !== 'demo';
      const lit = (n.state === 1 && t <= n.t + n.d) || (n.role === 'auto' && t >= n.t && t <= n.t + n.d && !(S.waiting && n.t >= t - 0.001));
      const nw = g.black ? g.w * 0.86 : g.w * 0.8;
      if (lit) {
        glowCtx.globalAlpha = accomp ? 0.2 : 0.6;
        glowCtx.fillStyle = c.main;
        glowCtx.fillRect(g.cx - nw / 2, yt, nw, Math.max(6, yb - yt));
      } else {
        // halo autour du bord seulement, pour ne pas noyer la lettre
        glowCtx.globalAlpha = accomp ? 0.08 : 0.5;
        glowCtx.strokeStyle = c.main;
        glowCtx.lineWidth = 6;
        glowCtx.strokeRect(g.cx - nw / 2, yt, nw, Math.max(6, yb - yt));
      }
    }
    glowCtx.globalAlpha = 1;
  }

  // ---------- jeu libre : rubans de lumière ----------
  const RISE = 210;
  function drawRibbons(now, glow) {
    const rib = N.game.free.ribbons;
    const c2 = glow ? glowCtx : ctx;
    for (let i = rib.length - 1; i >= 0; i--) {
      const r = rib[i];
      const yt = L.hitY - (now - r.t0) * RISE;
      const yb = r.t1 == null ? L.hitY : L.hitY - (now - r.t1) * RISE;
      if (yb < -30) { if (!glow) rib.splice(i, 1); continue; }
      const g = geom(r.midi);
      const c = N.colorFor(r.hand, r.midi);
      const w = (g.black ? g.w * 0.72 : g.w * 0.58) * (0.8 + 0.2 * r.vel);
      const h = Math.max(4, yb - yt);
      const fade = N.clamp(yb / (L.hitY * 0.9), 0, 1);
      const held = r.t1 == null;
      if (glow) {
        c2.globalAlpha = 0.6 * fade;
        c2.fillStyle = c.main;
        c2.fillRect(g.cx - w / 2, yt, w, h);
        continue;
      }
      const gr = ctx.createLinearGradient(0, yt, 0, yb);
      gr.addColorStop(0, rgba(c, 0));
      gr.addColorStop(Math.min(0.6, 90 / h), rgba(c, 0.42 * fade));
      gr.addColorStop(1, rgba(c, (held ? 0.9 : 0.7) * fade));
      ctx.fillStyle = gr;
      roundRect(ctx, g.cx - w / 2, yt, w, h, Math.min(8, w * 0.5));
      ctx.fill();
      // filament central plus clair
      const cw = Math.max(1.5, w * 0.22);
      const gc = ctx.createLinearGradient(0, yt, 0, yb);
      gc.addColorStop(0, 'rgba(255,255,255,0)');
      gc.addColorStop(1, held ? c.core : `rgba(255,255,255,${0.55 * fade})`);
      ctx.fillStyle = gc;
      ctx.fillRect(g.cx - cw / 2, yt + 6, cw, Math.max(0, h - 6));
    }
    if (glow) c2.globalAlpha = 1;
  }

  function drawHitLine(lo, hi) {
    ctx.fillStyle = gradHaze;
    ctx.fillRect(0, L.hitY - 140, W, 140);
    const gl = ctx.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, 'rgba(120,170,255,0.05)');
    gl.addColorStop(0.5, 'rgba(170,215,255,0.55)');
    gl.addColorStop(1, 'rgba(120,170,255,0.05)');
    ctx.fillStyle = gl;
    ctx.fillRect(0, L.hitY - 1, W, 2);
    // lumière des touches actives
    ctx.globalCompositeOperation = 'lighter';
    for (let m = lo; m <= hi; m++) {
      const v = keyGlow[m];
      if (v < 0.02) continue;
      const g = geom(m);
      const c = N.colorFor(keyHand[m], m);
      const r = Math.max(30, g.w * 2.6);
      const gr = ctx.createRadialGradient(g.cx, L.hitY, 0, g.cx, L.hitY, r);
      gr.addColorStop(0, rgba(c, 0.55 * v));
      gr.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(g.cx - r, L.hitY - r, r * 2, r * 2);
      if (keyDown[m]) {
        const bh = 170;
        const gb = ctx.createLinearGradient(0, L.hitY - bh, 0, L.hitY);
        gb.addColorStop(0, rgba(c, 0));
        gb.addColorStop(1, rgba(c, 0.16 * v));
        ctx.fillStyle = gb;
        ctx.fillRect(g.x, L.hitY - bh, g.w, bh);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawKeyboard(lo, hi, now) {
    ctx.fillStyle = gradPanel;
    ctx.fillRect(0, L.hitY, W, H - L.hitY);
    ctx.fillStyle = gradFelt;
    ctx.fillRect(0, L.hitY, W, L.felt);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fillRect(0, L.hitY, W, 1);
    const kbH = L.kbH, top = L.kbTop;
    const usingPc = N.input.usingPc();
    const showPc = usingPc && N.settings.showPcLabels;
    const names = N.settings.namesOnKeys;
    const ww = W / view.count;
    const fsW = N.clamp(ww * 0.3, 8, 13);
    // touches blanches
    for (let m = lo; m <= hi; m++) {
      if (N.isBlack(m)) continue;
      const g = geom(m);
      const p = keyPress[m];
      const x = g.x + 0.5, w = g.w - 1;
      ctx.fillStyle = gradWhite;
      roundRect(ctx, x, top, w, kbH - 2 + p * 2, 4);
      ctx.fill();
      const hint = keyHint[m];
      if (p > 0.01 || keyWrong[m] > 0.01 || hint > 0.02) {
        const c = keyWrong[m] > 0.01 && !keyDown[m] ? N.HANDS.X : N.colorFor(keyHand[m], m);
        if (p > 0.01 || keyWrong[m] > 0.01) {
          const a = Math.max(p, keyWrong[m]);
          const gr = ctx.createLinearGradient(0, top, 0, H);
          gr.addColorStop(0, rgba(c, 0.85 * a));
          gr.addColorStop(1, rgba(c, 0.35 * a));
          ctx.fillStyle = gr;
          roundRect(ctx, x, top, w, kbH - 2 + p * 2, 4);
          ctx.fill();
        }
        if (hint > 0.02 && p < 0.5) {
          const hc = N.colorFor(hintHand[m], m);
          ctx.fillStyle = rgba(hc, 0.32 * hint);
          roundRect(ctx, x + 2, top + kbH * 0.66, w - 4, kbH * 0.3, 4);
          ctx.fill();
        }
      }
      // séparation et ombre haute
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(g.x, top, 1, kbH);
      // étiquettes
      ctx.textAlign = 'center';
      let ly = H - 9;
      if (showPc) {
        const lab = N.input.labelForMidi(m, m >= 60 ? 'R' : 'L');
        if (lab) {
          ctx.font = `700 ${fsW}px Manrope, "Segoe UI", sans-serif`;
          ctx.fillStyle = p > 0.3 ? 'rgba(10,20,40,0.85)' : 'rgba(70,76,100,0.8)';
          ctx.fillText(lab, g.cx, ly);
          ly -= fsW + 5;
        }
      }
      if ((names === 'all' || (names === 'c' && N.pc(m) === 0)) && ww > 14) {
        ctx.font = `600 ${Math.max(8, fsW - 2)}px Manrope, "Segoe UI", sans-serif`;
        ctx.fillStyle = N.pc(m) === 0 ? 'rgba(80,90,130,0.85)' : 'rgba(110,116,140,0.7)';
        ctx.fillText(N.pc(m) === 0 ? N.noteName(m, null, true) : N.noteName(m), g.cx, ly);
      } else if (m === 60) {
        ctx.fillStyle = 'rgba(80,100,170,0.55)';
        ctx.beginPath(); ctx.arc(g.cx, ly - 3, 2.5, 0, 6.283); ctx.fill();
      }
    }
    // ombre portée des touches noires
    const bh = kbH * 0.63;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    for (let m = lo; m <= hi; m++) {
      if (!N.isBlack(m)) continue;
      const g = geom(m);
      ctx.fillRect(g.x + 2, top, g.w, bh + 5);
    }
    // touches noires
    for (let m = lo; m <= hi; m++) {
      if (!N.isBlack(m)) continue;
      const g = geom(m);
      const p = keyPress[m];
      ctx.fillStyle = gradBlack;
      roundRect(ctx, g.x, top - 1, g.w, bh + 1 - p * 2, 3);
      ctx.fill();
      if (p > 0.01 || keyWrong[m] > 0.01) {
        const c = keyWrong[m] > 0.01 && !keyDown[m] ? N.HANDS.X : N.colorFor(keyHand[m], m);
        const a = Math.max(p, keyWrong[m]);
        const gr = ctx.createLinearGradient(0, top, 0, top + bh);
        gr.addColorStop(0, rgba(c, 0.95 * a));
        gr.addColorStop(1, rgba(c, 0.55 * a));
        ctx.fillStyle = gr;
        roundRect(ctx, g.x, top - 1, g.w, bh + 1 - p * 2, 3);
        ctx.fill();
      }
      const hint = keyHint[m];
      if (hint > 0.02 && p < 0.5) {
        const hc = N.colorFor(hintHand[m], m);
        ctx.fillStyle = rgba(hc, 0.55 * hint);
        roundRect(ctx, g.x + 2, top + bh * 0.55, g.w - 4, bh * 0.38, 3);
        ctx.fill();
      }
      // biseau
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.fillRect(g.x + g.w * 0.16, top + 2, g.w * 0.1, bh - 12);
      if (showPc) {
        const lab = N.input.labelForMidi(m, m >= 60 ? 'R' : 'L');
        if (lab && g.w > 9) {
          ctx.font = `700 ${Math.max(7, Math.min(11, g.w * 0.5))}px Manrope, "Segoe UI", sans-serif`;
          ctx.fillStyle = p > 0.3 ? 'rgba(10,20,40,0.9)' : 'rgba(200,204,225,0.75)';
          ctx.textAlign = 'center';
          ctx.fillText(lab, g.cx, top + bh - 8);
        }
      }
    }
    void now;
  }

  function drawGlowKeys(lo, hi) {
    for (let m = lo; m <= hi; m++) {
      const v = keyGlow[m];
      if (v < 0.03) continue;
      const g = geom(m);
      const c = N.colorFor(keyHand[m], m);
      glowCtx.globalAlpha = 0.9 * v;
      glowCtx.fillStyle = c.main;
      glowCtx.fillRect(g.x, L.hitY - 4, g.w, 10);
    }
    glowCtx.globalAlpha = 0.35;
    glowCtx.fillStyle = '#9fd2ff';
    glowCtx.fillRect(0, L.hitY - 1, W, 2);
    glowCtx.globalAlpha = 1;
  }

  function drawParticles(dt) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < MAXP; i++) {
      const p = parts[i];
      if (!p.on) continue;
      p.life -= dt;
      if (p.life <= 0) { p.on = false; continue; }
      p.vx *= Math.pow(0.35, dt);
      p.vy = p.vy * Math.pow(0.45, dt) + 30 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = p.life / p.max;
      const s = p.size * (1.6 + 2.4 * k);
      ctx.globalAlpha = Math.min(1, k * 1.4);
      ctx.drawImage(sprite(p.col), p.x - s, p.y - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawPops(dt) {
    ctx.textAlign = 'center';
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.t += dt;
      if (p.t > 0.85) { pops.splice(i, 1); continue; }
      const a = p.t < 0.1 ? p.t / 0.1 : 1 - (p.t - 0.1) / 0.75;
      ctx.globalAlpha = Math.max(0, a);
      ctx.font = `800 ${p.big ? 26 : 15}px Manrope, "Segoe UI", sans-serif`;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fillText(p.text, p.x, p.y - p.t * 42);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t += dt;
      if (r.t > 0.9) { rings.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - r.t / 0.9;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(W / 2, L.hitY, 40 + r.t * W * 0.6, 8 + r.t * 50, 0, 0, 6.283);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- portée (lecture de notes) ----------
  function drawStaff(q) {
    const st = q.staff;
    if (!st) return;
    const cw = Math.min(560, W * 0.6), ch = Math.min(300, L.hitY * 0.55);
    const cx = W / 2 - cw / 2, cy = Math.max(90, L.hitY * 0.42 - ch / 2);
    ctx.fillStyle = 'rgba(10,12,26,0.72)';
    roundRect(ctx, cx, cy, cw, ch, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
    roundRect(ctx, cx + 0.5, cy + 0.5, cw - 1, ch - 1, 18); ctx.stroke();
    const sp = ch / 11; // interligne
    const midY = cy + ch / 2;
    const top = midY - 2 * sp; // ligne du haut
    const x0 = cx + 30, x1 = cx + cw - 30;
    ctx.strokeStyle = 'rgba(220,228,255,0.75)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) { const y = top + i * sp; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    // clé
    ctx.fillStyle = 'rgba(230,236,255,0.92)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const glyph = st.clef === 'bass' ? '\u{1D122}' : '\u{1D11E}';
    const fsz = st.clef === 'bass' ? sp * 3.4 : sp * 6.2;
    ctx.font = `${fsz}px "Segoe UI Symbol", "Noto Music", "Bravura", serif`;
    const m = ctx.measureText(glyph);
    const asc = m.actualBoundingBoxAscent || fsz * 0.75, desc = m.actualBoundingBoxDescent || fsz * 0.25;
    const gh = asc + desc;
    // clé de sol : de 1,5 interligne sous la portée à 1,5 au-dessus ; clé de fa : sur les 3 lignes du haut
    const wantTop = st.clef === 'bass' ? top - sp * 0.05 : top - sp * 1.6;
    const wantH = st.clef === 'bass' ? sp * 3.2 : sp * 7.2;
    const scale = wantH / gh;
    ctx.save();
    ctx.translate(x0 + 8, wantTop + asc * scale);
    ctx.scale(scale, scale);
    ctx.fillText(glyph, 0, 0);
    ctx.restore();
    // notes
    const baseStep = st.clef === 'bass' ? 18 : 30; // diatonique de la ligne du bas : Sol2 / Mi4
    const bottomY = top + 4 * sp;
    const nx0 = x0 + sp * 5.5;
    st.notes.forEach((n, k) => {
      const x = nx0 + k * sp * 3.2;
      const yStep = n.step - baseStep;
      const y = bottomY - yStep * (sp / 2);
      // lignes supplémentaires
      ctx.strokeStyle = 'rgba(220,228,255,0.75)';
      ctx.lineWidth = 1.4;
      for (let s = -2; s >= yStep; s -= 2) { const ly = bottomY - s * (sp / 2); ctx.beginPath(); ctx.moveTo(x - sp * 0.9, ly); ctx.lineTo(x + sp * 0.9, ly); ctx.stroke(); }
      for (let s = 10; s <= yStep; s += 2) { const ly = bottomY - s * (sp / 2); ctx.beginPath(); ctx.moveTo(x - sp * 0.9, ly); ctx.lineTo(x + sp * 0.9, ly); ctx.stroke(); }
      const col = n.state === 'ok' ? '#7dffb2' : n.state === 'bad' ? '#ff6d84' : '#f4f6ff';
      ctx.fillStyle = col;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.33);
      ctx.beginPath(); ctx.ellipse(0, 0, sp * 0.62, sp * 0.44, 0, 0, 6.283); ctx.fill();
      ctx.restore();
      // hampe
      ctx.strokeStyle = col; ctx.lineWidth = 1.6;
      ctx.beginPath();
      if (yStep < 4) { ctx.moveTo(x + sp * 0.56, y - 1); ctx.lineTo(x + sp * 0.56, y - sp * 3.3); }
      else { ctx.moveTo(x - sp * 0.56, y + 1); ctx.lineTo(x - sp * 0.56, y + sp * 3.3); }
      ctx.stroke();
      if (n.acc) {
        ctx.font = `600 ${sp * 1.6}px "Segoe UI Symbol", "Segoe UI", serif`;
        ctx.textAlign = 'center';
        ctx.fillText(n.acc, x - sp * 1.5, y + sp * 0.5);
      }
      if (n.label) {
        ctx.font = `700 ${Math.max(13, sp * 0.9)}px Manrope, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = col;
        ctx.fillText(n.label, x, cy + ch - 16);
      }
    });
  }

  // pixels par seconde de morceau
  R.pps = function (S) {
    const look = 2.7 / (N.settings.fallZoom || 1);
    return Math.max(60, (L.hitY - 70) / look);
  };

  let last = 0;
  R.frame = function (now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    const t = now / 1000;
    // animation de la plage
    const ps = view.start, pc = view.count;
    view.start = N.damp(view.start, view.tStart, 6, dt);
    view.count = N.damp(view.count, view.tCount, 6, dt);
    if (Math.abs(view.start - view.tStart) < 0.001) view.start = view.tStart;
    if (Math.abs(view.count - view.tCount) < 0.001) view.count = view.tCount;
    if (Math.abs(pc - view.count) > 0.0005 || ps !== view.start) {
      const oldH = L.kbH;
      computeLayout();
      if (Math.abs(oldH - L.kbH) > 0.5) document.documentElement.style.setProperty('--kb-h', Math.round(H - L.hitY) + 'px');
    }
    // états des touches
    for (let m = 0; m < 128; m++) {
      const target = keyDown[m] ? 1 : 0;
      keyPress[m] = target ? Math.min(1, keyPress[m] + dt * 30) : Math.max(0, keyPress[m] - dt * 9);
      keyGlow[m] = keyDown[m] ? Math.max(keyGlow[m] * Math.pow(0.6, dt), 0.65) : keyGlow[m] * Math.pow(0.02, dt);
      keyWrong[m] = Math.max(0, keyWrong[m] - dt * 2.5);
      keyHint[m] = Math.max(0, keyHint[m] - dt * 6);
    }
    energy = Math.max(0, energy - dt * 0.35);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackground(t);
    const G = N.game;
    const [lo, hi] = visibleMidiRange();
    const S = G.mode === 'song' ? G.session : null;
    if (S) drawSong(S, t);
    else {
      drawLanes(lo, hi, true);
      drawRibbons(t, false);
    }
    drawHitLine(lo, hi);

    // halo lumineux
    if (N.settings.quality !== 'low') {
      glowCtx.setTransform(1, 0, 0, 1, 0, 0);
      glowCtx.clearRect(0, 0, glowCv.width, glowCv.height);
      glowCtx.setTransform(GLOW, 0, 0, GLOW, 0, 0);
      if (S) drawGlowSong(S); else drawRibbons(t, true);
      drawGlowKeys(lo, hi);
      blurACtx.clearRect(0, 0, blurA.width, blurA.height);
      blurACtx.filter = 'blur(3px)';
      blurACtx.drawImage(glowCv, 0, 0);
      blurACtx.filter = 'none';
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = S ? 0.6 : 0.75;
      ctx.drawImage(blurA, 0, 0, W, H);
      if (N.settings.quality === 'high') {
        blurBCtx.clearRect(0, 0, blurB.width, blurB.height);
        blurBCtx.filter = 'blur(5px)';
        blurBCtx.drawImage(blurA, 0, 0, blurB.width, blurB.height);
        blurBCtx.filter = 'none';
        ctx.globalAlpha = S ? 0.7 : 0.9;
        ctx.drawImage(blurB, 0, 0, W, H);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    drawLabels();
    drawKeyboard(lo, hi, t);
    drawKeyTargets(lo, hi);
    drawParticles(dt);
    drawPops(dt);
    if (G.mode === 'quiz' && G.quiz) drawStaff(G.quiz);
    ctx.fillStyle = gradVignette;
    ctx.fillRect(0, 0, W, H);
    // étincelles continues des notes tenues
    if (Math.random() < 0.9) {
      for (let m = lo; m <= hi; m++) {
        if (!keyDown[m] || Math.random() > 0.35 * qMul()) continue;
        const g = geom(m);
        spawn(g.cx + N.rand(-g.w * 0.3, g.w * 0.3), L.hitY - 2, N.rand(-25, 25), N.rand(-150, -50), N.rand(0.35, 0.8), N.rand(1.1, 2.2), rgbStr(N.colorFor(keyHand[m], m)));
      }
    }
  };
})();
