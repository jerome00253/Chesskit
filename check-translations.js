const en = require('./src/messages/en.json');
const fr = require('./src/messages/fr.json');
const de = require('./src/messages/de.json');
const it = require('./src/messages/it.json');
const pt = require('./src/messages/pt.json');
const es = require('./src/messages/es.json');
const nl = require('./src/messages/nl.json');

const frKeys = Object.keys(fr.Tactical.themes);
const langs = { en, de, it, pt, es, nl };

console.log('=== French Tactical.themes keys ===');
console.log(frKeys.join(', '));
console.log('\n=== Checking other languages ===');

Object.entries(langs).forEach(([lang, data]) => {
  const missing = frKeys.filter(k => !data.Tactical.themes[k]);
  if (missing.length > 0) {
    console.log(`${lang}: ❌ Missing keys: ${missing.join(', ')}`);
  } else {
    console.log(`${lang}: ✅ All ${frKeys.length} keys present`);
  }
});
