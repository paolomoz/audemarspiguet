/* compare-snapshot — snapshot AP's `.compare.` servlet data for every ref in
   the pilot grid feed (no CORS on the live endpoint → served from /data,
   same policy as the product feed). Output: data/compare-core-collection.json
   keyed by reference. */
import fs from 'fs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const ROOT = new URL('../..', import.meta.url).pathname;
const feed = JSON.parse(fs.readFileSync(`${ROOT}data/products-core-collection.json`, 'utf8'));
const refs = (feed.results || []).map((p) => p.reference);
console.log('refs:', refs.length);

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const out = {};
for (let i = 0; i < refs.length; i += 3) {
  let batch = refs.slice(i, i + 3);
  if (batch.length < 2) batch = [refs[0], ...batch]; // servlet needs >=2
  const url = `https://www.audemarspiguet.com/ch/en/home.compare.${batch.map(b64).join('.')}.json?currency=ch`;
  // eslint-disable-next-line no-await-in-loop
  const resp = await fetch(url, { headers: { 'user-agent': UA } });
  if (!resp.ok) { console.error('FAIL', resp.status, batch.join(',')); continue; }
  // eslint-disable-next-line no-await-in-loop
  const data = await resp.json();
  data.forEach((entry) => { out[entry.card.reference] = entry; });
  console.log(`${i + batch.length}/${refs.length} ok (${Object.keys(out).length} collected)`);
  // eslint-disable-next-line no-await-in-loop
  await new Promise((r) => setTimeout(r, 400));
}
const missing = refs.filter((r) => !out[r]);
console.log('missing:', missing);
fs.writeFileSync(`${ROOT}data/compare-core-collection.json`, JSON.stringify(out));
console.log('written data/compare-core-collection.json', fs.statSync(`${ROOT}data/compare-core-collection.json`).size, 'bytes');
