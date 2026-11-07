/* Nocturne — parcours de leçons pour débuter.
   Dans les textes, {C4} est remplacé par la touche du clavier d'ordinateur qui joue cette note. */
'use strict';
(function () {
  const N = window.N;
  N.LESSONS = [
    {
      id: 'l1', title: 'Le Do central', goal: 'Trouver le Do central et le jouer en rythme.',
      text: [
        'Le <b>Do central</b> est le repère de tout pianiste : c’est le Do situé au milieu du clavier, juste à gauche du groupe de <b>deux touches noires</b>.',
        'Sur ton clavier d’ordinateur, il se joue avec la touche <kbd>{C4}</kbd>. Garde le <b>pouce</b> (doigt 1) dessus.',
        'Le morceau <b>t’attend</b> : quand une note touche la ligne lumineuse, il s’arrête jusqu’à ce que tu la joues.',
      ],
      tip: 'Joue le Do central ({C4}) avec le pouce.',
      bpm: 76, hands: 'R', play: 'wait',
      parts: { R: 'C4h@1 C4h@1 | C4q@1 C4@1 C4h@1 | C4q@1 C4@1 C4@1 C4@1 | C4w@1' },
    },
    {
      id: 'l2', title: 'Do, Ré, Mi', goal: 'Trois doigts, trois notes voisines.',
      text: [
        'Pose le <b>pouce (1)</b> sur Do, l’<b>index (2)</b> sur Ré et le <b>majeur (3)</b> sur Mi.',
        'Sur l’ordinateur : <kbd>{C4}</kbd> <kbd>{D4}</kbd> <kbd>{E4}</kbd>.',
        'Garde les doigts arrondis, comme si tu tenais une balle. Le numéro affiché sur chaque note est le doigt à utiliser.',
      ],
      tip: 'Do Ré Mi = {C4} {D4} {E4}, doigts 1-2-3.',
      bpm: 80, hands: 'R', play: 'wait',
      parts: { R: 'C4q@1 D4@2 E4@3 D4@2 | C4h@1 E4h@3 | D4q@2 E4@3 D4@2 C4@1 | E4q@3 D4@2 C4h@1 | C4q@1 D4@2 E4@3 E4@3 | D4q@2 D4@2 C4h@1' },
    },
    {
      id: 'l3', title: 'Les cinq doigts', goal: 'Une main posée, cinq touches : Do Ré Mi Fa Sol.',
      text: [
        'Ta main droite couvre maintenant cinq touches blanches : <b>Do Ré Mi Fa Sol</b>, un doigt par touche, du pouce (1) à l’auriculaire (5).',
        'Sur l’ordinateur : <kbd>{C4}</kbd> <kbd>{D4}</kbd> <kbd>{E4}</kbd> <kbd>{F4}</kbd> <kbd>{G4}</kbd>.',
        'Ne lève pas la main : seuls les doigts bougent.',
      ],
      tip: 'Do Ré Mi Fa Sol = {C4} {D4} {E4} {F4} {G4}.',
      bpm: 84, hands: 'R', play: 'wait',
      parts: { R: 'C4q@1 D4@2 E4@3 F4@4 | G4h@5 G4h@5 | G4q@5 F4@4 E4@3 D4@2 | C4h@1 C4h@1 | C4q@1 E4@3 G4@5 E4@3 | D4q@2 F4@4 E4@3 D4@2 | C4w@1' },
    },
    {
      id: 'l4', title: 'Première mélodie', goal: 'Jouer « Au clair de la lune ».',
      text: [
        'Tu connais déjà toutes les notes de cette chanson : <b>Do, Ré, Mi</b>.',
        'Écoute bien : la mélodie revient deux fois. Prends ton temps, le jeu attend chaque note.',
      ],
      tip: 'Au clair de la lune : Do Do Do Ré Mi Ré…',
      bpm: 92, hands: 'R', play: 'wait',
      parts: { R: 'C4q@1 C4@1 C4@1 D4@2 | E4h@3 D4h@2 | C4q@1 E4@3 D4@2 D4@2 | C4w@1 | C4q@1 C4@1 C4@1 D4@2 | E4h@3 D4h@2 | C4q@1 E4@3 D4@2 D4@2 | C4w@1' },
    },
    {
      id: 'l5', title: 'Le rythme', goal: 'Jouer au bon moment, sans que le jeu t’attende.',
      text: [
        'Jusqu’ici, le morceau t’attendait. Maintenant <b>il avance tout seul</b>, au rythme du métronome.',
        'Une <b>noire</b> dure un clic, une <b>blanche</b> deux clics, une <b>ronde</b> quatre. Plus la note est longue, plus son rectangle est haut.',
        'Vise le moment où la note touche la ligne : tu verras « Parfait », « Super » ou « Bien ».',
      ],
      tip: 'Joue quand la note touche la ligne lumineuse.',
      bpm: 72, hands: 'R', play: 'tempo', metronome: true,
      parts: { R: 'C4q@1 C4@1 C4@1 C4@1 | E4h@3 E4h@3 | G4q@5 G4@5 E4h@3 | C4w@1 | C4q@1 D4@2 E4@3 F4@4 | G4h@5 E4h@3 | D4q@2 E4@3 D4@2 C4@1 | C4w@1' },
    },
    {
      id: 'l6', title: 'La main gauche', goal: 'Les notes graves, de l’autre main.',
      text: [
        'La main gauche joue surtout les <b>notes graves</b>. Sur l’ordinateur, elle utilise la rangée du bas : <kbd>{C3}</kbd> <kbd>{D3}</kbd> <kbd>{E3}</kbd> <kbd>{F3}</kbd> <kbd>{G3}</kbd> pour Do Ré Mi Fa Sol.',
        'Attention, c’est le miroir de la main droite : l’<b>auriculaire (5)</b> est sur Do et le <b>pouce (1)</b> sur Sol.',
      ],
      tip: 'Main gauche : {C3} {D3} {E3} {F3} {G3}, doigts 5 à 1.',
      bpm: 80, hands: 'L', play: 'wait',
      parts: { L: 'C3q@5 D3@4 E3@3 F3@2 | G3h@1 G3h@1 | G3q@1 F3@2 E3@3 D3@4 | C3w@5 | C3q@5 E3@3 G3@1 E3@3 | C3w@5' },
    },
    {
      id: 'l7', title: 'Les deux mains', goal: 'La gauche tient, la droite chante.',
      text: [
        'La main gauche pose une note et la <b>tient</b> pendant que la droite joue la mélodie.',
        'Commence lentement : le jeu attend que les deux mains soient en place. Les notes violettes sont pour la main gauche, les bleues pour la droite.',
      ],
      tip: 'Gauche en violet, droite en bleu.',
      bpm: 72, hands: 'RL', play: 'wait',
      parts: { R: 'C4q@1 D4@2 E4@3 F4@4 | G4w@5 | G4q@5 F4@4 E4@3 D4@2 | C4w@1', L: 'C3w@5 | G3w@1 | G3w@1 | C3w@5' },
    },
    {
      id: 'l8', title: 'Les touches noires', goal: 'Rencontrer ton premier dièse : Fa♯.',
      text: [
        'Les touches noires sont les <b>dièses (♯)</b> et les <b>bémols (♭)</b>. Fa♯ est la touche noire juste à droite de Fa.',
        'Sur l’ordinateur, les touches noires sont sur la rangée du dessus : Fa♯ se joue avec <kbd>{F#4}</kbd>.',
        'Ta main se décale : pouce sur Fa♯, puis Sol La Si avec les doigts 2-3-4.',
      ],
      tip: 'Fa♯ = {F#4}.',
      bpm: 76, hands: 'R', play: 'wait',
      parts: { R: 'G4q@2 A4@3 B4@4 A4@3 | G4h@2 F#4h@1 | G4q@2 B4@4 A4@3 F#4@1 | G4w@2' },
    },
    {
      id: 'l9', title: 'Les accords', goal: 'Plusieurs notes en même temps.',
      text: [
        'Un <b>accord</b>, ce sont plusieurs notes jouées ensemble. <b>Do majeur</b> = Do + Mi + Sol, avec les doigts 1-3-5.',
        'Appuie sur les trois touches en même temps : le jeu attend que l’accord soit complet.',
        'On enchaîne Do, Fa et Sol, les trois accords les plus utilisés de la musique.',
      ],
      tip: 'Do majeur = {C4} + {E4} + {G4}.',
      bpm: 66, hands: 'R', play: 'wait',
      parts: { R: '[C4 E4 G4]h@1,3,5 [C4 E4 G4]h@1,3,5 | [C4 F4 A4]h@1,3,5 [C4 F4 A4]h@1,3,5 | [C4 E4 G4]h@1,3,5 [B3 D4 G4]h@1,2,5 | [C4 E4 G4]w@1,3,5' },
    },
    {
      id: 'l10', title: 'La gamme de Do', goal: 'Huit notes de Do à Do avec le passage du pouce.',
      text: [
        'La <b>gamme de Do majeur</b> monte de Do à Do sur les touches blanches.',
        'Astuce : après Mi (doigt 3), <b>passe le pouce sous la main</b> pour jouer Fa avec le pouce. En redescendant, passe le majeur par-dessus le pouce.',
      ],
      tip: 'Passe le pouce sous la main sur Fa.',
      bpm: 76, hands: 'R', play: 'wait',
      parts: { R: 'C4q@1 D4@2 E4@3 F4@1 | G4q@2 A4@3 B4@4 C5@5 | C5q@5 B4@4 A4@3 G4@2 | F4q@1 E4@3 D4@2 C4@1 | C4w@1' },
    },
    {
      id: 'l11', title: 'Accompagner', goal: 'L’Hymne à la joie, les deux mains ensemble.',
      text: [
        'La main droite joue l’<b>Hymne à la joie</b>, la main gauche l’accompagne avec deux notes : Do et Sol.',
        'Quand c’est fluide, rejoue la leçon en mode Défi depuis la bibliothèque.',
      ],
      tip: 'Main gauche : Do ({C3}) et Sol ({G3}).',
      bpm: 92, hands: 'RL', play: 'wait',
      parts: {
        R: 'E4q@3 E4@3 F4@4 G4@5 | G4q@5 F4@4 E4@3 D4@2 | C4q@1 C4@1 D4@2 E4@3 | E4q.@3 D4e@2 D4h@2 | E4q@3 E4@3 F4@4 G4@5 | G4q@5 F4@4 E4@3 D4@2 | C4q@1 C4@1 D4@2 E4@3 | D4q.@2 C4e@1 C4h@1',
        L: 'C3w@5 | G3w@1 | C3w@5 | G3w@1 | C3w@5 | G3w@1 | C3w@5 | G3h@1 C3h@5',
      },
    },
    {
      id: 'l12', title: 'Ton premier morceau', goal: '« Ah ! vous dirai-je, maman » en entier, deux mains.',
      text: [
        'Dernière étape : un morceau complet, <b>les deux mains</b>, du début à la fin.',
        'Tu peux ralentir avec la vitesse si besoin. Bravo pour ce parcours !',
      ],
      tip: 'Deux mains, du début à la fin.',
      bpm: 92, hands: 'RL', play: 'wait',
      parts: {
        R: 'C4q C4 G4 G4 | A4q A4 G4h | F4q F4 E4 E4 | D4q D4 C4h | G4q G4 F4 F4 | E4q E4 D4h | G4q G4 F4 F4 | E4q E4 D4h | C4q C4 G4 G4 | A4q A4 G4h | F4q F4 E4 E4 | D4q D4 C4h',
        L: 'C3w | F3h C3h | F3h C3h | G3h C3h | C3h G3h | C3h G3h | C3h G3h | C3h G3h | C3w | F3h C3h | F3h C3h | G3h C3h',
      },
    },
  ];

  N.lessonSong = function (lesson) {
    const song = N.songs.fromDef({
      id: 'lesson-' + lesson.id, title: lesson.title, composer: 'Leçon ' + lesson.id.slice(1), level: 1, cat: 'lesson', source: 'lesson',
      bpm: lesson.bpm, ts: '4/4', parts: lesson.parts,
    });
    song.lesson = lesson;
    return N.songs.register(song);
  };

  // remplace {C4} par la touche du clavier d'ordinateur
  N.lessonText = function (s) {
    return s.replace(/\{([A-G]#?-?\d)\}/g, (_, p) => {
      const m = N.parsePitch(p);
      const lab = N.input ? N.input.labelForMidi(m, m >= 60 ? 'R' : 'L', 3) : '';
      return lab ? N.esc(lab) : N.noteName(m, null, true);
    });
  };
})();
