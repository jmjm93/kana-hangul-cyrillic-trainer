/* Data self-check: node tools/check-data.js
   Verifies Hangul composition, item integrity, and that no character's accepted
   spellings quietly swallow another character's primary answer. */
'use strict';

var hangul = require('../js/data-hangul.js');
var cyrillic = require('../js/data-cyrillic.js');
var kana = require('../js/data-kana.js');

var HANGUL = hangul.ALPHABET_HANGUL;
var CYRILLIC = cyrillic.ALPHABET_CYRILLIC;
var KANA = kana.ALPHABET_KANA;
var compose = hangul.HANGUL_INTERNALS.compose;

var failures = 0;
var notes = [];

function check(label, condition, detail) {
  if (condition) return;
  failures++;
  console.log('FAIL  ' + label + (detail ? ' — ' + detail : ''));
}

// 1. Composition against known syllables.
[
  ['ㄱ', 'ㅏ', '', '가'], ['ㅎ', 'ㅏ', 'ㄴ', '한'], ['ㄱ', 'ㅜ', 'ㄱ', '국'],
  ['ㅇ', 'ㅏ', 'ㄴ', '안'], ['ㄴ', 'ㅕ', 'ㅇ', '녕'], ['ㅁ', 'ㅏ', 'ㄹ', '말'],
  ['ㅆ', 'ㅣ', '', '씨'], ['ㅈ', 'ㅗ', 'ㅎ', '좋'], ['ㅎ', 'ㅣ', '', '히']
].forEach(function (t) {
  check('compose ' + t[0] + t[1] + t[2], compose(t[0], t[1], t[2]) === t[3],
    'got ' + compose(t[0], t[1], t[2]) + ' want ' + t[3]);
});

// 2. Full deck per alphabet, everything selected.
function fullDeck(alpha, options) {
  var deck = [];
  alpha.charts.forEach(function (chart) {
    if (chart.type === 'list') {
      chart.rows.forEach(function (row) {
        row.entries.forEach(function (entry) {
          chart.itemsFor(entry, options).forEach(function (i) { deck.push(i); });
        });
      });
    } else {
      chart.rows.forEach(function (row) {
        chart.cols.forEach(function (col) {
          chart.itemsFor(row, col, options).forEach(function (i) { deck.push(i); });
        });
      });
    }
  });
  return deck;
}

function normalize(text) {
  return String(text).replace(/’/g, "'").trim().toLowerCase().replace(/\s+/g, ' ');
}

function audit(name, alpha, options) {
  var deck = fullDeck(alpha, options);
  console.log('\n' + name + ': ' + deck.length + ' characters');

  var ids = {};
  deck.forEach(function (item) {
    check(name + ' duplicate id ' + item.id, !ids[item.id]);
    ids[item.id] = true;
    check(name + ' ' + item.char + ' has answers', item.answers.length > 0);
    check(name + ' ' + item.char + ' primary answer non-empty', !!normalize(item.answers[0]));
    item.answers.forEach(function (a) {
      check(name + ' ' + item.char + ' answer not blank', !!normalize(a), JSON.stringify(item.answers));
    });
  });

  // Primaries shared by several characters: the trainer cannot tell them apart.
  var byPrimary = {};
  deck.forEach(function (item) {
    var key = normalize(item.answers[0]);
    (byPrimary[key] = byPrimary[key] || []).push(item.char);
  });
  var shared = Object.keys(byPrimary).filter(function (k) { return byPrimary[k].length > 1; });
  if (shared.length) {
    notes.push(name + ': ' + shared.length + ' answer(s) shared by several characters — ' +
      shared.map(function (k) { return k + ' = ' + byPrimary[k].join('/'); }).join(', '));
  }

  // An alias must not equal another character's primary answer unless that primary is
  // already shared (the RR final-consonant merges are legitimately ambiguous).
  var primaries = {};
  deck.forEach(function (item) { primaries[normalize(item.answers[0])] = item.char; });
  var leaks = [];
  deck.forEach(function (item) {
    var mine = normalize(item.answers[0]);
    item.answers.slice(1).forEach(function (alias) {
      var key = normalize(alias);
      if (key === mine) return;
      if (primaries[key] && primaries[key] !== item.char) {
        leaks.push(item.char + ' accepts "' + key + '" which is ' + primaries[key] + "'s answer");
      }
    });
  });
  if (leaks.length) {
    notes.push(name + ': ' + leaks.length + ' alias overlap(s) — ' + leaks.slice(0, 10).join('; ') +
      (leaks.length > 10 ? '; …' : ''));
  }

  // Answers that prefix a longer answer of the same character block auto-submit.
  var prefixed = [];
  deck.forEach(function (item) {
    item.answers.forEach(function (a) {
      var short = normalize(a);
      item.answers.forEach(function (b) {
        var long = normalize(b);
        if (long !== short && long.indexOf(short) === 0) prefixed.push(item.char + ' "' + short + '" ⊂ "' + long + '"');
      });
    });
  });
  if (prefixed.length) {
    notes.push(name + ': ' + prefixed.length + ' answer(s) prefix a longer one (enter still works) — ' +
      prefixed.slice(0, 6).join('; ') + (prefixed.length > 6 ? '; …' : ''));
  }

  return deck;
}

var hDeck = audit('hangul', HANGUL, { letterCase: 'both' });
var cDeck = audit('cyrillic', CYRILLIC, { letterCase: 'both' });
var kDeck = audit('kana', KANA, {});

// 3. Spot-check romanizations against known-correct RR spellings.
function answersFor(deck, char) {
  var hit = deck.filter(function (i) { return i.char === char; })[0];
  return hit ? hit.answers : null;
}
[
  ['가', 'ga'], ['녀', 'nyeo'], ['쓰', 'sseu'], ['의', 'ui'], ['왜', 'wae'],
  ['각', 'gak'], ['간', 'gan'], ['갈', 'gal'], ['감', 'gam'], ['강', 'gang'],
  ['시', 'si'], ['제', 'je'], ['무', 'mu'], ['도', 'do'], ['너', 'neo']
].forEach(function (t) {
  var answers = answersFor(hDeck, t[0]);
  check('hangul ' + t[0] + ' primary', answers && answers[0] === t[1],
    answers ? 'got ' + answers[0] + ' want ' + t[1] : 'missing from deck');
});
[['А', 'a'], ['ж', 'zh'], ['щ', 'shch'], ['Э', 'e'], ['ю', 'yu'], ['ь', "'"], ['ъ', '"'],
  ['ы', 'y']].forEach(function (t) {
  var answers = answersFor(cDeck, t[0]);
  check('cyrillic ' + t[0] + ' primary', answers && answers[0] === t[1],
    answers ? 'got ' + answers[0] + ' want ' + t[1] : 'missing from deck');
});

[
  ['あ', 'a'], ['し', 'shi'], ['つ', 'tsu'], ['ふ', 'fu'], ['ん', 'n'], ['を', 'wo'],
  ['ぢ', 'ji'], ['づ', 'zu'], ['きゃ', 'kya'], ['しゃ', 'sha'], ['ちょ', 'cho'], ['じゅ', 'ju'],
  ['ア', 'a'], ['ツ', 'tsu'], ['ン', 'n'], ['ヲ', 'wo'], ['シャ', 'sha'], ['ピョ', 'pyo']
].forEach(function (t) {
  var answers = answersFor(kDeck, t[0]);
  check('kana ' + t[0] + ' primary', answers && answers[0] === t[1],
    answers ? 'got ' + answers[0] + ' want ' + t[1] : 'missing from deck');
});

// Table holes must produce no items at all.
var kanaChars = kDeck.map(function (i) { return i.char; });
['やい', 'ゆえ', 'わい', 'わう', 'われ'].forEach(function (impossible) {
  check('kana has no ' + impossible, kanaChars.indexOf(impossible) === -1);
});
check('kana ん is present exactly once',
  kanaChars.filter(function (c) { return c === 'ん'; }).length === 1);

// Deck sizes: 46 basic kana per script, 71 with dakuten, 36 combinations.
function deckFromSelection(alpha, selection, options) {
  var deck = [];
  alpha.charts.forEach(function (chart) {
    var sel = selection[chart.id];
    if (!sel) return;
    chart.rows.forEach(function (row) {
      if ((sel.rows || []).indexOf(row.id) === -1) return;
      (chart.cols || []).forEach(function (col) {
        if ((sel.cols || []).indexOf(col.id) === -1) return;
        chart.itemsFor(row, col, options).forEach(function (i) { deck.push(i); });
      });
    });
  });
  return deck;
}
function presetSize(id) {
  var preset = KANA.presets.filter(function (p) { return p.id === id; })[0];
  return deckFromSelection(KANA, preset.selection, {}).length;
}
check('kana level 1 = 10', presetSize('h1') === 10, String(presetSize('h1')));
check('kana level 3 = 46 basic hiragana', presetSize('h3') === 46, String(presetSize('h3')));
check('kana level 4 = 71 with dakuten', presetSize('h4') === 71, String(presetSize('h4')));
check('kana level 5 = 107 with combinations', presetSize('h5') === 107, String(presetSize('h5')));
check('kana katakana basic = 46', presetSize('k1') === 46, String(presetSize('k1')));
check('kana both scripts = 214', presetSize('both') === 214, String(presetSize('both')));
check('kana full deck = 214', kDeck.length === 214, String(kDeck.length));

// 4. Presets must reference real charts, rows and columns.
[['hangul', HANGUL], ['cyrillic', CYRILLIC], ['kana', KANA]].forEach(function (pair) {
  var alpha = pair[1];
  alpha.presets.concat([{ id: 'default', name: 'default', selection: alpha.defaultSelection }])
    .forEach(function (preset) {
      Object.keys(preset.selection).forEach(function (chartId) {
        var chart = alpha.charts.filter(function (c) { return c.id === chartId; })[0];
        check(pair[0] + ' preset ' + preset.id + ' chart ' + chartId, !!chart);
        if (!chart) return;
        (preset.selection[chartId].rows || []).forEach(function (id) {
          check(pair[0] + ' preset ' + preset.id + ' row ' + id,
            chart.rows.some(function (r) { return r.id === id; }));
        });
        (preset.selection[chartId].cols || []).forEach(function (id) {
          check(pair[0] + ' preset ' + preset.id + ' col ' + id,
            (chart.cols || []).some(function (c) { return c.id === id; }));
        });
      });
    });
});

// 5. Case option produces the expected counts.
check('cyrillic lower-only = 33', fullDeck(CYRILLIC, { letterCase: 'lower' }).length === 33);
check('cyrillic upper-only = 33', fullDeck(CYRILLIC, { letterCase: 'upper' }).length === 33);
check('cyrillic both = 66', cDeck.length === 66);

console.log('');
notes.forEach(function (n) { console.log('note  ' + n); });
console.log('\n' + (failures ? failures + ' failure(s)' : 'all checks passed'));
process.exit(failures ? 1 : 0);
