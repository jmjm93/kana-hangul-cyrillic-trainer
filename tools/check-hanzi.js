'use strict';
var assert = require('assert');
var fs = require('fs');
var vm = require('vm');
var path = require('path');
var context = {};
vm.createContext(context);
['hanzi-characters.js', 'data-hanzi.js'].forEach(function (file) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), context);
});
var alpha = context.ALPHABET_HANZI;
var norm = context.HANZI_INTERNALS.normalizePinyin;
assert.deepStrictEqual(Array.from(context.HSK_CHARACTERS, function (l) { return l.length; }), [300, 300, 300, 300, 300, 300, 1200]);
var ids = new Set();
alpha.charts.forEach(function (chart) {
  chart.rows.forEach(function (row) {
    row.entries.forEach(function (entry) {
      var item = chart.itemsFor(entry)[0];
      assert(!ids.has(item.id));
      ids.add(item.id);
      item.answers.forEach(function (answer) {
        assert.notStrictEqual(norm(answer, true), '!invalid', item.char + ': ' + answer);
      });
    });
  });
});
assert.strictEqual(ids.size, 3000);
[['nǐ', 'ni3'], ['NǏ', 'ni3'], ['ni\u030c', 'ni3'], ['lǜ', 'lv4'], ['lǜ', 'lu:4'], ['lü', 'lv5'], ['ma', 'ma0']].forEach(function (pair) {
  assert.strictEqual(norm(pair[0], true), norm(pair[1], true));
});
assert.notStrictEqual(norm('ni', true), norm('nǐ', true));
assert.notStrictEqual(norm('ni2', true), norm('nǐ', true));
assert.notStrictEqual(norm('lu4', true), norm('lǜ', true));
['ni', 'nǐ', 'ni2', 'NI3', 'ni\u030c'].forEach(function (value) { assert.strictEqual(norm(value, false), 'ni'); });
['ni33', 'ni3x', 'nǐ3', 'ni!', 'n i'].forEach(function (value) { assert.strictEqual(norm(value, true), '!invalid'); });
alpha.presets.forEach(function (preset, i) {
  var count = 0;
  alpha.charts.forEach(function (chart) {
    chart.rows.forEach(function (row) {
      if (preset.selection[chart.id].rows.indexOf(row.id) !== -1) count += row.entries.length;
    });
  });
  assert.strictEqual(count, i === 6 ? 3000 : (i + 1) * 300);
});
console.log('Hanzi checks passed: 3,000 unique characters, level presets, readings and tone modes.');

// Exercise the actual app event handlers, including saved settings and scoring.
var elements = {};
function element(id) {
  return elements[id] || (elements[id] = {
    value: '', style: { setProperty: function () {} },
    classList: { add: function () {}, remove: function () {}, toggle: function () {} },
    handlers: {}, addEventListener: function (name, handler) { this.handlers[name] = handler; },
    focus: function () {}
  });
}
var saved;
context.document = {
  getElementById: element, body: element('body'), addEventListener: function () {}
};
context.window = context;
context.addEventListener = function () {};
context.setTimeout = function () { return 1; };
context.clearTimeout = function () {};
context.localStorage = {
  getItem: function () { return null; },
  setItem: function (key, value) { saved = JSON.parse(value); }
};
['data-hangul.js', 'data-cyrillic.js', 'data-kana.js', 'app.js'].forEach(function (file) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), context);
});
function target(attributes) { return { getAttribute: function (key) { return attributes[key] || null; } }; }
element('tabs').handlers.click({ target: target({ 'data-alphabet': 'hanzi' }) });
assert.strictEqual(element('pool').textContent, '300 characters');
var setting = target({ 'data-option': 'pinyinAccurate' });
setting.checked = true;
element('settings').handlers.change({ target: setting });
assert(element('answer').placeholder.includes('ni3'));
function reading() {
  var char = element('prompt').textContent;
  return context.HSK_CHARACTERS.flat().find(function (entry) { return entry[0] === char; })[1][0];
}
element('answer').value = reading();
element('answer-form').handlers.submit({ preventDefault: function () {} });
assert.strictEqual(element('score').textContent, '1/1');
setting.checked = false;
element('settings').handlers.change({ target: setting });
element('answer').value = norm(reading(), false);
element('answer-form').handlers.submit({ preventDefault: function () {} });
assert.strictEqual(element('score').textContent, '2/2');
// Reach 水 in the shuffled HSK 1 bag, then type through the real input handler.
for (var attempts = 0; element('prompt').textContent !== '水' && attempts < 300; attempts++) {
  element('answer').value = reading();
  element('answer-form').handlers.submit({ preventDefault: function () {} });
}
assert.strictEqual(element('prompt').textContent, '水');
var before = element('score').textContent;
['s', 'sh', 'shu'].forEach(function (prefix) {
  element('answer').value = prefix;
  element('answer').handlers.input({ isComposing: false });
  assert.strictEqual(element('score').textContent, before);
});
element('answer').value = 'shui';
element('answer').handlers.input({ isComposing: true });
assert.strictEqual(element('score').textContent, before);
element('answer').handlers.input({ isComposing: false });
var expected = Number(before.split('/')[0]) + 1;
assert.strictEqual(element('score').textContent, expected + '/' + expected);
assert.strictEqual(element('answer').value, '');
element('presets').handlers.click({ target: target({ 'data-preset': 'hsk7' }) });
assert.strictEqual(element('pool').textContent, '3000 characters');
assert(saved.progress.hanzi);
// Short valid readings must auto-submit even when another reading extends them.
[['度', 'du'], ['路', 'lu']].forEach(function (pair) {
  for (var attempts = 0; element('prompt').textContent !== pair[0] && attempts < 3000; attempts++) {
    element('answer').value = reading();
    element('answer-form').handlers.submit({ preventDefault: function () {} });
  }
  assert.strictEqual(element('prompt').textContent, pair[0]);
  var before = element('score').textContent;
  element('answer').value = pair[1].slice(0, 1);
  element('answer').handlers.input({ isComposing: false });
  assert.strictEqual(element('score').textContent, before);
  element('answer').value = pair[1];
  element('answer').handlers.input({ isComposing: false });
  var expected = Number(before.split('/')[0]) + 1;
  assert.strictEqual(element('score').textContent, expected + '/' + expected, pair[0] + ' should auto-submit');
  assert.strictEqual(element('answer').value, '');
});
console.log('App checks passed: Chinese tab, tone setting, both scoring modes and HSK presets.');
