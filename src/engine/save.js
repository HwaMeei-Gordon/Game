// ── 紀錄：進度代碼（可攜存檔編碼/解碼） ──────────────────────
// 新格式：整份 meta 以 JSON → base64，前綴版本與簡易校驗碼，供換裝置/備份。
// 另保留舊版 v3 字串解碼，供本機自動存檔一次性遷移（取鑽石/最佳波次）。

function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64decode(str) { return decodeURIComponent(escape(atob(str))); }

export function encodeSave(meta) {
  const j = JSON.stringify({
    d: meta.diamonds | 0, bw: meta.bestWave | 0, bk: meta.bestKills | 0,
    n: meta.nodes || {}, w: meta.weaponsOwned || {}, wb: meta.weaponBase || {},
    ro: meta.relicsOwned || {}, re: meta.relicEquipped || null,
    st: meta.stats || { kills: 0, runs: 0 }, ac: meta.ach || {},
  });
  const b = b64encode(j);
  let sum = 0; for (let i = 0; i < b.length; i++) sum += b.charCodeAt(i);
  const chk = (sum % 1296).toString(36).padStart(2, "0");
  return "T4-" + chk + "-" + b;
}

export function decodeSave(str) {
  const s = (str || "").trim();
  const m = /^T4-([0-9a-z]{2})-([A-Za-z0-9+/=]+)$/.exec(s);
  if (!m) return null;
  const b = m[2]; let sum = 0; for (let i = 0; i < b.length; i++) sum += b.charCodeAt(i);
  if ((sum % 1296).toString(36).padStart(2, "0") !== m[1]) return null;
  try {
    const j = JSON.parse(b64decode(b));
    return {
      diamonds: j.d | 0, bestWave: j.bw || 1, bestKills: j.bk | 0,
      nodes: j.n || {}, weaponsOwned: j.w || {}, weaponBase: j.wb || {},
      relicsOwned: j.ro || {}, relicEquipped: j.re || null,
      stats: j.st || { kills: 0, runs: 0 }, ach: j.ac || {},
    };
  } catch { return null; }
}

// ── 舊版 v3（位元打包）解碼：僅用於遷移鑽石/最佳波次 ──
const A36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function enc(n, w) { let s = ""; n = Math.max(0, Math.floor(n)); for (let i = 0; i < w; i++) { s = A36[n % 36] + s; n = Math.floor(n / 36); } return s; }
function dec(s) { let n = 0; for (const c of s) { const i = A36.indexOf(c); if (i < 0) return null; n = n * 36 + i; } return n; }
const OLD_V3_NODES = 44, OLD_CHUNK = Math.ceil(OLD_V3_NODES / 5);
export function legacyDecodeV3(str) {
  const s = (str || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  const N = 1 + 5 + OLD_CHUNK + 2 + 2;
  if (s.length !== N || s[0] !== "3") return null;
  const body = s.slice(0, N - 2), chk = s.slice(N - 2);
  let sum = 0; for (const c of body) sum += c.charCodeAt(0);
  if (enc(sum % 1296, 2) !== chk) return null;
  const diamonds = dec(s.slice(1, 6));
  const bestWave = dec(s.slice(6 + OLD_CHUNK, 6 + OLD_CHUNK + 2));
  if (diamonds === null || bestWave === null) return null;
  return { diamonds, bestWave };
}
