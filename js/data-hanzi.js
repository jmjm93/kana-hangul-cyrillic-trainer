(function (global) {
  'use strict';

  // Canonical form keeps ü distinct from u, including when its tone is removed.
  function normalizePinyin(text, accurate) {
    var value = String(text).trim().toLowerCase().replace(/u:/g, 'ü').replace(/v/g, 'ü').normalize('NFD');
    var tone = '', base = '';
    var tones = { '\u0304': '1', '\u0301': '2', '\u030c': '3', '\u0300': '4' };
    for (var i = 0; i < value.length; i++) {
      if (tones[value[i]]) tone += tones[value[i]];
      else base += value[i];
    }
    base = base.normalize('NFC');
    var number = /([0-5])$/.exec(base);
    if (number) {
      // A tone mark plus a number is malformed, even if both agree.
      if (tone) return '!invalid';
      tone = number[1] === '0' ? '5' : number[1];
      base = base.slice(0, -1);
    }
    if (!/^[a-züê]+$/.test(base) || tone.length > 1) return '!invalid';
    return base + (accurate ? (tone || '5') : '');
  }

  var charts = global.HSK_CHARACTERS.map(function (entries, index) {
    var level = index === 6 ? '7–9' : String(index + 1);
    var rows = [];
    for (var i = 0; i < entries.length; i += 20) {
      rows.push({ id: 'group' + (i / 20), label: (i + 1) + '–' + Math.min(i + 20, entries.length), entries: entries.slice(i, i + 20) });
    }
    return {
      id: 'hsk' + (index + 1), type: 'list', title: 'HSK ' + level,
      hint: entries.length + ' new simplified characters. Any listed dictionary reading is accepted.',
      rows: rows,
      cellChar: function (entry) { return entry[0]; },
      itemsFor: function (entry) {
        return [{ id: 'zh:' + entry[0], char: entry[0], answers: entry[1], note: 'HSK ' + level + ' · readings: ' + entry[1].join(', ') }];
      }
    };
  });
  function upTo(n) {
    var selection = {};
    charts.forEach(function (chart, i) {
      selection[chart.id] = { rows: i < n ? chart.rows.map(function (row) { return row.id; }) : [] };
    });
    return selection;
  }
  global.ALPHABET_HANZI = {
    id: 'hanzi', name: '汉字 Hanzi', label: 'Hanzi',
    fontStack: '"Microsoft YaHei", "Noto Sans SC", sans-serif',
    inputHint: 'pinyin', options: ['pinyinAccurate'], charts: charts,
    normalizeAnswer: normalizePinyin,
    presets: charts.map(function (chart, i) {
      return { id: chart.id, name: 'HSK 1–' + (i === 6 ? '9' : i + 1), selection: upTo(i + 1) };
    }),
    defaultSelection: upTo(1)
  };
  global.HANZI_INTERNALS = { normalizePinyin: normalizePinyin };
})(this);
