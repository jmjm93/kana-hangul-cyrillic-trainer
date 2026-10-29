/* Hangul & Cyrillic recognition trainer.
   No build step, no modules, no dependencies — open index.html directly.
   Progress and selection live in localStorage (silently skipped if unavailable). */
(function () {
  'use strict';

  var ALPHABETS = {
    hangul: window.ALPHABET_HANGUL,
    cyrillic: window.ALPHABET_CYRILLIC,
    kana: window.ALPHABET_KANA,
    hanzi: window.ALPHABET_HANZI
  };
  var ORDER = ['hangul', 'cyrillic', 'kana', 'hanzi'];
  var STORE_KEY = 'hcr-trainer-v1';

  var el = {
    title: document.getElementById('title'),
    tabs: document.getElementById('tabs'),
    prompt: document.getElementById('prompt'),
    form: document.getElementById('answer-form'),
    answer: document.getElementById('answer'),
    reveal: document.getElementById('reveal'),
    score: document.getElementById('score'),
    accuracy: document.getElementById('accuracy'),
    streak: document.getElementById('streak'),
    pool: document.getElementById('pool'),
    toggleOptions: document.getElementById('toggle-options'),
    options: document.getElementById('options'),
    presets: document.getElementById('presets'),
    settings: document.getElementById('settings'),
    charts: document.getElementById('charts'),
    weak: document.getElementById('weak'),
    resetStats: document.getElementById('reset-stats')
  };

  // --- state ------------------------------------------------------------------

  function freshProgress(alphabet) {
    return {
      selection: clone(alphabet.defaultSelection),
      options: { autoSubmit: true, drill: true, letterCase: 'both', pinyinAccurate: false },
      stats: { correct: 0, total: 0, best: 0 },
      items: {}
    };
  }

  var state = {
    current: 'hangul',
    optionsOpen: false,
    progress: {}
  };

  var run = {
    deck: [], signature: '', bag: [], review: [], sinceReview: 0,
    item: null, awaitingAck: false, streak: 0
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function load() {
    var raw = null;
    try { raw = window.localStorage.getItem(STORE_KEY); } catch (e) { /* file:// or blocked */ }
    var saved = null;
    if (raw) { try { saved = JSON.parse(raw); } catch (e) { saved = null; } }
    if (saved && ALPHABETS[saved.current]) state.current = saved.current;
    if (saved && saved.optionsOpen) state.optionsOpen = true;
    ORDER.forEach(function (id) {
      var base = freshProgress(ALPHABETS[id]);
      var got = saved && saved.progress && saved.progress[id];
      if (got) {
        if (got.selection) base.selection = got.selection;
        if (got.options) Object.keys(got.options).forEach(function (k) { base.options[k] = got.options[k]; });
        if (got.stats) base.stats = got.stats;
        if (got.items) base.items = got.items;
      }
      state.progress[id] = base;
    });
  }

  // Throttled, not debounced: a long answering streak must not defer the write forever.
  var saveTimer = null;
  var lastSave = 0;

  function writeNow() {
    lastSave = Date.now();
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function save() {
    if (saveTimer) return;
    var wait = 250 - (Date.now() - lastSave);
    if (wait <= 0) { writeNow(); return; }
    saveTimer = window.setTimeout(function () { saveTimer = null; writeNow(); }, wait);
  }

  function flushSave() {
    if (saveTimer) { window.clearTimeout(saveTimer); saveTimer = null; }
    writeNow();
  }

  window.addEventListener('pagehide', flushSave);
  window.addEventListener('beforeunload', flushSave);

  function alphabet() { return ALPHABETS[state.current]; }
  function progress() { return state.progress[state.current]; }
  function options() { return progress().options; }

  function selectionFor(chartId) {
    var sel = progress().selection;
    if (!sel[chartId]) sel[chartId] = {};
    if (!sel[chartId].rows) sel[chartId].rows = [];
    if (!sel[chartId].cols) sel[chartId].cols = [];
    return sel[chartId];
  }

  function isOn(chartId, kind, id) {
    return selectionFor(chartId)[kind].indexOf(id) !== -1;
  }

  function setOn(chartId, kind, id, on) {
    var list = selectionFor(chartId)[kind];
    var at = list.indexOf(id);
    if (on && at === -1) list.push(id);
    if (!on && at !== -1) list.splice(at, 1);
  }

  // --- deck -------------------------------------------------------------------

  function buildDeck() {
    var deck = [];
    var opts = options();
    alphabet().charts.forEach(function (chart) {
      var sel = selectionFor(chart.id);
      if (chart.type === 'list') {
        chart.rows.forEach(function (row) {
          if (sel.rows.indexOf(row.id) === -1) return;
          row.entries.forEach(function (entry) {
            chart.itemsFor(entry, opts).forEach(function (item) { deck.push(item); });
          });
        });
      } else {
        chart.rows.forEach(function (row) {
          if (sel.rows.indexOf(row.id) === -1) return;
          chart.cols.forEach(function (col) {
            if (sel.cols.indexOf(col.id) === -1) return;
            chart.itemsFor(row, col, opts).forEach(function (item) { deck.push(item); });
          });
        });
      }
    });
    return deck;
  }

  function syncDeck() {
    var deck = buildDeck();
    var signature = deck.map(function (i) { return i.id; }).join('|');
    if (signature === run.signature) return false;
    run.deck = deck;
    run.signature = signature;
    run.bag = [];
    run.review = [];
    run.sinceReview = 0;
    var stillValid = run.item && signature.indexOf(run.item.id) !== -1 &&
      deck.some(function (i) { return i.id === run.item.id; });
    if (!stillValid) { run.item = null; run.awaitingAck = false; }
    return true;
  }

  function refillBag() {
    var bag = run.deck.slice();
    for (var i = bag.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var swap = bag[i]; bag[i] = bag[j]; bag[j] = swap;
    }
    // Avoid handing out the same character twice in a row across a bag boundary.
    if (bag.length > 1 && run.item && bag[0].id === run.item.id) {
      bag.push(bag.shift());
    }
    run.bag = bag;
  }

  function drawFromBag() {
    if (!run.bag.length) refillBag();
    run.sinceReview += 1;
    return run.bag.shift();
  }

  function nextQuestion() {
    if (!run.deck.length) {
      run.item = null;
      render();
      return;
    }
    var previous = run.item;
    var item;
    // Review items are interleaved rather than pushed back into the bag: putting them back
    // would keep the bag from ever draining, and characters near its end would never come up.
    if (run.review.length && run.sinceReview >= 2) {
      item = run.review.shift();
      run.sinceReview = 0;
      if (previous && item.id === previous.id && run.deck.length > 1) {
        run.review.push(item);
        item = drawFromBag();
      }
    } else {
      item = drawFromBag();
      if (previous && item.id === previous.id && run.deck.length > 1) {
        var swap = run.bag.length ? run.bag.shift() : run.review.shift();
        if (swap) { run.bag.push(item); item = swap; }
      }
    }
    run.item = item;
    run.awaitingAck = false;
    el.answer.value = '';
    render();
    el.answer.focus();
  }

  // A missed character comes back within the next few questions. The queue is capped so a
  // bad run cannot crowd out the rest of the selection.
  var REVIEW_CAP = 3;
  function requeueMiss(item) {
    if (!options().drill || run.deck.length < 4) return;
    var pending = run.review.some(function (i) { return i.id === item.id; });
    if (pending) return;
    run.review.push(item);
    if (run.review.length > REVIEW_CAP) run.review.shift();
  }

  // --- answering --------------------------------------------------------------

  function normalize(text) {
    return String(text)
      .replace(/’/g, "'")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function accepts(item, text) {
    var typed = normalizeAnswer(text);
    if (!typed) return false;
    for (var i = 0; i < item.answers.length; i++) {
      if (normalizeAnswer(item.answers[i]) === typed) return true;
    }
    return false;
  }

  // True when no accepted answer continues past what was typed, so it is safe to submit.
  function isComplete(item, text) {
    // Any valid Hanzi reading is complete, even when another reading extends it
    // (e.g. du/duo for 度 or lu/luo for 路).
    if (state.current === 'hanzi') return true;
    var typed = normalizeAnswer(text);
    for (var i = 0; i < item.answers.length; i++) {
      var answer = normalizeAnswer(item.answers[i]);
      if (answer !== typed && answer.indexOf(typed) === 0) return false;
    }
    return true;
  }

  function normalizeAnswer(text) {
    return alphabet().normalizeAnswer
      ? alphabet().normalizeAnswer(text, options().pinyinAccurate)
      : normalize(text);
  }

  function itemStats(id) {
    var items = progress().items;
    if (!items[id]) items[id] = { a: 0, m: 0 };
    return items[id];
  }

  function submit() {
    if (!run.item) return;
    if (run.awaitingAck) { nextQuestion(); return; }

    var typed = el.answer.value;
    if (!normalize(typed)) return;

    var stats = progress().stats;
    var record = itemStats(run.item.id);
    stats.total += 1;
    record.a += 1;

    if (accepts(run.item, typed)) {
      stats.correct += 1;
      run.streak += 1;
      if (run.streak > stats.best) stats.best = run.streak;
      save();
      flash('ok');
      nextQuestion();
    } else {
      record.m += 1;
      run.streak = 0;
      run.awaitingAck = true;
      requeueMiss(run.item);
      save();
      el.answer.value = '';
      flash('bad');
      render();
      renderWeak();
    }
  }

  // A miss colours the character, which stays on screen. A hit colours the input box instead:
  // the character has already been replaced, and colouring it would mark the next one.
  var flashTimer = null;
  function flash(kind) {
    el.prompt.classList.remove('bad');
    el.answer.classList.remove('ok');
    void el.prompt.offsetWidth;
    if (kind === 'bad') el.prompt.classList.add('bad');
    else el.answer.classList.add('ok');
    if (flashTimer) window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(function () {
      el.prompt.classList.remove('bad');
      el.answer.classList.remove('ok');
    }, 320);
  }

  // --- rendering --------------------------------------------------------------

  function render() {
    var a = alphabet();
    var p = progress();
    document.body.style.setProperty('--char-font', a.fontStack);
    el.title.textContent = a.label.toLowerCase();
    el.answer.placeholder = a.inputHint;
    if (state.current === 'hanzi') {
      el.answer.placeholder = p.options.pinyinAccurate ? 'pinyin with tones: nǐ or ni3' : 'pinyin: ni (ü = v or u:)';
    }

    el.prompt.textContent = run.item ? run.item.char : '—';
    el.prompt.classList.toggle('empty', !run.item);

    if (run.awaitingAck && run.item) {
      var answer = run.item.answers[0] || '(no sound)';
      el.reveal.textContent = run.item.char + ' = ' + answer + (run.item.note ? '  (' + run.item.note + ')' : '');
      el.reveal.classList.add('shown');
    } else {
      el.reveal.innerHTML = '&nbsp;';
      el.reveal.classList.remove('shown');
    }

    el.score.textContent = p.stats.correct + '/' + p.stats.total;
    var pct = p.stats.total ? Math.round((p.stats.correct / p.stats.total) * 100) : 100;
    el.accuracy.textContent = pct + '%';
    el.streak.textContent = 'streak ' + run.streak + (p.stats.best ? ' (best ' + p.stats.best + ')' : '');
    el.pool.textContent = run.deck.length + (run.deck.length === 1 ? ' character' : ' characters');
    el.answer.disabled = !run.deck.length;
    if (!run.deck.length) el.pool.textContent = 'pick some characters below';
  }

  function renderTabs() {
    el.tabs.innerHTML = ORDER.map(function (id) {
      return '<button type="button" data-alphabet="' + id + '"' +
        (id === state.current ? ' class="on"' : '') + '>' + ALPHABETS[id].name + '</button>';
    }).join('');
  }

  function renderPresets() {
    el.presets.innerHTML = alphabet().presets.map(function (preset) {
      return '<button type="button" data-preset="' + preset.id + '">' + preset.name + '</button>';
    }).join('');
  }

  function renderSettings() {
    var opts = options();
    var html = '' +
      '<label><input type="checkbox" data-option="autoSubmit"' + (opts.autoSubmit ? ' checked' : '') + '>' +
      ' submit as soon as the answer is complete</label>' +
      '<label><input type="checkbox" data-option="drill"' + (opts.drill ? ' checked' : '') + '>' +
      ' show missed characters again a few questions later</label>';
    if ((alphabet().options || []).indexOf('letterCase') !== -1) {
      html += '<div class="radios">letter case:' +
        ['both', 'upper', 'lower'].map(function (mode) {
          return '<label><input type="radio" name="letterCase" data-case="' + mode + '"' +
            (opts.letterCase === mode ? ' checked' : '') + '> ' + mode + '</label>';
        }).join('') + '</div>';
    }
    if ((alphabet().options || []).indexOf('pinyinAccurate') !== -1) {
      html += '<label><input type="checkbox" data-option="pinyinAccurate"' + (opts.pinyinAccurate ? ' checked' : '') + '>' +
        ' pinyin accurate — require correct tones</label>' +
        '<p class="hint">Use tone marks (nǐ) or numbers (ni3). Neutral tone: no mark, 0 or 5. ' +
        'With accuracy off, tones are ignored. Type ü as ü, v or u:; plain u stays distinct. ' +
        'HSK 3.0 character lists; presets include all levels up to the selected level.</p>' +
        '<p class="hint">Place the tone number after the syllable: 1 = high and level (mā / ma1), ' +
        '2 = rising (má / ma2), 3 = dipping then rising (mǎ / ma3), ' +
        '4 = falling (mà / ma4).</p>';
    }
    el.settings.innerHTML = html;
  }

  // Quotes are escaped too: this output is used inside attribute values, and some answers and
  // tooltips are literally quote characters.
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderCharts() {
    var opts = options();
    el.charts.innerHTML = alphabet().charts.map(function (chart) {
      var sel = selectionFor(chart.id);
      var head = '<div class="block"><h2>' + chart.title + '</h2>' +
        '<p class="hint">' + chart.hint +
        ' <button type="button" class="link" data-all="' + chart.id + '">check all</button> | ' +
        '<button type="button" class="link" data-none="' + chart.id + '">uncheck all</button></p>';

      if (chart.type === 'list') {
        var rows = chart.rows.map(function (row) {
          var on = sel.rows.indexOf(row.id) !== -1;
          var cells = row.entries.map(function (entry) {
            var char = chart.cellChar ? chart.cellChar(entry, opts) : entry;
            var items = chart.itemsFor(entry, opts);
            var rom = items.length ? items[0].answers[0] : '';
            var help = items.length && items[0].help
              ? '<button type="button" class="help" data-tip="' + escapeHtml(items[0].help) +
                '" aria-label="' + escapeHtml(items[0].help) + '">?</button>'
              : '';
            return '<span class="cell"><b>' + escapeHtml(char) + '</b><i>' +
              escapeHtml(rom || '—') + help + '</i></span>';
          }).join('');
          return '<div class="listrow' + (on ? ' on' : '') + '">' +
            '<label class="rowlabel"><input type="checkbox" data-chart="' + chart.id +
            '" data-kind="rows" data-id="' + row.id + '"' + (on ? ' checked' : '') + '> ' +
            escapeHtml(row.label) + '</label>' +
            '<div class="cells">' + cells + '</div></div>';
        }).join('');
        return head + '<div class="listchart">' + rows + '</div></div>';
      }

      var header = '<tr><th class="corner"></th>' + chart.cols.map(function (col) {
        var on = sel.cols.indexOf(col.id) !== -1;
        return '<th' + (on ? ' class="on"' : '') + '><label><input type="checkbox" data-chart="' + chart.id +
          '" data-kind="cols" data-id="' + col.id + '"' + (on ? ' checked' : '') + '><span>' +
          escapeHtml(col.label) + '</span></label></th>';
      }).join('') + '</tr>';

      var body = chart.rows.map(function (row) {
        var rowOn = sel.rows.indexOf(row.id) !== -1;
        var cells = chart.cols.map(function (col) {
          var on = rowOn && sel.cols.indexOf(col.id) !== -1;
          var char = chart.cellChar(row, col);
          var items = chart.itemsFor(row, col, opts);
          var rom = items.length ? items[0].answers[0] : '';
          // The kana table has holes (や has no i or e, ん has no vowel); a hole must not
          // light up as though it were a selected character.
          var css = !char ? 'gap' : (on ? 'on' : '');
          return '<td class="' + css + '"><b>' + escapeHtml(char) + '</b><i>' +
            escapeHtml(rom) + '</i></td>';
        }).join('');
        return '<tr><th class="rowhead' + (rowOn ? ' on' : '') + '"><label>' +
          '<input type="checkbox" data-chart="' + chart.id + '" data-kind="rows" data-id="' +
          row.id + '"' + (rowOn ? ' checked' : '') + '><span>' + escapeHtml(row.label) +
          '</span></label></th>' + cells + '</tr>';
      }).join('');

      return head + '<div class="gridwrap"><table class="gridchart">' + header + body + '</table></div></div>';
    }).join('');
  }

  function renderWeak() {
    var items = progress().items;
    var rows = Object.keys(items)
      .filter(function (id) { return items[id].m > 0; })
      .map(function (id) {
        return { id: id, char: id.slice(id.indexOf(':') + 1), a: items[id].a, m: items[id].m };
      })
      .sort(function (x, y) { return (y.m / y.a) - (x.m / x.a) || y.m - x.m; })
      .slice(0, 15);
    if (!rows.length) {
      el.weak.textContent = 'Nothing missed yet.';
      return;
    }
    el.weak.innerHTML = rows.map(function (r) {
      return '<span class="weakcell"><b>' + escapeHtml(r.char) + '</b><i>' + r.m + '/' + r.a + '</i></span>';
    }).join('');
  }

  function renderOptionsPanel() {
    renderPresets();
    renderSettings();
    renderCharts();
    renderWeak();
  }

  // --- events -----------------------------------------------------------------

  el.form.addEventListener('submit', function (event) {
    event.preventDefault();
    submit();
  });

  function autoSubmitAnswer(event) {
    if (event && event.isComposing) return;
    if (!options().autoSubmit || !run.item || run.awaitingAck) return;
    // Neutral syllables can prefix a numbered tone; wait for Enter so a number
    // or a combining tone mark can still be entered without advancing early.
    if (state.current === 'hanzi' && options().pinyinAccurate &&
        !/[0-5]$/.test(el.answer.value.trim()) &&
        normalizeAnswer(el.answer.value).endsWith('5')) return;
    if (accepts(run.item, el.answer.value) && isComplete(run.item, el.answer.value)) submit();
  }
  el.answer.addEventListener('input', autoSubmitAnswer);
  el.answer.addEventListener('compositionend', autoSubmitAnswer);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      if (run.awaitingAck) nextQuestion();
      else el.answer.value = '';
      return;
    }
    // Typing anywhere on the page goes to the answer box.
    if (document.activeElement !== el.answer && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      el.answer.focus();
    }
  });

  el.tabs.addEventListener('click', function (event) {
    var id = event.target.getAttribute('data-alphabet');
    if (!id) return;
    state.current = id;
    run.signature = '';
    run.item = null;
    run.streak = 0;
    save();
    syncDeck();
    renderTabs();
    renderOptionsPanel();
    nextQuestion();
  });

  el.toggleOptions.addEventListener('click', function () {
    state.optionsOpen = !state.optionsOpen;
    el.options.hidden = !state.optionsOpen;
    save();
    if (state.optionsOpen) renderOptionsPanel();
    else el.answer.focus();
  });

  el.presets.addEventListener('click', function (event) {
    var id = event.target.getAttribute('data-preset');
    if (!id) return;
    var preset = alphabet().presets.filter(function (p) { return p.id === id; })[0];
    if (!preset) return;
    progress().selection = clone(preset.selection);
    afterSelectionChange();
  });

  el.settings.addEventListener('change', function (event) {
    var option = event.target.getAttribute('data-option');
    var mode = event.target.getAttribute('data-case');
    if (option) options()[option] = !!event.target.checked;
    else if (mode) options().letterCase = mode;
    else return;
    save();
    if (mode) afterSelectionChange();
    else if (option === 'pinyinAccurate') {
      el.answer.value = '';
      render();
    }
  });

  el.charts.addEventListener('click', function (event) {
    var all = event.target.getAttribute('data-all');
    var none = event.target.getAttribute('data-none');
    var chartId = all || none;
    if (!chartId) return;
    var chart = alphabet().charts.filter(function (c) { return c.id === chartId; })[0];
    var sel = selectionFor(chartId);
    sel.rows = all ? chart.rows.map(function (r) { return r.id; }) : [];
    sel.cols = all && chart.cols ? chart.cols.map(function (c) { return c.id; }) : [];
    afterSelectionChange();
  });

  el.charts.addEventListener('change', function (event) {
    var chartId = event.target.getAttribute('data-chart');
    if (!chartId) return;
    var kind = event.target.getAttribute('data-kind');
    var id = event.target.getAttribute('data-id');
    setOn(chartId, kind, id, event.target.checked);

    // On a grid, ticking a consonant with no vowels selected would add nothing —
    // seed the other axis so the first click always produces characters.
    var chart = alphabet().charts.filter(function (c) { return c.id === chartId; })[0];
    if (chart.type === 'grid' && event.target.checked) {
      var sel = selectionFor(chartId);
      if (kind === 'rows' && !sel.cols.length) {
        sel.cols = chart.cols.slice(0, 6).map(function (c) { return c.id; });
      } else if (kind === 'cols' && !sel.rows.length) {
        sel.rows = chart.rows.slice(0, 5).map(function (r) { return r.id; });
      }
    }
    afterSelectionChange();
  });

  el.resetStats.addEventListener('click', function () {
    progress().stats = { correct: 0, total: 0, best: 0 };
    progress().items = {};
    run.streak = 0;
    save();
    render();
    renderWeak();
  });

  function afterSelectionChange() {
    save();
    var changed = syncDeck();
    renderCharts();
    if (changed && !run.item) nextQuestion();
    else render();
  }

  // --- boot -------------------------------------------------------------------

  load();
  renderTabs();
  el.options.hidden = !state.optionsOpen;
  if (state.optionsOpen) renderOptionsPanel();
  syncDeck();
  nextQuestion();
})();
