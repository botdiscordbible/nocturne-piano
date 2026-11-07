/* Nocturne — mode Tuiles : 4 colonnes, on touche les tuiles au rythme, la musique joue autour.
   Les tuiles suivent la mélodie de n'importe quel morceau ; le reste (accompagnement) est joué automatiquement.
   Défi : 3 vies, 3 tours de plus en plus vite. Entraînement : pas de vies, la tuile en retard attend sur la ligne
   (la musique s'arrête avec elle) et une mauvaise touche ne coûte rien. */
'use strict';
(function () {
  const N = window.N;
  const TL = (N.tiles = {});

  TL.LEVELS = {
    1: { name: 'Facile', gap: 0.42, speed: 1 },
    2: { name: 'Normal', gap: 0.27, speed: 1.12 },
    3: { name: 'Difficile', gap: 0.17, speed: 1.25 },
  };
  TL.KEYS = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };
  TL.KEY_CODES = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
  TL.LAP_SPEED = [1, 1.15, 1.3];
  TL.LIVES = 3;
  let T = null;
  TL.game = () => T;

  // ---------- hasard reproductible ----------
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seedOf(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // ---------- tuiles à partir d'un morceau ----------
  TL.chart = function (song, level) {
    const gap = TL.LEVELS[level].gap;
    let mel = song.notes.filter((n) => n.hand === 'R');
    if (mel.length < Math.max(8, song.notes.length * 0.2)) mel = song.notes.slice();
    const groups = [];
    for (const n of mel) {
      const g = groups[groups.length - 1];
      if (g && n.t - g.t < 0.035) g.notes.push(n);
      else groups.push({ t: n.t, notes: [n] });
    }
    const used = new Set();
    const tiles = [];
    let last = -1e9;
    for (const g of groups) {
      if (g.t - last < gap) continue;
      const lead = g.notes.reduce((a, b) => (b.midi > a.midi ? b : a));
      const play = level >= 2 ? g.notes.slice(0, 4) : [lead];
      play.forEach((n) => used.add(n));
      tiles.push({ t: g.t, d: lead.d, pitch: lead.midi, notes: play.map((n) => ({ midi: n.midi, vel: n.vel, d: Math.max(n.d, n.ad || n.d) })), lane: 0, hold: false, end: g.t, state: 0, judge: null, held: 0, holding: false, hitAt: 0 });
      last = g.t;
    }
    // tuiles longues : seulement les notes nettement plus longues que le pas habituel du morceau
    const gaps = tiles.slice(1).map((tl, i) => tl.t - tiles[i].t).sort((a, b) => a - b);
    const typical = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0.5;
    for (let i = 0; i < tiles.length; i++) {
      const tl = tiles[i], next = tiles[i + 1];
      const room = next ? next.t - tl.t : tl.d + 1;
      if (tl.d >= Math.max(0.85, typical * 1.6) && room >= 0.8) { tl.hold = true; tl.end = tl.t + Math.min(tl.d, room - 0.15); }
    }
    // colonnes : elles suivent le contour de la mélodie, jamais deux fois la même d'affilée
    const r = rng(seedOf(song.id + ':' + level));
    let lane = Math.floor(r() * 4), prev = tiles.length ? tiles[0].pitch : 60;
    tiles.forEach((tl, i) => {
      if (i > 0) {
        const dp = tl.pitch - prev;
        const step = dp > 0 ? (dp > 4 ? 2 : 1) : dp < 0 ? (dp < -4 ? -2 : -1) : r() < 0.5 ? 1 : -1;
        let nl = lane + step;
        if (nl > 3) nl = 6 - nl;
        if (nl < 0) nl = -nl;
        nl = N.clamp(nl, 0, 3);
        if (nl === lane) nl = lane >= 2 ? lane - 1 : lane + 1;
        lane = nl;
      }
      tl.lane = lane;
      prev = tl.pitch;
    });
    const autos = song.notes.filter((n) => !used.has(n)).map((n) => ({ midi: n.midi, t: n.t, d: n.d, ad: Math.max(n.d, n.ad || n.d), vel: n.vel }));
    autos.sort((a, b) => a.t - b.t);
    return { tiles, autos, duration: song.duration };
  };

  // ---------- horloge (même principe que les morceaux) ----------
  const vclock = (perf) => N.audio.clock(perf) - (N.settings.latencyMs || 0) / 1000;
  const ctxFor = (g, s) => g.anchorV + (s - g.anchorSong) / g.speed;
  function anchor(g) { g.anchorSong = g.t; g.anchorV = vclock(performance.now()); }

  function resetLap(g) {
    N.audio.killAuto();
    for (const tl of g.tiles) { tl.state = 0; tl.judge = null; tl.held = 0; tl.holding = false; tl.hitAt = 0; }
    g.ti = 0; g.ai = 0; g.autoActive = [];
    g.waiting = null;
    g.pressed = [null, null, null, null];
    g.lead = 2.4 * g.speed;
    g.t = Math.min(0, g.tiles[0].t) - g.lead;
    anchor(g);
  }

  TL.start = function (song, opt) {
    opt = opt || {};
    TL.stop(true);
    N.game.stopSession(true);
    N.game.stopQuiz();
    const level = opt.level || 1;
    const ch = TL.chart(song, level);
    if (ch.tiles.length < 4) throw new Error('ce morceau a trop peu de notes');
    const practice = !!(opt.practice || opt.zen);
    T = {
      song, level, practice, chart: ch, tiles: ch.tiles, autos: ch.autos, lap: 1, baseSpeed: opt.speed || 1,
      speed: (opt.speed || 1) * TL.LEVELS[level].speed * TL.LAP_SPEED[0], score: 0, combo: 0, maxCombo: 0, perfect: 0, hits: 0, misses: 0, waited: 0, waiting: null, waitStart: 0, lives: TL.LIVES,
      t: 0, anchorSong: 0, anchorV: 0, paused: false, pausedAt: 0, over: false, win: false, ti: 0, ai: 0, autoActive: [],
      pressed: [null, null, null, null], down: [false, false, false, false], flash: [0, 0, 0, 0], wrongFlash: [0, 0, 0, 0], banner: null, started: performance.now(),
    };
    resetLap(T);
    N.game.mode = 'tiles';
    N.renderer.setTilesMode(true);
    T.banner = { text: (practice ? 'Entraînement' : TL.LEVELS[level].name) + ' · ' + song.title, t0: performance.now() };
    N.emit('tiles', T);
    return T;
  };

  TL.stop = function (silent) {
    if (!T) return;
    N.audio.killAuto();
    for (let l = 0; l < 4; l++) TL.release(l);
    T = null;
    if (N.game.mode === 'tiles') N.game.mode = 'free';
    N.renderer.setTilesMode(false);
    if (!silent) N.emit('tiles-stop');
  };

  TL.pause = function () {
    if (!T || T.paused || T.over) return;
    T.paused = true;
    T.pausedAt = performance.now();
    N.audio.killAuto();
    T.autoActive = [];
    for (let l = 0; l < 4; l++) TL.release(l);
  };
  TL.resume = function () {
    if (!T || !T.paused) return;
    T.paused = false;
    const away = performance.now() - T.pausedAt;
    T.started += away;
    if (T.waiting) T.waitStart += away;
    T.ai = N.lowerBound(T.autos, T.t - 0.001);
    anchor(T);
  };
  TL.restart = function () {
    if (!T) return;
    const { song, level, practice, baseSpeed } = T;
    TL.start(song, { level, practice, speed: baseSpeed });
  };

  // ---------- boucle ----------
  TL.update = function (perf) {
    const g = T;
    if (!g || g.paused || g.over) return;
    g.t = g.anchorSong + (vclock(perf) - g.anchorV) * g.speed;
    if (g.practice) {
      // entraînement : la tuile suivante attend sur la ligne, et la musique avec elle
      while (g.ti < g.tiles.length && g.tiles[g.ti].state !== 0) g.ti++;
      const nx = g.tiles[g.ti];
      if (nx && g.t >= nx.t) {
        g.t = nx.t;
        anchor(g);
        if (!g.waiting) { g.waiting = nx; g.waitStart = perf; }
      }
    } else {
      // tuiles ratées
      const late = 0.2 * g.speed;
      for (let i = g.ti; i < g.tiles.length; i++) {
        const tl = g.tiles[i];
        if (tl.t + late > g.t) break;
        if (tl.state === 0) { tl.state = 2; fault(g, tl.lane, 'miss'); if (g.over) return; }
      }
      while (g.ti < g.tiles.length && g.tiles[g.ti].state !== 0) g.ti++;
    }
    // tuiles tenues
    for (let l = 0; l < 4; l++) {
      const tl = g.pressed[l];
      if (!tl || !tl.hold || !tl.holding) continue;
      tl.held = N.clamp((g.t - tl.t) / Math.max(0.05, tl.end - tl.t), 0, 1);
      if (g.t >= tl.end) {
        tl.holding = false;
        tl.held = 1;
        g.score += 2;
        N.renderer.tilePop(l, '+2', '#ffe08a');
      }
    }
    schedule(g);
    if (g.t >= g.chart.duration + 0.5 && g.ti >= g.tiles.length) lapDone(g);
  };

  function schedule(g) {
    const look = 0.13;
    let limit = g.t + look * g.speed;
    if (g.practice) {
      // l'accompagnement ne dépasse jamais la tuile pas encore jouée
      while (g.ti < g.tiles.length && g.tiles[g.ti].state !== 0) g.ti++;
      if (g.ti < g.tiles.length) limit = Math.min(limit, g.tiles[g.ti].t - 0.0005);
    }
    while (g.ai < g.autos.length && g.autos[g.ai].t <= limit) {
      const n = g.autos[g.ai++];
      if (n.t < g.t - 0.06) continue;
      n.voice = N.audio.schedule(n.midi, n.vel, ctxFor(g, n.t));
      n.vend = n.t + n.ad;
      g.autoActive.push(n);
    }
    for (let i = g.autoActive.length - 1; i >= 0; i--) {
      const n = g.autoActive[i];
      if (limit >= n.vend) {
        N.audio.releaseAt(n.voice, ctxFor(g, n.vend));
        g.autoActive.splice(i, 1);
      }
    }
  }

  function fault(g, lane, kind) {
    // entraînement : aucune pénalité, juste un petit reflet rouge
    if (g.practice) { g.wrongFlash[lane] = 0.55; return; }
    g.combo = 0;
    g.misses++;
    if (kind === 'wrong') g.wrongFlash[lane] = 1; else g.flash[lane] = -1;
    N.renderer.tilePop(lane, kind === 'wrong' ? 'Raté' : 'Manqué', '#ff7088');
    g.lives--;
    N.audio.thud();
    if (g.lives <= 0) end(g, false);
  }

  function lapDone(g) {
    if (g.practice || g.lap >= TL.LAP_SPEED.length) { end(g, true); return; }
    g.lap++;
    g.speed = g.baseSpeed * TL.LEVELS[g.level].speed * TL.LAP_SPEED[g.lap - 1];
    g.banner = { text: 'Tour ' + g.lap + ' · plus vite !', t0: performance.now() };
    N.renderer.fireworks();
    resetLap(g);
    N.emit('tiles-lap', g);
  }

  function end(g, win) {
    g.over = true;
    g.win = win;
    g.stars = g.practice ? 0 : win ? 3 : g.lap - 1;
    g.seconds = (performance.now() - g.started) / 1000;
    for (let l = 0; l < 4; l++) TL.release(l);
    setTimeout(() => { if (T === g) N.audio.killAuto(); }, win ? 1800 : 300);
    if (win) N.renderer.fireworks();
    // l'entraînement ne touche pas aux records
    if (!g.practice) {
      const saved = N.progress.tilesResult(g.song, g.level, g.score, g.stars);
      g.newBest = saved.newBest;
      g.best = saved.best;
    }
    setTimeout(() => { if (T === g) N.emit('tiles-end', g); }, win ? 1300 : 900);
  }

  // ---------- touches et doigts ----------
  TL.press = function (lane) {
    const g = T;
    if (!g || g.paused || g.over || lane < 0 || lane > 3) return;
    g.down[lane] = true;
    N.audio.resume();
    const early = 0.34 * g.speed, late = 0.2 * g.speed;
    let best = null;
    if (g.waiting) {
      // entraînement : tant qu'une tuile attend, seule sa colonne la joue
      if (lane !== g.waiting.lane) { fault(g, lane, 'wrong'); return; }
      best = g.waiting;
    } else {
      for (let i = g.ti; i < g.tiles.length; i++) {
        const tl = g.tiles[i];
        if (tl.t > g.t + early) break;
        if (tl.state !== 0 || tl.lane !== lane || tl.t < g.t - late) continue;
        best = tl;
        break;
      }
    }
    if (!best) {
      // pendant le décompte, une touche ne coûte rien
      if (g.t < Math.min(0, g.tiles[0].t) - 0.5 * g.speed) return;
      fault(g, lane, 'wrong');
      return;
    }
    const waitedFor = g.waiting === best;
    const real = waitedFor ? (performance.now() - g.waitStart) / 1000 : Math.abs(best.t - g.t) / g.speed;
    best.state = 1;
    best.judge = real <= 0.07 ? 'perfect' : real <= 0.15 ? 'great' : 'good';
    if (waitedFor) {
      // la musique repart d'ici
      if (real > 0.25) { best.judge = 'late'; g.waited++; }
      g.waiting = null;
      anchor(g);
    }
    best.hitAt = performance.now();
    g.hits++;
    g.combo++;
    g.maxCombo = Math.max(g.maxCombo, g.combo);
    if (best.judge === 'perfect') g.perfect++;
    g.score += best.judge === 'perfect' ? 2 : 1;
    g.flash[lane] = 1;
    g.pressed[lane] = best;
    if (best.hold) {
      best.holding = true;
      best.notes.forEach((n, k) => N.audio.noteOn('tile' + lane + ':' + k, n.midi, N.clamp(n.vel + 0.08, 0.35, 1)));
    } else {
      best.notes.forEach((n) => N.audio.hit(n.midi, N.clamp(n.vel + 0.08, 0.35, 1), N.clamp(n.d, 0.25, 1.6)));
    }
    if (g.practice) schedule(g);
    N.renderer.tileHit(lane, best);
    if (best.judge === 'perfect') N.renderer.tilePop(lane, 'Parfait', '#ffe08a');
    if (!g.practice && g.combo > 0 && g.combo % 25 === 0) g.banner = { text: 'Combo ' + g.combo + ' !', t0: performance.now(), small: true };
    N.progress.note();
  };
  TL.release = function (lane) {
    const g = T;
    if (!g) return;
    g.down[lane] = false;
    const tl = g.pressed[lane];
    if (!tl) return;
    if (tl.hold) {
      tl.notes.forEach((n, k) => N.audio.noteOff('tile' + lane + ':' + k));
      tl.holding = false;
    }
    g.pressed[lane] = null;
  };
})();
