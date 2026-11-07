/* Nocturne — logique de jeu : jeu libre, morceaux (attente / défi / écoute), boucles, score */
'use strict';
(function () {
  const N = window.N;
  const G = (N.game = {});
  const PENDING = 0, HIT = 1, MISS = 2, SKIP = 3;
  G.PENDING = PENDING; G.HIT = HIT; G.MISS = MISS;

  G.mode = 'free'; // 'free' | 'song' | 'quiz'
  G.session = null;
  G.quiz = null;
  G.free = { ribbons: [], rec: null };
  G.held = new Map(); // touche -> { sound, hand, t }
  G.sustain = false;
  G.chord = null;

  const JUDGE = {
    perfect: { label: 'Parfait', color: '#ffe08a', pts: 300, w: 1 },
    great: { label: 'Super', color: '#80e7ff', pts: 200, w: 0.75 },
    good: { label: 'Bien', color: '#a6ffbf', pts: 100, w: 0.45 },
  };
  G.JUDGE = JUDGE;

  const vclock = (perf) => N.audio.clock(perf) - (N.settings.latencyMs || 0) / 1000;
  const ctxFor = (S, s) => S.anchorV + (s - S.anchorSong) / S.speed;
  function anchor(S) { S.anchorSong = S.t; S.anchorV = vclock(performance.now()); }

  // ================= entrées =================
  G.noteDown = function (key, vel, source) {
    if (!N.audio.ready()) { N.emit('wantAudio'); return; }
    if (G.held.has(key)) G.noteUp(key, source);
    let sound = key;
    let hand = N.settings.colorMode === 'rainbow' ? 'F' : key >= 60 ? 'R' : 'L';
    const S = G.mode === 'song' ? G.session : null;
    let kind = 'free';
    if (S && !S.paused && !S.finished && S.play !== 'demo') {
      const n = hitTest(S, key);
      if (n) { sound = n.orig; hand = n.hand; kind = 'hit'; }
      else { kind = 'wrong'; hand = 'X'; }
    }
    N.audio.noteOn(key, sound, vel);
    G.held.set(key, { sound, hand, t: performance.now() });
    N.renderer.pressKey(key, hand, 'player');
    if (kind === 'wrong') N.renderer.wrong(key);
    else N.renderer.burst(key, hand === 'X' ? 'R' : hand, kind === 'hit' ? 1.2 : 0.7 + vel * 0.5);
    if (G.mode !== 'song') G.free.ribbons.push({ midi: key, hand, vel, t0: performance.now() / 1000, t1: null });
    if (G.free.ribbons.length > 300) G.free.ribbons.splice(0, 50);
    const rec = G.free.rec;
    if (rec) rec.events.push({ k: 'on', key, sound, vel, t: (performance.now() - rec.t0) / 1000 });
    N.progress.note();
    if (G.mode === 'quiz' && G.quiz && G.quiz.noteDown) G.quiz.noteDown(key, sound);
    updateChord();
    N.emit('note', { key, kind, source });
  };

  G.noteUp = function (key, source) {
    const h = G.held.get(key);
    if (!h) return;
    G.held.delete(key);
    N.audio.noteOff(key);
    N.renderer.releaseKey(key, 'player');
    const now = performance.now() / 1000;
    const rib = G.free.ribbons;
    for (let i = rib.length - 1; i >= 0; i--) if (rib[i].midi === key && rib[i].t1 == null) { rib[i].t1 = now; break; }
    const rec = G.free.rec;
    if (rec) rec.events.push({ k: 'off', key, t: (performance.now() - rec.t0) / 1000 });
    if (G.mode === 'quiz' && G.quiz && G.quiz.noteUp) G.quiz.noteUp(key);
    updateChord();
    void source;
  };

  G.setSustain = function (on) {
    G.sustain = !!on;
    if (N.audio.ready()) N.audio.setSustain(on);
    const rec = G.free.rec;
    if (rec) rec.events.push({ k: 'sus', on: !!on, t: (performance.now() - rec.t0) / 1000 });
    N.emit('sustain', G.sustain);
  };
  G.allOff = function () {
    for (const key of Array.from(G.held.keys())) G.noteUp(key);
    G.setSustain(false);
  };

  let chordTimer = 0;
  function updateChord() {
    clearTimeout(chordTimer);
    chordTimer = setTimeout(() => {
      const sounds = Array.from(G.held.values()).map((h) => h.sound);
      const c = sounds.length >= 2 ? N.theory.detect(sounds) : null;
      if (c || !sounds.length) { G.chord = c; N.emit('chord', c); }
    }, 25);
  }

  // ================= morceaux =================
  function bestOctave(pn) {
    if (!pn.length) return N.input.octave;
    const lay = N.input.layout();
    const zones = lay.id !== 'simple';
    let best = null;
    for (let o = 1; o <= 5; o++) {
      const base = 12 * (o + 1);
      let score = 0;
      for (const n of pn) {
        const off = n.midi - base;
        if (!lay.offsets.has(off)) continue;
        score += 1;
        if (zones) {
          if (n.hand === 'L' && off <= lay.lower[1]) score += 0.3;
          if (n.hand !== 'L' && off >= lay.upper[0]) score += 0.3;
        }
      }
      score -= Math.abs(o - 3) * 0.02 * pn.length;
      if (!best || score > best.score + 1e-9) best = { o, score };
    }
    return best.o;
  }

  G.startSong = function (song, opt) {
    opt = Object.assign({ hands: 'R', play: 'wait', speed: 1, metronome: false, autoOther: true, fold: true }, opt || {});
    G.stopSession(true);
    N.input.sessionOctave = null;
    const usingPc = N.input.usingPc();
    const S = {
      song, opts: opt, play: opt.play, hands: opt.hands, speed: N.clamp(opt.speed, 0.25, 1.5), metronome: !!opt.metronome,
      autoOther: opt.autoOther !== false, lesson: opt.lesson || null, train: opt.train || null,
      notes: [], pnotes: [], t: 0, paused: false, waiting: false, finished: false, practiced: !!opt.from,
      anchorSong: 0, anchorV: 0, schedIdx: 0, beatIdx: 0, visIdx: 0, visActive: [], autoActive: [], autoKeys: new Uint8Array(128),
      pIdx: 0, loop: { on: false, a: 0, b: 0, count: 0 }, folded: 0, octave: null,
      stats: { wrong: 0, combo: 0, maxCombo: 0, score: 0 }, maxDur: song.maxDur || 4, started: performance.now(), waitSince: 0,
    };
    for (const n of song.notes) {
      let role;
      if (S.play === 'demo') role = n.hand === 'A' || S.hands.includes(n.hand) || S.autoOther ? 'auto' : 'mute';
      else if (n.hand !== 'A' && S.hands.includes(n.hand)) role = 'player';
      else if (n.hand === 'A') role = 'auto';
      else role = S.autoOther ? 'auto' : 'mute';
      S.notes.push({ midi: n.midi, orig: n.midi, t: n.t, d: n.d, ad: Math.max(n.d, n.ad || n.d), hand: n.hand, vel: n.vel, finger: n.finger || 0, role, state: PENDING, judge: null, voice: null });
    }
    // clavier d'ordinateur : on choisit l'octave et on replie les notes hors de portée
    if (usingPc && S.play !== 'demo') {
      const pn = S.notes.filter((n) => n.role === 'player');
      S.octave = opt.octave != null ? opt.octave : bestOctave(pn);
      N.input.sessionOctave = S.octave;
      if (opt.fold) {
        // chaque note sans touche d'ordinateur est déplacée à l'octave jouable la plus proche,
        // de préférence dans la zone de sa main ; sinon l'ordinateur la joue pour toi
        const lay = N.input.layout();
        const base = N.input.base(S.octave);
        const zones = lay.id !== 'simple';
        for (const n of pn) {
          if (lay.offsets.has(n.midi - base)) continue;
          let best = null;
          for (let k = -5; k <= 5; k++) {
            if (!k) continue;
            const m = n.midi + 12 * k, off = m - base;
            if (!lay.offsets.has(off)) continue;
            const away = zones && (n.hand === 'L' ? off > lay.lower[1] : off < lay.upper[0]) ? 0.6 : 0;
            const sc = Math.abs(k) + away;
            if (!best || sc < best.sc) best = { m, sc };
          }
          if (best) { n.midi = best.m; S.folded++; }
          else n.role = 'auto';
        }
        const seen = new Set();
        for (const n of pn) {
          const k = n.midi * 100000 + Math.round(n.t * 40);
          if (seen.has(k)) { n.role = 'auto'; n.midi = n.orig; } else seen.add(k);
        }
      }
    }
    S.notes.sort((a, b) => a.t - b.t || a.midi - b.midi);
    S.pnotes = S.notes.filter((n) => n.role === 'player');
    // plage du clavier affichée
    let lo = 127, hi = 0;
    for (const n of S.notes) if (n.role !== 'mute') { lo = Math.min(lo, n.midi); hi = Math.max(hi, n.midi); }
    if (lo > hi) { lo = 48; hi = 84; }
    if (S.octave != null) { const r = N.input.range(S.octave); lo = Math.min(lo, r[0]); hi = Math.max(hi, r[1]); }
    lo -= 2; hi += 2;
    if (hi - lo < 30) { const c = (lo + hi) / 2; lo = Math.round(c - 15); hi = Math.round(c + 15); }
    N.renderer.setRange(lo, hi);
    // métronome : temps du morceau + décompte
    const bl = song.beatLen || 0.6;
    S.lead = Math.max(2.4, bl * 3) * S.speed;
    const beats = (song.beats || []).slice();
    const first = beats.length ? beats[0].t : 0;
    const perBar = song.ts ? (song.ts[1] === 8 && song.ts[0] % 3 === 0 && song.ts[0] > 3 ? song.ts[0] / 3 : song.ts[0]) : 4;
    for (let k = 1, tt = first - bl; tt >= -S.lead - 0.01; k++, tt -= bl) beats.unshift({ t: tt, accent: k % perBar === 0 });
    S.beats = beats;
    S.endT = song.duration + 1.0;
    const from = opt.from != null ? Math.max(0, opt.from) : 0;
    S.t = from - S.lead;
    seekInternal(S, S.t);
    if (opt.loop) S.loop = Object.assign({ on: true, count: 0 }, opt.loop);
    G.session = S;
    G.mode = 'song';
    N.emit('session', S);
    return S;
  };

  G.stopSession = function (silent) {
    const S = G.session;
    if (S) {
      N.audio.killAuto();
      for (let m = 0; m < 128; m++) if (S.autoKeys[m]) N.renderer.releaseKey(m, 'auto');
    }
    G.session = null;
    N.input.sessionOctave = null;
    if (G.mode === 'song') G.mode = 'free';
    N.renderer.clearKeys();
    for (const [k] of G.held) N.renderer.pressKey(k, 'R', 'player');
    if (!silent) N.emit('session-end', S);
  };

  function advance(S) {
    while (S.pIdx < S.pnotes.length && S.pnotes[S.pIdx].state !== PENDING) S.pIdx++;
  }

  function seekInternal(S, t) {
    N.audio.killAuto();
    for (let m = 0; m < 128; m++) if (S.autoKeys[m]) { S.autoKeys[m] = 0; N.renderer.releaseKey(m, 'auto'); }
    S.visActive = []; S.autoActive = [];
    S.t = t;
    for (const n of S.notes) {
      if (n.t >= t - 0.001) { n.state = PENDING; n.judge = null; }
      else if (n.state === PENDING) n.state = SKIP;
    }
    S.schedIdx = S.visIdx = N.lowerBound(S.notes, t - 0.001);
    S.beatIdx = N.lowerBound(S.beats, t - 0.001);
    S.pIdx = 0;
    advance(S);
    S.waiting = false;
    anchor(S);
  }

  G.seek = function (t) {
    const S = G.session;
    if (!S) return;
    S.practiced = true;
    seekInternal(S, N.clamp(t, -S.lead, S.song.duration));
  };
  G.seekBar = function (delta) {
    const S = G.session;
    if (!S) return;
    const bars = S.song.bars;
    if (!bars.length) return G.seek(S.t + delta * 2);
    let i = 0;
    while (i < bars.length - 1 && bars[i + 1] <= S.t + 0.05) i++;
    const j = N.clamp(i + delta, 0, bars.length - 1);
    G.seek(bars[j] - (delta < 0 ? 0.6 * S.speed : 0));
  };

  G.pause = function () {
    const S = G.session;
    if (!S || S.paused || S.finished) return;
    S.paused = true;
    N.audio.killAuto();
    for (let m = 0; m < 128; m++) if (S.autoKeys[m]) { S.autoKeys[m] = 0; N.renderer.releaseKey(m, 'auto'); }
    S.visActive = []; S.autoActive = [];
    N.emit('paused', S);
  };
  G.resume = function () {
    const S = G.session;
    if (!S || !S.paused) return;
    S.paused = false;
    S.schedIdx = S.visIdx = N.lowerBound(S.notes, S.t - 0.001);
    S.beatIdx = N.lowerBound(S.beats, S.t - 0.001);
    anchor(S);
    N.emit('resumed', S);
  };
  G.togglePause = () => { const S = G.session; if (S) S.paused ? G.resume() : G.pause(); };

  G.setSpeed = function (v) {
    const S = G.session;
    if (!S) return;
    S.speed = N.clamp(Math.round(v * 100) / 100, 0.25, 1.5);
    S.practiced = S.practiced || S.speed !== S.opts.speed;
    N.audio.killFutureAuto();
    S.autoActive = S.autoActive.filter((n) => n.voice && !n.voice.released);
    S.schedIdx = N.lowerBound(S.notes, S.t + 0.0005);
    S.beatIdx = N.lowerBound(S.beats, S.t + 0.0005);
    anchor(S);
    N.emit('speed', S.speed);
  };

  G.setLoop = function (a, b) {
    const S = G.session;
    if (!S) return;
    if (a == null) { S.loop.on = false; N.emit('loop', S.loop); return; }
    if (b - a < 0.4) return;
    S.loop = { on: true, a, b, count: 0 };
    S.practiced = true;
    if (S.t < a - S.lead || S.t > b) seekInternal(S, a - Math.min(S.lead, 1.5 * S.speed));
    N.emit('loop', S.loop);
  };
  // boucle sur les mesures autour de la position actuelle
  G.loopHere = function (nBars) {
    const S = G.session;
    if (!S) return;
    const bars = S.song.bars;
    let i = 0;
    while (i < bars.length - 1 && bars[i + 1] <= Math.max(0, S.t) + 0.05) i++;
    const a = bars[i] != null ? bars[i] : 0;
    const b = bars[Math.min(bars.length - 1, i + (nBars || 2))] || S.song.duration;
    G.setLoop(a, b > a ? b : S.song.duration);
  };

  G.restartWith = function (changes, keepPosition) {
    const S = G.session;
    if (!S) return;
    const opt = Object.assign({}, S.opts, changes || {});
    if (keepPosition) {
      const bars = S.song.bars;
      let i = 0;
      while (i < bars.length - 1 && bars[i + 1] <= Math.max(0, S.t)) i++;
      opt.from = bars[i] || 0;
    } else delete opt.from;
    if (S.loop.on) opt.loop = { a: S.loop.a, b: S.loop.b };
    opt.speed = changes && changes.speed != null ? changes.speed : S.speed;
    G.startSong(S.song, opt);
  };

  // ---------- test des notes jouées ----------
  function hitTest(S, key) {
    const t = S.t, sp = S.speed;
    if (S.play === 'wait') {
      const early = 0.32 * sp;
      for (let i = S.pIdx; i < S.pnotes.length; i++) {
        const n = S.pnotes[i];
        if (n.t > t + early) break;
        if (n.state === PENDING && n.midi === key) {
          n.state = HIT;
          n.judge = 'good';
          advance(S);
          if (S.waiting) {
            const next = S.pIdx < S.pnotes.length ? S.pnotes[S.pIdx] : null;
            if (!next || next.t > t + 0.03) { S.waiting = false; anchor(S); }
          }
          return n;
        }
      }
      S.stats.wrong++;
      return null;
    }
    // mode défi
    const win = 0.2 * sp;
    let best = null, bd = 1e9;
    for (let i = S.pIdx; i < S.pnotes.length; i++) {
      const n = S.pnotes[i];
      if (n.t > t + win) break;
      if (n.state !== PENDING || n.midi !== key) continue;
      const d = Math.abs(n.t - t);
      if (d <= win && d < bd) { bd = d; best = n; }
    }
    if (!best) { S.stats.wrong++; return null; }
    const real = bd / sp;
    const j = real <= 0.05 ? 'perfect' : real <= 0.1 ? 'great' : 'good';
    best.state = HIT;
    best.judge = j;
    S.stats.combo++;
    S.stats.maxCombo = Math.max(S.stats.maxCombo, S.stats.combo);
    S.stats.score += Math.round(JUDGE[j].pts * (1 + Math.min(S.stats.combo, 100) / 100));
    const early = best.t - t;
    const tag = j === 'perfect' ? '' : early > 0 ? ' · tôt' : ' · tard';
    N.renderer.popup(best.midi, JUDGE[j].label + tag, JUDGE[j].color);
    if (S.stats.combo > 0 && S.stats.combo % 25 === 0) {
      N.renderer.ring('rgba(255,224,138,0.8)');
      N.renderer.popup(best.midi, 'Combo ' + S.stats.combo, '#ffe08a', true);
    }
    advance(S);
    return best;
  }

  // ================= boucle de jeu =================
  G.update = function (dt, perf) {
    if (G.mode === 'song' && G.session) updateSession(G.session, perf);
    else if (G.mode === 'quiz' && G.quiz && G.quiz.update) G.quiz.update(dt, perf);
    else if (G.mode === 'tiles' && N.tiles) N.tiles.update(perf);
    N.progress.tick(dt);
  };

  function updateSession(S, perf) {
    if (S.paused || S.finished) return;
    const V = vclock(perf);
    if (!S.waiting) S.t = S.anchorSong + (V - S.anchorV) * S.speed;
    if (S.play === 'wait') {
      advance(S);
      const nt = S.pIdx < S.pnotes.length ? S.pnotes[S.pIdx].t : null;
      if (!S.waiting && nt !== null && S.t >= nt) { S.t = nt; S.waiting = true; S.waitSince = perf; }
    }
    if (S.loop.on && S.t >= S.loop.b) {
      S.loop.count++;
      N.progress.stat('loops');
      seekInternal(S, S.loop.a - Math.min(S.lead, 1.2 * S.speed));
      N.emit('loop', S.loop);
      return;
    }
    if (S.play === 'tempo') {
      const late = 0.2 * S.speed;
      for (let i = S.pIdx; i < S.pnotes.length; i++) {
        const n = S.pnotes[i];
        if (n.t + late >= S.t) break;
        if (n.state === PENDING) {
          n.state = MISS;
          S.stats.combo = 0;
          N.renderer.popup(n.midi, 'Raté', '#ff7088');
        }
      }
      advance(S);
    }
    // indices lumineux sur les touches à venir (la prochaine en plein, les suivantes en contour)
    const pulse = 0.88 + 0.12 * Math.sin(perf / 110);
    const horizon = 1.6 * S.speed;
    let firstT = null;
    for (let i = S.pIdx; i < S.pnotes.length; i++) {
      const n = S.pnotes[i];
      const dtn = n.t - S.t;
      if (dtn > horizon) break;
      if (n.state !== PENDING) continue;
      if (firstT === null) firstT = n.t;
      const isNext = n.t - firstT < 0.03;
      const v = isNext && (S.waiting || dtn < 0.45 * S.speed) ? pulse : N.clamp(1 - dtn / horizon, 0.15, 0.78);
      N.renderer.setHint(n.midi, v, n.hand);
    }
    schedule(S);
    // touches des notes automatiques
    const notes = S.notes;
    const visLimit = S.waiting ? S.t - 0.001 : S.t;
    while (S.visIdx < notes.length && notes[S.visIdx].t <= visLimit) {
      const n = notes[S.visIdx++];
      if (n.role !== 'auto' || n.t + n.d < S.t - 0.05) continue;
      if (!S.autoKeys[n.midi]++) N.renderer.pressKey(n.midi, n.hand, 'auto');
      if (S.play === 'demo') N.renderer.burst(n.midi, n.hand, 0.6);
      S.visActive.push(n);
    }
    for (let i = S.visActive.length - 1; i >= 0; i--) {
      const n = S.visActive[i];
      if (S.t >= n.t + n.d) {
        S.visActive.splice(i, 1);
        if (S.autoKeys[n.midi] && !--S.autoKeys[n.midi]) N.renderer.releaseKey(n.midi, 'auto');
      }
    }
    if (!S.loop.on && S.t >= S.endT) finish(S);
  }

  function schedule(S) {
    const look = 0.13;
    let limit = S.t + look * S.speed;
    if (S.play === 'wait' && S.pIdx < S.pnotes.length) limit = Math.min(limit, S.pnotes[S.pIdx].t - 0.0005);
    const notes = S.notes;
    while (S.schedIdx < notes.length && notes[S.schedIdx].t <= limit) {
      const n = notes[S.schedIdx++];
      if (n.role !== 'auto' || n.t < S.t - 0.06) continue;
      n.voice = N.audio.schedule(n.orig, n.vel, ctxFor(S, n.t));
      n.vend = n.t + n.ad;
      S.autoActive.push(n);
    }
    for (let i = S.autoActive.length - 1; i >= 0; i--) {
      const n = S.autoActive[i];
      if (limit >= n.vend) {
        N.audio.releaseAt(n.voice, ctxFor(S, n.vend));
        n.voice = null;
        S.autoActive.splice(i, 1);
      }
    }
    if (S.metronome) {
      while (S.beatIdx < S.beats.length && S.beats[S.beatIdx].t <= limit) {
        const b = S.beats[S.beatIdx++];
        if (b.t < S.t - 0.06) continue;
        N.audio.click(ctxFor(S, b.t), b.accent);
      }
    } else S.beatIdx = N.lowerBound(S.beats, limit);
  }

  G.result = function (S, live) {
    const pn = S.pnotes;
    let perfect = 0, great = 0, good = 0, miss = 0, total = 0;
    for (const n of pn) {
      if (n.state === SKIP) continue;
      if (n.state === PENDING) { if (S.play === 'tempo' && !live) { miss++; total++; } continue; }
      total++;
      if (n.state === MISS) miss++;
      else if (n.judge === 'perfect') perfect++;
      else if (n.judge === 'great') great++;
      else good++;
    }
    const wrong = S.stats.wrong;
    let acc;
    if (S.play === 'tempo') acc = total ? (perfect + great * 0.75 + good * 0.45) / (total + wrong * 0.35) : 0;
    else acc = total ? total / (total + wrong * 0.6) : 0;
    acc = N.clamp(acc, 0, 1);
    let stars = acc >= 0.93 ? 3 : acc >= 0.8 ? 2 : acc >= 0.55 ? 1 : 0;
    if (S.play === 'wait' && total > 0) stars = Math.max(1, stars);
    return {
      mode: S.play, total, perfect, great, good, miss, wrong, maxCombo: S.stats.maxCombo, score: S.stats.score, acc, stars,
      speed: S.speed, hands: S.hands, seconds: (performance.now() - S.started) / 1000, practiced: S.practiced,
    };
  };

  function finish(S) {
    S.finished = true;
    const res = G.result(S);
    S.res = res;
    setTimeout(() => { if (G.session === S) N.audio.killAuto(); }, 2500);
    if (res.stars >= 2) N.renderer.fireworks();
    N.emit('finished', { S, res });
  }

  // ================= quiz (entraînement) =================
  G.startQuiz = function (q) {
    G.stopSession(true);
    G.quiz = q;
    G.mode = 'quiz';
    if (q.range) N.renderer.setRange(q.range[0], q.range[1]);
    if (q.start) q.start();
  };
  G.stopQuiz = function () {
    if (G.quiz && G.quiz.stop) G.quiz.stop();
    G.quiz = null;
    if (G.mode === 'quiz') G.mode = 'free';
  };

  // ================= enregistrement =================
  G.recStart = function () { G.free.rec = { t0: performance.now(), events: [] }; };
  G.recStop = function () {
    const rec = G.free.rec;
    G.free.rec = null;
    if (!rec) return null;
    const end = (performance.now() - rec.t0) / 1000;
    const open = new Map(), notes = [], pedal = [];
    for (const e of rec.events) {
      if (e.k === 'on') open.set(e.key, e);
      else if (e.k === 'off') {
        const on = open.get(e.key);
        if (on) { notes.push({ midi: on.sound, t: on.t, d: Math.max(0.05, e.t - on.t), vel: on.vel, hand: on.sound >= 60 ? 'R' : 'L' }); open.delete(e.key); }
      } else if (e.k === 'sus') pedal.push({ t: e.t, on: e.on });
    }
    for (const on of open.values()) notes.push({ midi: on.sound, t: on.t, d: Math.max(0.05, end - on.t), vel: on.vel, hand: on.sound >= 60 ? 'R' : 'L' });
    if (!notes.length) return null;
    const t0 = Math.min(...notes.map((n) => n.t));
    notes.forEach((n) => (n.t -= t0));
    pedal.forEach((p) => (p.t = Math.max(0, p.t - t0)));
    notes.sort((a, b) => a.t - b.t);
    return { notes, pedal, duration: Math.max(...notes.map((n) => n.t + n.d)) };
  };
})();
