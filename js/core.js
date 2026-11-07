/* Nocturne — noyau : utilitaires, réglages, stockage, événements */
'use strict';
(function () {
  const N = (window.N = window.N || {});
  N.VERSION = '1.1.0';
  // page intégrée dans un cadre (lien claude.ai) : pas de téléchargement, pas d'accès aux autres sites
  N.EMBED = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();

  // ---------- maths ----------
  N.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  N.lerp = (a, b, t) => a + (b - a) * t;
  N.damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  N.rand = (a, b) => a + Math.random() * (b - a);
  N.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  N.pick = (arr) => arr[(Math.random() * arr.length) | 0];
  N.mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  N.pc = (m) => ((m % 12) + 12) % 12;
  const BLACK = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  N.isBlack = (m) => BLACK[N.pc(m)] === 1;

  // index de touche blanche absolu (0 = Do-1) pour placer les touches
  const WHITE_INDEX = new Float32Array(128);
  {
    let w = 0;
    for (let m = 0; m < 128; m++) {
      if (N.isBlack(m)) WHITE_INDEX[m] = w - 0.5; // centrée sur la frontière
      else { WHITE_INDEX[m] = w; w++; }
    }
  }
  N.whiteIndex = (m) => WHITE_INDEX[N.clamp(m | 0, 0, 127)];

  // ---------- noms de notes ----------
  N.LATIN = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  N.LATIN_FLAT = ['Do', 'Ré♭', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Sol♭', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
  N.ENGLISH = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  N.ENGLISH_FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

  // style : 'latin' (Do Ré Mi, convention française : Do3 = Do central) | 'english' (C D E, C4 = Do central)
  N.noteName = function (m, style, withOct, flat) {
    const pc = N.pc(m);
    const oct = Math.floor(m / 12) - 1;
    if ((style || N.settings.noteNames) === 'english') return (flat ? N.ENGLISH_FLAT : N.ENGLISH)[pc] + (withOct ? oct : '');
    return (flat ? N.LATIN_FLAT : N.LATIN)[pc] + (withOct ? oct - 1 : '');
  };
  N.pcName = (pc, flat) => N.noteName(pc + 60, null, false, flat);

  const PITCH_RE = /^([A-Ga-g])(#|b|♯|♭)?(-?\d)$/;
  const BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  N.parsePitch = function (s) {
    const m = PITCH_RE.exec(s);
    if (!m) return null;
    let v = BASE[m[1].toUpperCase()];
    if (m[2] === '#' || m[2] === '♯') v++;
    else if (m[2] === 'b' || m[2] === '♭') v--;
    return v + (parseInt(m[3], 10) + 1) * 12;
  };

  N.fmtTime = function (s) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  };
  N.fmtDuration = function (sec) {
    sec = Math.round(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    if (h) return h + ' h ' + String(m).padStart(2, '0');
    if (m) return m + ' min';
    return sec + ' s';
  };
  N.fmtInt = (n) => Math.round(n).toLocaleString('fr-FR');
  N.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  N.today = function (d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  N.hash = function (buf) {
    const b = new Uint8Array(buf);
    let h = 0x811c9dc5;
    for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16).padStart(8, '0');
  };
  N.lowerBound = function (arr, t, key) {
    let lo = 0, hi = arr.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid][key || 't'] < t) lo = mid + 1; else hi = mid; }
    return lo;
  };
  N.download = function (filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // ---------- événements ----------
  const handlers = {};
  N.on = (ev, fn) => { (handlers[ev] = handlers[ev] || []).push(fn); };
  N.emit = (ev, data) => {
    (handlers[ev] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } });
  };

  // ---------- localStorage ----------
  N.store = {
    get(key, def) {
      try { const v = localStorage.getItem('nocturne.' + key); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
    },
    set(key, val) {
      try { localStorage.setItem('nocturne.' + key, JSON.stringify(val)); return true; } catch (e) { return false; }
    },
  };

  // ---------- IndexedDB (échantillons, fichiers MIDI importés) ----------
  N.idb = (function () {
    let dbp = null;
    function open() {
      if (dbp) return dbp;
      dbp = new Promise((resolve) => {
        try {
          const req = indexedDB.open('nocturne', 1);
          req.onupgradeneeded = () => {
            const db = req.result;
            ['samples', 'songs'].forEach((n) => { if (!db.objectStoreNames.contains(n)) db.createObjectStore(n); });
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
          req.onblocked = () => resolve(null);
        } catch (e) { resolve(null); }
      });
      return dbp;
    }
    function run(store, mode, fn) {
      return open().then((db) => new Promise((resolve) => {
        if (!db) return resolve(undefined);
        try {
          const tx = db.transaction(store, mode);
          const req = fn(tx.objectStore(store));
          tx.oncomplete = () => resolve(req ? req.result : undefined);
          tx.onerror = tx.onabort = () => resolve(undefined);
        } catch (e) { resolve(undefined); }
      }));
    }
    return {
      ok: () => open().then((db) => !!db),
      get: (s, k) => run(s, 'readonly', (st) => st.get(k)),
      put: (s, k, v) => run(s, 'readwrite', (st) => st.put(v, k)),
      del: (s, k) => run(s, 'readwrite', (st) => st.delete(k)),
      all: (s) => run(s, 'readonly', (st) => st.getAll()),
    };
  })();

  // ---------- réglages ----------
  N.DEFAULTS = {
    instrument: 'concert',
    volume: 0.8,
    reverb: 0.32,
    bass: 0,
    treble: 0,
    pcVelocity: 0.72,
    accompVolume: 0.75,
    metroVolume: 0.55,
    latencyMs: 0,
    layout: 'double', // 'double' (2 rangées, 2,5 octaves) | 'simple' (1 rangée)
    octave: 3, // Do de la rangée du bas (3 => la rangée A Z E R… commence au Do central)
    kbLabels: 'auto', // 'auto' | 'azerty' | 'qwerty' | 'qwertz'
    kbFormat: '100', // '100' | '80' | 'compact' (75 % / 65 %) | '60'
    keymap: null, // touches de commande personnalisées { action: [codes] }
    kbSetupDone: false,
    showPcLabels: true,
    noteNames: 'latin', // 'latin' | 'english'
    namesOnKeys: 'c', // 'none' | 'c' | 'all'
    namesOnNotes: false,
    colorMode: 'hands', // 'hands' | 'rainbow'
    fallZoom: 1,
    quality: 'high', // 'high' | 'medium' | 'low'
    showBars: true,
    inputMode: 'auto', // 'auto' | 'pc' | 'midi'
    midiIn: 'all',
    autoPause: true,
  };
  N.settings = Object.assign({}, N.DEFAULTS, N.store.get('settings', {}));
  N.saveSettings = function () { N.store.set('settings', N.settings); N.emit('settings', N.settings); };

  // ---------- couleurs ----------
  // main : bord lumineux · body / bodyB : corps sombre des notes (touches blanches / noires)
  N.HANDS = {
    R: { main: '#3fdcff', core: '#d9f8ff', deep: '#1677ff', body: '#0c4a86', bodyB: '#08325e', rgb: [63, 220, 255], name: 'Main droite' },
    L: { main: '#b98aff', core: '#f1e2ff', deep: '#6b33ff', body: '#4b2399', bodyB: '#33176d', rgb: [185, 138, 255], name: 'Main gauche' },
    A: { main: '#7f88ad', core: '#d6dbf0', deep: '#4a5277', body: '#2e3450', bodyB: '#23283e', rgb: [127, 136, 173], name: 'Accompagnement' },
    X: { main: '#ff5f78', core: '#ffd6dd', deep: '#c2213e', body: '#7a1426', bodyB: '#5a0e1b', rgb: [255, 95, 120], name: 'Fausse note' },
    F: { main: '#ffd27a', core: '#fff3d6', deep: '#ff9a3c', body: '#7a4a10', bodyB: '#5a360b', rgb: [255, 210, 122], name: 'Libre' },
  };
  // couleur arc-en-ciel par hauteur
  const rainbowCache = {};
  N.rainbow = function (m) {
    const pc = N.pc(m);
    if (rainbowCache[pc]) return rainbowCache[pc];
    const h = (pc * 29 + 185) % 360;
    const c = { main: `hsl(${h},95%,64%)`, core: `hsl(${h},100%,90%)`, deep: `hsl(${(h + 25) % 360},90%,45%)`, body: `hsl(${h},70%,27%)`, bodyB: `hsl(${h},70%,19%)`, rgb: hslToRgb(h / 360, 0.95, 0.64) };
    rainbowCache[pc] = c;
    return c;
  };
  function hslToRgb(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = (n) => { const k = (n + h * 12) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
    return [f(0), f(8), f(4)];
  }
  N.colorFor = function (hand, midi) {
    if (N.settings.colorMode === 'rainbow' && (hand === 'R' || hand === 'L' || hand === 'F')) return N.rainbow(midi);
    return N.HANDS[hand] || N.HANDS.F;
  };
})();
