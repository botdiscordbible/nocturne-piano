/* Nocturne — démarrage et boucle principale */
'use strict';
(function () {
  const N = window.N;
  let booted = false;

  function enter() {
    if (booted) return;
    booted = true;
    N.audio.init();
    N.audio.resume();
    N.audio.loadSamples();
    N.input.requestMidi();
    N.ui.show('home');
    if (!N.settings.kbSetupDone) setTimeout(() => N.ui.openKbSetup(), 450);
    else if (!N.progress.data.stats.notes) {
      setTimeout(() => N.ui.toast('<span><b>Bienvenue !</b><small>Joue sur ton clavier : les touches de lettres sont un piano. Si tu débutes, ouvre les Leçons.</small></span>', '', 7000), 700);
    }
    document.documentElement.dataset.boot = 'entered';
  }
  N.enter = enter;
  N.on('wantAudio', enter);

  function autoPause() {
    if (!N.settings.autoPause) return;
    const S = N.game.session;
    if (S && !S.paused && !S.finished && S.play !== 'demo') { N.game.pause(); N.ui.open('mdl-pause'); }
  }

  function init() {
    N.songs.initBuiltin();
    N.songs.initClassics();
    const stage = document.getElementById('stage');
    N.renderer.init(stage);
    N.input.init(stage);
    N.ui.init();
    const [a, b] = N.input.range(N.input.octave);
    N.renderer.setRange(a - 12, b + 5, true);
    N.songs.loadImported().then(() => { if (N.ui.screen() === 'library') N.ui.show('library'); });
    N.idb.ok().then((ok) => (document.documentElement.dataset.idb = ok ? 'ok' : 'none'));
    document.getElementById('btn-enter').addEventListener('click', enter);
    window.addEventListener('keydown', (e) => { if (!booted && !e.repeat && !e.ctrlKey && !e.altKey) enter(); });
    stage.addEventListener('pointerdown', () => { if (!booted) enter(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
    window.addEventListener('blur', autoPause);
    requestAnimationFrame(loop);
    document.documentElement.dataset.boot = 'ready';
  }

  let last = 0;
  function loop(now) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016;
    last = now;
    try { N.game.update(dt, now); } catch (e) { console.error(e); }
    try { N.renderer.frame(now); } catch (e) { console.error(e); }
    try { N.ui.frame(dt); } catch (e) { console.error(e); }
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
