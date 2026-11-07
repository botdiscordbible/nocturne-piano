/* Nocturne — interface : écrans, bibliothèque, HUD, réglages, résultats */
'use strict';
(function () {
  const N = window.N;
  const U = (N.ui = {});
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const S_ = () => N.game.session;

  // ---------- icônes ----------
  const sv = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}>${d}</svg>`;
  const ICONS = {
    notes: sv('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
    cap: sv('<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>'),
    target: sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    spark: sv('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 3v4M17 5h4"/>'),
    chart: sv('<path d="M4 20V11M10 20V5M16 20v-8M21 20H3"/>'),
    gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    back: sv('<path d="M15 18l-6-6 6-6"/>'),
    search: sv('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
    import: sv('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
    pause: sv('<path d="M8 5v14M16 5v14"/>', 'stroke-width="2.6"'),
    play: sv('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
    metro: sv('<path d="M8 21h8l-2.6-17h-2.8z"/><path d="M12 16l5.5-8"/>'),
    loop: sv('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
    close: sv('<path d="M6 6l12 12M18 6L6 18"/>'),
    star: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>',
    trophy: sv('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
    keys: sv('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v8M12 5v8M16 5v8M8 13v6M12 13v6M16 13v6"/>'),
    plug: sv('<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>'),
    ear: sv('<path d="M7 9a5 5 0 1 1 10 0c0 3.5-3.5 4.5-3.5 8a3 3 0 0 1-6 0"/><path d="M10 9a2 2 0 1 1 4 0"/>'),
    scale: sv('<path d="M3 20h4v-4h4v-4h4V8h4V4h2"/>'),
    staff: sv('<path d="M3 6h18M3 10h18M3 14h18M3 18h18"/><ellipse cx="14" cy="12" rx="2.6" ry="2" fill="currentColor"/>'),
    arp: sv('<path d="M3 18l4-9 4 7 4-11 4 9 2-3"/>'),
    chord: sv('<circle cx="8" cy="7" r="2.4"/><circle cx="8" cy="13" r="2.4"/><circle cx="8" cy="19" r="2.4" /><path d="M10.4 7H21M10.4 13H21M10.4 19H21"/>'),
    flame: sv('<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z"/>'),
    check: sv('<path d="M5 13l4 4L19 7"/>', 'stroke-width="2.4"'),
    full: sv('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  };
  U.ICONS = ICONS;
  U.icons = function (root) { $$('[data-ico]', root).forEach((el) => { if (!el.firstElementChild) el.innerHTML = ICONS[el.dataset.ico] || ''; }); };
  const starsHtml = (n, max) => `<span class="stars">${Array.from({ length: max || 3 }, (_, i) => `<span class="${i < n ? 'on' : ''}">${ICONS.star}</span>`).join('')}</span>`;
  const lvlHtml = (n) => `<span class="lvl">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const noBlur = () => { if (document.activeElement && document.activeElement !== document.body && document.activeElement.tagName !== 'INPUT') document.activeElement.blur(); };

  // ---------- notifications ----------
  U.toast = function (html, kind, ms) {
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = html;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, ms || 3600);
  };

  // ---------- écrans ----------
  let screen = 'splash';
  let returnTo = 'library';
  U.screen = () => screen;
  U.show = function (name) {
    $$('.screen').forEach((el) => {
      const on = el.id === 'scr-' + name;
      if (on) { el.classList.add('show'); requestAnimationFrame(() => el.classList.add('vis')); }
      else { el.classList.remove('show', 'vis'); }
    });
    screen = name;
    const builders = { home: buildHome, library: buildLibrary, lessons: buildLessons, training: buildTraining, progress: buildProgress };
    if (builders[name]) builders[name]();
    $('#free-hud').classList.toggle('hidden', name !== 'free');
    if (name === 'home' || name === 'free') N.renderer.setRange(...freeRange());
    updateChordVisibility();
  };
  function freeRange() {
    if (!N.input.usingPc()) return [21, 108];
    const [a, b] = N.input.range(N.input.octave);
    return [a - 12, b + 5];
  }
  U.goHome = () => U.show('home');

  // ---------- fenêtres ----------
  const modalStack = [];
  U.open = function (id) {
    const el = $('#' + id);
    if (!el) return;
    if (id === 'mdl-pause') $('#p-keys').textContent = U.shortcutsLine(true);
    el.classList.add('show');
    if (!modalStack.includes(id)) modalStack.push(id);
  };
  U.close = function (id) {
    const el = $('#' + id);
    if (el) el.classList.remove('show');
    if (id === 'mdl-settings') U.rebinding = null;
    if (id === 'mdl-kb' && !N.settings.kbSetupDone) { N.settings.kbSetupDone = true; N.saveSettings(); }
    const i = modalStack.indexOf(id);
    if (i >= 0) modalStack.splice(i, 1);
    if (id === 'mdl-pause' && S_() && S_().paused && !modalStack.length) N.game.resume();
  };
  U.top = () => modalStack[modalStack.length - 1];
  function confirmBox(title, text, yes) {
    $('#cf-title').textContent = title;
    $('#cf-text').textContent = text;
    U.open('mdl-confirm');
    $('#cf-yes').onclick = () => { U.close('mdl-confirm'); yes(); };
    $('#cf-no').onclick = () => U.close('mdl-confirm');
  }

  // ---------- accueil ----------
  function chip(led, html, ico) { return `<span class="chip">${ico ? `<span data-ico="${ico}"></span>` : `<span class="led ${led}"></span>`}${html}</span>`; }
  function buildStatus() {
    const el = $('#home-status');
    if (!el) return;
    const m = N.input.midi;
    let h = '';
    if (m.inputs.length) h += chip('on', `MIDI · <b>${N.esc(m.inputs[0].name)}</b>${m.inputs.length > 1 ? ' +' + (m.inputs.length - 1) : ''}`);
    else if (N.EMBED && (m.state === 'denied' || m.state === 'unsupported')) h += chip('', 'Clavier MIDI non disponible sur cette page');
    else h += chip('', m.state === 'denied' ? 'MIDI non autorisé' : m.state === 'unsupported' ? 'MIDI non pris en charge' : 'Aucun clavier MIDI branché');
    h += chip('on', `Clavier d’ordinateur · <b>${N.esc(N.input.layoutName())}</b>`);
    const s = N.audio.samples;
    if (s.state === 'ready') h += chip('on', `<b>Piano de concert</b> prêt`);
    else if (s.state === 'loading') h += chip('wait', `Piano de concert · ${Math.round((s.loaded / s.total) * 100)} %`);
    else if (s.state === 'error') h += chip('on', N.EMBED ? '<b>Piano doux</b> (version en ligne)' : 'Piano de concert indisponible (hors ligne) · piano doux');
    const st = N.progress.streak();
    if (st > 0) h += `<span class="chip"><span data-ico="flame"></span>Série · <b>${st} jour${st > 1 ? 's' : ''}</b></span>`;
    el.innerHTML = h;
    U.icons(el);
  }
  U.buildStatus = buildStatus;
  function pcHint() {
    const I = N.input;
    const o = I.octave;
    const lab = (m) => I.labelForMidi(m, m >= 12 * (o + 2) ? 'R' : 'L', o);
    const b = 12 * (o + 1);
    if (N.settings.layout === 'simple') {
      const whites = [0, 2, 4, 5, 7, 9, 11, 12].map((x) => `<kbd>${N.esc(lab(b + x))}</kbd>`).join(' ');
      return `Ton clavier est un piano : ${whites} = Do Ré Mi Fa Sol La Si Do · rangée du dessus : dièses<br>${N.esc(U.shortcutsLine(false))}`;
    }
    const up = [12, 14, 16, 17, 19, 21, 23, 24].map((x) => `<kbd>${N.esc(I.labelForMidi(b + x, 'R', o))}</kbd>`).join(' ');
    const low = [0, 2, 4, 5, 7, 9, 11].map((x) => `<kbd>${N.esc(I.labelForMidi(b + x, 'L', o))}</kbd>`).join(' ');
    return `Ton clavier est un piano : ${up} = Do Ré Mi Fa Sol La Si Do<br>${low} = une octave plus bas · chiffres et rangée du milieu : touches noires<br>${N.esc(U.shortcutsLine(false))}`;
  }
  function buildHome() {
    buildStatus();
    $('#home-hint').innerHTML = N.input.usingPc() ? pcHint() : 'Ton clavier MIDI est prêt : joue, les notes s’envolent.';
  }

  // ---------- bibliothèque ----------
  let libFilter = 'all', libList = [];
  function songMatches(s, f, q) {
    if (q && !(s.title + ' ' + s.composer).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)) return false;
    if (f === 'all') return s.cat !== 'gen' && s.cat !== 'lesson';
    if (f === 'easy') return s.level > 0 && s.level <= 2;
    if (f === 'classique') return s.cat === 'classique' || s.cat === 'nocturne';
    if (f === 'trad') return s.cat === 'trad' || s.cat === 'fetes';
    if (f === 'mine') return s.cat === 'import' || s.cat === 'rec';
    return true;
  }
  function buildLibrary() {
    const q = ($('#lib-search').value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    $$('#lib-tabs .tab').forEach((t) => t.classList.toggle('on', t.dataset.f === libFilter));
    libList = N.songs.all().filter((s) => songMatches(s, libFilter, q));
    const grid = $('#lib-grid');
    let h = '';
    for (const s of libList) {
      const p = N.progress.song(s.id);
      const glow = s.cat === 'import' || s.cat === 'rec' ? 'rgba(255,210,122,0.12)' : s.level >= 4 ? 'rgba(183,123,255,0.16)' : 'rgba(63,220,255,0.12)';
      const hands = s.hasR && s.hasL ? '2 mains' : s.hasL ? 'Main gauche' : 'Main droite';
      h += `<button class="card" data-id="${N.esc(s.id)}" style="--glow:${glow}">
        <div class="card-top">${s.level ? lvlHtml(s.level) + `<span>${N.songs.LEVELS[s.level]}</span>` : `<span>${N.songs.CATS[s.cat] || ''}</span>`}<span>${starsHtml(p ? p.stars : 0)}</span></div>
        <h4>${N.esc(s.title)}</h4>
        <div class="meta">${N.esc(s.composer)} · ${N.fmtTime(s.duration)}</div>
        <div class="tags"><span class="tag">${hands}</span>${p && p.best ? `<span class="tag gold">${N.fmtInt(p.best)}</span>` : ''}${s.cat === 'nocturne' ? '<span class="tag">Original</span>' : ''}</div>
      </button>`;
    }
    if (!libList.length) {
      h = libFilter === 'mine'
        ? `<div class="empty"><b>Aucun fichier pour l’instant.</b><br>Glisse un fichier <b>.mid</b> n’importe où dans la fenêtre, ou clique sur « Importer un MIDI ».<br>Tu trouveras des milliers de partitions MIDI libres de droits sur Mutopia Project ou Musopen.<br>Tes improvisations enregistrées en jeu libre arrivent aussi ici.</div>`
        : `<div class="empty">Aucun morceau ne correspond.</div>`;
    }
    grid.innerHTML = h;
  }

  // ---------- préparation d'un morceau ----------
  let setupSong = null;
  const setupOpt = Object.assign({ hands: 'R', play: 'wait', speed: 1, metronome: false, autoOther: true, fold: true }, N.store.get('setup', {}));
  U.openSetup = function (song) {
    setupSong = song;
    const p = N.progress.song(song.id);
    $('#su-level').innerHTML = song.level ? lvlHtml(song.level) + `<span>${N.songs.LEVELS[song.level]}</span>` : `<span>${N.songs.CATS[song.cat] || ''}</span>`;
    $('#su-title').textContent = song.title;
    $('#su-meta').textContent = `${song.composer} · ${N.fmtTime(song.duration)} · ${song.notes.length} notes`;
    $('#su-desc').textContent = song.desc || '';
    $('#su-desc').classList.toggle('hidden', !song.desc);
    // mains disponibles
    if (setupOpt.hands === 'L' && !song.hasL) setupOpt.hands = 'R';
    if (setupOpt.hands === 'R' && !song.hasR) setupOpt.hands = 'L';
    if (setupOpt.hands === 'RL' && !(song.hasR && song.hasL)) setupOpt.hands = song.hasR ? 'R' : 'L';
    $$('#su-hands button').forEach((b) => {
      const h = b.dataset.h;
      b.disabled = (h === 'L' && !song.hasL) || (h === 'R' && !song.hasR) || (h === 'RL' && !(song.hasR && song.hasL));
    });
    refreshSetup();
    $('#su-fold-wrap').classList.toggle('hidden', !N.input.usingPc());
    // pistes MIDI
    const tw = $('#su-tracks-wrap');
    if (song.source === 'midi' && song.tracks) {
      tw.classList.remove('hidden');
      const opts = (cur, single) => [['R', 'Main droite'], ['L', 'Main gauche'], ['A', 'Accompagnement (joué pour toi)'], ['M', 'Muet']].concat(single ? [['S', 'Séparer : grave à gauche, aigu à droite']] : [])
        .map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`).join('');
      $('#su-tracks').innerHTML = song.tracks.map((t) => `<div class="track-row"><span>${N.esc(t.name)}<small>${t.count} notes</small></span><select data-track="${t.index}">${opts(song.assign[t.index] || 'A', true)}</select></div>`).join('');
    } else tw.classList.add('hidden');
    $('#su-delete').classList.toggle('hidden', !(song.cat === 'import' || song.cat === 'rec'));
    let best = '';
    if (p) {
      best = `<span>${starsHtml(p.stars)}</span><span>Meilleur score : <b>${p.best ? N.fmtInt(p.best) : '—'}</b> · précision ${Math.round((p.acc || 0) * 100)} %</span>`;
    } else best = '<span>Pas encore joué</span>';
    $('#su-best').innerHTML = best;
    U.open('mdl-setup');
  };
  function refreshSetup() {
    $$('#su-hands button').forEach((b) => b.classList.toggle('on', b.dataset.h === setupOpt.hands));
    $$('#su-mode button').forEach((b) => b.classList.toggle('on', b.dataset.m === setupOpt.play));
    $('#su-speed').value = Math.round(setupOpt.speed * 100);
    $('#su-speed-val').textContent = Math.round(setupOpt.speed * 100) + ' %';
    $('#su-metro').checked = setupOpt.metronome;
    $('#su-other').checked = setupOpt.autoOther;
    $('#su-fold').checked = setupOpt.fold;
  }
  function startSetup() {
    if (!setupSong) return;
    N.store.set('setup', setupOpt);
    U.close('mdl-setup');
    returnTo = screen === 'library' ? 'library' : returnTo;
    U.startSong(setupSong, Object.assign({}, setupOpt));
  };

  U.startSong = function (song, opt) {
    N.game.stopQuiz();
    $$('.screen').forEach((el) => el.classList.remove('show', 'vis'));
    screen = 'session';
    $('#free-hud').classList.add('hidden');
    N.game.startSong(song, opt);
    showHud();
  };

  // ---------- HUD ----------
  let hudCache = {};
  function showHud() {
    const S = S_();
    if (!S) return;
    hudCache = {};
    $('#hud').classList.remove('hidden');
    $('#h-title').textContent = S.song.title;
    $('#h-sub').textContent = S.lesson ? 'Leçon · ' + S.lesson.title : S.song.composer;
    $$('#h-hands button').forEach((b) => {
      const h = b.dataset.h;
      b.disabled = (h === 'L' && !S.song.hasL) || (h === 'R' && !S.song.hasR) || (h === 'RL' && !(S.song.hasR && S.song.hasL));
    });
    const tip = $('#lesson-tip');
    if (S.lesson) { tip.innerHTML = N.lessonText(S.lesson.tip); tip.classList.remove('hidden'); }
    else tip.classList.add('hidden');
    if (S.folded) U.toast(`${S.folded} note${S.folded > 1 ? 's ont été ramenées' : ' a été ramenée'} d’une octave pour tenir sur le clavier d’ordinateur.`, '', 4200);
    updateChordVisibility();
    U.updateHud(true);
  }
  function hideHud() { $('#hud').classList.add('hidden'); $('#key-ticker').classList.add('hidden'); }
  U.updateHud = function (force) {
    const S = S_();
    if (!S || $('#hud').classList.contains('hidden')) return;
    const dur = Math.max(0.1, S.song.duration);
    const f = N.clamp(S.t / dur, 0, 1);
    $('#hp-fill').style.width = f * 100 + '%';
    $('#hp-head').style.left = f * 100 + '%';
    const lp = $('#hp-loop');
    if (S.loop.on) { lp.classList.add('on'); lp.style.left = (S.loop.a / dur) * 100 + '%'; lp.style.width = ((S.loop.b - S.loop.a) / dur) * 100 + '%'; }
    else lp.classList.remove('on');
    const time = N.fmtTime(Math.max(0, S.t)) + ' / ' + N.fmtTime(dur);
    if (hudCache.time !== time) { $('#h-time').textContent = time; hudCache.time = time; }
    const key = [S.hands, S.play, S.speed, S.metronome, S.loop.on].join('|');
    if (force || hudCache.key !== key) {
      hudCache.key = key;
      $$('#h-hands button').forEach((b) => b.classList.toggle('on', b.dataset.h === S.hands));
      $$('#h-mode button').forEach((b) => b.classList.toggle('on', b.dataset.m === S.play));
      $('#h-speed').textContent = Math.round(S.speed * 100) + ' %';
      $('#h-metro').classList.toggle('on', S.metronome);
      $('#h-loop').classList.toggle('on', S.loop.on);
      $('#h-score').classList.toggle('dim', S.play !== 'tempo');
    }
    if (S.play === 'tempo') {
      const r = N.game.result(S, true);
      const sc = N.fmtInt(S.stats.score), cb = String(S.stats.combo), ac = r.total ? Math.round(r.acc * 100) + ' %' : '—';
      if (hudCache.sc !== sc) { $('#hs-score').textContent = sc; hudCache.sc = sc; }
      if (hudCache.cb !== cb) { $('#hs-combo').textContent = cb; hudCache.cb = cb; }
      if (hudCache.ac !== ac) { $('#hs-acc').textContent = ac; hudCache.ac = ac; }
    } else if (hudCache.sc !== '—') {
      $('#hs-score').textContent = '—'; $('#hs-combo').textContent = '—'; $('#hs-acc').textContent = '—'; hudCache.sc = '—';
    }
    // bandeau des touches : celle(s) à jouer maintenant + les suivantes
    const tick = $('#key-ticker');
    const groups = [];
    if (S.play !== 'demo' && !S.paused && !S.finished) {
      let cur = null;
      for (let i = S.pIdx; i < S.pnotes.length && groups.length <= 6; i++) {
        const n = S.pnotes[i];
        if (n.state !== 0) continue;
        if (!cur || n.t - cur.t > 0.03) { if (groups.length === 6) break; cur = { t: n.t, notes: [] }; groups.push(cur); }
        cur.notes.push(n);
      }
    }
    const sig = groups.map((g) => g.notes.map((n) => n.midi + n.hand).join('+')).join('|') + (S.waiting ? 'W' : '') + N.input.curOctave() + N.settings.layout + N.settings.kbLabels;
    if (hudCache.tick !== sig) {
      hudCache.tick = sig;
      const pc = N.input.usingPc() && N.settings.showPcLabels;
      const cap = (n, big) => {
        const lab = pc ? N.input.labelForMidi(n.midi, n.hand) : '';
        const name = N.noteName(n.midi);
        const main = lab || name;
        return `<span class="kc ${n.hand === 'L' ? 'L' : 'R'}${big ? ' big' : ''}${main.length > 1 ? ' wide' : ''}"><b>${N.esc(main)}</b>${big && lab ? `<small>${N.esc(name)}</small>` : ''}</span>`;
      };
      let h = '';
      if (groups.length) {
        h += `<span class="kt-lab">${S.waiting ? 'À toi' : 'Ensuite'}</span><span class="kt-group now${S.waiting ? ' wait' : ''}">${groups[0].notes.map((n) => cap(n, true)).join('')}</span>`;
        if (groups.length > 1) h += '<span class="kt-arrow">›</span>' + groups.slice(1).map((g, i) => `<span class="kt-group" style="opacity:${(1 - i * 0.14).toFixed(2)}">${g.notes.map((n) => cap(n, false)).join('')}</span>`).join('');
      }
      tick.innerHTML = h;
      tick.classList.toggle('hidden', !h);
    }
  };

  function quitSession() {
    N.game.stopSession();
    hideHud();
    U.closeAllModals();
    U.show(returnTo || 'library');
  }
  U.closeAllModals = () => { modalStack.slice().forEach((id) => { $('#' + id).classList.remove('show'); }); modalStack.length = 0; };

  // ---------- résultats ----------
  let lastStart = null;
  function showResults(S, res) {
    hideHud();
    const song = S.song;
    let saved = null;
    if (S.play !== 'demo' && !S.train) {
      if (S.lesson) N.progress.lessonResult(S.lesson, res);
      else if (!res.practiced) saved = N.progress.songResult(song, res);
      else N.progress.data.stats.songsDone++;
    }
    const demo = S.play === 'demo';
    $('#r-title').textContent = demo ? 'Fin du morceau' : res.stars >= 3 ? 'Magnifique !' : res.stars === 2 ? 'Très bien !' : res.stars === 1 ? 'Bien joué !' : 'Continue, ça vient !';
    const modeName = { wait: 'Apprendre', tempo: 'Défi', demo: 'Écoute' }[S.play];
    const handsName = { R: 'main droite', L: 'main gauche', RL: 'deux mains' }[S.hands];
    $('#r-sub').textContent = `${song.title} · ${modeName} · ${handsName} · ${Math.round(S.speed * 100)} %`;
    const starsEl = $('#r-stars');
    starsEl.innerHTML = demo ? '' : [0, 1, 2].map(() => ICONS.star).join('');
    $$('svg', starsEl).forEach((el, i) => setTimeout(() => { el.classList.add('show'); if (i < res.stars) { el.classList.add('on'); N.audio.play(84 + [0, 4, 7][i], 0.4, 0.5, 0, 'celesta'); } }, 250 + i * 280));
    const cell = (l, v) => `<div><small>${l}</small><b>${v}</b></div>`;
    let g = '';
    if (S.play === 'tempo') g = cell('Score', N.fmtInt(res.score)) + cell('Précision', Math.round(res.acc * 100) + ' %') + cell('Combo max', res.maxCombo) + cell('Parfaits', res.perfect) + cell('Ratées', res.miss) + cell('Fausses notes', res.wrong);
    else if (S.play === 'wait') g = cell('Notes jouées', res.total) + cell('Fausses notes', res.wrong) + cell('Précision', Math.round(res.acc * 100) + ' %') + cell('Durée', N.fmtTime(res.seconds)) + cell('Vitesse', Math.round(S.speed * 100) + ' %') + cell('Mains', handsName);
    else g = cell('Notes', S.notes.length) + cell('Durée', N.fmtTime(song.duration / S.speed)) + cell('Vitesse', Math.round(S.speed * 100) + ' %');
    $('#r-grid').innerHTML = g;
    let tip = '';
    if (saved && saved.newBest) tip = 'Nouveau record !';
    else if (res.practiced && !demo && !S.lesson) tip = 'Session d’entraînement (boucle, déplacement ou vitesse modifiée) : le score n’est pas enregistré.';
    else if (S.play === 'wait' && res.stars >= 2 && !S.lesson) tip = 'Prêt pour le mode Défi ? Le morceau n’attendra plus.';
    else if (S.play === 'tempo' && S.speed < 1 && res.stars >= 2) tip = `Essaie à ${Math.min(100, Math.round(S.speed * 100) + 15)} % de vitesse.`;
    else if (S.lesson && res.stars < 2) tip = 'Rejoue la leçon pour gagner plus d’étoiles.';
    $('#r-tip').textContent = tip;
    $('#r-next').textContent = S.lesson ? 'Leçon suivante' : S.train ? 'Nouvel exercice' : 'Morceau suivant';
    lastStart = { song, opts: Object.assign({}, S.opts), lesson: S.lesson, train: S.train };
    U.open('mdl-results');
  }

  // ---------- leçons ----------
  function buildLessons() {
    const L = N.LESSONS;
    const done = L.filter((l) => (N.progress.data.lessons[l.id] || {}).done).length;
    $('#lessons-sub').textContent = `${done} / ${L.length} terminées`;
    const nextIdx = L.findIndex((l) => !(N.progress.data.lessons[l.id] || {}).done);
    $('#lesson-path').innerHTML = L.map((l, i) => {
      const r = N.progress.data.lessons[l.id] || {};
      return `<li><button class="lesson-card ${r.done ? 'done' : ''} ${i === nextIdx ? 'next' : ''}" data-lesson="${l.id}">
        <span class="l-num">${r.done ? ICONS.check : i + 1}</span>
        <span class="l-txt"><b>${N.esc(l.title)}</b><small>${N.esc(l.goal)}</small></span>
        <span class="l-side">${r.done ? starsHtml(r.stars) : i === nextIdx ? 'À faire' : ''}</span></button></li>`;
    }).join('');
  }
  let curLesson = null;
  U.openLesson = function (id) {
    const l = N.LESSONS.find((x) => x.id === id);
    if (!l) return;
    curLesson = l;
    const i = N.LESSONS.indexOf(l);
    $('#ls-num').textContent = 'Leçon ' + (i + 1) + ' sur ' + N.LESSONS.length;
    $('#ls-title').textContent = l.title;
    const extra = N.input.usingPc() ? '' : '<p>Avec un clavier MIDI, ignore les touches d’ordinateur : joue directement les notes indiquées.</p>';
    $('#ls-text').innerHTML = l.text.map((p) => `<p>${N.lessonText(p)}</p>`).join('') + extra;
    U.open('mdl-lesson');
  };
  function startLesson(l) {
    U.close('mdl-lesson');
    returnTo = 'lessons';
    const song = N.lessonSong(l);
    U.startSong(song, { hands: l.hands, play: l.play, speed: 1, metronome: !!l.metronome, autoOther: true, fold: true, octave: 3, lesson: l });
  }

  // ---------- entraînement ----------
  const TRAIN = [
    { id: 'scale', ico: 'scale', title: 'Gammes', desc: 'Toutes les gammes, en montée et descente, avec les doigtés usuels.' },
    { id: 'arp', ico: 'arp', title: 'Arpèges', desc: 'Les notes d’un accord, une à une, sur deux octaves.' },
    { id: 'chords', ico: 'chord', title: 'Accords', desc: 'Un nom d’accord s’affiche : trouve-le sur le clavier.' },
    { id: 'ear', ico: 'ear', title: 'Oreille', desc: 'Écoute une note ou une mélodie et retrouve-la.' },
    { id: 'reading', ico: 'staff', title: 'Lecture de notes', desc: 'Une note sur la portée : joue-la à la bonne hauteur.' },
  ];
  function buildTraining() {
    const st = N.progress.data.stats;
    const rec = { chords: st.chords ? st.chords + ' accords trouvés' : '', ear: st.earBest ? 'Record : ' + st.earBest + ' d’affilée' : '', reading: st.readBest ? 'Record : ' + st.readBest + ' d’affilée' : '' };
    $('#train-grid').innerHTML = TRAIN.map((t) => `<button class="train-card" data-train="${t.id}"><span class="mi-ico" data-ico="${t.ico}"></span><b>${t.title}</b><small>${t.desc}</small><span class="rec-line">${rec[t.id] || ''}</span></button>`).join('');
    U.icons($('#train-grid'));
  }
  const trainOpt = Object.assign({ tonic: 0, type: 'major', hands: 'R', bpm: 80, play: 'wait', arpType: 'maj', chordLevel: 1, earLevel: 1, readLevel: 1 }, N.store.get('train', {}));
  let trainKind = null;
  function openTrain(kind) {
    trainKind = kind;
    const t = TRAIN.find((x) => x.id === kind);
    $('#tr-title').textContent = t.title;
    $('#tr-desc').textContent = t.desc;
    const tonics = Array.from({ length: 12 }, (_, i) => `<option value="${i}"${i === trainOpt.tonic ? ' selected' : ''}>${N.esc(N.theory.rootName(i))}</option>`).join('');
    const seg = (id, items, cur) => `<div class="seg big" data-seg="${id}">${items.map(([v, l]) => `<button data-v="${v}" class="${String(v) === String(cur) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    let h = '';
    if (kind === 'scale' || kind === 'arp') {
      const types = kind === 'scale' ? N.theory.SCALES.map((s) => [s.id, s.name]) : [['maj', 'majeur'], ['min', 'mineur'], ['7', 'septième'], ['maj7', 'septième majeure'], ['m7', 'mineur septième'], ['dim7', 'diminué septième']];
      const cur = kind === 'scale' ? trainOpt.type : trainOpt.arpType;
      h += `<div class="field row"><label>Tonique</label><select class="text" id="tr-tonic" style="width:auto;height:38px">${tonics}</select>
        <select class="text" id="tr-type" style="width:auto;height:38px">${types.map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`).join('')}</select></div>`;
      h += `<div class="field"><label>Mains</label>${seg('hands', [['L', 'Main gauche'], ['RL', 'Les deux'], ['R', 'Main droite']], trainOpt.hands)}</div>`;
      h += `<div class="field"><label>Mode</label>${seg('play', [['wait', 'Apprendre'], ['tempo', 'Défi en rythme']], trainOpt.play)}</div>`;
      h += `<div class="field row"><label>Tempo</label><input type="range" id="tr-bpm" min="40" max="180" step="4" value="${trainOpt.bpm}"><span class="val" id="tr-bpm-val">${trainOpt.bpm}</span></div>`;
    } else {
      const lv = kind === 'chords' ? N.training.CHORD_LEVELS : kind === 'ear' ? N.training.EAR_LEVELS : N.training.READ_LEVELS;
      const cur = kind === 'chords' ? trainOpt.chordLevel : kind === 'ear' ? trainOpt.earLevel : trainOpt.readLevel;
      h += `<div class="field"><label>Niveau</label><div class="modes" data-seg="level">${Object.keys(lv).map((k) => `<button data-v="${k}" class="${String(k) === String(cur) ? 'on' : ''}"><b>Niveau ${k}</b><small>${lv[k].name}</small></button>`).join('')}</div></div>`;
    }
    $('#tr-fields').innerHTML = h;
    U.open('mdl-train');
  }
  function startTrain() {
    const kind = trainKind;
    N.store.set('train', trainOpt);
    U.close('mdl-train');
    returnTo = 'training';
    if (kind === 'scale' || kind === 'arp') {
      const song = kind === 'scale'
        ? N.theory.scaleSong({ tonic: trainOpt.tonic, type: trainOpt.type, hands: trainOpt.hands, bpm: trainOpt.bpm, octaves: 1 })
        : N.theory.arpeggioSong({ tonic: trainOpt.tonic, type: trainOpt.arpType, hands: trainOpt.hands, bpm: trainOpt.bpm });
      U.startSong(song, { hands: trainOpt.hands, play: trainOpt.play, speed: 1, metronome: trainOpt.play === 'tempo', autoOther: true, fold: true, train: kind });
      return;
    }
    const q = kind === 'chords' ? N.training.chords(trainOpt.chordLevel) : kind === 'ear' ? N.training.ear(trainOpt.earLevel) : N.training.reading(trainOpt.readLevel);
    startQuiz(q);
  }

  // ---------- quiz ----------
  function startQuiz(q) {
    $$('.screen').forEach((el) => el.classList.remove('show', 'vis'));
    screen = 'quiz';
    $('#quiz').classList.remove('hidden');
    $('#quiz').classList.toggle('reading', q.kind === 'reading');
    $('#q-title').textContent = q.title;
    $('#q-actions').innerHTML = q.actions.map((a) => `<button class="btn" data-qa="${a.id}">${a.label}</button>`).join('');
    N.game.startQuiz(q);
    renderQuiz(q);
    updateChordVisibility();
  }
  function renderQuiz(q) {
    if (!q || N.game.quiz !== q) return;
    $('#q-big').textContent = q.view.big;
    $('#q-sub').textContent = q.view.sub;
    $('#q-note').textContent = q.view.note;
    const card = $('#q-card');
    card.classList.toggle('ok', q.view.status === 'ok');
    card.classList.toggle('bad', q.view.status === 'bad');
    $('#q-ok').textContent = q.score.ok;
    $('#q-streak').textContent = q.score.streak;
    $('#q-best').textContent = q.score.best;
  }
  function stopQuiz() {
    N.game.stopQuiz();
    $('#quiz').classList.add('hidden');
    U.show('training');
  }

  // ---------- progression ----------
  function buildProgress() {
    const P = N.progress.data;
    const st = P.stats;
    const achN = Object.keys(P.ach).length;
    const tile = (l, v, e) => `<div class="stat"><small>${l}</small><b>${v}${e ? `<em>${e}</em>` : ''}</b></div>`;
    let h = '<div class="stat-row">';
    h += tile('Temps de pratique', N.fmtDuration(st.seconds));
    h += tile('Aujourd’hui', N.fmtDuration(N.progress.todaySeconds()));
    h += tile('Série', N.progress.streak(), 'jour' + (N.progress.streak() > 1 ? 's' : ''));
    h += tile('Notes jouées', N.fmtInt(st.notes));
    h += tile('Morceaux terminés', N.fmtInt(st.songsDone));
    h += tile('Succès', achN, '/ ' + N.progress.ACHIEVEMENTS.length);
    h += '</div>';
    // calendrier : 20 dernières semaines
    h += '<div class="block-title">Calendrier de pratique</div><div class="cal">';
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - (7 * 19 + ((today.getDay() + 6) % 7)));
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const key = N.today(d);
      const sec = P.days[key] || 0;
      const lv = sec <= 0 ? '' : sec < 300 ? 'l1' : sec < 900 ? 'l2' : sec < 1800 ? 'l3' : 'l4';
      h += `<i class="${lv} ${key === N.today() ? 'today' : ''}" title="${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · ${N.fmtDuration(sec)}"></i>`;
    }
    h += '</div><div class="cal-legend">Moins <i style="background:rgba(255,255,255,.05)"></i><i style="background:rgba(63,220,255,.28)"></i><i style="background:rgba(63,220,255,.5)"></i><i style="background:rgba(63,220,255,.75)"></i><i style="background:#9ff0ff"></i> Plus · lundi en haut</div>';
    h += '<div class="block-title">Succès</div><div class="ach-grid">';
    for (const a of N.progress.ACHIEVEMENTS) {
      const on = !!P.ach[a.id];
      h += `<div class="ach ${on ? 'on' : ''}"><span class="medal">${ICONS.trophy}</span><span><b>${N.esc(a.title)}</b><small>${N.esc(a.desc)}</small></span></div>`;
    }
    h += '</div>';
    $('#progress-body').innerHTML = h;
  }

  // ---------- réglages ----------
  let setTab = 'son';
  function sampleText(smp) {
    if (smp.state === 'ready') return 'Piano de concert : échantillons chargés';
    if (smp.state === 'loading') return `Piano de concert : chargement… ${smp.loaded}/${smp.total}`;
    if (smp.state === 'error') return N.EMBED ? 'Le piano de concert ne peut pas se charger sur cette page en ligne : piano doux utilisé' : 'Piano de concert indisponible hors ligne : piano doux utilisé';
    return '';
  }
  function instOptions() {
    const off = N.audio.samples.state === 'error';
    return N.audio.INSTRUMENTS.map((i) => [i.id, i.name + (i.id === 'concert' && off ? ' (indisponible ici)' : '')]);
  }
  function rowRange(id, label, sub, min, max, step, val, fmt) {
    return `<div class="set-row"><div class="lab"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div><input type="range" data-set="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><span class="val" data-val="${id}">${fmt(val)}</span></div>`;
  }
  function rowSelect(id, label, sub, opts, val) {
    return `<div class="set-row"><div class="lab"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div><select data-set="${id}">${opts.map(([v, l]) => `<option value="${v}"${String(v) === String(val) ? ' selected' : ''}>${l}</option>`).join('')}</select></div>`;
  }
  function rowSwitch(id, label, sub, val) {
    return `<div class="set-row"><div class="lab"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div><label class="switch"><input type="checkbox" data-set="${id}"${val ? ' checked' : ''}><i></i></label></div>`;
  }
  const FMT = {
    pct: (v) => Math.round(v * 100) + ' %',
    db: (v) => (v > 0 ? '+' : '') + v + ' dB',
    ms: (v) => (v > 0 ? '+' : '') + v + ' ms',
    zoom: (v) => '× ' + Number(v).toFixed(1),
  };
  const SET_FMT = { volume: FMT.pct, reverb: FMT.pct, pcVelocity: FMT.pct, accompVolume: FMT.pct, metroVolume: FMT.pct, bass: FMT.db, treble: FMT.db, latencyMs: FMT.ms, fallZoom: FMT.zoom };
  function buildSettings(tab) {
    setTab = tab || setTab;
    $$('#set-tabs .tab').forEach((t) => t.classList.toggle('on', t.dataset.t === setTab));
    const s = N.settings;
    let h = '';
    if (setTab === 'son') {
      h += rowSelect('instrument', 'Instrument', '<span id="set-smp">' + sampleText(N.audio.samples) + '</span>', instOptions(), s.instrument);
      h += rowRange('volume', 'Volume général', '', 0, 1, 0.01, s.volume, FMT.pct);
      h += rowRange('reverb', 'Réverbération', 'L’acoustique de la salle', 0, 1, 0.01, s.reverb, FMT.pct);
      h += rowRange('bass', 'Graves', '', -9, 9, 1, s.bass, FMT.db);
      h += rowRange('treble', 'Aigus', '', -9, 9, 1, s.treble, FMT.db);
      h += rowRange('pcVelocity', 'Force du clavier d’ordinateur', 'Maintiens Maj pour jouer plus fort', 0.2, 1, 0.01, s.pcVelocity, FMT.pct);
      h += rowRange('accompVolume', 'Volume de l’accompagnement', 'Les notes jouées pour toi', 0, 1, 0.01, s.accompVolume, FMT.pct);
      h += rowRange('metroVolume', 'Volume du métronome', '', 0, 1, 0.01, s.metroVolume, FMT.pct);
      h += rowRange('latencyMs', 'Décalage du son', 'Si le son arrive après l’image (casque Bluetooth…), augmente cette valeur', -100, 300, 5, s.latencyMs, FMT.ms);
    } else if (setTab === 'clavier') {
      const m = N.input.midi;
      h += `<div class="set-row"><div class="lab"><b>Assistant clavier</b><small>Choisir en deux clics les lettres et le format de ton clavier</small></div><button class="btn" id="set-kb-wizard">Ouvrir</button></div>`;
      h += rowSelect('kbLabels', 'Lettres de ton clavier', 'Détecté : ' + N.esc(N.input.detectedName() || 'inconnu (AZERTY par défaut)'), [['auto', 'Automatique'], ['azerty', 'AZERTY'], ['qwerty', 'QWERTY'], ['qwertz', 'QWERTZ']], s.kbLabels);
      h += rowSelect('kbFormat', 'Format du clavier', N.input.FORMATS[s.kbFormat] ? N.input.FORMATS[s.kbFormat].desc : '', Object.keys(N.input.FORMATS).sort((a, b) => (b === 'compact' ? 72 : +b) - (a === 'compact' ? 72 : +a)).map((k) => [k, N.input.FORMATS[k].name + ' (' + N.input.FORMATS[k].pct + ')']), s.kbFormat);
      h += rowSelect('layout', 'Notes sur le clavier d’ordinateur', N.settings.layout === 'double' ? 'Deux rangées de lettres = 2,5 octaves' : 'Une rangée, plus simple, 1,5 octave', [['double', 'Deux rangées (2,5 octaves)'], ['simple', 'Une rangée (1,5 octave)']], s.layout);
      h += `<div class="set-sub">Touches de commande<button class="btn ghost sm" id="set-keys-reset">Réinitialiser pour ce format</button></div>`;
      const binds = N.input.bindings();
      for (const a of N.input.ACTIONS) {
        const waiting = U.rebinding === a.id;
        h += `<div class="set-row key-row"><div class="lab"><b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div><span class="keys">${waiting ? '<span class="press">Appuie sur une touche… (Échap : annuler)</span>' : kbdList(binds[a.id])}</span><button class="btn sm" data-rebind="${a.id}">${waiting ? '…' : 'Changer'}</button></div>`;
      }
      h += rowSwitch('showPcLabels', 'Lettres sur les notes et les touches', 'Pour savoir quelle touche d’ordinateur appuyer', s.showPcLabels);
      h += rowSelect('noteNames', 'Noms des notes', '', [['latin', 'Do Ré Mi (Do3 = Do central)'], ['english', 'C D E (C4 = Do central)']], s.noteNames);
      h += rowSelect('namesOnKeys', 'Noms sur le clavier', '', [['none', 'Aucun'], ['c', 'Seulement les Do'], ['all', 'Toutes les touches blanches']], s.namesOnKeys);
      h += rowSwitch('namesOnNotes', 'Noms sur les notes qui tombent', 'Quand les lettres d’ordinateur ne sont pas affichées', s.namesOnNotes);
      h += rowSelect('inputMode', 'Je joue avec', 'Automatique : clavier MIDI dès qu’il envoie une note', [['auto', 'Automatique'], ['pc', 'Le clavier d’ordinateur'], ['midi', 'Un clavier MIDI']], s.inputMode);
      const ins = [['all', 'Tous les appareils']].concat(m.inputs.map((x) => [x.id, x.name]));
      h += rowSelect('midiIn', 'Clavier MIDI', m.inputs.length ? m.inputs.length + ' appareil(s) détecté(s)' : m.state === 'denied' ? 'Accès refusé : autorise le MIDI dans la barre d’adresse du navigateur' : 'Branche un clavier en USB : il est reconnu tout seul', ins, s.midiIn);
    } else if (setTab === 'affichage') {
      h += rowSelect('colorMode', 'Couleurs des notes', '', [['hands', 'Par main (bleu droite, violet gauche)'], ['rainbow', 'Arc-en-ciel (par note)']], s.colorMode);
      h += rowRange('fallZoom', 'Vitesse de défilement', 'Plus haut = notes plus espacées et plus rapides', 0.6, 1.8, 0.1, s.fallZoom, FMT.zoom);
      h += rowSelect('quality', 'Effets lumineux', 'Baisse-les si le jeu saccade', [['high', 'Élevés'], ['medium', 'Moyens'], ['low', 'Légers']], s.quality);
      h += rowSwitch('showBars', 'Barres de mesure', 'Les lignes horizontales et leurs numéros', s.showBars);
      h += rowSwitch('autoPause', 'Pause automatique', 'Quand la fenêtre passe en arrière-plan', s.autoPause);
      h += `<div class="set-row"><div class="lab"><b>Plein écran</b><small>Ou touche F11</small></div><button class="btn" id="set-full"><span data-ico="full"></span>Basculer</button></div>`;
    } else {
      h += `<div class="set-row"><div class="lab"><b>Progression</b><small>Records, leçons, statistiques et succès</small></div><button class="btn danger" id="set-reset">Tout effacer</button></div>`;
      h += `<div class="set-row"><div class="lab"><b>Sons du piano en cache</b><small>Les échantillons sont gardés pour jouer hors ligne</small></div><button class="btn" id="set-clear-cache">Vider le cache</button></div>`;
      h += `<div class="credits"><p><b>Nocturne</b> ${N.VERSION} — jeu de piano. Ta progression est enregistrée dans ce navigateur, rien n’est envoyé ailleurs.</p>
        ${N.EMBED ? '<p><b>Version en ligne</b> : cette page ne peut ni charger le piano de concert, ni utiliser un clavier MIDI, ni télécharger de fichier. La version complète s’ouvre avec le fichier index.html du jeu.</p>' : ''}
        <p><b>Piano de concert</b> : Salamander Grand Piano V3 d’Alexander Holm, licence CC BY 3.0, version mp3 publiée par le projet Tone.js. Chargé une fois depuis Internet puis gardé en cache.</p>
        <p><b>Morceaux</b> : œuvres du domaine public (Beethoven, Bach, Satie, Grieg, Pachelbel, chants traditionnels…), arrangées pour le jeu. Le thème « Nocturne » est une composition originale.</p>
        <p><b>Polices</b> : Cormorant Garamond et Manrope (licence SIL Open Font).</p>
        <p><b>Où trouver des fichiers MIDI ?</b> Mutopia Project et Musopen proposent des partitions libres de droits avec leur MIDI. Glisse le fichier dans la fenêtre pour l’apprendre.</p></div>`;
    }
    $('#set-body').innerHTML = h;
    U.icons($('#set-body'));
  }
  U.openSettings = function (tab) { buildSettings(tab); U.open('mdl-settings'); };
  function applySetting(id, raw, el) {
    const s = N.settings;
    let v = raw;
    if (el.type === 'checkbox') v = el.checked;
    else if (el.type === 'range') v = parseFloat(raw);
    s[id] = v;
    if (id === 'kbFormat') s.keymap = null;
    N.saveSettings();
    const valEl = $(`[data-val="${id}"]`);
    if (valEl && SET_FMT[id]) valEl.textContent = SET_FMT[id](v);
    N.audio.apply();
    if (id === 'layout' || id === 'kbLabels' || id === 'inputMode' || id === 'kbFormat') { buildSettings(); U.buildStatus(); if (screen === 'home') buildHome(); if (screen === 'home' || screen === 'free') N.renderer.setRange(...freeRange()); }
    if (id === 'instrument') { $('#f-inst').value = v; }
  }

  // ---------- assistant clavier ----------
  function kbSvg(f) {
    const R = (x, y, w, h, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.8" opacity="${o || 1}"/>`;
    let s = '';
    if (f === '100' || f === '80') {
      s += R(2, 2, 72, 5, 0.5) + R(2, 9, 72, 31) + R(77, 9, 16, 11, 0.75) + R(82, 31, 5, 4, 0.75) + R(77, 36, 16, 4, 0.75);
      if (f === '100') s += R(96, 9, 26, 31, 0.75);
    } else if (f === 'compact') {
      s += R(2, 4, 72, 36) + R(76, 4, 7, 24, 0.75) + R(70, 36, 13, 4, 0.75) + R(76, 31, 6, 4, 0.75);
    } else s += R(2, 4, 72, 36);
    return `<svg viewBox="0 0 124 44" fill="currentColor" aria-hidden="true">${s}</svg>`;
  }
  function renderKb() {
    const s = N.settings, I = N.input;
    const det = I.detectedName();
    const labs = [['auto', 'Auto' + (det ? ' · ' + det : '')], ['azerty', 'AZERTY'], ['qwerty', 'QWERTY'], ['qwertz', 'QWERTZ']];
    $('#kb-labels').innerHTML = labs.map(([v, l]) => `<button data-v="${v}" class="${s.kbLabels === v ? 'on' : ''}">${l}</button>`).join('');
    $('#kb-format').innerHTML = ['100', '80', 'compact', '60'].map((f) => {
      const F = I.FORMATS[f];
      return `<button data-f="${f}" class="${String(s.kbFormat) === f ? 'on' : ''}">${kbSvg(f)}<b>${F.name}</b><small>${F.pct}</small></button>`;
    }).join('');
    const o = I.octave, b = 12 * (o + 1);
    const notes = (s.layout === 'simple' ? [0, 2, 4, 5, 7, 9, 11, 12] : [12, 14, 16, 17, 19, 21, 23, 24]).map((x) => `<kbd>${N.esc(I.labelForMidi(b + x, 'R', o))}</kbd>`).join(' ');
    const B = I.bindings();
    $('#kb-preview').innerHTML = `<div><span>Notes</span>${notes}<em>= Do Ré Mi Fa Sol La Si Do</em></div>
      <div><span>Morceaux</span>${kbdList(B.slower)} ${kbdList(B.faster)}<em>vitesse</em> · ${kbdList(B.prev)} ${kbdList(B.next)}<em>mesures</em></div>
      <div><span>Jeu libre</span>${kbdList([...(B.octDown || []), ...(B.octUp || [])])}<em>octave</em></div>
      <div><span>Partout</span><kbd>Espace</kbd><em>pédale</em> · <kbd>Échap</kbd><em>pause</em> · <kbd>Maj</kbd><em>plus fort</em></div>
      <p class="hint-small">${N.esc(I.FORMATS[s.kbFormat] ? I.FORMATS[s.kbFormat].desc : '')}</p>`;
  }
  U.openKbSetup = function () { renderKb(); U.open('mdl-kb'); };

  // ---------- jeu libre ----------
  function enterFree() {
    U.show('free');
    $('#f-inst').value = N.settings.instrument;
    updateOct();
  }
  function updateOct() { $('#f-oct').textContent = 'Octave ' + N.input.curOctave(); }
  let recTimer = 0, recData = null, freeMetro = { on: false, bpm: 90, next: 0, k: 0 };
  U.freeMetro = freeMetro;
  function toggleRec() {
    const btn = $('#f-rec');
    if (!N.game.free.rec) {
      N.game.recStart();
      btn.classList.add('on');
      const t0 = performance.now();
      recTimer = setInterval(() => { $('#f-rec-label').textContent = 'Arrêter · ' + N.fmtTime((performance.now() - t0) / 1000); }, 250);
      $('#f-rec-label').textContent = 'Arrêter · 0:00';
    } else {
      clearInterval(recTimer);
      btn.classList.remove('on');
      $('#f-rec-label').textContent = 'Enregistrer';
      recData = N.game.recStop();
      if (!recData) { U.toast('Rien n’a été joué pendant l’enregistrement.'); return; }
      const d = new Date();
      $('#rec-info').textContent = `${recData.notes.length} notes · ${N.fmtTime(recData.duration)}`;
      $('#rec-name').value = 'Improvisation du ' + d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      U.open('mdl-rec');
    }
  }

  // ---------- nom d'accord ----------
  function updateChordVisibility() {
    const el = $('#chord-name');
    const show = (screen === 'free' || screen === 'home') && !!N.game.chord;
    el.classList.toggle('on', show);
  }
  N.on('chord', (c) => {
    const el = $('#chord-name');
    if (c) el.innerHTML = `<b>${N.esc(c.name)}</b><small>${N.esc(c.sym)}</small>`;
    updateChordVisibility();
  });

  // ---------- clavier : touches hors notes ----------
  U.onKey = function (e) {
    const k = e.key;
    const S = S_();
    if (k === 'Escape') {
      e.preventDefault();
      const top = U.top();
      if (top) { U.close(top); return; }
      if (screen === 'session' && S) { if (S.finished) return; N.game.pause(); U.open('mdl-pause'); return; }
      if (screen === 'quiz') { stopQuiz(); return; }
      if (screen !== 'home' && screen !== 'splash') { U.show('home'); return; }
      return;
    }
    if (k === 'Enter') {
      const top = U.top();
      if (top === 'mdl-setup') { e.preventDefault(); startSetup(); return; }
      if (top === 'mdl-lesson' && curLesson) { e.preventDefault(); startLesson(curLesson); return; }
      if (top === 'mdl-pause') { e.preventDefault(); U.close('mdl-pause'); return; }
      return;
    }
    // touches de commande (selon le format du clavier et tes réglages)
    if (U.top()) return;
    const inSong = screen === 'session' && !!S;
    const act = N.input.actionFor(e.code, inSong);
    if (!act) return;
    e.preventDefault();
    if (inSong) {
      if (act === 'pause') { if (!S.finished) { N.game.pause(); U.open('mdl-pause'); } return; }
      if (act === 'faster') { N.game.setSpeed(S.speed + 0.05); return; }
      if (act === 'slower') { N.game.setSpeed(S.speed - 0.05); return; }
      if (act === 'prev') { N.game.seekBar(-1); return; }
      if (act === 'next') { N.game.seekBar(1); return; }
      if (act === 'restart') { N.game.restartWith({}, false); showHud(); return; }
      if (act === 'octUp' || act === 'octDown') { N.input.shiftOctave(act === 'octUp' ? 1 : -1); return; }
      return;
    }
    if ((screen === 'home' || screen === 'free' || screen === 'quiz') && (act === 'octUp' || act === 'octDown')) N.input.shiftOctave(act === 'octUp' ? 1 : -1);
  };

  // ---------- réattribution d'une touche de commande ----------
  U.rebinding = null;
  U.captureKey = function (code) {
    const act = U.rebinding;
    U.rebinding = null;
    if (!act) return;
    if (code === 'Escape') { buildSettings('clavier'); return; }
    if (N.input.isPianoCode(code) || /^(Shift|Control|Alt|Meta)/.test(code)) {
      U.toast(`<span><b>${N.esc(N.input.keyName(code))}</b><small>Cette touche sert déjà au piano (ou c’est un modificateur) : choisis-en une autre.</small></span>`, 'err');
      buildSettings('clavier');
      return;
    }
    const km = Object.assign({}, N.settings.keymap || {});
    // une touche ne déclenche qu'une seule commande
    const all = N.input.bindings();
    for (const a in all) if (a !== act && (all[a] || []).includes(code)) km[a] = all[a].filter((c) => c !== code);
    km[act] = [code];
    N.settings.keymap = km;
    N.saveSettings();
    buildSettings('clavier');
    U.toast(`Commande « ${N.esc(N.input.ACTIONS.find((x) => x.id === act).name)} » : <b>${N.esc(N.input.keyName(code))}</b>`);
  };
  const kbdList = (codes) => (codes && codes.length ? codes.map((c) => `<kbd>${N.esc(N.input.keyName(c))}</kbd>`).join(' ') : '<span class="none">—</span>');
  U.shortcutsLine = function (inSong) {
    const b = N.input.bindings();
    const k = (a) => (b[a] || []).map((c) => N.input.keyName(c)).slice(0, 2).join(' / ');
    if (inSong) return `Échap : pause · ${k('prev')} ${k('next')} : mesures · ${k('slower')} ${k('faster')} : vitesse · Espace : pédale`;
    const oct = [k('octDown'), k('octUp')].filter(Boolean).join(' ');
    return `Espace : pédale · ${oct || k('slower') + ' ' + k('faster')} : octave · Maj : jouer plus fort`;
  };

  // ---------- importation ----------
  async function importFiles(files) {
    let last = null;
    for (const f of files) {
      if (!/\.(mid|midi|kar|rmi)$/i.test(f.name)) { U.toast(`« ${N.esc(f.name)} » n’est pas un fichier MIDI.`, 'err'); continue; }
      try {
        last = await N.songs.importFile(f);
        U.toast(`<span><b>${N.esc(last.title)}</b><small>Ajouté à « Mes fichiers » · ${last.notes.length} notes</small></span>`);
        N.progress.unlock('import');
      } catch (err) {
        U.toast(`Impossible de lire « ${N.esc(f.name)} » : ${N.esc(err.message || err)}`, 'err', 6000);
      }
    }
    if (last) {
      libFilter = 'mine';
      if (screen !== 'session' && screen !== 'quiz') { U.show('library'); U.openSetup(last); }
    }
  }

  // ---------- câblage ----------
  U.init = function () {
    U.icons(document);
    // menu
    $('#home-menu').addEventListener('click', (e) => {
      const b = e.target.closest('[data-go]');
      if (!b) return;
      noBlur();
      const go = b.dataset.go;
      if (go === 'settings') U.openSettings();
      else if (go === 'free') enterFree();
      else U.show(go);
    });
    $$('[data-back]').forEach((b) => b.addEventListener('click', () => U.show('home')));
    $$('[data-close]').forEach((b) => b.addEventListener('click', () => U.close(b.closest('.modal').id)));
    $$('.modal').forEach((m) => m.addEventListener('mousedown', (e) => { if (e.target === m && m.id !== 'mdl-results') U.close(m.id); }));
    // bibliothèque
    $('#lib-tabs').addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (!t) return; libFilter = t.dataset.f; buildLibrary(); });
    $('#lib-search').addEventListener('input', buildLibrary);
    $('#lib-search').addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.target.value = ''; e.target.blur(); buildLibrary(); } });
    $('#lib-grid').addEventListener('click', (e) => { const c = e.target.closest('.card'); if (!c) return; const s = N.songs.get(c.dataset.id); if (s) U.openSetup(s); });
    $('#btn-import').addEventListener('click', () => $('#file-midi').click());
    $('#file-midi').addEventListener('change', (e) => { importFiles(Array.from(e.target.files || [])); e.target.value = ''; });
    // préparation
    $('#su-hands').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; setupOpt.hands = b.dataset.h; refreshSetup(); });
    $('#su-mode').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; setupOpt.play = b.dataset.m; refreshSetup(); });
    $('#su-speed').addEventListener('input', (e) => { setupOpt.speed = e.target.value / 100; $('#su-speed-val').textContent = e.target.value + ' %'; });
    $('#su-metro').addEventListener('change', (e) => (setupOpt.metronome = e.target.checked));
    $('#su-other').addEventListener('change', (e) => (setupOpt.autoOther = e.target.checked));
    $('#su-fold').addEventListener('change', (e) => (setupOpt.fold = e.target.checked));
    $('#su-tracks').addEventListener('change', async (e) => {
      const sel = e.target.closest('select');
      if (!sel || !setupSong) return;
      const assign = Object.assign({}, setupSong.assign, { [sel.dataset.track]: sel.value });
      const fresh = await N.songs.updateAssign(setupSong, assign, setupSong.split);
      U.openSetup(fresh);
      buildLibrary();
    });
    $('#su-start').addEventListener('click', startSetup);
    $('#su-delete').addEventListener('click', () => {
      const s = setupSong;
      confirmBox('Supprimer ce morceau ?', `« ${s.title} » sera retiré de tes fichiers.`, async () => { await N.songs.remove(s.id); U.close('mdl-setup'); buildLibrary(); U.toast('Morceau supprimé.'); });
    });
    // HUD
    $('#h-pause').addEventListener('click', () => { noBlur(); const S = S_(); if (!S || S.finished) return; N.game.pause(); U.open('mdl-pause'); });
    $('#h-hands').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; noBlur(); N.game.restartWith({ hands: b.dataset.h }, true); showHud(); });
    $('#h-mode').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; noBlur(); N.game.restartWith({ play: b.dataset.m }, true); showHud(); });
    $('#h-slower').addEventListener('click', () => { noBlur(); const S = S_(); if (S) N.game.setSpeed(S.speed - 0.05); });
    $('#h-faster').addEventListener('click', () => { noBlur(); const S = S_(); if (S) N.game.setSpeed(S.speed + 0.05); });
    $('#h-metro').addEventListener('click', () => { noBlur(); const S = S_(); if (!S) return; S.metronome = !S.metronome; S.opts.metronome = S.metronome; S.beatIdx = N.lowerBound(S.beats, S.t); });
    $('#h-loop').addEventListener('click', () => { noBlur(); const S = S_(); if (!S) return; if (S.loop.on) N.game.setLoop(null); else N.game.loopHere(2); });
    // barre de progression : clic = déplacement, Maj + glisser = boucle
    const prog = $('#h-progress');
    let drag = null;
    const frac = (e) => { const r = prog.getBoundingClientRect(); return N.clamp((e.clientX - r.left) / r.width, 0, 1); };
    prog.addEventListener('pointerdown', (e) => {
      const S = S_(); if (!S) return;
      prog.setPointerCapture(e.pointerId);
      drag = { shift: e.shiftKey, a: frac(e) * S.song.duration };
      if (!drag.shift) N.game.seek(drag.a - 0.8 * S.speed);
    });
    prog.addEventListener('pointermove', (e) => {
      const S = S_(); if (!S || !drag) return;
      const t = frac(e) * S.song.duration;
      if (!drag.shift) N.game.seek(t - 0.8 * S.speed);
      else { S.loop = { on: true, a: Math.min(drag.a, t), b: Math.max(drag.a, t), count: 0 }; }
    });
    prog.addEventListener('pointerup', (e) => {
      const S = S_(); if (!S || !drag) return;
      if (drag.shift) { const t = frac(e) * S.song.duration; if (Math.abs(t - drag.a) > 0.4) N.game.setLoop(Math.min(drag.a, t), Math.max(drag.a, t)); else N.game.setLoop(null); }
      drag = null;
    });
    // pause
    $('#p-resume').addEventListener('click', () => U.close('mdl-pause'));
    $('#p-restart').addEventListener('click', () => { U.closeAllModals(); N.game.restartWith({}, false); showHud(); });
    $('#p-settings').addEventListener('click', () => U.openSettings());
    $('#p-quit').addEventListener('click', quitSession);
    // résultats
    $('#r-library').addEventListener('click', () => { U.close('mdl-results'); quitSession(); });
    $('#r-retry').addEventListener('click', () => {
      U.close('mdl-results');
      if (!lastStart) return;
      if (lastStart.train === 'scale' || lastStart.train === 'arp') { startTrain(); return; }
      U.startSong(lastStart.song, Object.assign({}, lastStart.opts, { from: undefined, loop: undefined }));
    });
    $('#r-next').addEventListener('click', () => {
      U.close('mdl-results');
      if (!lastStart) return quitSession();
      if (lastStart.lesson) {
        const i = N.LESSONS.indexOf(lastStart.lesson);
        const nx = N.LESSONS[i + 1];
        N.game.stopSession(); hideHud(); U.show('lessons');
        if (nx) U.openLesson(nx.id);
        return;
      }
      if (lastStart.train) { N.game.stopSession(); hideHud(); U.show('training'); openTrain(lastStart.train); return; }
      const list = libList.length ? libList : N.songs.all();
      const i = list.findIndex((s) => s.id === lastStart.song.id);
      const nx = list[(i + 1) % list.length];
      N.game.stopSession(); hideHud(); U.show('library');
      if (nx) U.openSetup(nx);
    });
    // leçons
    $('#lesson-path').addEventListener('click', (e) => { const b = e.target.closest('[data-lesson]'); if (b) U.openLesson(b.dataset.lesson); });
    $('#ls-start').addEventListener('click', () => curLesson && startLesson(curLesson));
    // entraînement
    $('#train-grid').addEventListener('click', (e) => { const b = e.target.closest('[data-train]'); if (b) openTrain(b.dataset.train); });
    $('#tr-fields').addEventListener('click', (e) => {
      const b = e.target.closest('[data-seg] button');
      if (!b) return;
      const seg = b.closest('[data-seg]').dataset.seg;
      $$('button', b.parentElement).forEach((x) => x.classList.toggle('on', x === b));
      if (seg === 'hands') trainOpt.hands = b.dataset.v;
      if (seg === 'play') trainOpt.play = b.dataset.v;
      if (seg === 'level') {
        const v = +b.dataset.v;
        if (trainKind === 'chords') trainOpt.chordLevel = v; else if (trainKind === 'ear') trainOpt.earLevel = v; else trainOpt.readLevel = v;
      }
    });
    $('#tr-fields').addEventListener('input', (e) => {
      if (e.target.id === 'tr-bpm') { trainOpt.bpm = +e.target.value; $('#tr-bpm-val').textContent = e.target.value; }
    });
    $('#tr-fields').addEventListener('change', (e) => {
      if (e.target.id === 'tr-tonic') trainOpt.tonic = +e.target.value;
      if (e.target.id === 'tr-type') { if (trainKind === 'scale') trainOpt.type = e.target.value; else trainOpt.arpType = e.target.value; }
      e.target.blur();
    });
    $('#tr-start').addEventListener('click', startTrain);
    // assistant clavier
    $('#kb-labels').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      N.settings.kbLabels = b.dataset.v; N.saveSettings(); renderKb(); U.buildStatus(); if (screen === 'home') buildHome();
    });
    $('#kb-format').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      N.settings.kbFormat = b.dataset.f; N.settings.keymap = null; N.saveSettings(); renderKb(); if (screen === 'home') buildHome();
    });
    $('#kb-ok').addEventListener('click', () => { N.settings.kbSetupDone = true; N.saveSettings(); U.close('mdl-kb'); if (screen === 'home') buildHome(); });
    $('#set-body').addEventListener('click', (e) => {
      const rb = e.target.closest('[data-rebind]');
      if (rb) { U.rebinding = rb.dataset.rebind; buildSettings('clavier'); return; }
      if (e.target.closest('#set-keys-reset')) { N.settings.keymap = null; N.saveSettings(); buildSettings('clavier'); U.toast('Touches de commande remises par défaut pour ce format.'); }
      if (e.target.closest('#set-kb-wizard')) U.openKbSetup();
    });
    // quiz
    $('#q-back').addEventListener('click', stopQuiz);
    $('#q-actions').addEventListener('click', (e) => { const b = e.target.closest('[data-qa]'); if (b && N.game.quiz) { noBlur(); N.game.quiz.action(b.dataset.qa); } });
    N.on('quiz', renderQuiz);
    // réglages
    $('#set-tabs').addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) buildSettings(t.dataset.t); });
    $('#set-body').addEventListener('input', (e) => { const el = e.target.closest('[data-set]'); if (el && el.type === 'range') applySetting(el.dataset.set, el.value, el); });
    $('#set-body').addEventListener('change', (e) => { const el = e.target.closest('[data-set]'); if (el) { applySetting(el.dataset.set, el.value, el); if (el.tagName === 'SELECT') el.blur(); } });
    $('#set-body').addEventListener('click', (e) => {
      if (e.target.closest('#set-full')) { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); }
      if (e.target.closest('#set-reset')) confirmBox('Effacer toute la progression ?', 'Records, leçons, statistiques et succès seront remis à zéro. Tes fichiers MIDI importés sont conservés.', () => { N.store.set('progress', {}); location.reload(); });
      if (e.target.closest('#set-clear-cache')) confirmBox('Vider le cache du piano ?', 'Les sons seront téléchargés de nouveau au prochain lancement.', async () => {
        for (const name of ['A0', 'C1', 'Ds1', 'Fs1', 'A1', 'C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6', 'Ds6', 'Fs6', 'A6', 'C7', 'Ds7', 'Fs7', 'A7', 'C8']) await N.idb.del('samples', name);
        U.toast('Cache vidé.');
      });
    });
    // jeu libre
    $('#f-inst').innerHTML = instOptions().map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    if (N.EMBED) $('#rec-export').classList.add('hidden'); // les téléchargements sont bloqués sur la page en ligne
    $('#f-inst').addEventListener('change', (e) => { N.settings.instrument = e.target.value; N.saveSettings(); e.target.blur(); });
    $('#f-back').addEventListener('click', () => { noBlur(); U.show('home'); });
    $('#f-oct-down').addEventListener('click', () => { noBlur(); N.input.shiftOctave(-1); });
    $('#f-oct-up').addEventListener('click', () => { noBlur(); N.input.shiftOctave(1); });
    $('#f-metro').addEventListener('click', () => {
      noBlur();
      freeMetro.on = !freeMetro.on;
      freeMetro.next = N.audio.now() + 0.05; freeMetro.k = 0;
      $('#f-metro').classList.toggle('on', freeMetro.on);
    });
    $('#f-bpm-range').addEventListener('input', (e) => { freeMetro.bpm = +e.target.value; $('#f-bpm').textContent = e.target.value; });
    $('#f-bpm-range').addEventListener('change', (e) => e.target.blur());
    $('#f-rec').addEventListener('click', () => { noBlur(); toggleRec(); });
    $('#rec-play').addEventListener('click', () => {
      if (!recData) return;
      const t0 = N.audio.now() + 0.15;
      for (const n of recData.notes) { const v = N.audio.schedule(n.midi, n.vel, t0 + n.t); N.audio.releaseAt(v, t0 + n.t + n.d); }
    });
    $('#rec-save').addEventListener('click', async () => {
      if (!recData) return;
      const name = ($('#rec-name').value || '').trim() || 'Improvisation';
      await N.songs.saveRecording(recData.notes, name);
      N.progress.unlock('record');
      U.toast(`<span><b>${N.esc(name)}</b><small>Ajouté à « Mes fichiers »</small></span>`);
      U.close('mdl-rec');
    });
    $('#rec-export').addEventListener('click', () => {
      if (!recData) return;
      const name = ($('#rec-name').value || '').trim() || 'Improvisation';
      const buf = N.midiFile.write(recData.notes, { bpm: 120, pedal: recData.pedal, name });
      N.download(name.replace(/[\\/:*?"<>|]+/g, '-') + '.mid', new Blob([buf], { type: 'audio/midi' }));
      N.progress.unlock('record');
    });
    $('#rec-discard').addEventListener('click', () => U.close('mdl-rec'));
    // glisser-déposer
    let dragDepth = 0;
    const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
    window.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; $('#drop').classList.add('on'); });
    window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
    window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('#drop').classList.remove('on'); });
    window.addEventListener('drop', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth = 0;
      $('#drop').classList.remove('on');
      importFiles(Array.from(e.dataTransfer.files || []));
    });
    // évènements
    N.on('finished', ({ S, res }) => { if (N.game.session === S) setTimeout(() => { if (N.game.session === S) showResults(S, res); }, 1100); });
    N.on('achievement', (a) => U.toast(`<span class="medal">${ICONS.trophy}</span><span>Succès débloqué<small><b>${N.esc(a.title)}</b> · ${N.esc(a.desc)}</small></span>`, 'ach', 5000));
    N.on('midi', () => { U.buildStatus(); if (screen === 'home') buildHome(); if ($('#mdl-settings').classList.contains('show') && setTab === 'clavier') buildSettings(); });
    N.on('midi-connect', (name) => U.toast(`<span><b>Clavier MIDI connecté</b><small>${N.esc(name || '')}</small></span>`));
    N.on('samples', (smp) => {
      U.buildStatus();
      const el = $('#set-smp');
      if (el) el.textContent = sampleText(smp);
      if (smp.state === 'error' || smp.state === 'ready') {
        const cur = N.settings.instrument;
        $('#f-inst').innerHTML = instOptions().map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`).join('');
      }
    });
    N.on('layout', () => { if (screen === 'home') buildHome(); });
    N.on('octave', () => { updateOct(); if (screen === 'home' || screen === 'free') { N.renderer.setRange(...freeRange()); if (screen === 'home') buildHome(); } });
    N.on('sustain', (on) => $('#f-sus').classList.toggle('on', on));
    N.on('note', (e) => {
      if (e.source === 'midi' && (screen === 'home' || screen === 'free') && N.renderer.range().count < 40) N.renderer.setRange(21, 108);
    });
  };

  // appelé à chaque image
  U.frame = function (dt) {
    if (screen === 'session') U.updateHud();
    if (freeMetro.on && screen === 'free') {
      const now = N.audio.now();
      while (freeMetro.next < now + 0.12) {
        if (freeMetro.next >= now - 0.02) N.audio.click(freeMetro.next, freeMetro.k % 4 === 0);
        freeMetro.next += 60 / freeMetro.bpm;
        freeMetro.k++;
      }
    }
    void dt;
  };
})();
