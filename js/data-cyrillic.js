/* Russian Cyrillic deck data.
   Letters are grouped the way they are usually taught: the ones that already look right,
   then the false friends, then genuinely new shapes, then the awkward ones.
   Aliases are pruned where they would collide with another letter's primary answer
   (so "e" is only Э, never Е). Й and Ы both accept "y" — that ambiguity is real. */
(function (global) {
  'use strict';

  // [upper, lower, answers, note]
  var GROUPS = [
    {
      id: 'g1', label: 'Already familiar', letters: [
        ['А', 'а', ['a'], 'like "a" in "father"'],
        ['К', 'к', ['k'], ''],
        ['М', 'м', ['m'], ''],
        ['О', 'о', ['o'], 'unstressed it drifts toward "a"'],
        ['Т', 'т', ['t'], '']
      ]
    },
    {
      id: 'g2', label: 'False friends', letters: [
        ['В', 'в', ['v'], 'looks like B, sounds like V'],
        ['Е', 'е', ['ye', 'je'], 'looks like E, sounds like "ye"'],
        ['Н', 'н', ['n'], 'looks like H, sounds like N'],
        ['Р', 'р', ['r'], 'looks like P, sounds like R'],
        ['С', 'с', ['s'], 'looks like C, sounds like S'],
        ['У', 'у', ['u', 'oo'], 'looks like y, sounds like "oo"'],
        ['Х', 'х', ['kh', 'h', 'x'], 'looks like X, sounds like Scottish "loch"']
      ]
    },
    {
      id: 'g3', label: 'New shapes, familiar sounds', letters: [
        ['Б', 'б', ['b'], ''],
        ['Г', 'г', ['g'], ''],
        ['Д', 'д', ['d'], ''],
        ['З', 'з', ['z'], ''],
        ['И', 'и', ['i', 'ee'], 'like "ee" in "see"'],
        ['Л', 'л', ['l'], ''],
        ['П', 'п', ['p'], ''],
        ['Ф', 'ф', ['f'], ''],
        ['Э', 'э', ['e'], 'like "e" in "bed"']
      ]
    },
    {
      id: 'g4', label: 'Y-glides', letters: [
        ['Ё', 'ё', ['yo', 'jo'], 'always stressed'],
        ['Й', 'й', ['y', 'j'], 'short i — the glide in "boy"'],
        ['Ю', 'ю', ['yu', 'ju'], ''],
        ['Я', 'я', ['ya', 'ja'], '']
      ]
    },
    {
      id: 'g5', label: 'Hushers', letters: [
        ['Ж', 'ж', ['zh', 'ž'], 'like "s" in "measure"'],
        ['Ц', 'ц', ['ts', 'c'], 'like "ts" in "cats"'],
        ['Ч', 'ч', ['ch', 'č'], ''],
        ['Ш', 'ш', ['sh', 'š'], 'hard sh'],
        ['Щ', 'щ', ['shch', 'sch', 'ŝ'], 'soft, longer sh']
      ]
    },
    {
      id: 'g6', label: 'Signs & Ы', letters: [
        ['Ы', 'ы', ['y', 'ih'], 'a full vowel, romanized y — был (byl) vs бил (bil)',
          'A full vowel, not a sign: [ɨ], like i with the tongue pulled back and the lips flat. ' +
          'Romanized y — был (byl, "was") vs бил (bil, "beat"). Й is answered y as well; the hint on a miss tells them apart.'],
        ['Ъ', 'ъ', ['"', 'ʺ', 'hard', 'hard sign', '-', "''"],
          'hard sign — no sound of its own; it blocks softening',
          'The hard sign. It has no sound: it keeps a consonant separate from the vowel after it, ' +
          'blocking softening — подъезд is podyezd, not podezd. Scholarly transliteration writes ʺ and everyday ' +
          'transliteration drops it, so this trainer asks for " — typing hard also works.'],
        ['Ь', 'ь', ["'", 'ʹ', 'soft', 'soft sign'],
          'soft sign — no sound of its own; it softens the letter before it',
          'The soft sign. It has no sound: it palatalizes the letter before it — мать (matʹ, "mother") vs мат (mat). ' +
          'Scholarly transliteration writes ʹ and everyday transliteration an apostrophe, so this trainer asks for \' ' +
          '— typing soft also works.']
      ]
    }
  ];

  var letterChart = {
    id: 'letters',
    type: 'list',
    title: 'Russian alphabet',
    hint: 'Type the sound. For Ъ and Ь type "hard" and "soft".',
    rows: GROUPS.map(function (g) {
      return { id: g.id, label: g.label, entries: g.letters };
    }),
    cellChar: function (entry, options) {
      var mode = (options && options.letterCase) || 'both';
      if (mode === 'upper') return entry[0];
      if (mode === 'lower') return entry[1];
      return entry[0] + entry[1];
    },
    itemsFor: function (entry, options) {
      var mode = (options && options.letterCase) || 'both';
      var out = [];
      if (mode !== 'lower') {
        out.push({ id: 'ru:' + entry[0], char: entry[0], answers: entry[2], note: entry[3], help: entry[4] });
      }
      if (mode !== 'upper') {
        out.push({ id: 'ru:' + entry[1], char: entry[1], answers: entry[2], note: entry[3], help: entry[4] });
      }
      return out;
    }
  };

  function upTo(n) {
    return { letters: { rows: GROUPS.slice(0, n).map(function (g) { return g.id; }) } };
  }

  global.ALPHABET_CYRILLIC = {
    id: 'cyrillic',
    name: 'Русский Cyrillic',
    label: 'Cyrillic',
    fontStack: '"Segoe UI", "PT Sans", "Noto Sans", Arial, sans-serif',
    inputHint: 'transliteration',
    charts: [letterChart],
    options: ['letterCase'],
    presets: [
      { id: 'lvl1', name: 'Level 1 · already familiar', selection: upTo(1) },
      { id: 'lvl2', name: 'Level 2 · + false friends', selection: upTo(2) },
      { id: 'lvl3', name: 'Level 3 · + new shapes', selection: upTo(3) },
      { id: 'lvl4', name: 'Level 4 · + y-glides', selection: upTo(4) },
      { id: 'lvl5', name: 'Level 5 · + hushers', selection: upTo(5) },
      { id: 'lvl6', name: 'Level 6 · all 33 letters', selection: upTo(6) }
    ],
    defaultSelection: upTo(1)
  };

  global.CYRILLIC_GROUPS = GROUPS;
})(this);
