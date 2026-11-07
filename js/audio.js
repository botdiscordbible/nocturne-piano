/* Nocturne — moteur audio : piano échantillonné (Salamander), synthés, réverbération, métronome */
'use strict';
(function () {
  const N = window.N;
  const A = (N.audio = {});
  let ctx = null;

  A.INSTRUMENTS = [
    { id: 'concert', name: 'Piano de concert', desc: 'Grand piano échantillonné' },
    { id: 'doux', name: 'Piano doux', desc: 'Piano feutré, synthétisé' },
    { id: 'electrique', name: 'Piano électrique', desc: 'Sonorité ronde et chaude' },
    { id: 'celesta', name: 'Célesta', desc: 'Cloches cristallines' },
    { id: 'orgue', name: 'Orgue', desc: 'Orgue à tirettes' },
  ];

  // Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0), version mp3 publiée par Tone.js
  const SAMPLE_FILES = ['A0', 'C1', 'Ds1', 'Fs1', 'A1', 'C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6', 'Ds6', 'Fs6', 'A6', 'C7', 'Ds7', 'Fs7', 'A7', 'C8'];
  const SAMPLE_BASES = ['https://tonejs.github.io/audio/salamander/'];
  A.samples = { state: 'idle', loaded: 0, total: SAMPLE_FILES.length, failed: 0, fromCache: 0 };
  const buffers = new Map();
  let sampleKeys = [];

  function fileMidi(name) {
    const m = /^([A-G])(s?)(\d)$/.exec(name);
    return N.parsePitch(m[1] + (m[2] ? '#' : '') + m[3]);
  }

  A.ready = () => !!ctx;
  A.now = () => (ctx ? ctx.currentTime : 0);
  A.instrument = function () {
    const id = N.settings.instrument;
    if (id === 'concert' && !sampleKeys.length) return 'doux';
    return id;
  };

  // ---------- graphe ----------
  A.init = function () {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
    A.ctx = ctx;
    A.master = ctx.createGain();
    A.eqLow = ctx.createBiquadFilter(); A.eqLow.type = 'lowshelf'; A.eqLow.frequency.value = 220;
    A.eqHigh = ctx.createBiquadFilter(); A.eqHigh.type = 'highshelf'; A.eqHigh.frequency.value = 3200;
    A.limiter = ctx.createDynamicsCompressor();
    A.limiter.threshold.value = -9; A.limiter.knee.value = 8; A.limiter.ratio.value = 8;
    A.limiter.attack.value = 0.002; A.limiter.release.value = 0.22;
    A.master.connect(A.eqLow); A.eqLow.connect(A.eqHigh); A.eqHigh.connect(A.limiter); A.limiter.connect(ctx.destination);

    A.dry = ctx.createGain(); A.dry.connect(A.master);
    A.revSend = ctx.createGain(); A.revSend.gain.value = 1;
    A.reverb = ctx.createConvolver(); A.reverb.buffer = buildIR(2.7);
    A.revReturn = ctx.createGain();
    A.revSend.connect(A.reverb); A.reverb.connect(A.revReturn); A.revReturn.connect(A.master);

    const bus = () => { const g = ctx.createGain(); g.connect(A.dry); g.connect(A.revSend); return g; };
    A.busPlayer = bus();
    A.busAuto = bus();
    A.busFx = bus();
    A.busClick = ctx.createGain(); A.busClick.connect(A.master);
    buildWaves();
    A.apply();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) A.resume(); });
    return ctx;
  };
  A.resume = function () { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); };
  A.running = () => ctx && ctx.state === 'running';

  A.apply = function () {
    if (!ctx) return;
    const s = N.settings, t = ctx.currentTime;
    A.master.gain.setTargetAtTime(Math.pow(s.volume, 1.6) * 1.1, t, 0.03);
    A.revReturn.gain.setTargetAtTime(s.reverb * 0.9, t, 0.05);
    A.dry.gain.setTargetAtTime(1 - s.reverb * 0.25, t, 0.05);
    A.eqLow.gain.setTargetAtTime(s.bass, t, 0.05);
    A.eqHigh.gain.setTargetAtTime(s.treble, t, 0.05);
    A.busAuto.gain.setTargetAtTime(s.accompVolume, t, 0.05);
    A.busClick.gain.setTargetAtTime(s.metroVolume, t, 0.05);
  };

  function buildIR(seconds) {
    const rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    const ir = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const x = i / len;
        const env = Math.pow(1 - x, 2.4) * Math.exp(-x * 3.2);
        const k = 0.9 - 0.78 * x; // la queue s'assombrit
        lp += k * (Math.random() * 2 - 1 - lp);
        d[i] = lp * env;
      }
      const pre = Math.floor(rate * 0.018);
      for (let i = 0; i < pre; i++) d[i] *= (i / pre) * (i / pre);
      // quelques premières réflexions
      [0.011, 0.019, 0.027, 0.041].forEach((tt, j) => {
        const p = Math.floor(rate * (tt + c * 0.0023));
        if (p < len) d[p] += (0.5 - j * 0.09) * (c ? -1 : 1);
      });
    }
    return ir;
  }

  // ---------- formes d'onde ----------
  let pianoWave = null, organWave = null, noiseBuf = null;
  function buildWaves() {
    const n = 40;
    const re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) {
      let a = 1 / Math.pow(k, 1.3);
      if (k % 7 === 0) a *= 0.06; // point de frappe du marteau à 1/7 de la corde
      if (k === 2) a *= 1.25;
      if (k === 3) a *= 0.95;
      if (k === 4) a *= 0.75;
      im[k] = a;
    }
    pianoWave = ctx.createPeriodicWave(re, im);
    const re2 = new Float32Array(17), im2 = new Float32Array(17);
    [[1, 1], [2, 0.8], [3, 0.55], [4, 0.5], [6, 0.32], [8, 0.3], [10, 0.12], [12, 0.12], [16, 0.06]].forEach(([k, a]) => (im2[k] = a));
    organWave = ctx.createPeriodicWave(re2, im2);
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  // ---------- voix ----------
  const active = new Set();
  const MAX_VOICES = 80;
  const pitchComp = (m) => N.clamp(1 - (m - 60) * 0.009, 0.55, 1.3);

  function makeVoiceObj(midi, when, out, sources, relTau) {
    const v = { midi, start: when, out, sources, relTau, released: false, dead: false };
    v.release = function (t, tau) {
      if (v.released || v.dead) return;
      v.released = true;
      t = Math.max(t == null ? 0 : t, ctx.currentTime);
      tau = tau || v.relTau;
      const g = v.out.gain;
      if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t);
      else { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); }
      g.setTargetAtTime(0, t, tau);
      const end = t + tau * 7 + 0.05;
      v.sources.forEach((s) => { try { s.stop(end); } catch (e) { /* déjà arrêtée */ } });
    };
    v.kill = function () {
      if (v.dead) return;
      const t = ctx.currentTime;
      const g = v.out.gain;
      if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t);
      else g.cancelScheduledValues(t);
      g.setTargetAtTime(0, t, 0.012);
      v.released = true;
      v.sources.forEach((s) => { try { s.stop(t + 0.09); } catch (e) { /* */ } });
    };
    active.add(v);
    if (active.size > MAX_VOICES) {
      let oldest = null;
      for (const x of active) if (!x.released && x !== v && (!oldest || x.start < oldest.start)) oldest = x;
      if (oldest) oldest.release(ctx.currentTime, 0.03);
    }
    return v;
  }
  function onEnd(v, nodes) {
    return () => {
      v.dead = true;
      active.delete(v);
      nodes.forEach((n) => { try { n.disconnect(); } catch (e) { /* */ } });
    };
  }

  function nearestSample(midi) {
    let best = sampleKeys[0], bd = 1e9;
    for (let i = 0; i < sampleKeys.length; i++) {
      const k = sampleKeys[i], d = Math.abs(k - midi);
      if (d < bd || (d === bd && k < midi)) { bd = d; best = k; }
    }
    return best;
  }

  function sampleVoice(midi, vel, when, dest) {
    const sm = nearestSample(midi);
    const src = ctx.createBufferSource();
    src.buffer = buffers.get(sm);
    src.playbackRate.value = Math.pow(2, (midi - sm) / 12);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    const f0 = N.mtof(midi);
    lp.frequency.value = Math.min(20000, 500 + f0 * 2.5 + 17000 * vel * vel);
    lp.Q.value = 0.3;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.setValueAtTime((0.04 + 0.96 * Math.pow(vel, 1.65)) * 0.95, when);
    src.connect(lp); lp.connect(out); out.connect(dest);
    src.start(when);
    const relTau = midi > 88 ? 0.6 : midi < 48 ? 0.26 : midi < 72 ? 0.15 : 0.1;
    const v = makeVoiceObj(midi, when, out, [src], relTau);
    src.onended = onEnd(v, [src, lp, out]);
    return v;
  }

  function softVoice(midi, vel, when, dest) {
    const f = N.mtof(midi);
    const comp = pitchComp(midi);
    const out = ctx.createGain(); out.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(Math.min(15000, f * (3 + 11 * vel)), when);
    lp.frequency.setTargetAtTime(Math.max(f * 1.7, 320), when + 0.004, 0.22 + (1 - vel) * 0.25);
    const o1 = ctx.createOscillator(); o1.setPeriodicWave(pianoWave); o1.frequency.value = f; o1.detune.value = -2.2;
    const o2 = ctx.createOscillator(); o2.setPeriodicWave(pianoWave); o2.frequency.value = f; o2.detune.value = 2.6;
    const mix = ctx.createGain(); mix.gain.value = 0.42;
    o1.connect(mix); o2.connect(mix); mix.connect(lp); lp.connect(out); out.connect(dest);
    const amp = (0.05 + 0.62 * Math.pow(vel, 1.5)) * comp;
    const dec = N.clamp(6 - (midi - 36) * 0.08, 0.7, 6.5);
    const g = out.gain;
    g.setValueAtTime(0, when);
    g.linearRampToValueAtTime(amp, when + 0.004);
    g.setTargetAtTime(amp * 0.38, when + 0.004, 0.16);
    g.setTargetAtTime(0, when + 0.32, dec * 0.42);
    // bruit de marteau
    const ns = ctx.createBufferSource(); ns.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(5200, f * 4.5); bp.Q.value = 1.1;
    const ng = ctx.createGain(); ng.gain.value = 0;
    ng.gain.setValueAtTime(0, when);
    ng.gain.linearRampToValueAtTime(0.16 * vel * comp, when + 0.002);
    ng.gain.setTargetAtTime(0, when + 0.003, 0.011);
    ns.connect(bp); bp.connect(ng); ng.connect(dest);
    o1.start(when); o2.start(when); ns.start(when); ns.stop(when + 0.12);
    const stopAt = when + 0.32 + dec * 3.2;
    o1.stop(stopAt); o2.stop(stopAt);
    const v = makeVoiceObj(midi, when, out, [o1, o2], midi < 48 ? 0.2 : 0.12);
    o1.onended = onEnd(v, [o1, o2, mix, lp, out, ns, bp, ng]);
    return v;
  }

  function epVoice(midi, vel, when, dest) {
    const f = N.mtof(midi);
    const comp = pitchComp(midi);
    const car = ctx.createOscillator(); car.frequency.value = f;
    const mod = ctx.createOscillator(); mod.frequency.value = f;
    const modG = ctx.createGain();
    modG.gain.setValueAtTime(f * (0.5 + 2.4 * vel), when);
    modG.gain.setTargetAtTime(f * 0.22, when + 0.002, 0.32);
    mod.connect(modG); modG.connect(car.frequency);
    const tine = ctx.createOscillator(); tine.frequency.value = f * 7.02;
    const tineG = ctx.createGain();
    tineG.gain.setValueAtTime(f * 0.9 * vel, when);
    tineG.gain.setTargetAtTime(0, when + 0.001, 0.018);
    tine.connect(tineG); tineG.connect(car.frequency);
    const out = ctx.createGain(); out.gain.value = 0;
    const amp = (0.06 + 0.5 * Math.pow(vel, 1.35)) * comp;
    const dec = N.clamp(4.2 - (midi - 40) * 0.05, 0.9, 4.6);
    out.gain.setValueAtTime(0, when);
    out.gain.linearRampToValueAtTime(amp, when + 0.003);
    out.gain.setTargetAtTime(amp * 0.5, when + 0.003, 0.28);
    out.gain.setTargetAtTime(0, when + 0.42, dec * 0.45);
    car.connect(out); out.connect(dest);
    const stopAt = when + 0.42 + dec * 3.4;
    [car, mod, tine].forEach((o) => { o.start(when); o.stop(stopAt); });
    const v = makeVoiceObj(midi, when, out, [car, mod, tine], 0.12);
    car.onended = onEnd(v, [car, mod, tine, modG, tineG, out]);
    return v;
  }

  function celestaVoice(midi, vel, when, dest) {
    const f = N.mtof(midi);
    const comp = pitchComp(midi) * 0.85;
    const out = ctx.createGain(); out.gain.value = 1;
    const parts = [[1, 1, 1.9], [2, 0.32, 0.9], [3, 0.12, 0.45], [4.16, 0.1, 0.22], [5.43, 0.05, 0.12]];
    const srcs = [], nodes = [out];
    let longest = 0;
    parts.forEach(([ratio, a, dec]) => {
      if (f * ratio > 16000) return;
      const o = ctx.createOscillator(); o.frequency.value = f * ratio;
      const g = ctx.createGain(); g.gain.value = 0;
      const amp = a * (0.05 + 0.42 * Math.pow(vel, 1.3)) * comp;
      const d = dec * N.clamp(1.4 - (midi - 60) * 0.012, 0.5, 2);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(amp, when + 0.002);
      g.gain.setTargetAtTime(0, when + 0.002, d);
      o.connect(g); g.connect(out);
      o.start(when); o.stop(when + d * 7 + 0.1);
      longest = Math.max(longest, d * 7 + 0.1);
      srcs.push(o); nodes.push(o, g);
    });
    out.connect(dest);
    const v = makeVoiceObj(midi, when, out, srcs, 0.35);
    if (srcs[0]) srcs[0].onended = onEnd(v, nodes);
    return v;
  }

  function organVoice(midi, vel, when, dest) {
    const f = N.mtof(midi);
    const comp = pitchComp(midi) * 0.8;
    const o1 = ctx.createOscillator(); o1.setPeriodicWave(organWave); o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.setPeriodicWave(organWave); o2.frequency.value = f; o2.detune.value = 5;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.6;
    const lfoG = ctx.createGain(); lfoG.gain.value = 3.5;
    lfo.connect(lfoG); lfoG.connect(o2.detune);
    const mix = ctx.createGain(); mix.gain.value = 0.3;
    const out = ctx.createGain(); out.gain.value = 0;
    const amp = (0.12 + 0.25 * vel) * comp;
    out.gain.setValueAtTime(0, when);
    out.gain.linearRampToValueAtTime(amp, when + 0.012);
    o1.connect(mix); o2.connect(mix); mix.connect(out); out.connect(dest);
    [o1, o2, lfo].forEach((o) => { o.start(when); o.stop(when + 40); });
    const v = makeVoiceObj(midi, when, out, [o1, o2, lfo], 0.035);
    o1.onended = onEnd(v, [o1, o2, lfo, lfoG, mix, out]);
    return v;
  }

  function makeVoice(inst, midi, vel, when, dest) {
    vel = N.clamp(vel, 0.02, 1);
    if (inst === 'concert' && sampleKeys.length) return sampleVoice(midi, vel, when, dest);
    if (inst === 'electrique') return epVoice(midi, vel, when, dest);
    if (inst === 'celesta') return celestaVoice(midi, vel, when, dest);
    if (inst === 'orgue') return organVoice(midi, vel, when, dest);
    return softVoice(midi, vel, when, dest);
  }

  // ---------- notes jouées par le joueur ----------
  const held = new Map(); // touche -> voix
  const sustained = new Set();
  let sustainOn = false;

  A.noteOn = function (key, sound, vel) {
    if (!ctx) return null;
    A.resume();
    const t = ctx.currentTime;
    const prev = held.get(key);
    if (prev) prev.release(t, 0.04);
    for (const v of sustained) if (v.midi === sound) { v.release(t, 0.1); sustained.delete(v); }
    const v = makeVoice(A.instrument(), sound, vel, t, A.busPlayer);
    held.set(key, v);
    return v;
  };
  A.noteOff = function (key) {
    if (!ctx) return;
    const v = held.get(key);
    if (!v) return;
    held.delete(key);
    if (sustainOn) sustained.add(v);
    else v.release(ctx.currentTime);
  };
  A.setSustain = function (on) {
    sustainOn = !!on;
    if (!ctx || on) return;
    const t = ctx.currentTime;
    for (const v of sustained) v.release(t);
    sustained.clear();
  };
  A.releaseAllPlayer = function () {
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const v of held.values()) v.release(t, 0.05);
    held.clear();
    for (const v of sustained) v.release(t, 0.05);
    sustained.clear();
  };

  // ---------- notes programmées (accompagnement, démo) ----------
  const autoVoices = new Set();
  A.schedule = function (midi, vel, when, bus) {
    if (!ctx) return null;
    when = Math.max(when, ctx.currentTime);
    const v = makeVoice(A.instrument(), midi, vel, when, bus || A.busAuto);
    autoVoices.add(v);
    return v;
  };
  A.releaseAt = function (v, when) {
    if (!v) return;
    v.release(when);
    autoVoices.delete(v);
  };
  A.killAuto = function () {
    for (const v of autoVoices) v.kill();
    autoVoices.clear();
  };
  A.killFutureAuto = function () {
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const v of autoVoices) if (v.start > t + 0.002) { v.kill(); autoVoices.delete(v); }
  };

  // son court joué directement (entraînement auditif, aperçus)
  A.play = function (midi, vel, dur, delay, inst) {
    if (!ctx) return;
    A.resume();
    const t = ctx.currentTime + (delay || 0) + 0.01;
    const v = makeVoice(inst || A.instrument(), midi, vel == null ? 0.7 : vel, t, A.busFx);
    v.release(t + (dur || 0.8));
  };
  A.chime = function (ok) {
    if (!ctx) return;
    if (ok) { A.play(88, 0.45, 0.4, 0, 'celesta'); A.play(95, 0.4, 0.6, 0.07, 'celesta'); }
    else { A.play(52, 0.35, 0.25, 0, 'doux'); }
  };

  // ---------- métronome ----------
  A.click = function (when, accent) {
    if (!ctx) return;
    when = Math.max(when, ctx.currentTime);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = accent ? 1870 : 1250;
    const g = ctx.createGain(); g.gain.value = 0;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(accent ? 0.42 : 0.26, when + 0.0015);
    g.gain.setTargetAtTime(0, when + 0.002, 0.016);
    o.connect(g); g.connect(A.busClick);
    o.start(when); o.stop(when + 0.14);
    o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) { /* */ } };
  };

  // ---------- horloge « entendue » (ce qui sort des haut-parleurs) ----------
  let clockOffset = null;
  A.latency = () => (ctx ? (ctx.outputLatency || 0) + (ctx.baseLatency || 0) : 0);
  A.clock = function (perfMs) {
    const p = perfMs / 1000;
    if (!ctx || ctx.state !== 'running') { if (clockOffset === null) clockOffset = 0; return p + clockOffset; }
    let heard;
    const ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
    if (ts && ts.performanceTime > 0 && ts.contextTime > 0) heard = ts.contextTime + (perfMs - ts.performanceTime) / 1000;
    else heard = ctx.currentTime - A.latency();
    const off = heard - p;
    if (clockOffset === null || Math.abs(off - clockOffset) > 0.2) clockOffset = off;
    else clockOffset += (off - clockOffset) * 0.03;
    return p + clockOffset;
  };

  // ---------- chargement des échantillons ----------
  function decode(ab) {
    return new Promise((res, rej) => {
      try {
        const p = ctx.decodeAudioData(ab, res, rej);
        if (p && p.then) p.then(res, rej);
      } catch (e) { rej(e); }
    });
  }
  A.SAMPLE_BASES = SAMPLE_BASES;
  async function fetchSample(name) {
    let err = null;
    for (const base of SAMPLE_BASES) {
      for (let attempt = 0; attempt < (N.EMBED ? 1 : 2); attempt++) {
        try {
          const r = await fetch(base + name + '.mp3', { mode: 'cors' });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const ab = await r.arrayBuffer();
          if (ab.byteLength < 1000) throw new Error('fichier vide');
          return ab;
        } catch (e) { err = e; }
      }
    }
    throw err || new Error('échec');
  }
  A.loadSamples = async function (onProgress) {
    if (!ctx || A.samples.state === 'loading' || A.samples.state === 'ready') return;
    A.samples.state = 'loading';
    A.samples.loaded = 0; A.samples.failed = 0; A.samples.fromCache = 0;
    const queue = SAMPLE_FILES.slice();
    // on teste d'abord un seul fichier : si le réseau est bloqué (page intégrée, hors ligne), on n'insiste pas
    let blocked = false;
    const loadOne = async (name) => {
      let ab = await N.idb.get('samples', name);
      if (ab && ab.byteLength > 1000) A.samples.fromCache++;
      else {
        ab = await fetchSample(name);
        N.idb.put('samples', name, ab.slice(0));
      }
      buffers.set(fileMidi(name), await decode(ab));
      A.samples.loaded++;
    };
    try { await loadOne(queue.shift()); } catch (e) { A.samples.failed++; blocked = true; }
    N.emit('samples', A.samples);
    const worker = async () => {
      while (queue.length && !blocked) {
        const name = queue.shift();
        try { await loadOne(name); } catch (e) { A.samples.failed++; }
        if (onProgress) onProgress(A.samples);
        N.emit('samples', A.samples);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker(), worker()]);
    if (buffers.size >= 26) {
      sampleKeys = Array.from(buffers.keys()).sort((a, b) => a - b);
      A.samples.state = 'ready';
    } else {
      A.samples.state = 'error';
    }
    N.emit('samples', A.samples);
  };
})();
