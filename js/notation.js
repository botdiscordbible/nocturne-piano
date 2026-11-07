/* Nocturne — construction des morceaux : notation compacte, fichiers MIDI, enregistrements
   Notation : notes « C4 », « F#3 », « Bb4 » ; durées w h q e s x (ronde → triple croche),
   « . » pointé, « 3 » triolet, « + » liaison (h+e) ; « r » silence ; « [C4 E4 G4]h » accord ;
   « @1 » ou « @1,3,5 » doigté ; « | » barre de mesure ; « !p !mf !f » nuances.
   Une durée omise reprend la précédente. */
'use strict';
(function () {
  const N = window.N;
  const S = (N.songs = N.songs || {});

  const DUR = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, x: 0.125 };
  const DYN = { ppp: 0.25, pp: 0.35, p: 0.48, mp: 0.6, mf: 0.72, f: 0.84, ff: 0.95, fff: 1 };
  const DUR_RE = /^([whqesx])(\.{0,2})(3?)$/;

  function parseDur(str) {
    if (!str) return null;
    let total = 0;
    for (const part of str.split('+')) {
      const m = DUR_RE.exec(part);
      if (!m) return NaN;
      let d = DUR[m[1]];
      if (m[2] === '.') d *= 1.5;
      else if (m[2] === '..') d *= 1.75;
      if (m[3]) d *= 2 / 3;
      total += d;
    }
    return total;
  }
  S.parseDur = parseDur;

  const TOKEN_RE = /\[[^\]]*\][^\s|]*|\||[^\s|]+/g;
  const NOTE_RE = /^([A-G](?:#|b)?-?\d)((?:[whqesx]\.{0,2}3?)(?:\+[whqesx]\.{0,2}3?)*)?(?:@([\d,]+))?$/;
  const CHORD_RE = /^\[([^\]]*)\]((?:[whqesx]\.{0,2}3?)(?:\+[whqesx]\.{0,2}3?)*)?(?:@([\d,]+))?$/;
  const REST_RE = /^r((?:[whqesx]\.{0,2}3?)(?:\+[whqesx]\.{0,2}3?)*)?$/;

  // renvoie { events:[{beat,dur,midis,vel,fingers}], bars:[beats], end, errors:[] }
  S.parseVoice = function (str, label) {
    const out = { events: [], bars: [], end: 0, errors: [] };
    let beat = 0, last = 1, vel = DYN.mf;
    const tokens = (str || '').match(TOKEN_RE) || [];
    for (const tok of tokens) {
      if (tok === '|') { out.bars.push(beat); continue; }
      if (tok[0] === '!') { const v = DYN[tok.slice(1)]; if (v) vel = v; else out.errors.push(label + ': nuance inconnue ' + tok); continue; }
      let m;
      if ((m = REST_RE.exec(tok))) {
        const d = m[1] ? parseDur(m[1]) : last;
        if (!(d > 0)) { out.errors.push(label + ': durée invalide ' + tok); continue; }
        last = d; beat += d; continue;
      }
      let midis = null, dstr = null, fstr = null;
      if ((m = CHORD_RE.exec(tok))) {
        midis = m[1].trim().split(/\s+/).map(N.parsePitch);
        dstr = m[2]; fstr = m[3];
      } else if ((m = NOTE_RE.exec(tok))) {
        midis = [N.parsePitch(m[1])];
        dstr = m[2]; fstr = m[3];
      }
      if (!midis || midis.some((x) => x == null)) { out.errors.push(label + ': jeton illisible « ' + tok + ' »'); continue; }
      const d = dstr ? parseDur(dstr) : last;
      if (!(d > 0)) { out.errors.push(label + ': durée invalide ' + tok); continue; }
      last = d;
      midis.sort((a, b) => a - b);
      const fingers = fstr ? fstr.split(',').map(Number) : null;
      out.events.push({ beat, dur: d, midis, vel, fingers });
      beat += d;
    }
    out.end = beat;
    return out;
  };

  const ppqOf = (parsed) => parsed.ppq || 480;

  function tsOf(def) {
    const [num, den] = (def.ts || '4/4').split('/').map(Number);
    return { num, den, barBeats: (num * 4) / den, compound: den === 8 && num % 3 === 0 && num > 3 };
  }

  // tempo : bpm constant ou carte [{beat, bpm}]
  function beatClock(def) {
    const map = (def.tempo && def.tempo.length ? def.tempo.slice() : [{ beat: 0, bpm: def.bpm || 100 }]).sort((a, b) => a.beat - b.beat);
    if (map[0].beat > 0) map.unshift({ beat: 0, bpm: def.bpm || map[0].bpm });
    const segs = [];
    let sec = 0;
    for (let i = 0; i < map.length; i++) {
      if (i > 0) sec += ((map[i].beat - map[i - 1].beat) * 60) / map[i - 1].bpm;
      segs.push({ beat: map[i].beat, sec, spb: 60 / map[i].bpm });
    }
    return function (b) {
      let s = segs[0];
      for (let i = 1; i < segs.length; i++) if (segs[i].beat <= b) s = segs[i]; else break;
      return s.sec + (b - s.beat) * s.spb;
    };
  }

  // validation : chaque mesure doit faire la bonne longueur
  S.validate = function (def) {
    const ts = tsOf(def);
    const errs = [];
    const pick = def.pickup || 0;
    const ends = {};
    for (const key of Object.keys(def.parts || {})) {
      const v = S.parseVoice(def.parts[key], def.id + '/' + key);
      errs.push(...v.errors);
      let prev = 0;
      v.bars.forEach((b, i) => {
        const len = b - prev;
        const expect = i === 0 && pick ? pick : ts.barBeats;
        const ratio = len / expect;
        if (Math.abs(ratio - Math.round(ratio)) > 1e-6 || Math.round(ratio) < 1) errs.push(`${def.id}/${key}: mesure ${i + (pick ? 0 : 1)} = ${len} temps (attendu ${expect})`);
        prev = b;
      });
      ends[key] = v.end;
    }
    const vals = Object.values(ends);
    if (vals.length > 1 && Math.max(...vals) - Math.min(...vals) > 1e-6) errs.push(def.id + ': les voix n’ont pas la même longueur ' + JSON.stringify(ends));
    return errs;
  };

  function finalize(song) {
    song.notes.sort((a, b) => a.t - b.t || a.midi - b.midi);
    song.notes.forEach((n, i) => (n.i = i));
    let end = 0, lo = 127, hi = 0, maxDur = 0;
    const hands = { R: 0, L: 0, A: 0 };
    for (const n of song.notes) {
      end = Math.max(end, n.t + n.d);
      lo = Math.min(lo, n.midi); hi = Math.max(hi, n.midi);
      maxDur = Math.max(maxDur, n.d);
      hands[n.hand] = (hands[n.hand] || 0) + 1;
      if (n.ad == null) n.ad = n.d;
    }
    song.duration = end;
    song.lo = lo; song.hi = hi;
    song.maxDur = maxDur;
    song.handCount = hands;
    song.hasR = hands.R > 0; song.hasL = hands.L > 0;
    return song;
  }

  // ---------- depuis la notation ----------
  S.fromDef = function (def) {
    const ts = tsOf(def);
    const clock = beatClock(def);
    const song = {
      id: def.id, title: def.title, composer: def.composer || '', level: def.level || 1, cat: def.cat || 'classique',
      desc: def.desc || '', source: def.source || 'builtin', bpm: def.bpm || 100, ts: [ts.num, ts.den], notes: [], bars: [], beats: [],
    };
    let endBeat = 0;
    for (const key of Object.keys(def.parts || {})) {
      const hand = key[0] === 'L' ? 'L' : key[0] === 'A' ? 'A' : 'R';
      const v = S.parseVoice(def.parts[key], def.id + '/' + key);
      endBeat = Math.max(endBeat, v.end);
      for (const ev of v.events) {
        const t = clock(ev.beat), t2 = clock(ev.beat + ev.dur);
        ev.midis.forEach((midi, k) => {
          song.notes.push({ midi, t, d: Math.max(0.05, t2 - t - 0.012), hand, vel: ev.vel, finger: ev.fingers ? ev.fingers[Math.min(k, ev.fingers.length - 1)] : 0 });
        });
      }
    }
    // mesures et temps
    const pick = def.pickup || 0;
    song.hasPickup = pick > 0;
    for (let b = pick; b <= endBeat + 1e-6; b += ts.barBeats) song.bars.push(clock(b));
    if (pick) song.bars.unshift(0);
    const unit = ts.compound ? 1.5 : 4 / ts.den;
    const perBar = Math.round(ts.barBeats / unit);
    let k = 0;
    for (let b = pick - Math.ceil(pick / unit - 1e-6) * unit; b <= endBeat + 1e-6; b += unit, k++) {
      const rel = Math.round((b - pick) / unit);
      song.beats.push({ t: clock(b), accent: ((rel % perBar) + perBar) % perBar === 0 });
    }
    // pédale « par mesure » pour l'accompagnement
    finalize(song);
    if (def.pedal === 'bar') {
      for (const n of song.notes) {
        const bi = song.bars.findIndex((bt) => bt > n.t + 1e-4);
        const nextBar = bi >= 0 ? song.bars[bi] : song.duration;
        n.ad = Math.max(n.d, nextBar - n.t);
      }
    }
    song.beatLen = 60 / (def.bpm || 100) * unit;
    return song;
  };

  // ---------- depuis un fichier MIDI ----------
  // assign : tableau index de piste -> 'R' | 'L' | 'A' | 'M' (muet) ; split : note de séparation pour une piste unique
  S.fromMidi = function (parsed, meta, assign, split) {
    meta = meta || {};
    const t2s = parsed.tickToSec;
    // pistes candidates (on ignore la batterie, canal 10)
    const groups = [];
    for (const tr of parsed.tracks) {
      const notes = tr.notes.filter((n) => n.ch !== 9);
      if (!notes.length) continue;
      const avg = notes.reduce((a, n) => a + n.midi, 0) / notes.length;
      groups.push({ index: tr.index, name: tr.name || tr.instrument || 'Piste ' + (tr.index + 1), count: notes.length, avg, notes, pedal: tr.pedal, programs: tr.programs });
    }
    // une seule piste à plusieurs canaux : on sépare par canal
    if (groups.length === 1) {
      const chans = new Set(groups[0].notes.map((n) => n.ch));
      if (chans.size > 1) {
        const g0 = groups.pop();
        for (const ch of chans) {
          const notes = g0.notes.filter((n) => n.ch === ch);
          groups.push({ index: g0.index * 100 + ch, name: 'Canal ' + (ch + 1), count: notes.length, avg: notes.reduce((a, n) => a + n.midi, 0) / notes.length, notes, pedal: g0.pedal, programs: g0.programs });
        }
      }
    }
    if (!groups.length) throw new Error('Ce fichier MIDI ne contient aucune note jouable.');
    const tracks = groups.map((g) => ({ index: g.index, name: g.name, count: g.count, avg: g.avg }));
    // affectation automatique des mains
    if (!assign) {
      assign = {};
      if (groups.length === 1) assign[groups[0].index] = 'S'; // séparation par hauteur
      else {
        const sorted = groups.slice().sort((a, b) => b.count - a.count);
        const main = sorted.slice(0, 2).sort((a, b) => b.avg - a.avg);
        groups.forEach((g) => (assign[g.index] = 'A'));
        assign[main[0].index] = 'R';
        if (main[1]) assign[main[1].index] = 'L';
      }
    }
    split = split || 60;
    const song = {
      id: meta.id || 'midi-' + Date.now(), title: meta.title || 'Fichier MIDI', composer: meta.composer || 'Fichier importé', level: 0, cat: 'import',
      desc: '', source: 'midi', bpm: Math.round(parsed.bpm), ts: [4, 4], notes: [], bars: [], beats: [], tracks, assign, split,
    };
    const firstTick = Math.min(...groups.map((g) => g.notes[0].tick));
    const offset = t2s(firstTick) > 1.2 ? t2s(firstTick) - 0.2 : 0; // on retire le long silence initial
    for (const g of groups) {
      const a = assign[g.index] || 'A';
      if (a === 'M') continue;
      const pedalByCh = {};
      for (const ch in g.pedal || {}) pedalByCh[ch] = g.pedal[ch].slice().sort((x, y) => x.tick - y.tick);
      for (const n of g.notes) {
        const hand = a === 'S' ? (n.midi >= split ? 'R' : 'L') : a;
        const t = t2s(n.tick) - offset, te = t2s(n.end) - offset;
        // durée audio prolongée par la pédale de sustain (si elle est enfoncée au relâchement de la note)
        let endTick = n.end;
        const pe = pedalByCh[n.ch];
        if (pe && pe.length) {
          let lo = 0, hi = pe.length; // premier évènement après la fin de la note
          while (lo < hi) { const mid = (lo + hi) >> 1; if (pe[mid].tick <= n.end) lo = mid + 1; else hi = mid; }
          const down = lo > 0 && pe[lo - 1].on;
          if (down) {
            let j = lo;
            while (j < pe.length && pe[j].on) j++;
            endTick = j < pe.length ? pe[j].tick : n.end + ppqOf(parsed) * 2;
          }
        }
        const ad = Math.min(8, t2s(Math.max(endTick, n.end)) - offset - t);
        song.notes.push({ midi: n.midi, t, d: Math.max(0.04, te - t), ad: Math.max(0.04, ad), hand, vel: N.clamp(n.vel / 127, 0.1, 1), finger: 0, track: g.index });
      }
    }
    finalize(song);
    // mesures depuis les signatures rythmiques
    const ppq = parsed.ppq;
    const sigs = parsed.timeSigs.length ? parsed.timeSigs : [{ tick: 0, num: 4, den: 4 }];
    if (sigs[0].tick > 0) sigs.unshift({ tick: 0, num: 4, den: 4 });
    song.ts = [sigs[0].num, sigs[0].den];
    const endTick = parsed.endTick;
    for (let i = 0; i < sigs.length; i++) {
      const s = sigs[i];
      const stop = i + 1 < sigs.length ? sigs[i + 1].tick : endTick + ppq * 4;
      const beatTicks = (ppq * 4) / s.den;
      const barTicks = beatTicks * s.num;
      if (barTicks <= 0) continue;
      for (let tk = s.tick, k = 0; tk < stop && song.bars.length < 20000; tk += beatTicks, k++) {
        const t = t2s(tk) - offset;
        if (k % s.num === 0) song.bars.push(t);
        song.beats.push({ t, accent: k % s.num === 0 });
      }
    }
    song.bars = song.bars.filter((t) => t >= -0.001 && t <= song.duration + 4);
    song.beats = song.beats.filter((b) => b.t >= -0.001 && b.t <= song.duration + 1);
    song.beatLen = song.beats.length > 1 ? song.beats[1].t - song.beats[0].t : 0.5;
    return song;
  };

  // ---------- depuis un enregistrement ----------
  S.fromNotes = function (notes, meta) {
    const song = {
      id: meta.id, title: meta.title, composer: meta.composer || '', level: meta.level || 0, cat: meta.cat || 'rec', desc: meta.desc || '',
      source: meta.source || 'rec', bpm: meta.bpm || 120, ts: meta.ts || [4, 4], notes: notes.map((n) => ({ ...n })), bars: [], beats: [],
    };
    finalize(song);
    const bl = 60 / song.bpm;
    const perBar = song.ts[0];
    for (let k = 0, t = 0; t <= song.duration + bl; k++, t += bl) {
      if (k % perBar === 0) song.bars.push(t);
      song.beats.push({ t, accent: k % perBar === 0 });
    }
    song.beatLen = bl;
    return song;
  };
})();
