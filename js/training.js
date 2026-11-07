/* Nocturne — entraînements : accords, oreille, lecture de notes (les gammes passent par le moteur de morceaux) */
'use strict';
(function () {
  const N = window.N;
  const TR = (N.training = {});
  const T = () => N.theory;

  function base(kind, title) {
    const q = {
      kind, title, view: { big: '', sub: '', status: 'ask', note: '' }, score: { ok: 0, bad: 0, streak: 0, best: 0 },
      actions: [], timers: [],
      emit() { N.emit('quiz', q); },
      later(fn, ms) { q.timers.push(setTimeout(fn, ms)); },
      stop() { q.timers.forEach(clearTimeout); q.timers = []; N.input.sessionOctave = null; },
      good() {
        q.score.ok++; q.score.streak++;
        q.score.best = Math.max(q.score.best, q.score.streak);
      },
      bad() { q.score.bad++; q.score.streak = 0; },
    };
    return q;
  }
  const heldSounds = () => Array.from(N.game.held.values()).map((h) => h.sound);
  const pcList = (pcs) => pcs.map((p) => N.pcName(p, [1, 3, 8, 10].includes(p))).join(' · ');

  // ---------------- accords ----------------
  const CHORD_LEVELS = {
    1: { name: 'Majeurs', types: ['maj'], roots: [0, 2, 4, 5, 7, 9, 11] },
    2: { name: 'Majeurs et mineurs', types: ['maj', 'min'], roots: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    3: { name: 'Avec septièmes', types: ['maj', 'min', '7', 'maj7', 'm7'], roots: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    4: { name: 'Tous les accords', types: ['maj', 'min', 'dim', 'aug', 'sus4', '7', 'maj7', 'm7', 'm7b5'], roots: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  };
  TR.CHORD_LEVELS = CHORD_LEVELS;
  TR.chords = function (level) {
    const lv = CHORD_LEVELS[level] || CHORD_LEVELS[1];
    const q = base('chords', 'Accords · ' + lv.name);
    q.range = [48, 84];
    q.actions = [{ id: 'hint', label: 'Indice' }, { id: 'skip', label: 'Passer' }];
    let cur = null, shownAt = 0, hint = false, done = false;
    q.start = () => {
      if (N.input.usingPc()) N.input.sessionOctave = 3;
      next();
    };
    function next() {
      let root, type, guard = 0;
      do { root = N.pick(lv.roots); type = N.pick(lv.types); } while (cur && cur.root === root && cur.type === type && guard++ < 10);
      const c = T().CHORDS.find((x) => x.id === type);
      cur = { root, type, pcs: T().pcsOf(root, type), d: T().describe(root, c) };
      shownAt = performance.now(); hint = false; done = false;
      q.view = { big: cur.d.name, sub: cur.d.sym, status: 'ask', note: 'Joue cet accord, dans n’importe quel ordre ou renversement.' };
      q.emit();
    }
    function check() {
      if (!cur || done) return;
      const s = heldSounds();
      const pcs = Array.from(new Set(s.map(N.pc)));
      if (T().sameSet(pcs, cur.pcs)) {
        done = true;
        q.good();
        N.progress.stat('chords');
        N.audio.chime(true);
        q.view = { big: cur.d.name, sub: cur.d.sym, status: 'ok', note: 'Bravo ! ' + pcList(cur.pcs) };
        q.emit();
        q.later(next, 1000);
      } else if (pcs.length >= cur.pcs.length) {
        const det = T().detect(s);
        q.view.note = det ? 'Tu joues : ' + det.name + '.' : 'Pas encore : ' + pcs.length + ' notes enfoncées.';
        q.view.status = 'bad';
        q.emit();
      }
    }
    q.noteDown = () => setTimeout(check, 30);
    q.noteUp = () => {
      if (done) return;
      if (q.view.status === 'bad' && heldSounds().length === 0) { q.view.status = 'ask'; q.view.note = 'Joue cet accord, dans n’importe quel ordre ou renversement.'; q.emit(); }
    };
    q.update = () => {
      if (!cur || done) return;
      if (!hint && performance.now() - shownAt > 9000) { hint = true; q.view.note = 'Indice : ' + pcList(cur.pcs); q.emit(); }
      if (hint) {
        // position fondamentale autour du Do central
        let r = 60 + cur.root; if (r > 66) r -= 12;
        const iv = T().CHORDS.find((x) => x.id === cur.type).iv;
        iv.forEach((i) => N.renderer.setHint(r + i, 0.8, 'R'));
      }
    };
    q.action = (id) => {
      if (id === 'hint') { hint = true; q.view.note = 'Indice : ' + pcList(cur.pcs); q.emit(); }
      if (id === 'skip') { q.bad(); next(); }
    };
    return q;
  };

  // ---------------- oreille ----------------
  const EAR_LEVELS = {
    1: { name: 'Touches blanches', pool: [60, 62, 64, 65, 67, 69, 71, 72] },
    2: { name: 'Toutes les notes', pool: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72] },
    3: { name: 'Intervalles', interval: true },
    4: { name: 'Mélodies de trois notes', melody: true, pool: [60, 62, 64, 65, 67] },
  };
  TR.EAR_LEVELS = EAR_LEVELS;
  const IV_NAMES = ['unisson', 'seconde mineure', 'seconde majeure', 'tierce mineure', 'tierce majeure', 'quarte', 'triton', 'quinte', 'sixte mineure', 'sixte majeure', 'septième mineure', 'septième majeure', 'octave'];
  TR.ear = function (level) {
    const lv = EAR_LEVELS[level] || EAR_LEVELS[1];
    const q = base('ear', 'Oreille · ' + lv.name);
    q.range = [48, 84];
    q.actions = [{ id: 'replay', label: 'Réécouter' }, { id: 'answer', label: 'Réponse' }, { id: 'skip', label: 'Suivante' }];
    let seq = [], idx = 0, tries = 0, ref = 60, locked = true, revealed = false;
    const play = () => {
      locked = true;
      let t = 0.05;
      if (!lv.interval) { N.audio.play(ref, 0.6, 0.6, t); t += 0.9; }
      seq.forEach((m, i) => N.audio.play(m, 0.7, 0.65, t + i * 0.7));
      q.later(() => { locked = false; }, (t + (seq.length - 1) * 0.7) * 1000 + 150);
    };
    function next() {
      idx = 0; tries = 0; revealed = false;
      if (lv.interval) {
        const a = N.randInt(55, 67);
        const iv = N.randInt(1, 12);
        seq = [a, a + iv];
        idx = 1;
        q.view = { big: 'Quelle est la 2ᵉ note ?', sub: 'La 1ʳᵉ est ' + N.noteName(a, null, true) + ' (allumée).', status: 'ask', note: 'Écoute, puis joue la seconde note.' };
      } else if (lv.melody) {
        seq = [N.pick(lv.pool), N.pick(lv.pool), N.pick(lv.pool)];
        q.view = { big: 'Rejoue la mélodie', sub: 'Trois notes, après le Do de référence.', status: 'ask', note: 'Écoute, puis joue les trois notes dans l’ordre.' };
      } else {
        let m; do { m = N.pick(lv.pool); } while (seq.length && m === seq[0] && lv.pool.length > 1);
        seq = [m];
        q.view = { big: 'Quelle est cette note ?', sub: 'Le Do de référence est joué d’abord.', status: 'ask', note: 'Écoute, puis cherche la note sur le clavier.' };
      }
      q.emit();
      play();
    }
    q.start = () => { if (N.input.usingPc()) N.input.sessionOctave = 3; q.later(next, 400); };
    q.update = () => {
      if (lv.interval && seq.length) N.renderer.setHint(seq[0], 0.7, 'L');
      if (revealed && seq[idx] != null) N.renderer.setHint(seq[idx], 0.9, 'R');
    };
    q.noteDown = (key, sound) => {
      if (locked || !seq.length || idx >= seq.length) return;
      const target = seq[idx];
      if (N.pc(sound) === N.pc(target)) {
        idx++;
        if (idx >= seq.length) {
          if (!revealed && tries === 0) q.good(); else if (!revealed) { q.score.ok++; q.score.streak = 0; }
          N.progress.stat('earBest', q.score.streak, 'max');
          N.audio.chime(true);
          const names = seq.map((m) => N.noteName(m, null, true)).join(' · ');
          const extra = lv.interval ? ' — ' + IV_NAMES[Math.min(12, seq[1] - seq[0])] : '';
          q.view = Object.assign({}, q.view, { status: 'ok', note: 'Oui ! ' + names + extra });
          q.emit();
          locked = true;
          q.later(next, 1300);
        } else {
          q.view = Object.assign({}, q.view, { status: 'ask', note: 'Bien, continue (' + idx + '/' + seq.length + ')' });
          q.emit();
        }
      } else {
        tries++;
        const dir = Math.abs(target - sound) > 12 ? 'Cherche près du Do central' : target > sound ? 'Plus haut ↑' : 'Plus bas ↓';
        if (tries === 1) q.bad();
        if (lv.melody) { idx = 0; q.view = Object.assign({}, q.view, { status: 'bad', note: 'Raté, on reprend depuis la 1ʳᵉ note.' }); }
        else q.view = Object.assign({}, q.view, { status: 'bad', note: dir + (tries >= 3 ? ' · la touche est allumée' : '') });
        if (tries >= 3) revealed = true;
        q.emit();
      }
    };
    q.action = (id) => {
      if (id === 'replay') play();
      if (id === 'answer') { revealed = true; if (!tries) q.bad(); q.view = Object.assign({}, q.view, { note: 'Réponse : ' + seq.map((m) => N.noteName(m, null, true)).join(' · ') }); q.emit(); }
      if (id === 'skip') { if (q.view.status !== 'ok') q.bad(); next(); }
    };
    return q;
  };

  // ---------------- lecture de notes ----------------
  const LETTERS = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
  function stepOf(midi, acc) {
    const oct = Math.floor(midi / 12) - 1;
    let pc = N.pc(midi), o = oct;
    if (acc === '♯') pc -= 1;
    else if (acc === '♭') pc += 1;
    if (pc < 0) { pc += 12; o--; }
    if (pc > 11) { pc -= 12; o++; }
    return o * 7 + LETTERS[pc];
  }
  const READ_LEVELS = {
    1: { name: 'Clé de sol', clefs: ['treble'] },
    2: { name: 'Clé de fa', clefs: ['bass'] },
    3: { name: 'Les deux clés', clefs: ['treble', 'bass'] },
    4: { name: 'Avec dièses et bémols', clefs: ['treble'], acc: true },
  };
  TR.READ_LEVELS = READ_LEVELS;
  TR.reading = function (level) {
    const lv = READ_LEVELS[level] || READ_LEVELS[1];
    const q = base('reading', 'Lecture · ' + lv.name);
    const pc = N.input.usingPc();
    const needBass = lv.clefs.includes('bass');
    const oct = needBass ? 2 : 3;
    const pcRange = N.input.range(oct);
    q.range = needBass ? [40, 81] : [57, 84];
    q.actions = [{ id: 'answer', label: 'Réponse' }, { id: 'skip', label: 'Suivante' }];
    let cur = null, tries = 0, revealed = false;
    function candidates(clef) {
      const lo = clef === 'bass' ? 40 : 60, hi = clef === 'bass' ? 60 : 81; // Mi2–Do4 / Do4–La5
      const out = [];
      for (let m = lo; m <= hi; m++) {
        if (pc && (m < pcRange[0] || m > pcRange[1])) continue;
        if (!N.isBlack(m)) out.push({ midi: m, acc: '' });
        else if (lv.acc) out.push({ midi: m, acc: Math.random() < 0.5 ? '♯' : '♭' });
      }
      return out;
    }
    function next() {
      const clef = N.pick(lv.clefs);
      let c, guard = 0;
      do { c = N.pick(candidates(clef)); } while (cur && c.midi === cur.midi && guard++ < 8);
      cur = { clef, midi: c.midi, acc: c.acc };
      tries = 0; revealed = false;
      q.staff = { clef, notes: [{ step: stepOf(c.midi, c.acc), acc: c.acc, state: '', label: '' }] };
      q.view = { big: 'Quelle note est écrite ?', sub: clef === 'bass' ? 'Clé de fa' : 'Clé de sol', status: 'ask', note: 'Joue-la à la bonne hauteur sur le clavier.' };
      q.emit();
    }
    const nameOf = (c) => {
      const flat = c.acc === '♭';
      return N.noteName(c.midi, null, true, flat);
    };
    q.start = () => { if (pc) N.input.sessionOctave = oct; next(); };
    q.update = () => { if (revealed && cur) N.renderer.setHint(cur.midi, 0.9, 'R'); };
    q.noteDown = (key, sound) => {
      if (!cur || q.staff.notes[0].state === 'ok') return;
      if (sound === cur.midi) {
        if (tries === 0 && !revealed) q.good(); else q.score.streak = 0;
        N.progress.stat('readBest', q.score.streak, 'max');
        q.staff.notes[0].state = 'ok';
        q.staff.notes[0].label = nameOf(cur);
        q.view = Object.assign({}, q.view, { status: 'ok', note: 'Oui : ' + nameOf(cur) + '.' });
        q.emit();
        q.later(next, 750);
      } else {
        tries++;
        if (tries === 1) q.bad();
        q.staff.notes[0].state = 'bad';
        q.later(() => { if (q.staff.notes[0].state === 'bad') q.staff.notes[0].state = ''; }, 350);
        const sameName = N.pc(sound) === N.pc(cur.midi);
        q.view = Object.assign({}, q.view, { status: 'bad', note: sameName ? 'Bonne note, mais pas la bonne octave.' : 'Ce n’est pas ' + N.noteName(sound, null, true) + '.' });
        if (tries >= 3) revealed = true;
        q.emit();
      }
    };
    q.action = (id) => {
      if (id === 'answer' && cur) { revealed = true; if (!tries) q.bad(); q.staff.notes[0].label = nameOf(cur); q.view = Object.assign({}, q.view, { note: 'C’est ' + nameOf(cur) + '.' }); q.emit(); }
      if (id === 'skip') { if (q.staff.notes[0].state !== 'ok') q.bad(); next(); }
    };
    return q;
  };
})();
