/* Overlay Copy - lay danh sach gift code tu nguon cong dong
 *
 * Nguon: https://codes.yar.gg  (Where Winds Meet - danh sach do cong dong cap nhat)
 * Trang tra ve HTML da dung san, moi code nam trong mot the:
 *     <article data-code="ABC123" class="code-card is-unused"> ... </article>
 * Chi nhung code CON HAN duoc gui xuong, code het han khong co trong HTML.
 */

const { net } = require('electron');
const path = require('path');
const fs = require('fs');

const SOURCE = {
  name: 'codes.yar.gg',
  game: 'Where Winds Meet',
  url: 'https://codes.yar.gg/'
};

const CACHE_FILE = 'codes.json';
const FRESH_MS = 30 * 60 * 1000; // duoi 30 phut thi dung ban da tai, khoi lam phien may chu

let cache = { fetchedAt: 0, codes: [], source: SOURCE.name };

function cachePath(userData) {
  return path.join(userData, CACHE_FILE);
}

function load(userData) {
  try {
    const d = JSON.parse(fs.readFileSync(cachePath(userData), 'utf8'));
    if (Array.isArray(d.codes)) {
      cache = {
        fetchedAt: Number(d.fetchedAt) || 0,
        codes: d.codes.filter((c) => c && typeof c.code === 'string'),
        source: d.source || SOURCE.name
      };
    }
  } catch (_) {
    // chua tai lan nao
  }
  return cache;
}

function save(userData) {
  try {
    fs.writeFileSync(cachePath(userData), JSON.stringify(cache, null, 2), 'utf8');
    return true;
  } catch (_) {
    return false;
  }
}

/* Tach code tu HTML. Bam vao data-code nen doi mau ma khong doi cau truc van chay. */
function parse(html) {
  const out = [];
  const seen = new Set();
  const re = /<article\b([^>]*)>([\s\S]*?)<\/article>/g;

  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const inner = m[2];

    const codeM = /data-code="([^"]+)"/.exec(attrs);
    if (!codeM) continue;
    const code = codeM[1].trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);

    const cls = (/class="([^"]*)"/.exec(attrs) || [, ''])[1];
    const dateM = /class="code-date"[^>]*>([^<]*)</.exec(inner);
    const tipM = /class="code-date"[^>]*data-tooltip="([^"]*)"/.exec(inner);

    out.push({
      code,
      date: dateM ? dateM[1].trim() : '',
      note: tipM ? tipM[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : '',
      expired: /is-expired/.test(cls)
    });
  }
  return out;
}

async function refresh(userData) {
  try {
    const res = await net.fetch(SOURCE.url, {
      headers: { 'User-Agent': 'OverlayCopy/1.0 (+gift code helper)' }
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, ...status() };

    const html = await res.text();
    const codes = parse(html).filter((c) => !c.expired);
    if (!codes.length) return { ok: false, error: 'empty', ...status() };

    cache = { fetchedAt: Date.now(), codes, source: SOURCE.name };
    save(userData);
    return { ok: true, ...status() };
  } catch (e) {
    return { ok: false, error: e.message || 'network', ...status() };
  }
}

function status() {
  return {
    codes: cache.codes,
    fetchedAt: cache.fetchedAt,
    stale: Date.now() - cache.fetchedAt > FRESH_MS,
    source: SOURCE
  };
}

/* Tu tai neu chua co gi hoac ban dang giu da cu */
async function ensure(userData) {
  if (!cache.codes.length || Date.now() - cache.fetchedAt > FRESH_MS) {
    return refresh(userData);
  }
  return { ok: true, ...status() };
}

module.exports = { load, refresh, ensure, status, parse, SOURCE };
