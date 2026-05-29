// ── 紀錄：進度代碼（存檔編碼/解碼） ──────────────────────────
// 沒有伺服器，進度以一段可複製的代碼保存（含校驗碼防竄改）。
// 記錄：鑽石數、技能地圖各節點是否點亮、最佳波次。
import { NODE_KEYS, ZERO_NODES } from "../data/skillTree.js";

const A36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const VERSION = "3"; // 節點數量改變時提高版本，避免讀到舊格式

function enc(n, w) { let s = ""; n = Math.max(0, Math.floor(n)); for (let i = 0; i < w; i++) { s = A36[n % 36] + s; n = Math.floor(n / 36); } return s; }
function dec(s) { let n = 0; for (const c of s) { const i = A36.indexOf(c); if (i < 0) return null; n = n * 36 + i; } return n; }
function packBits(bits) { let s = ""; for (let i = 0; i < bits.length; i += 5) { let v = 0; for (let j = 0; j < 5; j++) v |= (bits[i + j] || 0) << j; s += A36[v]; } return s; }
function unpackBits(str, n) { const a = []; for (const c of str) { const v = A36.indexOf(c); if (v < 0) return null; for (let j = 0; j < 5; j++) a.push((v >> j) & 1); } return a.slice(0, n); }

const NCHUNK = Math.ceil(NODE_KEYS.length / 5);

export function encodeSave(diamonds, nodes, bestWave) {
  let p = VERSION + enc(Math.min(diamonds, 36 ** 5 - 1), 5);
  p += packBits(NODE_KEYS.map((k) => ((nodes[k] || 0) >= 1 ? 1 : 0)));
  p += enc(Math.min(bestWave, 36 ** 2 - 1), 2);
  let sum = 0; for (const c of p) sum += c.charCodeAt(0);
  p += enc(sum % 1296, 2);
  return p.match(/.{1,5}/g).join("-");
}

export function decodeSave(str) {
  const s = (str || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  const N = 1 + 5 + NCHUNK + 2 + 2;
  if (s.length !== N || s[0] !== VERSION) return null;
  const body = s.slice(0, N - 2), chk = s.slice(N - 2);
  let sum = 0; for (const c of body) sum += c.charCodeAt(0);
  if (enc(sum % 1296, 2) !== chk) return null;
  const diamonds = dec(s.slice(1, 6));
  const bits = unpackBits(s.slice(6, 6 + NCHUNK), NODE_KEYS.length);
  if (!bits || diamonds === null) return null;
  const nodes = { ...ZERO_NODES }; NODE_KEYS.forEach((k, i) => (nodes[k] = bits[i]));
  const bestWave = dec(s.slice(6 + NCHUNK, 6 + NCHUNK + 2));
  if (bestWave === null) return null;
  return { diamonds, nodes, bestWave };
}
