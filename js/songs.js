/* Nocturne — bibliothèque intégrée : œuvres du domaine public, arrangements faits pour le jeu */
'use strict';
(function () {
  const N = window.N;
  const S = N.songs;

  const rep = (s, n) => Array(n).fill(s).join(' | ');

  // Prélude en do majeur (BWV 846) : 5 notes par mesure, motif de Bach généré
  function bachPrelude(rows) {
    const R = [], L = [], L2 = [];
    for (const row of rows) {
      const [n1, n2, n3, n4, n5] = row.split(' ');
      const half = `re ${n3}s ${n4}s ${n5}s ${n3}s ${n4}s ${n5}s`;
      R.push(`${half} ${half}`);
      L.push(`${n1}h ${n1}h`);
      L2.push(`rs ${n2}e.+q rs ${n2}e.+q`);
    }
    R.push('[E4 G4 C5]w');
    L.push('C2w');
    L2.push('C3w');
    return { R: R.join(' | '), L: L.join(' | '), L2: L2.join(' | ') };
  }

  const MOUNTAIN = 'A3e B3e C4e D4e E4e C4e E4q | D#4e B3e D#4q D4e A#3e D4q | A3e B3e C4e D4e E4e C4e E4e A4e | G4e E4e C4e E4e G4h';
  const MOUNTAIN_HI = 'A4e B4e C5e D5e E5e C5e E5q | D#5e B4e D#5q D5e A#4e D5q | A4e B4e C5e D5e E5e C5e E5e A5e | G5e E5e C5e E5e G5h';
  const MOUNTAIN_L = 'A2q E3q A2q E3q | B2q F#3q A#2q F3q | A2q E3q A2q E3q | C3q G2q C3q G2q';

  const KORO_R = 'E5q B4e C5e D5q C5e B4e | A4q A4e C5e E5q D5e C5e | B4q. C5e D5q E5q | C5q A4q A4h | D5q. F5e A5q G5e F5e | E5q. C5e E5q D5e C5e | B4q B4e C5e D5q E5q | C5q A4q A4h';
  const KORO_L = 'E3h B2h | A2h E3h | E3h B2h | A2h E3h | D3h A3h | C3h G3h | E3h B2h | A2h E3h';

  const CANON_L = '[D3 A3]h [A2 E3]h | [B2 F#3]h [F#2 C#3]h | [G2 D3]h [D2 A2]h | [G2 D3]h [A2 E3]h';

  const ELISE_A = 'E5s D#5s E5s B4s D5s C5s | A4e rs C4s E4s A4s | B4e rs E4s G#4s B4s | C5e rs E4s E5s D#5s | E5s D#5s E5s B4s D5s C5s | A4e rs C4s E4s A4s | B4e rs E4s C5s B4s';
  const ELISE_L = 'rq. | A2s E3s A3s re. | E2s E3s G#3s re. | A2s E3s A3s re. | rq. | A2s E3s A3s re. | E2s E3s G#3s re.';

  const NOC = {
    am: 'A2e E3e A3e E3e A2e E3e A3e E3e',
    f: 'F2e C3e F3e C3e F2e C3e F3e C3e',
    c: 'C3e G3e C4e G3e C3e G3e C4e G3e',
    g: 'G2e D3e G3e D3e G2e D3e G3e D3e',
    e: 'E2e B2e G#3e B2e E2e B2e G#3e B2e',
    dm: 'D3e A3e D4e A3e D3e A3e D4e A3e',
  };

  S.BUILTIN_DEFS = [
    // ---------------- Débutant ----------------
    {
      id: 'clair-de-la-lune', title: 'Au clair de la lune', composer: 'Chanson traditionnelle', level: 1, cat: 'trad', bpm: 96, ts: '4/4',
      desc: 'La toute première mélodie : cinq notes autour du Do central.',
      parts: {
        R: 'C4q@1 C4@1 C4@1 D4@2 | E4h@3 D4h@2 | C4q@1 E4@3 D4@2 D4@2 | C4w@1 | C4q@1 C4@1 C4@1 D4@2 | E4h@3 D4h@2 | C4q@1 E4@3 D4@2 D4@2 | C4w@1 | D4q@5 D4@5 D4@5 D4@5 | A3h@2 A3h@2 | D4q@5 C4@4 B3@3 A3@2 | G3w@1 | C4q@1 C4@1 C4@1 D4@2 | E4h@3 D4h@2 | C4q@1 E4@3 D4@2 D4@2 | C4w@1',
        L: 'C3w | C3h G2h | C3h G2h | C3w | C3w | C3h G2h | C3h G2h | C3w | G2w | D3w | G2w | G2w | C3w | C3h G2h | C3h G2h | C3w',
      },
    },
    {
      id: 'frere-jacques', title: 'Frère Jacques', composer: 'Chanson traditionnelle', level: 1, cat: 'trad', bpm: 104, ts: '4/4',
      desc: 'Un canon que tout le monde connaît, sur une quinte tenue à la main gauche.',
      parts: {
        R: 'C4q D4 E4 C4 | C4q D4 E4 C4 | E4q F4 G4h | E4q F4 G4h | G4e A4 G4 F4 E4q C4 | G4e A4 G4 F4 E4q C4 | C4q G3 C4h | C4q G3 C4h',
        L: '[C3 G3]w | [C3 G3]w | [C3 G3]w | [C3 G3]w | [C3 G3]w | [C3 G3]w | C3w | C3w',
      },
    },
    {
      id: 'vous-dirai-je', title: 'Ah ! vous dirai-je, maman', composer: 'Chanson traditionnelle', level: 1, cat: 'trad', bpm: 100, ts: '4/4',
      desc: 'L’air que Mozart a varié douze fois. Idéal pour les deux mains.',
      parts: {
        R: 'C4q C4 G4 G4 | A4q A4 G4h | F4q F4 E4 E4 | D4q D4 C4h | G4q G4 F4 F4 | E4q E4 D4h | G4q G4 F4 F4 | E4q E4 D4h | C4q C4 G4 G4 | A4q A4 G4h | F4q F4 E4 E4 | D4q D4 C4h',
        L: 'C3w | F3h C3h | F3h C3h | G3h C3h | C3h G3h | C3h G3h | C3h G3h | C3h G3h | C3w | F3h C3h | F3h C3h | G3h C3h',
      },
    },
    {
      id: 'hymne-joie', title: 'Hymne à la joie', composer: 'Ludwig van Beethoven', level: 2, cat: 'classique', bpm: 108, ts: '4/4',
      desc: 'Le thème de la 9ᵉ Symphonie, en Do majeur.',
      parts: {
        R: 'E4q E4 F4 G4 | G4q F4 E4 D4 | C4q C4 D4 E4 | E4q. D4e D4h | E4q E4 F4 G4 | G4q F4 E4 D4 | C4q C4 D4 E4 | D4q. C4e C4h | D4q D4 E4 C4 | D4q E4e F4e E4q C4q | D4q E4e F4e E4q D4q | C4q D4q G3h | E4q E4 F4 G4 | G4q F4 E4 D4 | C4q C4 D4 E4 | D4q. C4e C4h',
        L: 'C3w | G2w | C3w | G2w | C3w | G2w | C3w | G2h C3h | G2h C3h | G2h C3h | G2w | C3h G2h | C3w | G2w | C3w | G2h C3h',
      },
    },
    {
      id: 'joyeux-anniversaire', title: 'Joyeux anniversaire', composer: 'Mildred et Patty Hill', level: 2, cat: 'fetes', bpm: 100, ts: '3/4', pickup: 1,
      desc: 'Pour briller au prochain gâteau.',
      parts: {
        R: 'G3e. G3s | A3q G3 C4 | B3h G3e. G3s | A3q G3 D4 | C4h G3e. G3s | G4q E4 C4 | B3q A3 F4e. F4s | E4q C4 D4 | C4h.',
        L: 'rq | C3h. | G2h. | G2h. | C3h. | C3h. | F2h. | C3h G2q | C3h.',
      },
    },
    {
      id: 'jingle-bells', title: 'Jingle Bells', composer: 'James Lord Pierpont', level: 2, cat: 'fetes', bpm: 120, ts: '4/4',
      desc: 'Le refrain, avec une basse qui balance.',
      parts: {
        R: 'E4q E4 E4h | E4q E4 E4h | E4q G4 C4q. D4e | E4w | F4q F4 F4q. F4e | F4q E4 E4 E4e E4e | E4q D4 D4 E4 | D4h G4h | E4q E4 E4h | E4q E4 E4h | E4q G4 C4q. D4e | E4w | F4q F4 F4 F4 | F4q E4 E4 E4e E4e | G4q G4 F4 D4 | C4w',
        L: 'C3h G2h | C3h G2h | C3h G2h | C3h G2h | F2h C3h | C3h G2h | G2h D3h | G2w | C3h G2h | C3h G2h | C3h G2h | C3h G2h | F2h C3h | C3h G2h | G2h G2h | C3w',
      },
    },
    {
      id: 'douce-nuit', title: 'Douce nuit', composer: 'Franz Xaver Gruber', level: 2, cat: 'fetes', bpm: 72, ts: '6/8',
      desc: 'Une berceuse de Noël, toute en douceur.',
      parts: {
        R: '!mp G4q. A4e G4q | E4h. | G4q. A4e G4q | E4h. | D5h D5q | B4h. | C5h C5q | G4h. | A4h A4q | C5q. B4e A4q | G4q. A4e G4q | E4h. | A4h A4q | C5q. B4e A4q | G4q. A4e G4q | E4h. | D5h D5q | F5q. D5e B4q | C5h. | E5h. | C5q. G4e E4q | G4q. F4e D4q | C4h.',
        L: '!p [C3 G3]h. | [C3 G3]h. | [C3 G3]h. | [C3 G3]h. | [G2 D3]h. | [G2 D3]h. | [C3 G3]h. | [C3 G3]h. | [F2 C3]h. | [F2 C3]h. | [C3 G3]h. | [C3 G3]h. | [F2 C3]h. | [F2 C3]h. | [C3 G3]h. | [C3 G3]h. | [G2 D3]h. | [G2 D3]h. | [C3 G3]h. | [C3 G3]h. | [C3 G3]h. | [G2 D3]h. | [C3 G3]h.',
      },
    },
    // ---------------- Intermédiaire ----------------
    {
      id: 'korobeiniki', title: 'Korobeïniki', composer: 'Chant populaire russe', level: 3, cat: 'trad', bpm: 112, ts: '4/4',
      desc: 'Le célèbre air des colporteurs, qui se joue de plus en plus vite.',
      parts: { R: KORO_R + ' | ' + KORO_R, L: KORO_L + ' | ' + KORO_L },
    },
    {
      id: 'greensleeves', title: 'Greensleeves', composer: 'Chanson traditionnelle anglaise', level: 3, cat: 'trad', bpm: 88, ts: '6/8', pickup: 0.5,
      desc: 'Une complainte de la Renaissance en La mineur.',
      parts: {
        R: 'A4e | C5q D5e E5e. F5s E5e | D5q B4e G4e. A4s B4e | C5q A4e A4e. G#4s A4e | B4q G#4e E4q A4e | C5q D5e E5e. F5s E5e | D5q B4e G4e. A4s B4e | C5e. B4s A4e G#4e. F#4s G#4e | A4h. | G5q. G5e. F#5s E5e | D5q B4e G4e. A4s B4e | C5q A4e A4e. G#4s A4e | B4q G#4e E4q. | G5q. G5e. F#5s E5e | D5q B4e G4e. A4s B4e | C5e. B4s A4e G#4e. F#4s G#4e | A4h.',
        L: 're | [A2 E3]h. | [G2 D3]h. | [A2 E3]h. | [E2 B2]h. | [A2 E3]h. | [G2 D3]h. | [A2 E3]q. [E2 B2]q. | [A2 E3]h. | [C3 G3]h. | [G2 D3]h. | [A2 E3]h. | [E2 B2]h. | [C3 G3]h. | [G2 D3]h. | [A2 E3]q. [E2 B2]q. | [A2 E3]h.',
      },
    },
    {
      id: 'menuet-sol', title: 'Menuet en sol', composer: 'Christian Petzold (attr. J.-S. Bach)', level: 3, cat: 'classique', bpm: 104, ts: '3/4',
      desc: 'Le menuet du Petit livre d’Anna Magdalena Bach, en entier.',
      parts: {
        R: 'D5q G4e A4e B4e C5e | D5q G4q G4q | E5q C5e D5e E5e F#5e | G5q G4q G4q | C5q D5e C5e B4e A4e | B4q C5e B4e A4e G4e | F#4q G4e A4e B4e G4e | A4h. | D5q G4e A4e B4e C5e | D5q G4q G4q | E5q C5e D5e E5e F#5e | G5q G4q G4q | C5q D5e C5e B4e A4e | B4q C5e B4e A4e G4e | A4q B4e A4e G4e F#4e | G4h. | B5q G5e A5e B5e G5e | A5q D5e E5e F#5e D5e | G5q E5e F#5e G5e D5e | C#5q B4e C#5e A4q | A4e B4e C#5e D5e E5e F#5e | G5q F#5q E5q | F#5q A4q C#5q | D5h. | D5q G4e F#4e G4q | E5q G4e F#4e G4q | D5q C5q B4q | A4e G4e F#4e G4e A4q | D4e E4e F#4e G4e A4e B4e | C5q B4q A4q | B4e D5e G4q F#4q | G4h.',
        L: 'G3h. | B3h. | C4h. | B3h. | A3h. | G3h. | D3h. | D3h. | G3h. | B3h. | C4h. | B3h. | A3h. | G3h. | D3h. | G2h. | G3h. | F#3h. | E3h. | A3h. | A2h. | A3h. | A2h. | D3h. | B2h. | C3h. | B2h. | C3h. | D3h. | D3h. | B2h D3q | G2h.',
      },
    },
    {
      id: 'canon-pachelbel', title: 'Canon en ré', composer: 'Johann Pachelbel', level: 3, cat: 'classique', bpm: 66, ts: '4/4',
      desc: 'La basse obstinée de huit notes et trois variations.',
      parts: {
        R: 'F#5h E5h | D5h C#5h | B4h A4h | B4h C#5h | D5h C#5h | B4h A4h | G4h F#4h | G4h E4h | D4q F#4q A4q G4q | F#4q D4q F#4q E4q | D4q B3q D4q A4q | G4q B4q A4q G4q | [F#4 A4 D5]w',
        L: CANON_L + ' | ' + CANON_L + ' | ' + CANON_L + ' | [D2 A2]w',
      },
    },
    {
      id: 'lettre-elise', title: 'Lettre à Élise', composer: 'Ludwig van Beethoven', level: 4, cat: 'classique', bpm: 66, ts: '3/8', pickup: 0.5,
      desc: 'Le thème célèbre, joué deux fois, arpèges compris.',
      parts: {
        R: '!mp E5s D#5s | ' + ELISE_A + ' | A4e re E5s D#5s | ' + ELISE_A + ' | A4q.',
        L: 're | ' + ELISE_L + ' | A2s E3s A3s re. | ' + ELISE_L + ' | A2s E3s A3s+e.',
      },
    },
    {
      id: 'roi-montagne', title: 'Dans l’antre du roi de la montagne', composer: 'Edvard Grieg', level: 3, cat: 'classique', bpm: 96, ts: '4/4',
      tempo: [{ beat: 0, bpm: 96 }, { beat: 16, bpm: 112 }, { beat: 32, bpm: 128 }, { beat: 48, bpm: 146 }],
      desc: 'Un thème qui accélère à chaque reprise, transposé en La mineur.',
      parts: {
        R: '!p ' + MOUNTAIN + ' | !mf ' + MOUNTAIN + ' | !f ' + MOUNTAIN_HI + ' | !ff ' + MOUNTAIN_HI + ' | [A4 C5 E5 A5]w',
        L: rep(MOUNTAIN_L, 4) + ' | [A2 E3]w',
      },
    },
    {
      id: 'gymnopedie', title: 'Gymnopédie n° 1 (début)', composer: 'Erik Satie', level: 3, cat: 'classique', bpm: 72, ts: '3/4', pedal: 'bar',
      desc: 'Lent et douloureux : les accords en balancier et la première phrase.',
      parts: {
        R: 'rh. | rh. | rh. | rh. | !mp rq F#5q A5q | G5q F#5q C#5q | B4q C#5q D5q | A4h. | F#4h.+h.+h.+h. | rh.',
        L: '!p ' + rep('G2q rh | D2q rh', 6) + ' | G2h.',
        L2: '!p ' + rep('rq [B3 D4 F#4]h | rq [A3 C#4 F#4]h', 6) + ' | rq [B3 D4 F#4]h',
      },
    },
    {
      id: 'nocturne-theme', title: 'Nocturne', composer: 'Thème original du jeu', level: 3, cat: 'nocturne', bpm: 72, ts: '4/4', pedal: 'bar',
      desc: 'Le thème de Nocturne : arpèges à la main gauche, chant à la main droite.',
      parts: {
        R: 'rw | rw | !mf A4q C5q E5h | F5q. E5e D5e C5e A4q | G4q C5q E5q. D5e | D5h B4h | A4q C5q E5q A5q | G5q. F5e E5q C5q | B4q. C5e D5q G#4q | A4w | !f A5q. G5e F5q E5q | D5q. E5e F5q D5q | E5q. F5e E5q C5q | A4h. C5q | !mf F5q. E5e D5q A4q | G#4q B4q D5q B4q | C5q. B4e A4q E4q | !mp A4w',
        L: `!mp ${NOC.am} | ${NOC.am} | ${NOC.am} | ${NOC.f} | ${NOC.c} | ${NOC.g} | ${NOC.am} | ${NOC.f} | ${NOC.e} | ${NOC.am} | ${NOC.f} | ${NOC.g} | ${NOC.c} | ${NOC.am} | ${NOC.dm} | ${NOC.e} | ${NOC.am} | [A2 E3 A3]w`,
      },
    },
    // ---------------- Avancé ----------------
    Object.assign(
      {
        id: 'prelude-do', title: 'Prélude en do majeur (mes. 1–19)', composer: 'Jean-Sébastien Bach', level: 4, cat: 'classique', bpm: 66, ts: '4/4',
        desc: 'Le premier prélude du Clavier bien tempéré : des arpèges qui coulent.',
      },
      {
        parts: bachPrelude([
          'C4 E4 G4 C5 E5', 'C4 D4 A4 D5 F5', 'B3 D4 G4 D5 F5', 'C4 E4 G4 C5 E5', 'C4 E4 A4 E5 A5', 'C4 D4 F#4 A4 D5', 'B3 D4 G4 D5 G5',
          'B3 C4 E4 G4 C5', 'A3 C4 E4 G4 C5', 'D3 A3 D4 F#4 C5', 'G3 B3 D4 G4 B4', 'G3 Bb3 E4 G4 C#5', 'F3 A3 D4 A4 D5', 'F3 Ab3 D4 F4 B4',
          'E3 G3 C4 G4 C5', 'E3 F3 A3 C4 F4', 'D3 F3 A3 C4 F4', 'G2 D3 G3 B3 F4', 'C3 E3 G3 C4 E4',
        ]),
      }
    ),
  ];

  S.LEVELS = ['', 'Facile', 'Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
  S.CATS = { trad: 'Traditionnel', classique: 'Classique', ragtime: 'Ragtime', fetes: 'Fêtes', nocturne: 'Original', import: 'Mes fichiers', rec: 'Enregistrements', lesson: 'Leçon', gen: 'Entraînement' };

  // ---------- bibliothèque ----------
  S.builtin = [];
  S.classics = [];
  S.imported = [];
  const cache = new Map();

  // ---------- grands classiques : partitions complètes chargées à la demande (songs/*.js) ----------
  const classicData = new Map();
  const classicWait = new Map();
  S.addData = function (id, b64) {
    classicData.set(id, b64);
    const r = classicWait.get(id);
    if (r) { classicWait.delete(id); r(); }
  };
  S.initClassics = function () {
    S.classics = (S.CLASSICS || []).map((m) => {
      const p = { id: m.id, title: m.title, composer: m.composer, level: m.level, cat: m.cat, desc: m.desc, duration: m.duration, hasR: true, hasL: true, notes: [], noteCount: m.notes, placeholder: true, classic: m };
      cache.set(m.id, p);
      return p;
    });
  };
  function loadScript(src) {
    return new Promise((res, rej) => {
      const el = document.createElement('script');
      el.src = src;
      el.onload = res;
      el.onerror = () => rej(new Error('fichier introuvable'));
      document.head.appendChild(el);
    });
  }
  S.ensure = async function (id) {
    const cur = cache.get(id);
    if (!cur || !cur.placeholder) return cur || null;
    const m = cur.classic;
    if (!classicData.has(id)) {
      const wait = new Promise((r) => classicWait.set(id, r));
      await loadScript(m.file);
      await Promise.race([wait, new Promise((_, rej) => setTimeout(() => rej(new Error('délai dépassé')), 10000))]);
    }
    const bin = atob(classicData.get(id));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const song = S.fromMidi(N.midiFile.parse(bytes.buffer), { id, title: m.title, composer: m.composer }, null, 60);
    Object.assign(song, { level: m.level, cat: m.cat, desc: m.desc, source: 'classic', license: m.license, mutopia: m.mutopia, classic: m });
    cache.set(id, song);
    S.classics = S.classics.map((s) => (s.id === id ? song : s));
    return song;
  };

  S.initBuiltin = function () {
    S.builtin = S.BUILTIN_DEFS.map((def) => {
      const song = S.fromDef(def);
      cache.set(song.id, song);
      return song;
    });
  };
  S.get = (id) => cache.get(id) || null;
  S.all = () => S.builtin.concat(S.classics, S.imported);

  // fichiers importés (IndexedDB) : { id, title, bytes, added, assign, split, kind }
  S.loadImported = async function () {
    const recs = (await N.idb.all('songs')) || [];
    S.imported = [];
    for (const rec of recs.sort((a, b) => (a.added || 0) - (b.added || 0))) {
      try {
        const song = S.buildRecord(rec);
        cache.set(song.id, song);
        S.imported.push(song);
      } catch (e) { console.warn('Import illisible', rec.title, e); }
    }
    return S.imported;
  };
  S.buildRecord = function (rec) {
    if (rec.kind === 'rec') {
      return S.fromNotes(rec.notes, { id: rec.id, title: rec.title, composer: rec.composer || 'Mon enregistrement', cat: 'rec', source: 'rec', bpm: rec.bpm || 120 });
    }
    const parsed = N.midiFile.parse(rec.bytes);
    const song = S.fromMidi(parsed, { id: rec.id, title: rec.title, composer: rec.composer || 'Fichier importé' }, rec.assign || null, rec.split || 60);
    song.record = rec;
    return song;
  };
  S.importFile = async function (file, meta) {
    const bytes = await file.arrayBuffer();
    const parsed = N.midiFile.parse(bytes); // lève une erreur si le fichier est invalide
    const id = 'midi-' + N.hash(bytes);
    let title = file.name.replace(/\.(mid|midi|kar|rmi)$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title) title = 'Morceau importé';
    const composer = (meta && meta.composer) || 'Fichier importé';
    const rec = { id, title, composer, bytes, added: Date.now(), kind: 'midi' };
    const song = S.fromMidi(parsed, { id, title, composer }, null, 60);
    rec.assign = song.assign;
    song.record = rec;
    await N.idb.put('songs', id, rec);
    cache.set(id, song);
    S.imported = S.imported.filter((s) => s.id !== id).concat([song]);
    return song;
  };
  S.saveRecording = async function (notes, title) {
    const id = 'rec-' + Date.now().toString(36);
    const rec = { id, title, notes, added: Date.now(), kind: 'rec', bpm: 120 };
    const song = S.buildRecord(rec);
    song.record = rec;
    await N.idb.put('songs', id, rec);
    cache.set(id, song);
    S.imported.push(song);
    return song;
  };
  S.updateAssign = async function (song, assign, split) {
    const rec = song.record;
    if (!rec || rec.kind === 'rec') return song;
    rec.assign = assign; rec.split = split;
    await N.idb.put('songs', rec.id, rec);
    const fresh = S.buildRecord(rec);
    fresh.record = rec;
    cache.set(rec.id, fresh);
    S.imported = S.imported.map((s) => (s.id === rec.id ? fresh : s));
    return fresh;
  };
  S.remove = async function (id) {
    await N.idb.del('songs', id);
    cache.delete(id);
    S.imported = S.imported.filter((s) => s.id !== id);
  };
  S.register = function (song) { cache.set(song.id, song); return song; };
})();
