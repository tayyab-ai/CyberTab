// ── CyberTab · db.js ──────────────────────────────────────────
const DB_NAME = 'CyberTabDB', DB_VER = 1, STORE = 'assets';

function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = e => { const db = e.target.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE); };
    r.onsuccess = e => res(e.target.result);
    r.onerror   = e => rej(e.target.error);
  });
}
async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((res, rej) => { const tx = db.transaction(STORE,'readwrite'); tx.objectStore(STORE).put(value, key); tx.oncomplete=()=>res(); tx.onerror=e=>rej(e.target.error); });
}
async function dbGet(key) {
  const db = await openDB();
  return new Promise((res, rej) => { const r = db.transaction(STORE,'readonly').objectStore(STORE).get(key); r.onsuccess=e=>res(e.target.result); r.onerror=e=>rej(e.target.error); });
}
async function dbDelete(key) {
  const db = await openDB();
  return new Promise((res, rej) => { const tx = db.transaction(STORE,'readwrite'); tx.objectStore(STORE).delete(key); tx.oncomplete=()=>res(); tx.onerror=e=>rej(e.target.error); });
}

// ── Single wallpaper ──
async function saveWallpaper(file) {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  await dbSet('wp_blob', blob);
  await dbSet('wp_type', file.type);
  await dbSet('wp_name', file.name);
}
async function loadWallpaper() {
  const blob = await dbGet('wp_blob');
  if (!blob) return null;
  return { url: URL.createObjectURL(blob), type: await dbGet('wp_type'), name: await dbGet('wp_name') };
}
async function clearWallpaper() {
  await dbDelete('wp_blob'); await dbDelete('wp_type'); await dbDelete('wp_name');
}

// ── Multi wallpaper (slots 1–5) ──
async function saveWallpaperSlot(slot, file) {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  await dbSet(`wp_blob_${slot}`, blob);
  await dbSet(`wp_type_${slot}`, file.type);
  await dbSet(`wp_name_${slot}`, file.name);
}
async function loadWallpaperSlot(slot) {
  const blob = await dbGet(`wp_blob_${slot}`);
  if (!blob) return null;
  return { url: URL.createObjectURL(blob), type: await dbGet(`wp_type_${slot}`), name: await dbGet(`wp_name_${slot}`) };
}
async function clearWallpaperSlot(slot) {
  await dbDelete(`wp_blob_${slot}`); await dbDelete(`wp_type_${slot}`); await dbDelete(`wp_name_${slot}`);
}
async function clearAllWallpaperSlots(maxSlots = 5) {
  for (let i = 1; i <= maxSlots; i++) await clearWallpaperSlot(i);
}
