/* Hangul deck data: jamo letters, consonant x vowel syllable grid, and batchim (final consonants).
   Romanization follows Revised Romanization (RR); extra spellings are accepted silently as aliases.
   Aliases are pruned wherever they would collide with another character's primary answer,
   so the trainer still forces the distinctions that matter (ㄱ/ㅋ, ㅈ/ㅊ, ㅓ/ㅗ, ...). */
(function (global) {
  'use strict';

  var BASE = 0xac00;
  var INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  var MEDIALS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  var FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  // Onset (initial position) sounds. First entry is the answer shown on a miss.
  var ONSET = {
    'ㄱ': ['g'], 'ㄲ': ['kk', 'gg'], 'ㄴ': ['n'], 'ㄷ': ['d'], 'ㄸ': ['tt', 'dd'],
    'ㄹ': ['r', 'l'], 'ㅁ': ['m'], 'ㅂ': ['b'], 'ㅃ': ['pp', 'bb'], 'ㅅ': ['s', 'sh'],
    'ㅆ': ['ss'], 'ㅇ': [''], 'ㅈ': ['j'], 'ㅉ': ['jj', 'tch'], 'ㅊ': ['ch', "ch'"],
    'ㅋ': ['k', "k'"], 'ㅌ': ['t', "t'"], 'ㅍ': ['p', "p'"], 'ㅎ': ['h']
  };

  // Coda (final position) sounds. RR collapses many finals onto the same sound.
  var CODA = {
    'ㄱ': ['k', 'g'], 'ㄲ': ['k', 'kk'], 'ㄴ': ['n'], 'ㄷ': ['t', 'd'], 'ㄹ': ['l', 'r'],
    'ㅁ': ['m'], 'ㅂ': ['p', 'b'], 'ㅅ': ['t', 's'], 'ㅆ': ['t', 's'], 'ㅇ': ['ng'],
    'ㅈ': ['t', 'j'], 'ㅊ': ['t', 'ch'], 'ㅋ': ['k'], 'ㅌ': ['t'], 'ㅍ': ['p'], 'ㅎ': ['t', 'h']
  };

  var VOWEL = {
    'ㅏ': ['a'], 'ㅐ': ['ae'], 'ㅑ': ['ya'], 'ㅒ': ['yae'], 'ㅓ': ['eo', 'ŏ'], 'ㅔ': ['e'],
    'ㅕ': ['yeo', 'yŏ'], 'ㅖ': ['ye'], 'ㅗ': ['o'], 'ㅘ': ['wa'], 'ㅙ': ['wae'], 'ㅚ': ['oe'],
    'ㅛ': ['yo'], 'ㅜ': ['u', 'oo'], 'ㅝ': ['wo', 'wŏ'], 'ㅞ': ['we'], 'ㅟ': ['wi'],
    'ㅠ': ['yu'], 'ㅡ': ['eu', 'ŭ'], 'ㅢ': ['ui', 'eui'], 'ㅣ': ['i']
  };

  var JAMO_NOTE = {
    'ㅇ': 'silent as an initial, "ng" as a final',
    'ㄹ': 'between English r and l',
    'ㅓ': 'like the "u" in "but"',
    'ㅡ': 'like the "oo" in "book" with flat lips',
    'ㅐ': 'ㅏ + ㅣ',
    'ㅔ': 'ㅓ + ㅣ'
  };

  function compose(initial, medial, final) {
    var l = INITIALS.indexOf(initial);
    var v = MEDIALS.indexOf(medial);
    var t = FINALS.indexOf(final || '');
    if (l < 0 || v < 0 || t < 0) throw new Error('bad jamo: ' + initial + medial + final);
    return String.fromCharCode(BASE + (l * 21 + v) * 28 + t);
  }

  // Cartesian product of per-part spellings, so 시 accepts both "si" and "shi".
  function combine(parts) {
    var out = [''];
    for (var i = 0; i < parts.length; i++) {
      var next = [];
      for (var a = 0; a < out.length; a++) {
        for (var b = 0; b < parts[i].length; b++) next.push(out[a] + parts[i][b]);
      }
      out = next;
    }
    var seen = {}, unique = [];
    for (var k = 0; k < out.length; k++) {
      if (out[k] && !seen[out[k]]) { seen[out[k]] = true; unique.push(out[k]); }
    }
    return unique;
  }

  function row(id, label, jamo) {
    return { id: id, label: label, entries: jamo };
  }

  // --- Chart 1: isolated jamo -------------------------------------------------
  // An isolated consonant is answered with its initial-position sound only. Folding in the
  // final-position sound would let ㄱ accept "k" and ㄷ accept "t", erasing the ㄱ/ㅋ and
  // ㄷ/ㅌ distinction — the final sounds are drilled in the batchim chart instead.
  function jamoItem(jamo) {
    var answers;
    if (jamo === 'ㅇ') answers = ['ng', '-', 'silent', 'x'];
    else if (ONSET[jamo]) answers = ONSET[jamo].slice();
    else answers = VOWEL[jamo];
    // Drop aliases that merely extend the primary (ㅅ "sh", ㅋ "k'"): keeping them would stop
    // the answer box from submitting on its own the moment you type the short form.
    var primary = answers[0];
    var seen = {}, unique = [];
    for (var i = 0; i < answers.length; i++) {
      var answer = answers[i];
      if (!answer || seen[answer]) continue;
      if (i > 0 && primary && answer.indexOf(primary) === 0) continue;
      seen[answer] = true;
      unique.push(answer);
    }
    return [{ id: 'jamo:' + jamo, char: jamo, answers: unique, note: JAMO_NOTE[jamo] || '' }];
  }

  var jamoChart = {
    id: 'jamo',
    type: 'list',
    title: 'Jamo — individual letters',
    hint: 'The 40 building blocks. Type the sound: ㄱ → g, ㅏ → a.',
    rows: [
      row('c-plain-1', 'Plain consonants I', ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ']),
      row('c-plain-2', 'Plain consonants II', ['ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ']),
      row('c-aspirated', 'Aspirated consonants', ['ㅊ', 'ㅋ', 'ㅌ', 'ㅍ']),
      row('c-tense', 'Tense consonants', ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ']),
      row('v-basic', 'Basic vowels', ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ']),
      row('v-iotated', 'Y-vowels', ['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ']),
      row('v-e', 'E-vowels', ['ㅐ', 'ㅔ', 'ㅒ', 'ㅖ']),
      row('v-w', 'W-vowels & ㅢ', ['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'])
    ],
    itemsFor: function (jamo) { return jamoItem(jamo); }
  };

  // --- Chart 2: consonant x vowel syllable grid -------------------------------
  var GRID_CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'];
  var GRID_VOWELS = ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ', 'ㅑ', 'ㅕ', 'ㅛ', 'ㅠ', 'ㅐ', 'ㅔ', 'ㅒ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'];

  var syllableChart = {
    id: 'syllables',
    type: 'grid',
    title: 'Syllable blocks',
    hint: 'Consonant + vowel, the way Hangul is actually read — Revised Romanization, with common alternatives accepted. Tick a few rows and columns to start.',
    rows: GRID_CONSONANTS.map(function (c) { return { id: 'c:' + c, label: c }; }),
    cols: GRID_VOWELS.map(function (v) { return { id: 'v:' + v, label: v }; }),
    cellChar: function (r, c) { return compose(r.label, c.label, ''); },
    itemsFor: function (r, c) {
      var char = compose(r.label, c.label, '');
      return [{
        id: 'syl:' + char,
        char: char,
        answers: combine([ONSET[r.label], VOWEL[c.label]]),
        note: r.label + ' + ' + c.label
      }];
    }
  };

  // --- Chart 3: batchim (final consonants) ------------------------------------
  var CODA_ROWS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅆ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  var CODA_BASES = [
    { id: 'b:ga', initial: 'ㄱ', medial: 'ㅏ' },
    { id: 'b:neo', initial: 'ㄴ', medial: 'ㅓ' },
    { id: 'b:do', initial: 'ㄷ', medial: 'ㅗ' },
    { id: 'b:mu', initial: 'ㅁ', medial: 'ㅜ' },
    { id: 'b:si', initial: 'ㅅ', medial: 'ㅣ' },
    { id: 'b:je', initial: 'ㅈ', medial: 'ㅔ' }
  ];
  CODA_BASES.forEach(function (b) { b.label = compose(b.initial, b.medial, ''); });

  var batchimChart = {
    id: 'batchim',
    type: 'grid',
    title: 'Batchim — final consonants',
    hint: 'A consonant closing the block. Its sound changes in final position: ㅅ, ㅈ and ㅎ all become a cut-off "t".',
    rows: CODA_ROWS.map(function (c) { return { id: 'f:' + c, label: c }; }),
    cols: CODA_BASES,
    cellChar: function (r, c) { return compose(c.initial, c.medial, r.label); },
    itemsFor: function (r, c) {
      var char = compose(c.initial, c.medial, r.label);
      return [{
        id: 'bat:' + char,
        char: char,
        answers: combine([ONSET[c.initial], VOWEL[c.medial], CODA[r.label]]),
        note: 'final ' + r.label + ' → "' + CODA[r.label][0] + '"'
      }];
    }
  };

  global.ALPHABET_HANGUL = {
    id: 'hangul',
    name: '한글 Hangul',
    label: 'Hangul',
    fontStack: '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", "Nanum Gothic", sans-serif',
    inputHint: 'romanization',
    charts: [jamoChart, syllableChart, batchimChart],
    presets: [
      {
        id: 'first-letters', name: 'Level 1 · first 5 consonants + 6 vowels',
        selection: { jamo: { rows: ['c-plain-1', 'v-basic'] } }
      },
      {
        id: 'all-plain', name: 'Level 2 · all plain letters',
        selection: { jamo: { rows: ['c-plain-1', 'c-plain-2', 'v-basic', 'v-iotated'] } }
      },
      {
        id: 'all-jamo', name: 'Level 3 · all 40 jamo',
        selection: { jamo: { rows: ['c-plain-1', 'c-plain-2', 'c-aspirated', 'c-tense', 'v-basic', 'v-iotated', 'v-e', 'v-w'] } }
      },
      {
        id: 'first-syllables', name: 'Level 4 · first syllable blocks',
        selection: { syllables: { rows: ['c:ㄱ', 'c:ㄴ', 'c:ㄷ', 'c:ㄹ', 'c:ㅁ'], cols: ['v:ㅏ', 'v:ㅓ', 'v:ㅗ', 'v:ㅜ', 'v:ㅡ', 'v:ㅣ'] } }
      },
      {
        id: 'core-syllables', name: 'Level 5 · core syllable grid',
        selection: {
          syllables: {
            rows: ['c:ㄱ', 'c:ㄴ', 'c:ㄷ', 'c:ㄹ', 'c:ㅁ', 'c:ㅂ', 'c:ㅅ', 'c:ㅇ', 'c:ㅈ', 'c:ㅎ'],
            cols: ['v:ㅏ', 'v:ㅓ', 'v:ㅗ', 'v:ㅜ', 'v:ㅡ', 'v:ㅣ', 'v:ㅑ', 'v:ㅕ', 'v:ㅛ', 'v:ㅠ']
          }
        }
      },
      {
        id: 'with-batchim', name: 'Level 6 · syllables + common batchim',
        selection: {
          syllables: {
            rows: ['c:ㄱ', 'c:ㄴ', 'c:ㄷ', 'c:ㄹ', 'c:ㅁ', 'c:ㅂ', 'c:ㅅ', 'c:ㅇ', 'c:ㅈ', 'c:ㅎ'],
            cols: ['v:ㅏ', 'v:ㅓ', 'v:ㅗ', 'v:ㅜ', 'v:ㅡ', 'v:ㅣ']
          },
          batchim: {
            rows: ['f:ㄱ', 'f:ㄴ', 'f:ㄹ', 'f:ㅁ', 'f:ㅂ', 'f:ㅇ'],
            cols: ['b:ga', 'b:neo', 'b:do', 'b:mu', 'b:si', 'b:je']
          }
        }
      }
    ],
    defaultSelection: { jamo: { rows: ['c-plain-1', 'v-basic'] } }
  };

  // Exposed for the self-check in tools/check-data.js
  global.HANGUL_INTERNALS = { compose: compose, combine: combine, ONSET: ONSET, VOWEL: VOWEL, CODA: CODA };
})(this);
