/* Nocturne — entrées : clavier d'ordinateur (positions physiques, AZERTY/QWERTY), clavier MIDI, souris/tactile */
'use strict';
(function () {
  const N = window.N;
  const I = (N.input = {});

  // ---------- dispositions (codes physiques -> décalage en demi-tons depuis le Do de la rangée du bas) ----------
  const LAYOUTS = {
    // uniquement des lettres : main droite sur la rangée du milieu (blanches) et celle du dessus (noires),
    // main gauche sur la rangée du bas. Les touches dont la lettre n'existe pas sur ton clavier sont écartées.
    lettres: {
      name: 'Lettres seulement',
      lettersOnly: true,
      keys: {
        KeyZ: 0, KeyX: 2, KeyC: 4, KeyV: 5, KeyB: 7, KeyN: 9, KeyM: 11,
        KeyA: 12, KeyW: 13, KeyS: 14, KeyE: 15, KeyD: 16, KeyF: 17, KeyT: 18, KeyG: 19, KeyY: 20, KeyH: 21, KeyU: 22, KeyJ: 23,
        KeyK: 24, KeyO: 25, KeyL: 26, KeyP: 27, Semicolon: 28,
      },
      lower: [0, 11], upper: [12, 28], span: 28,
    },
    double: {
      name: 'Deux rangées (2,5 octaves)',
      keys: {
        // rangée du bas : W X C V B N , ; : ! (AZERTY) / Z X C V B N M , . / (QWERTY)
        KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6, KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11,
        Comma: 12, KeyL: 13, Period: 14, Semicolon: 15, Slash: 16,
        // rangée du haut : A Z E R T Y U I O P ^ $ (AZERTY) / Q W E R T Y U I O P [ ] (QWERTY)
        KeyQ: 12, Digit2: 13, KeyW: 14, Digit3: 15, KeyE: 16, KeyR: 17, Digit5: 18, KeyT: 19, Digit6: 20, KeyY: 21, Digit7: 22, KeyU: 23,
        KeyI: 24, Digit9: 25, KeyO: 26, Digit0: 27, KeyP: 28, BracketLeft: 29, Equal: 30, BracketRight: 31,
      },
      lower: [0, 16], upper: [12, 31], span: 31,
    },
    simple: {
      name: 'Une rangée (1,5 octave)',
      keys: {
        KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11,
        KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16, Quote: 17, BracketRight: 18, Backslash: 19,
      },
      lower: [0, 19], upper: [0, 19], span: 19,
    },
  };
  I.LAYOUTS = LAYOUTS;

  const AZERTY = {
    KeyQ: 'A', KeyW: 'Z', KeyE: 'E', KeyR: 'R', KeyT: 'T', KeyY: 'Y', KeyU: 'U', KeyI: 'I', KeyO: 'O', KeyP: 'P', BracketLeft: '^', BracketRight: '$',
    KeyA: 'Q', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyG: 'G', KeyH: 'H', KeyJ: 'J', KeyK: 'K', KeyL: 'L', Semicolon: 'M', Quote: 'Ù', Backslash: '*',
    KeyZ: 'W', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyB: 'B', KeyN: 'N', KeyM: ',', Comma: ';', Period: ':', Slash: '!',
    Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0', Minus: ')', Equal: '=',
  };
  const QWERTY = {
    KeyQ: 'Q', KeyW: 'W', KeyE: 'E', KeyR: 'R', KeyT: 'T', KeyY: 'Y', KeyU: 'U', KeyI: 'I', KeyO: 'O', KeyP: 'P', BracketLeft: '[', BracketRight: ']',
    KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyG: 'G', KeyH: 'H', KeyJ: 'J', KeyK: 'K', KeyL: 'L', Semicolon: ';', Quote: "'", Backslash: '\\',
    KeyZ: 'Z', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyB: 'B', KeyN: 'N', KeyM: 'M', Comma: ',', Period: '.', Slash: '/',
    Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0', Minus: '-', Equal: '=',
  };
  const QWERTZ = Object.assign({}, QWERTY, {
    KeyY: 'Z', KeyZ: 'Y', BracketLeft: 'Ü', BracketRight: '+', Semicolon: 'Ö', Quote: 'Ä', Backslash: '#', Slash: '-', Minus: 'ß', Equal: '´',
  });
  const TABLES = { azerty: AZERTY, qwerty: QWERTY, qwertz: QWERTZ };
  let detected = null; // libellés lus via navigator.keyboard
  let detectedName = '';
  I.detectedName = () => detectedName;
  I.layoutName = () => {
    const s = N.settings.kbLabels;
    if (TABLES[s]) return s.toUpperCase();
    return detectedName || 'AZERTY';
  };
  function labelOf(code) {
    if (!code) return '';
    if (code.startsWith('Digit')) return code.slice(5);
    const s = N.settings.kbLabels;
    if (TABLES[s]) return TABLES[s][code] || '';
    if (detected && detected[code]) return detected[code];
    const t = detectedName === 'QWERTY' ? QWERTY : detectedName === 'QWERTZ' ? QWERTZ : AZERTY;
    return t[code] || '';
  }
  I.label = labelOf;

  // ---------- formats de clavier et touches de commande ----------
  I.FORMATS = {
    100: { name: 'Complet', pct: '100 %', desc: 'Pavé numérique, flèches et touches de navigation.' },
    80: { name: 'Sans pavé numérique', pct: '80 % · TKL', desc: 'Flèches et touches de navigation, sans pavé.' },
    compact: { name: 'Compact', pct: '75 % · 65 %', desc: 'Flèches et petite colonne de navigation.' },
    60: { name: 'Mini', pct: '60 %', desc: 'Pas de flèches dédiées ni de touches F : commandes sur Tab et 1.' },
  };
  I.ACTIONS = [
    { id: 'slower', name: 'Ralentir', sub: 'En jeu libre : octave plus grave' },
    { id: 'faster', name: 'Accélérer', sub: 'En jeu libre : octave plus aiguë' },
    { id: 'prev', name: 'Mesure précédente', sub: '' },
    { id: 'next', name: 'Mesure suivante', sub: '' },
    { id: 'octDown', name: 'Octave plus grave', sub: '' },
    { id: 'octUp', name: 'Octave plus aiguë', sub: '' },
    { id: 'restart', name: 'Recommencer le morceau', sub: '' },
    { id: 'pause', name: 'Pause (en plus d’Échap)', sub: '' },
  ];
  const KEYSETS = {
    100: { slower: ['ArrowDown'], faster: ['ArrowUp'], prev: ['ArrowLeft'], next: ['ArrowRight'], octDown: ['PageDown', 'NumpadSubtract'], octUp: ['PageUp', 'NumpadAdd'], restart: ['Home'], pause: ['NumpadEnter'] },
    80: { slower: ['ArrowDown'], faster: ['ArrowUp'], prev: ['ArrowLeft'], next: ['ArrowRight'], octDown: ['PageDown'], octUp: ['PageUp'], restart: ['Home'], pause: [] },
    compact: { slower: ['ArrowDown'], faster: ['ArrowUp'], prev: ['ArrowLeft'], next: ['ArrowRight'], octDown: ['PageDown'], octUp: ['PageUp'], restart: ['Delete'], pause: [] },
    60: { slower: ['Tab', 'ArrowDown'], faster: ['Digit1', 'ArrowUp'], prev: ['ArrowLeft'], next: ['ArrowRight'], octDown: ['Tab'], octUp: ['Digit1'], restart: [], pause: [] },
  };
  I.defaultKeys = (fmt) => JSON.parse(JSON.stringify(KEYSETS[fmt || N.settings.kbFormat] || KEYSETS[100]));
  I.bindings = () => Object.assign(I.defaultKeys(), N.settings.keymap || {});
  // action selon le contexte : en jeu libre, ralentir/accélérer changent l'octave
  I.actionFor = function (code, inSong) {
    const b = I.bindings();
    const order = inSong ? ['pause', 'slower', 'faster', 'prev', 'next', 'restart', 'octDown', 'octUp'] : ['pause', 'octDown', 'octUp', 'slower', 'faster'];
    for (const a of order) {
      if (!(b[a] || []).includes(code)) continue;
      if (!inSong && a === 'slower') return 'octDown';
      if (!inSong && a === 'faster') return 'octUp';
      return a;
    }
    return null;
  };
  const KEYNAMES = {
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', PageUp: 'Page ↑', PageDown: 'Page ↓', Home: 'Début', End: 'Fin',
    Delete: 'Suppr', Insert: 'Inser', Backspace: '⌫', Tab: 'Tab', Enter: 'Entrée', NumpadEnter: 'Entrée pavé', NumpadAdd: '+ pavé',
    NumpadSubtract: '− pavé', NumpadMultiply: '× pavé', NumpadDivide: '÷ pavé', NumpadDecimal: ', pavé', Escape: 'Échap', CapsLock: 'Verr. Maj',
    Space: 'Espace', ShiftLeft: 'Maj', ShiftRight: 'Maj', ControlLeft: 'Ctrl', ControlRight: 'Ctrl', AltLeft: 'Alt', Backquote: '²',
    IntlBackslash: '<', ContextMenu: 'Menu', Pause: 'Pause', ScrollLock: 'Arrêt défil',
  };
  I.keyName = function (code) {
    if (!code) return '';
    if (KEYNAMES[code]) return code === 'Backquote' && I.layoutName() !== 'AZERTY' ? '`' : KEYNAMES[code];
    let m;
    if ((m = /^Numpad(\d)$/.exec(code))) return m[1] + ' pavé';
    if (/^F\d+$/.test(code)) return code;
    return labelOf(code) || code;
  };
  I.keysOf = (action) => (I.bindings()[action] || []).map(I.keyName);
  I.isPianoCode = (code) => code === 'Space' || I.layout().keys[code] != null;

  let layoutCache = { key: '', lay: null };
  I.layout = function () {
    const id = LAYOUTS[N.settings.layout] ? N.settings.layout : 'lettres';
    const ck = id + '|' + N.settings.kbLabels + '|' + detectedName + '|' + (detected ? 1 : 0);
    if (layoutCache.key === ck) return layoutCache.lay;
    const base = LAYOUTS[id];
    let keys = base.keys;
    if (base.lettersOnly) {
      keys = {};
      for (const code in base.keys) if (/^[A-ZÀ-ÖØ-Ý]$/.test(labelOf(code))) keys[code] = base.keys[code];
    }
    const offs = new Set(Object.values(keys));
    const lay = Object.assign({}, base, { id, keys, offsets: offs, span: Math.max(...offs) });
    layoutCache = { key: ck, lay };
    return lay;
  };
  // une note a-t-elle une touche d'ordinateur ?
  I.playable = (midi, oct) => I.layout().offsets.has(midi - I.base(oct));
  I.octave = N.settings.octave;
  I.sessionOctave = null; // octave forcée pendant un morceau
  I.curOctave = () => (I.sessionOctave != null ? I.sessionOctave : I.octave);
  I.base = (oct) => 12 * ((oct == null ? I.curOctave() : oct) + 1);
  I.range = (oct) => { const b = I.base(oct); return [b, b + I.layout().span]; };
  I.midiForCode = function (code, oct) {
    const off = I.layout().keys[code];
    return off == null ? null : I.base(oct) + off;
  };
  // touche à afficher pour une note (préférence : rangée du haut pour la main droite, du bas pour la gauche)
  I.labelForMidi = function (midi, hand, oct) {
    const lay = I.layout();
    const off = midi - I.base(oct);
    if (off < 0 || off > lay.span) return '';
    let best = null;
    for (const code in lay.keys) {
      if (lay.keys[code] !== off) continue;
      const upper = /^(Key[QWERTYUIOP]|Digit|Bracket|Equal)/.test(code) && lay.id === 'double';
      const score = hand === 'L' ? (upper ? 0 : 1) : upper ? 1 : 0;
      if (!best || score > best.score) best = { code, score };
    }
    return best ? labelOf(best.code) : '';
  };
  I.setOctave = function (o) {
    o = N.clamp(o, 0, 6);
    if (I.sessionOctave != null) I.sessionOctave = o;
    else { I.octave = o; N.settings.octave = o; N.saveSettings(); }
    N.emit('octave', o);
  };
  I.shiftOctave = (d) => I.setOctave(I.curOctave() + d);

  // ---------- état des touches ----------
  const codeDown = new Map(); // code -> note jouée
  I.sustainKey = false;
  I.lastSource = 'pc';
  I.enabled = true;

  function isTyping(e) {
    const t = e.target;
    if (!t || !t.tagName) return false;
    const tag = t.tagName;
    return (tag === 'INPUT' && !/^(range|checkbox|radio|button)$/.test(t.type)) || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
  }

  function onKeyDown(e) {
    if (N.ui && N.ui.rebinding) { e.preventDefault(); if (!e.repeat) N.ui.captureKey(e.code); return; }
    if (isTyping(e)) return;
    if (e.ctrlKey || e.metaKey || (e.altKey && !e.getModifierState('AltGraph'))) return;
    const code = e.code;
    // apprentissage de la disposition à partir de la première frappe
    if (!detected && e.key && e.key.length === 1) {
      if (code === 'KeyQ' && e.key.toLowerCase() === 'a') detectedName = 'AZERTY';
      else if (code === 'KeyY' && e.key.toLowerCase() === 'z') detectedName = 'QWERTZ';
      else if (code === 'KeyQ' && e.key.toLowerCase() === 'q' && detectedName !== 'QWERTZ') detectedName = 'QWERTY';
    }
    // mode Tuiles : 4 touches, une par colonne
    if (N.game.mode === 'tiles' && N.tiles) {
      const lane = N.tiles.KEYS[code];
      if (lane != null) {
        e.preventDefault();
        if (!e.repeat) { I.lastSource = 'pc'; N.tiles.press(lane); }
        return;
      }
      if (code === 'Space') { e.preventDefault(); return; }
      N.ui && N.ui.onKey && N.ui.onKey(e);
      return;
    }
    if (code === 'Space') {
      e.preventDefault();
      if (!e.repeat && !I.sustainKey) { I.sustainKey = true; N.game.setSustain(true, 'pc'); }
      return;
    }
    const midi = I.enabled ? I.midiForCode(code) : null;
    if (midi != null) {
      e.preventDefault();
      if (e.repeat || codeDown.has(code)) return;
      const vel = N.clamp(N.settings.pcVelocity + (e.shiftKey ? 0.22 : 0), 0.05, 1);
      codeDown.set(code, midi);
      I.lastSource = 'pc';
      N.game.noteDown(midi, vel, 'pc');
      return;
    }
    N.ui && N.ui.onKey && N.ui.onKey(e);
  }
  function onKeyUp(e) {
    const code = e.code;
    if (N.tiles && N.tiles.KEYS[code] != null && N.tiles.game()) { N.tiles.release(N.tiles.KEYS[code]); return; }
    if (code === 'Space') {
      e.preventDefault();
      if (I.sustainKey) { I.sustainKey = false; N.game.setSustain(false, 'pc'); }
      return;
    }
    if (codeDown.has(code)) {
      const midi = codeDown.get(code);
      codeDown.delete(code);
      N.game.noteUp(midi, 'pc');
    }
  }
  I.releaseAll = function () {
    for (const [code, midi] of codeDown) N.game.noteUp(midi, 'pc');
    codeDown.clear();
    for (const [id, v] of pointers) {
      if (typeof v === 'string') { if (N.tiles) N.tiles.release(+v.slice(4)); }
      else N.game.noteUp(v, 'mouse');
    }
    pointers.clear();
    if (N.tiles && N.tiles.game()) for (let l = 0; l < 4; l++) N.tiles.release(l);
    if (I.sustainKey) { I.sustainKey = false; N.game.setSustain(false, 'pc'); }
  };

  // ---------- souris / tactile sur le clavier dessiné ----------
  const pointers = new Map();
  function pointerKey(e) {
    const r = N.renderer;
    return r ? r.keyAt(e.clientX, e.clientY) : null;
  }
  I.touchUsed = false;
  I.touchPrimary = () => I.touchUsed || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  function onPointerDown(e) {
    if (e.pointerType === 'touch') I.touchUsed = true;
    if (N.game.mode === 'tiles' && N.tiles && N.tiles.game()) {
      e.preventDefault();
      const lane = N.renderer.laneAt(e.clientX);
      if (lane < 0) return;
      try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* */ }
      pointers.set(e.pointerId, 'lane' + lane);
      N.tiles.press(lane);
      return;
    }
    const hit = pointerKey(e);
    if (!hit) return;
    e.preventDefault();
    try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    pointers.set(e.pointerId, hit.midi);
    I.lastSource = 'mouse';
    N.game.noteDown(hit.midi, N.clamp(0.35 + hit.depth * 0.6, 0.2, 0.95), 'mouse');
  }
  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    if (typeof pointers.get(e.pointerId) === 'string') return;
    const hit = pointerKey(e);
    const cur = pointers.get(e.pointerId);
    if (hit && hit.midi !== cur) {
      N.game.noteUp(cur, 'mouse');
      pointers.set(e.pointerId, hit.midi);
      N.game.noteDown(hit.midi, N.clamp(0.35 + hit.depth * 0.6, 0.2, 0.95), 'mouse');
    }
  }
  function onPointerUp(e) {
    if (!pointers.has(e.pointerId)) return;
    const v = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (typeof v === 'string') { if (N.tiles) N.tiles.release(+v.slice(4)); return; }
    N.game.noteUp(v, 'mouse');
  }

  // ---------- MIDI ----------
  I.midi = { access: null, inputs: [], state: 'off', active: false, lastName: '' };
  function midiMessage(ev) {
    const d = ev.data;
    if (!d || d.length < 2) return;
    const st = d[0] & 0xf0;
    const sel = N.settings.midiIn;
    if (sel !== 'all' && ev.target && ev.target.id !== sel) return;
    if (st === 0x90 && d[2] > 0) {
      I.midi.active = true;
      I.lastSource = 'midi';
      I.midi.lastName = (ev.target && ev.target.name) || I.midi.lastName;
      N.game.noteDown(d[1], N.clamp(Math.pow(d[2] / 127, 0.85), 0.03, 1), 'midi');
    } else if (st === 0x80 || (st === 0x90 && d[2] === 0)) {
      N.game.noteUp(d[1], 'midi');
    } else if (st === 0xb0 && d[1] === 64) {
      N.game.setSustain(d[2] >= 64, 'midi');
    } else if (st === 0xb0 && (d[1] === 123 || d[1] === 120)) {
      N.game.allOff && N.game.allOff();
    }
  }
  function refreshInputs() {
    const acc = I.midi.access;
    if (!acc) return;
    const list = [];
    acc.inputs.forEach((inp) => {
      inp.onmidimessage = midiMessage;
      list.push({ id: inp.id, name: inp.name || 'Clavier MIDI', state: inp.state });
    });
    const before = I.midi.inputs.map((x) => x.id).join();
    I.midi.inputs = list.filter((x) => x.state !== 'disconnected');
    if (!I.midi.inputs.length) I.midi.active = false;
    if (before !== I.midi.inputs.map((x) => x.id).join()) N.emit('midi', I.midi);
  }
  I.requestMidi = async function () {
    if (!navigator.requestMIDIAccess) { I.midi.state = 'unsupported'; N.emit('midi', I.midi); return; }
    if (I.midi.access) return;
    try {
      I.midi.state = 'asking';
      const acc = await navigator.requestMIDIAccess({ sysex: false });
      I.midi.access = acc;
      I.midi.state = 'on';
      acc.onstatechange = (e) => {
        const p = e.port;
        refreshInputs();
        if (p && p.type === 'input' && p.state === 'connected' && p.connection !== 'open') N.emit('midi-connect', p.name);
      };
      refreshInputs();
      N.emit('midi', I.midi);
    } catch (e) {
      I.midi.state = 'denied';
      N.emit('midi', I.midi);
    }
  };
  // le joueur utilise-t-il un clavier d'ordinateur ? (affichage des touches, repli des octaves)
  I.usingPc = function () {
    const m = N.settings.inputMode;
    if (m === 'pc') return true;
    if (m === 'midi') return false;
    return !(I.midi.inputs.length && (I.midi.active || I.lastSource === 'midi'));
  };

  I.init = function (canvas) {
    window.addEventListener('keydown', onKeyDown, { capture: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', () => I.releaseAll());
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
      navigator.keyboard.getLayoutMap().then((map) => {
        detected = {};
        map.forEach((key, code) => (detected[code] = key.toUpperCase()));
        const q = map.get('KeyQ');
        if (!q) { detected = null; return; }
        detectedName = q === 'a' ? 'AZERTY' : q === 'q' ? (map.get('KeyY') === 'z' ? 'QWERTZ' : 'QWERTY') : '';
        N.emit('layout', detectedName);
      }).catch(() => {});
    }
  };
})();
