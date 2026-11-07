/* Nocturne — théorie : reconnaissance d'accords, gammes */
'use strict';
(function () {
  const N = window.N;
  const T = (N.theory = {});

  // [intervalles, nom français, suffixe anglo-saxon, priorité]
  T.CHORDS = [
    { id: 'maj', iv: [0, 4, 7], fr: 'majeur', sym: '', pri: 10 },
    { id: 'min', iv: [0, 3, 7], fr: 'mineur', sym: 'm', pri: 10 },
    { id: 'dim', iv: [0, 3, 6], fr: 'diminué', sym: 'dim', pri: 6 },
    { id: 'aug', iv: [0, 4, 8], fr: 'augmenté', sym: 'aug', pri: 5 },
    { id: 'sus2', iv: [0, 2, 7], fr: 'sus2', sym: 'sus2', pri: 4 },
    { id: 'sus4', iv: [0, 5, 7], fr: 'sus4', sym: 'sus4', pri: 5 },
    { id: '7', iv: [0, 4, 7, 10], fr: 'septième', sym: '7', pri: 9 },
    { id: 'maj7', iv: [0, 4, 7, 11], fr: 'septième majeure', sym: 'maj7', pri: 9 },
    { id: 'm7', iv: [0, 3, 7, 10], fr: 'mineur septième', sym: 'm7', pri: 9 },
    { id: 'm7b5', iv: [0, 3, 6, 10], fr: 'demi-diminué', sym: 'm7♭5', pri: 7 },
    { id: 'dim7', iv: [0, 3, 6, 9], fr: 'diminué septième', sym: 'dim7', pri: 7 },
    { id: 'mM7', iv: [0, 3, 7, 11], fr: 'mineur septième majeure', sym: 'm(maj7)', pri: 4 },
    { id: '6', iv: [0, 4, 7, 9], fr: 'sixte', sym: '6', pri: 6 },
    { id: 'm6', iv: [0, 3, 7, 9], fr: 'mineur sixte', sym: 'm6', pri: 6 },
    { id: 'add9', iv: [0, 2, 4, 7], fr: 'add9', sym: 'add9', pri: 5 },
    { id: '9', iv: [0, 2, 4, 7, 10], fr: 'neuvième', sym: '9', pri: 6 },
    { id: 'maj9', iv: [0, 2, 4, 7, 11], fr: 'neuvième majeure', sym: 'maj9', pri: 6 },
    { id: 'm9', iv: [0, 2, 3, 7, 10], fr: 'mineur neuvième', sym: 'm9', pri: 6 },
    { id: '7no5', iv: [0, 4, 10], fr: 'septième', sym: '7', pri: 6 },
    { id: 'maj7no5', iv: [0, 4, 11], fr: 'septième majeure', sym: 'maj7', pri: 5 },
    { id: 'm7no5', iv: [0, 3, 10], fr: 'mineur septième', sym: 'm7', pri: 5 },
    { id: '5', iv: [0, 7], fr: 'quinte', sym: '5', pri: 3 },
  ];
  const BY_KEY = new Map();
  T.CHORDS.forEach((c) => BY_KEY.set(c.iv.slice().sort((a, b) => a - b).join(','), c));

  const FLAT_ROOTS = new Set([1, 3, 8, 10]); // Ré♭, Mi♭, La♭, Si♭ plus courants que les dièses
  T.rootName = (pc, style) => N.noteName(pc + 60, style, false, FLAT_ROOTS.has(pc));

  // midis : tableau de notes MIDI enfoncées -> { name, sym, root, bass, chord } ou null
  T.detect = function (midis) {
    const uniq = Array.from(new Set(midis)).sort((a, b) => a - b);
    if (uniq.length < 2) return null;
    const pcs = Array.from(new Set(uniq.map(N.pc)));
    if (pcs.length < 2) return null;
    const bass = N.pc(uniq[0]);
    let best = null;
    for (const root of pcs) {
      const key = pcs.map((p) => (p - root + 12) % 12).sort((a, b) => a - b).join(',');
      const c = BY_KEY.get(key);
      if (!c) continue;
      const score = c.pri + (root === bass ? 4 : 0);
      if (!best || score > best.score) best = { chord: c, root, score };
    }
    if (!best) return null;
    return T.describe(best.root, best.chord, bass);
  };
  T.describe = function (root, chord, bass) {
    const style = N.settings.noteNames;
    const rn = T.rootName(root, style);
    let name = rn + (chord.id === 'maj' ? ' majeur' : ' ' + chord.fr);
    let sym = T.rootName(root, 'english') + chord.sym;
    if (bass != null && bass !== root) {
      name += ' / ' + T.rootName(bass, style);
      sym += '/' + T.rootName(bass, 'english');
    }
    return { name, sym, root, bass, chord };
  };
  T.pcsOf = (root, chordId) => {
    const c = T.CHORDS.find((x) => x.id === chordId);
    return c.iv.map((i) => (root + i) % 12);
  };
  T.sameSet = (a, b) => {
    const A = new Set(a), B = new Set(b);
    if (A.size !== B.size) return false;
    for (const x of A) if (!B.has(x)) return false;
    return true;
  };

  T.SCALES = [
    { id: 'major', name: 'majeure', iv: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'minor', name: 'mineure naturelle', iv: [0, 2, 3, 5, 7, 8, 10] },
    { id: 'harmonic', name: 'mineure harmonique', iv: [0, 2, 3, 5, 7, 8, 11] },
    { id: 'penta', name: 'pentatonique majeure', iv: [0, 2, 4, 7, 9] },
    { id: 'pentamin', name: 'pentatonique mineure', iv: [0, 3, 5, 7, 10] },
    { id: 'blues', name: 'blues', iv: [0, 3, 5, 6, 7, 10] },
    { id: 'chromatic', name: 'chromatique', iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  ];

  // doigtés usuels (une octave) pour quelques gammes
  const FINGER_R = { major: { 0: [1, 2, 3, 1, 2, 3, 4, 5], 7: [1, 2, 3, 1, 2, 3, 4, 5], 2: [1, 2, 3, 1, 2, 3, 4, 5], 9: [1, 2, 3, 1, 2, 3, 4, 5], 4: [1, 2, 3, 1, 2, 3, 4, 5], 5: [1, 2, 3, 4, 1, 2, 3, 4] }, minor: { 9: [1, 2, 3, 1, 2, 3, 4, 5], 4: [1, 2, 3, 1, 2, 3, 4, 5], 2: [1, 2, 3, 1, 2, 3, 4, 5] } };
  const FINGER_L = { major: { 0: [5, 4, 3, 2, 1, 3, 2, 1], 7: [5, 4, 3, 2, 1, 3, 2, 1], 2: [5, 4, 3, 2, 1, 3, 2, 1], 9: [5, 4, 3, 2, 1, 3, 2, 1], 4: [5, 4, 3, 2, 1, 3, 2, 1] }, minor: { 9: [5, 4, 3, 2, 1, 3, 2, 1], 4: [5, 4, 3, 2, 1, 3, 2, 1], 2: [5, 4, 3, 2, 1, 3, 2, 1] } };

  // fabrique un morceau d'exercice (montée + descente)
  T.scaleSong = function (opt) {
    const sc = T.SCALES.find((s) => s.id === opt.type) || T.SCALES[0];
    const octs = opt.octaves || 1;
    const baseR = 60 + opt.tonic;
    const up = [];
    for (let o = 0; o < octs; o++) for (const i of sc.iv) up.push(o * 12 + i);
    up.push(octs * 12);
    const seq = up.concat(up.slice(0, -1).reverse());
    const step = 60 / (opt.bpm || 80) / 2; // croches
    const notes = [];
    const fr = octs === 1 && FINGER_R[sc.id] && FINGER_R[sc.id][opt.tonic];
    const fl = octs === 1 && FINGER_L[sc.id] && FINGER_L[sc.id][opt.tonic];
    const fingerAt = (arr, k) => {
      if (!arr) return 0;
      const n = arr.length; // 8 notes à la montée, miroir à la descente
      return k < n ? arr[k] : arr[2 * (n - 1) - k];
    };
    seq.forEach((off, k) => {
      const last = k === seq.length - 1;
      const d = last ? step * 4 : step;
      const t = k * step;
      if (opt.hands !== 'L') notes.push({ midi: baseR + off, t, d: d - 0.01, hand: 'R', vel: 0.72, finger: fingerAt(fr, k) });
      if (opt.hands !== 'R') notes.push({ midi: baseR - 12 + off, t, d: d - 0.01, hand: 'L', vel: 0.66, finger: fingerAt(fl, k) });
    });
    const name = 'Gamme ' + sc.name + ' de ' + N.pcName(opt.tonic, FLAT_ROOTS.has(opt.tonic));
    const song = N.songs.fromNotes(notes, { id: 'gen-scale', title: name, composer: 'Entraînement', cat: 'gen', source: 'gen', bpm: opt.bpm || 80, ts: [4, 4] });
    return N.songs.register(song);
  };

  // arpèges d'accord (entraînement)
  T.arpeggioSong = function (opt) {
    const iv = T.CHORDS.find((c) => c.id === (opt.type || 'maj')).iv;
    const base = 60 + opt.tonic;
    const up = [];
    for (let o = 0; o < 2; o++) for (const i of iv) up.push(o * 12 + i);
    up.push(24);
    const seq = up.concat(up.slice(0, -1).reverse());
    const step = 60 / (opt.bpm || 80) / 2;
    const notes = [];
    seq.forEach((off, k) => {
      const d = k === seq.length - 1 ? step * 4 : step;
      if (opt.hands !== 'L') notes.push({ midi: base + off, t: k * step, d: d - 0.01, hand: 'R', vel: 0.72 });
      if (opt.hands !== 'R') notes.push({ midi: base - 24 + off, t: k * step, d: d - 0.01, hand: 'L', vel: 0.66 });
    });
    const c = T.CHORDS.find((x) => x.id === (opt.type || 'maj'));
    const song = N.songs.fromNotes(notes, { id: 'gen-arp', title: 'Arpège de ' + T.rootName(opt.tonic) + ' ' + c.fr, composer: 'Entraînement', cat: 'gen', source: 'gen', bpm: opt.bpm || 80 });
    return N.songs.register(song);
  };
})();
