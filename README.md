# Hangul, Cyrillic, Kana & Hanzi recognition trainer

A character-recognition drill in the mould of the old itazuraneko kana trainer.

Also added Hangul for Korean and Russian Cyrillic because why not.

Chinese practice includes the 3,000 simplified hanzi in the **HSK 3.0 (2021)** character lists: 300 new characters per level for levels 1–6, and 1,200 for the combined 7–9 band. Presets are cumulative; individual groups can also be selected in the charts. These are character drills, not vocabulary word drills. Multiple dictionary readings are accepted for characters with more than one pronunciation.

In Chinese settings, enable **pinyin accurate** to require tones, using either marks (`nǐ`) or numbers (`ni3`). Neutral tones accept an unmarked syllable, `0`, or `5`. With the setting off (the default), plain letters such as `ni` suffice and tones are ignored; auto-submit advances as soon as the answer is complete. Use `ü`, `v`, or `u:` for ü; `u` remains a different vowel. In accurate mode, press Enter for unmarked neutral-tone answers, or type `0` or `5` to auto-submit. Settings and progress are saved separately for each script.

The HSK character list comes from [elkmovie/hsk30](https://github.com/elkmovie/hsk30) (Pleco Inc., MIT; upstream notes that the list was OCR-transcribed). Pronunciations come from [mozillazg/pinyin-data](https://github.com/mozillazg/pinyin-data) (MIT). Original sources and licenses are in `tools/data`; rebuild the bundled offline data with `node tools/build-hanzi.js`.

![The kana tab, with the selection charts open below the game](docs/screenshot.png)

## Running it

Just open `index.html` with any browser.

Progress, selection and settings are kept in `localStorage` so anything that might block or impede that will affect stats.

You can also see it https://jmjm93.github.io/kana-hangul-cyrillic-trainer/
