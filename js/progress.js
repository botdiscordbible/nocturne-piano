/* Nocturne — progression : records, temps de pratique, série de jours, succès */
'use strict';
(function () {
  const N = window.N;
  const P = (N.progress = {});
  const DEF = { songs: {}, tiles: {}, lessons: {}, stats: { notes: 0, seconds: 0, songsDone: 0, chords: 0, earBest: 0, readBest: 0, loops: 0 }, days: {}, ach: {} };
  P.data = Object.assign(JSON.parse(JSON.stringify(DEF)), N.store.get('progress', {}));
  for (const k of Object.keys(DEF)) if (!P.data[k]) P.data[k] = JSON.parse(JSON.stringify(DEF[k]));
  P.data.stats = Object.assign({}, DEF.stats, P.data.stats);

  let dirty = false, lastSave = 0, lastNote = -1e9;
  P.save = function (force) {
    dirty = true;
    const now = performance.now();
    if (force || now - lastSave > 4000) { N.store.set('progress', P.data); lastSave = now; dirty = false; }
  };
  window.addEventListener('beforeunload', () => { if (dirty) N.store.set('progress', P.data); });

  P.note = function () {
    P.data.stats.notes++;
    lastNote = performance.now();
    const n = P.data.stats.notes;
    if (n === 1) P.unlock('first-note');
    if (n === 1000) P.unlock('notes-1k');
    if (n === 10000) P.unlock('notes-10k');
    const h = new Date().getHours();
    if (h >= 0 && h < 5 && n % 20 === 0) P.unlock('night');
    if (n % 25 === 0) P.save();
  };
  // le temps compte seulement si on a joué dans les 20 dernières secondes
  P.tick = function (dt) {
    if (document.hidden || performance.now() - lastNote > 20000) return;
    P.data.stats.seconds += dt;
    const d = N.today();
    P.data.days[d] = (P.data.days[d] || 0) + dt;
    if (P.data.stats.seconds >= 3600) P.unlock('time-1h');
    const st = P.streak();
    if (st >= 3) P.unlock('streak-3');
    if (st >= 7) P.unlock('streak-7');
    P.save();
  };
  P.streak = function () {
    let n = 0;
    const d = new Date();
    // aujourd'hui compte s'il y a eu au moins une minute, sinon on part d'hier
    if ((P.data.days[N.today(d)] || 0) < 60) d.setDate(d.getDate() - 1);
    while ((P.data.days[N.today(d)] || 0) >= 60) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };
  P.todaySeconds = () => P.data.days[N.today()] || 0;

  P.song = (id) => P.data.songs[id] || null;
  // res : { mode, stars, acc, score, maxCombo, speed, hands }
  P.songResult = function (song, res) {
    const id = song.id;
    const rec = P.data.songs[id] || { plays: 0, best: 0, stars: 0, acc: 0 };
    rec.plays++;
    rec.last = Date.now();
    const newBest = res.mode === 'tempo' && res.score > (rec.best || 0);
    if (res.mode === 'tempo') rec.best = Math.max(rec.best || 0, res.score);
    rec.stars = Math.max(rec.stars || 0, res.stars);
    rec.acc = Math.max(rec.acc || 0, res.acc);
    P.data.songs[id] = rec;
    P.data.stats.songsDone++;
    P.unlock('first-song');
    if (res.stars >= 3) P.unlock('stars-3');
    if (res.mode === 'tempo' && res.miss === 0 && res.wrong === 0 && res.total > 10) P.unlock('perfect');
    if (res.maxCombo >= 50) P.unlock('combo-50');
    if (res.maxCombo >= 150) P.unlock('combo-150');
    if (song.level >= 4 && res.speed >= 1 && res.mode === 'tempo' && res.stars >= 1) P.unlock('full-speed');
    P.save(true);
    return { newBest, rec };
  };
  // mode Tuiles : meilleur score et étoiles (tours réussis) par morceau et par difficulté
  P.tilesRecord = (id, level) => (P.data.tiles || {})[id + ':' + level] || null;
  P.tilesResult = function (song, level, score, stars) {
    P.data.tiles = P.data.tiles || {};
    const key = song.id + ':' + level;
    const rec = P.data.tiles[key] || { best: 0, stars: 0, plays: 0 };
    const newBest = score > rec.best;
    rec.best = Math.max(rec.best, score);
    rec.stars = Math.max(rec.stars, stars);
    rec.plays++;
    P.data.tiles[key] = rec;
    if (stars >= 1) P.unlock('first-song');
    if (stars >= 3) P.unlock('stars-3');
    P.save(true);
    return { newBest, best: rec.best };
  };
  P.lessonResult = function (lesson, res) {
    const rec = P.data.lessons[lesson.id] || { stars: 0, done: false };
    rec.done = true;
    rec.stars = Math.max(rec.stars, res.stars);
    P.data.lessons[lesson.id] = rec;
    if (N.LESSONS.every((l) => P.data.lessons[l.id] && P.data.lessons[l.id].done)) P.unlock('lessons-all');
    P.save(true);
    return rec;
  };
  P.stat = function (key, val, mode) {
    const s = P.data.stats;
    if (mode === 'max') s[key] = Math.max(s[key] || 0, val);
    else s[key] = (s[key] || 0) + (val == null ? 1 : val);
    if (key === 'chords' && s.chords >= 20) P.unlock('chords-20');
    if (key === 'earBest' && s.earBest >= 10) P.unlock('ear-10');
    if (key === 'readBest' && s.readBest >= 25) P.unlock('reader-25');
    if (key === 'loops' && s.loops >= 10) P.unlock('loop');
    P.save();
  };

  P.ACHIEVEMENTS = [
    { id: 'first-note', title: 'Première note', desc: 'Jouer ta toute première note.' },
    { id: 'notes-1k', title: 'Mille notes', desc: 'Jouer 1 000 notes.' },
    { id: 'notes-10k', title: 'Dix mille notes', desc: 'Jouer 10 000 notes.' },
    { id: 'first-song', title: 'Premier morceau', desc: 'Aller au bout d’un morceau.' },
    { id: 'stars-3', title: 'Trois étoiles', desc: 'Obtenir trois étoiles sur un morceau.' },
    { id: 'perfect', title: 'Sans faute', desc: 'Finir un morceau en mode Défi sans aucune erreur.' },
    { id: 'combo-50', title: 'En rythme', desc: 'Enchaîner 50 notes sans en rater une.' },
    { id: 'combo-150', title: 'Métronome humain', desc: 'Enchaîner 150 notes sans en rater une.' },
    { id: 'full-speed', title: 'Tempo original', desc: 'Réussir un morceau avancé à 100 % de vitesse.' },
    { id: 'lessons-all', title: 'Diplômé', desc: 'Terminer toutes les leçons.' },
    { id: 'streak-3', title: 'Assidu', desc: 'Jouer trois jours d’affilée.' },
    { id: 'streak-7', title: 'Une semaine', desc: 'Jouer sept jours d’affilée.' },
    { id: 'time-1h', title: 'Une heure de piano', desc: 'Cumuler une heure de pratique.' },
    { id: 'ear-10', title: 'Oreille d’or', desc: 'Dix bonnes réponses d’affilée à l’oreille.' },
    { id: 'reader-25', title: 'Lecteur', desc: 'Lire 25 notes d’affilée sans erreur.' },
    { id: 'chords-20', title: 'Accordé', desc: 'Trouver 20 accords.' },
    { id: 'import', title: 'Ma musique', desc: 'Importer un fichier MIDI.' },
    { id: 'record', title: 'Compositeur', desc: 'Enregistrer une improvisation.' },
    { id: 'loop', title: 'Persévérant', desc: 'Répéter un passage en boucle dix fois.' },
    { id: 'night', title: 'Nocturne', desc: 'Jouer au cœur de la nuit.' },
  ];
  P.unlock = function (id) {
    if (P.data.ach[id]) return false;
    const a = P.ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return false;
    P.data.ach[id] = Date.now();
    P.save(true);
    N.emit('achievement', a);
    return true;
  };
})();
