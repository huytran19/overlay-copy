/* Overlay Copy - ghi va phat lai thao tac (macro)
 *
 * Ghi:    uiohook-napi  - hook chuot/ban phim toan he thong
 * Phat:   @jitsi/robotjs (chuot) + uIOhook.keyTap (ban phim)
 *
 * Ca hai deu la native module. Neu nap that bai thi module nay van load duoc,
 * chi bao available() = false de giao dien hien thong bao thay vi lam app chet.
 */

let uio = null;
let robot = null;
let loadError = '';

try {
  uio = require('uiohook-napi');
} catch (e) {
  loadError = `uiohook-napi: ${e.message}`;
}
try {
  robot = require('@jitsi/robotjs');
} catch (e) {
  loadError = loadError ? `${loadError} | @jitsi/robotjs: ${e.message}` : `@jitsi/robotjs: ${e.message}`;
}

const K = uio ? uio.UiohookKey : {};

/* Ma phim bo tro -> bo qua khi ghi (chi ghi phim chinh + co bo tro) */
const MOD_CODES = new Set(
  [K.Ctrl, K.CtrlRight, K.Alt, K.AltRight, K.Shift, K.ShiftRight, K.Meta, K.MetaRight]
    .filter((v) => v !== undefined)
);

/* Ma phim -> ten de hien thi */
const CODE_NAME = {};
for (const [name, code] of Object.entries(K)) {
  if (CODE_NAME[code] === undefined) CODE_NAME[code] = name;
}

const BUTTON_NAME = { 1: 'left', 2: 'right', 3: 'middle' };

/* Khoang cho toi da tu dong chen giua hai thao tac khi ghi */
const MAX_GAP = 3000;
const MIN_GAP = 60;

/* Phim bo tro phai/trai deu quy ve mot ma chuan */
const MOD_CANON = {};
if (K.CtrlRight !== undefined) MOD_CANON[K.CtrlRight] = K.Ctrl;
if (K.AltRight !== undefined) MOD_CANON[K.AltRight] = K.Alt;
if (K.ShiftRight !== undefined) MOD_CANON[K.ShiftRight] = K.Shift;
if (K.MetaRight !== undefined) MOD_CANON[K.MetaRight] = K.Meta;

/* Co ctrlKey/altKey/shiftKey/metaKey trong su kien khong phai luc nao cung dung,
   nen tu theo doi phim bo tro dang duoc giu. Luu kem moc thoi gian de neu bi lo
   mat su kien nha phim thi khong ket vinh vien vao moi buoc sau. */
const heldMods = new Map(); // ma phim -> luc bam
const MOD_STALE = 8000;

let hookOn = false;      // uIOhook.start() da chay chua
let recording = null;    // { steps, lastTime, skipRect }
let playing = null;      // { stop: bool }

function available() {
  return !!(uio && robot);
}

function why() {
  return loadError || '';
}

function ensureHook() {
  if (!uio || hookOn) return true;
  try {
    uio.uIOhook.start();
    hookOn = true;
    return true;
  } catch (e) {
    // macOS chua cap quyen Accessibility thi start() hong
    loadError = `uIOhook.start: ${e.message}`;
    return false;
  }
}

function releaseHook() {
  if (!uio || !hookOn || recording) return;
  uio.uIOhook.stop();
  hookOn = false;
}

/* ---------- Ghi ---------- */

function inRect(x, y, r) {
  return !!r && x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}

/* Dung Date.now() chu khong dung e.time: moc thoi gian cua libuiohook khong
   phai mili-giay tren moi he dieu hanh, dung no thi khoang cho luon vuot tran. */
function pushGap(rec) {
  const now = Date.now();
  if (!rec.lastTime) { rec.lastTime = now; return; }
  const gap = Math.min(MAX_GAP, Math.round(now - rec.lastTime));
  rec.lastTime = now;
  if (gap >= MIN_GAP) rec.steps.push({ t: 'wait', ms: gap });
}

function modsNow(e) {
  const out = new Set();
  const now = Date.now();
  for (const [code, at] of heldMods) {
    if (now - at > MOD_STALE) { heldMods.delete(code); continue; } // ro rang la lo mat keyup
    out.add(MOD_CANON[code] ?? code);
  }
  // he dieu hanh co bao co thi lay them cho chac
  if (e.ctrlKey) out.add(K.Ctrl);
  if (e.altKey) out.add(K.Alt);
  if (e.shiftKey) out.add(K.Shift);
  if (e.metaKey) out.add(K.Meta);
  return [...out];
}

function onKeyUp(e) {
  // xoa ca ban goc lan ban da quy chuan: keydown/keyup co the bao ma trai/phai khac nhau
  heldMods.delete(e.keycode);
  const canon = MOD_CANON[e.keycode];
  if (canon !== undefined) heldMods.delete(canon);
  for (const [raw, target] of Object.entries(MOD_CANON)) {
    if (target === e.keycode) heldMods.delete(Number(raw));
  }
}

function onClick(e) {
  if (!recording) return;
  // bo qua cu nhap vao chinh cua so overlay
  if (inRect(e.x, e.y, recording.skipRect)) return;
  pushGap(recording);
  recording.steps.push({
    t: 'click',
    x: Math.round(e.x),
    y: Math.round(e.y),
    button: BUTTON_NAME[e.button] || 'left',
    double: e.clicks >= 2
  });
  recording.notify();
}

function onKeyDown(e) {
  if (!recording) return;
  if (MOD_CODES.has(e.keycode)) { heldMods.set(e.keycode, Date.now()); return; } // doi phim chinh

  pushGap(recording);
  const mods = modsNow(e);

  // Ctrl+V / Cmd+V = dan code -> tu chen buoc lay dong ke tiep ngay truoc do
  const isPaste = e.keycode === K.V && (mods.includes(K.Ctrl) || mods.includes(K.Meta));
  if (isPaste && recording.steps[recording.steps.length - 1]?.t !== 'code') {
    recording.steps.push({ t: 'code' });
  }

  recording.steps.push({ t: 'key', code: e.keycode, mods });
  recording.notify();
}

/* skipRect: vung cua so overlay, moi cu nhap vao day se khong bi ghi */
function startRecording({ skipRect, onStep, base } = {}) {
  if (!available()) return { ok: false, error: 'unavailable' };
  if (playing) return { ok: false, error: 'busy' };
  stopRecording();
  heldMods.clear();

  recording = {
    // ghi noi vao danh sach dang co, khong xoa cong suc nguoi dung da xep
    steps: Array.isArray(base) ? base.slice() : [],
    lastTime: 0,
    skipRect: skipRect || null,
    notify: () => { if (onStep) onStep(recording.steps.slice()); }
  };

  if (!ensureHook()) { recording = null; return { ok: false, error: 'hook-failed' }; }
  uio.uIOhook.on('click', onClick);
  uio.uIOhook.on('keydown', onKeyDown);
  uio.uIOhook.on('keyup', onKeyUp);
  return { ok: true };
}

function stopRecording() {
  if (!recording) return [];
  uio.uIOhook.off('click', onClick);
  uio.uIOhook.off('keydown', onKeyDown);
  uio.uIOhook.off('keyup', onKeyUp);
  heldMods.clear();
  const steps = recording.steps;
  recording = null;
  releaseHook();
  return steps;
}

function isRecording() {
  return !!recording;
}

/* ---------- Phat lai ---------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function describe(step) {
  switch (step.t) {
    case 'click': return `${step.double ? 'double-' : ''}click ${step.button} (${step.x}, ${step.y})`;
    case 'key': {
      const mods = (step.mods || []).map((c) => CODE_NAME[c] || c);
      return [...mods, CODE_NAME[step.code] || step.code].join('+');
    }
    case 'wait': return `wait ${step.ms}ms`;
    case 'code': return 'next-code';
    default: return step.t;
  }
}

async function runStep(step, ctx) {
  switch (step.t) {
    case 'click':
      robot.moveMouse(step.x, step.y);
      await sleep(30); // cho con tro toi noi truoc khi bam
      robot.mouseClick(step.button, !!step.double);
      return;

    case 'key':
      uio.uIOhook.keyTap(step.code, step.mods || []);
      return;

    case 'wait':
      await sleep(Math.max(0, Math.min(MAX_GAP, step.ms || 0)));
      return;

    case 'code':
      // nguoi goi tra ve dong ke tiep va tu danh dau da copy
      await ctx.nextCode();
      return;

    default:
      return;
  }
}

/**
 * steps    - danh sach thao tac
 * loops    - so vong chay
 * gapMs    - nghi giua hai vong
 * nextCode - async () => boolean, dua dong ke tiep vao clipboard;
 *            tra ve false khi het dong -> dung som
 * onTick   - (loopIndex, stepIndex, total) bao tien do
 */
async function play({ steps, loops = 1, gapMs = 400, nextCode, onTick } = {}) {
  if (!available()) return { ok: false, error: 'unavailable' };
  if (recording) return { ok: false, error: 'recording' };
  if (playing) return { ok: false, error: 'busy' };
  if (!Array.isArray(steps) || !steps.length) return { ok: false, error: 'empty' };

  playing = { stop: false };
  let outOfCodes = false;

  const ctx = {
    nextCode: async () => {
      const more = nextCode ? await nextCode() : true;
      if (!more) { outOfCodes = true; playing.stop = true; }
    }
  };

  let done = 0;
  try {
    for (let loop = 0; loop < loops && !playing.stop; loop++) {
      for (let i = 0; i < steps.length && !playing.stop; i++) {
        if (onTick) onTick(loop, i, steps.length);
        await runStep(steps[i], ctx);
      }
      if (!playing.stop) done++;
      if (loop < loops - 1 && !playing.stop) await sleep(gapMs);
    }
  } finally {
    playing = null;
    releaseHook();
  }

  return { ok: true, loops: done, stopped: outOfCodes ? 'out-of-codes' : (done < loops ? 'aborted' : 'finished') };
}

function abort() {
  if (playing) playing.stop = true;
  return !!playing;
}

function isPlaying() {
  return !!playing;
}

function shutdown() {
  abort();
  stopRecording();
  if (uio && hookOn) { uio.uIOhook.stop(); hookOn = false; }
}

/* Buoc "dan" dung san cho he dieu hanh hien tai */
function pasteStep() {
  const mod = process.platform === 'darwin' ? K.Meta : K.Ctrl;
  return { t: 'key', code: K.V, mods: [mod] };
}

module.exports = {
  available, why, pasteStep,
  startRecording, stopRecording, isRecording,
  play, abort, isPlaying,
  describe, shutdown
};
