/* Japanese kana deck data: hiragana, katakana and both sets of yōon combinations,
   laid out like the gojūon table the original trainer used (transposed here, so the
   consonant series are rows and the vowels are columns).
   Romanization is Hepburn; wāpuro spellings (si, tu, hu, sya) are accepted as aliases. */
(function (global) {
  'use strict';

  var VOWELS = ['a', 'i', 'u', 'e', 'o', 'n'];

  // series id, hiragana row, katakana row, romanizations — index order a i u e o n,
  // null wherever the table has a hole.
  var N = null;
  var GOJUON = [
    ['a', ['あ', 'い', 'う', 'え', 'お', N], ['ア', 'イ', 'ウ', 'エ', 'オ', N],
      [['a'], ['i'], ['u'], ['e'], ['o'], N]],
    ['k', ['か', 'き', 'く', 'け', 'こ', N], ['カ', 'キ', 'ク', 'ケ', 'コ', N],
      [['ka'], ['ki'], ['ku'], ['ke'], ['ko'], N]],
    ['s', ['さ', 'し', 'す', 'せ', 'そ', N], ['サ', 'シ', 'ス', 'セ', 'ソ', N],
      [['sa'], ['shi', 'si'], ['su'], ['se'], ['so'], N]],
    ['t', ['た', 'ち', 'つ', 'て', 'と', N], ['タ', 'チ', 'ツ', 'テ', 'ト', N],
      [['ta'], ['chi', 'ti'], ['tsu', 'tu'], ['te'], ['to'], N]],
    ['n', ['な', 'に', 'ぬ', 'ね', 'の', N], ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ', N],
      [['na'], ['ni'], ['nu'], ['ne'], ['no'], N]],
    ['h', ['は', 'ひ', 'ふ', 'へ', 'ほ', N], ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ', N],
      [['ha'], ['hi'], ['fu', 'hu'], ['he'], ['ho'], N]],
    ['m', ['ま', 'み', 'む', 'め', 'も', N], ['マ', 'ミ', 'ム', 'メ', 'モ', N],
      [['ma'], ['mi'], ['mu'], ['me'], ['mo'], N]],
    ['y', ['や', N, 'ゆ', N, 'よ', N], ['ヤ', N, 'ユ', N, 'ヨ', N],
      [['ya'], N, ['yu'], N, ['yo'], N]],
    ['r', ['ら', 'り', 'る', 'れ', 'ろ', N], ['ラ', 'リ', 'ル', 'レ', 'ロ', N],
      [['ra'], ['ri'], ['ru'], ['re'], ['ro'], N]],
    ['w', ['わ', N, N, N, 'を', N], ['ワ', N, N, N, 'ヲ', N],
      [['wa'], N, N, N, ['wo', 'o'], N]],
    ['nn', [N, N, N, N, N, 'ん'], [N, N, N, N, N, 'ン'],
      [N, N, N, N, N, ['n']]],
    ['g', ['が', 'ぎ', 'ぐ', 'げ', 'ご', N], ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ', N],
      [['ga'], ['gi'], ['gu'], ['ge'], ['go'], N]],
    ['z', ['ざ', 'じ', 'ず', 'ぜ', 'ぞ', N], ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ', N],
      [['za'], ['ji', 'zi'], ['zu'], ['ze'], ['zo'], N]],
    ['d', ['だ', 'ぢ', 'づ', 'で', 'ど', N], ['ダ', 'ヂ', 'ヅ', 'デ', 'ド', N],
      [['da'], ['ji', 'di'], ['zu', 'du'], ['de'], ['do'], N]],
    ['b', ['ば', 'び', 'ぶ', 'べ', 'ぼ', N], ['バ', 'ビ', 'ブ', 'ベ', 'ボ', N],
      [['ba'], ['bi'], ['bu'], ['be'], ['bo'], N]],
    ['p', ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ', N], ['パ', 'ピ', 'プ', 'ペ', 'ポ', N],
      [['pa'], ['pi'], ['pu'], ['pe'], ['po'], N]]
  ];

  var NOTES = {
    'し': 'shi, never "si"', 'シ': 'shi, never "si"',
    'ち': 'chi, never "ti"', 'チ': 'chi, never "ti"',
    'つ': 'tsu, never "tu"', 'ツ': 'tsu, never "tu"',
    'ふ': 'between "hu" and "fu"', 'フ': 'between "hu" and "fu"',
    'を': 'the topic particle — pronounced "o"', 'ヲ': 'pronounced "o", almost never used',
    'ん': 'the only kana with no vowel', 'ン': 'the only kana with no vowel',
    'ぢ': 'rare — same sound as じ', 'ヂ': 'rare — same sound as ジ',
    'づ': 'rare — same sound as ず', 'ヅ': 'rare — same sound as ズ'
  };

  // base id, hiragana base, katakana base, romanizations for small ya/yu/yo
  var YOON = [
    ['k', 'き', 'キ', [['kya'], ['kyu'], ['kyo']]],
    ['s', 'し', 'シ', [['sha', 'sya'], ['shu', 'syu'], ['sho', 'syo']]],
    ['t', 'ち', 'チ', [['cha', 'tya'], ['chu', 'tyu'], ['cho', 'tyo']]],
    ['n', 'に', 'ニ', [['nya'], ['nyu'], ['nyo']]],
    ['h', 'ひ', 'ヒ', [['hya'], ['hyu'], ['hyo']]],
    ['m', 'み', 'ミ', [['mya'], ['myu'], ['myo']]],
    ['r', 'り', 'リ', [['rya'], ['ryu'], ['ryo']]],
    ['g', 'ぎ', 'ギ', [['gya'], ['gyu'], ['gyo']]],
    ['z', 'じ', 'ジ', [['ja', 'jya', 'zya'], ['ju', 'jyu', 'zyu'], ['jo', 'jyo', 'zyo']]],
    ['d', 'ぢ', 'ヂ', [['ja', 'dya'], ['ju', 'dyu'], ['jo', 'dyo']]],
    ['b', 'び', 'ビ', [['bya'], ['byu'], ['byo']]],
    ['p', 'ぴ', 'ピ', [['pya'], ['pyu'], ['pyo']]]
  ];

  var SMALL = { hiragana: ['ゃ', 'ゅ', 'ょ'], katakana: ['ャ', 'ュ', 'ョ'] };

  function seriesLabel(row, script) {
    var glyphs = script === 'katakana' ? row[2] : row[1];
    for (var i = 0; i < glyphs.length; i++) if (glyphs[i]) return glyphs[i];
    return '?';
  }

  function gojuonChart(script) {
    var glyphIndex = script === 'katakana' ? 2 : 1;
    return {
      id: script,
      type: 'grid',
      title: script === 'katakana' ? 'Katakana' : 'Hiragana',
      hint: script === 'katakana'
        ? 'Same sounds as hiragana, used for loanwords, names and emphasis.'
        : 'The gojūon table. Rows are consonants, columns are vowels — ん sits in its own column.',
      rows: GOJUON.map(function (row) {
        return { id: 's:' + row[0], label: seriesLabel(row, script), series: row };
      }),
      cols: VOWELS.map(function (vowel, index) {
        return { id: 'v:' + vowel, label: vowel === 'n' ? '—' : vowel, index: index };
      }),
      cellChar: function (r, c) { return r.series[glyphIndex][c.index] || ''; },
      itemsFor: function (r, c) {
        var char = r.series[glyphIndex][c.index];
        var answers = r.series[3][c.index];
        if (!char || !answers) return [];
        return [{ id: 'kana:' + char, char: char, answers: answers, note: NOTES[char] || '' }];
      }
    };
  }

  function yoonChart(script) {
    var baseIndex = script === 'katakana' ? 2 : 1;
    var smalls = SMALL[script];
    return {
      id: script + '-yoon',
      type: 'grid',
      title: (script === 'katakana' ? 'Katakana' : 'Hiragana') + ' combinations',
      hint: 'An i-row kana followed by a small ya, yu or yo — read as one syllable.',
      rows: YOON.map(function (base) {
        return { id: 'y:' + base[0], label: base[baseIndex], base: base };
      }),
      cols: smalls.map(function (small, index) {
        return { id: 'y:' + small, label: small, index: index };
      }),
      cellChar: function (r, c) { return r.base[baseIndex] + smalls[c.index]; },
      itemsFor: function (r, c) {
        var char = r.base[baseIndex] + smalls[c.index];
        return [{
          id: 'kana:' + char,
          char: char,
          answers: r.base[3][c.index],
          note: r.base[baseIndex] + ' + small ' + smalls[c.index]
        }];
      }
    };
  }

  var ALL_VOWELS = VOWELS.map(function (v) { return 'v:' + v; });
  var BASIC_ROWS = ['a', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'nn'].map(function (s) { return 's:' + s; });
  var VOICED_ROWS = BASIC_ROWS.concat(['g', 'z', 'd', 'b', 'p'].map(function (s) { return 's:' + s; }));
  var ALL_YOON_ROWS = YOON.map(function (b) { return 'y:' + b[0]; });

  function gojuon(script, rows) {
    var selection = {};
    selection[script] = { rows: rows, cols: ALL_VOWELS };
    return selection;
  }

  function withYoon(script, rows) {
    var selection = gojuon(script, rows);
    selection[script + '-yoon'] = { rows: ALL_YOON_ROWS, cols: SMALL[script].map(function (s) { return 'y:' + s; }) };
    return selection;
  }

  function merge() {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
      var source = arguments[i];
      Object.keys(source).forEach(function (key) { out[key] = source[key]; });
    }
    return out;
  }

  global.ALPHABET_KANA = {
    id: 'kana',
    name: 'かな Kana',
    label: 'Kana',
    fontStack: '"Yu Gothic", "Hiragino Kaku Gothic ProN", Meiryo, "MS PGothic", "Noto Sans JP", sans-serif',
    inputHint: 'romaji',
    charts: [gojuonChart('hiragana'), yoonChart('hiragana'), gojuonChart('katakana'), yoonChart('katakana')],
    presets: [
      { id: 'h1', name: 'Level 1 · あ and か rows', selection: gojuon('hiragana', ['s:a', 's:k']) },
      { id: 'h2', name: 'Level 2 · through な', selection: gojuon('hiragana', ['s:a', 's:k', 's:s', 's:t', 's:n']) },
      { id: 'h3', name: 'Level 3 · all 46 hiragana', selection: gojuon('hiragana', BASIC_ROWS) },
      { id: 'h4', name: 'Level 4 · + dakuten', selection: gojuon('hiragana', VOICED_ROWS) },
      { id: 'h5', name: 'Level 5 · + combinations', selection: withYoon('hiragana', VOICED_ROWS) },
      { id: 'k1', name: 'Katakana · all 46', selection: gojuon('katakana', BASIC_ROWS) },
      { id: 'k2', name: 'Katakana · everything', selection: withYoon('katakana', VOICED_ROWS) },
      {
        id: 'both', name: 'Both scripts · everything',
        selection: merge(withYoon('hiragana', VOICED_ROWS), withYoon('katakana', VOICED_ROWS))
      }
    ],
    defaultSelection: gojuon('hiragana', ['s:a', 's:k'])
  };
})(this);
