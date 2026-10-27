# Hangul, Cyrillic, Kana & Hanzi recognition trainer

A character-recognition drill in the mould of the old itazuraneko kana trainer. With Hangul, Russian Cyrillic and Simplified Hanzi as well as Kana.

The HSK character list comes from [elkmovie/hsk30](https://github.com/elkmovie/hsk30) (Pleco Inc., MIT; upstream notes that the list was OCR-transcribed). Pronunciations come from [mozillazg/pinyin-data](https://github.com/mozillazg/pinyin-data) (MIT). Original sources and licenses are in `tools/data`; rebuild the bundled offline data with `node tools/build-hanzi.js`.

![The kana tab, with the selection charts open below the game](docs/screenshot.png)

## Running it

Just open `index.html` with any browser.

Progress, selection and settings are kept in `localStorage` so anything that might block or impede that will affect stats.

You can also see it https://jmjm93.github.io/kana-hangul-cyrillic-trainer/
