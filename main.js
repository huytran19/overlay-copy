const { app, BrowserWindow, ipcMain, clipboard, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const macro = require('./macro');
const codes = require('./codes');

let win = null;
let clickThrough = false;

/* Cac chuc nang co the gan phim tat toan cuc (chay ca khi app khong duoc focus) */
const ACTIONS = ['copy', 'toggle', 'undo', 'reset', 'show', 'panic'];

/* 'panic' chi dang ky trong luc macro chay, khong giu phim ca ngay */
const RUNTIME_ONLY = new Set(['panic']);

const DEFAULT_HOTKEYS = {
  copy: 'Control+Alt+C',       // copy dong ke tiep
  toggle: 'Control+Alt+Space', // bat/tat xuyen chuot
  undo: '',                    // '' = chua gan
  reset: '',
  show: '',
  panic: 'Escape' // dung macro khan cap
};

const LANGS = ['vi', 'en'];

const DEFAULT_OPTIONS = {
  rememberOpacity: true,
  rememberBounds: true,
  opacity: 1,
  lineMode: false,
  lang: 'vi' // app goc tieng Viet -> mac dinh tieng Viet, doi trong Cai dat
};

const MIN_W = 300;
const MIN_H = 220;

let hotkeys = { ...DEFAULT_HOTKEYS };
let options = { ...DEFAULT_OPTIONS };
let bounds = null;
let hotkeyState = {};
let macroData = { steps: [], gapMs: 400 };

/* ---------- Doc / ghi cau hinh ---------- */

function configPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function clampOpacity(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.min(1, Math.max(0.2, n));
}

function isBounds(b) {
  return !!b && ['x', 'y', 'width', 'height'].every((k) => Number.isFinite(b[k])) &&
    b.width >= MIN_W && b.height >= MIN_H;
}

function loadConfig() {
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(configPath(), 'utf8')) || {};
  } catch (_) {
    data = {}; // chua co file hoac file hong -> dung mac dinh
  }

  // ban cu luu thang {toggle, copy} o goc, ban moi luu trong data.hotkeys
  const src = (data.hotkeys && typeof data.hotkeys === 'object') ? data.hotkeys : data;
  hotkeys = { ...DEFAULT_HOTKEYS };
  for (const id of ACTIONS) {
    if (typeof src[id] === 'string') hotkeys[id] = src[id].trim();
  }

  const o = (data.options && typeof data.options === 'object') ? data.options : {};
  options = {
    rememberOpacity: o.rememberOpacity !== false,
    rememberBounds: o.rememberBounds !== false,
    opacity: clampOpacity(o.opacity),
    lineMode: o.lineMode === true,
    lang: LANGS.includes(o.lang) ? o.lang : DEFAULT_OPTIONS.lang
  };

  bounds = isBounds(data.bounds) ? data.bounds : null;

  const m = (data.macro && typeof data.macro === 'object') ? data.macro : {};
  macroData = {
    steps: Array.isArray(m.steps) ? m.steps : [],
    gapMs: Number.isFinite(m.gapMs) ? Math.min(10000, Math.max(0, m.gapMs)) : 400
  };
}

function saveConfig() {
  try {
    fs.writeFileSync(
      configPath(),
      JSON.stringify({ hotkeys, options, bounds, macro: macroData }, null, 2),
      'utf8'
    );
    return true;
  } catch (_) {
    return false; // khong ghi duoc thi phien nay van chay binh thuong
  }
}

/* ---------- Dang ky phim tat ---------- */

function toRenderer(channel) {
  return () => { if (win && !win.isDestroyed()) win.webContents.send(channel); };
}

function toggleVisible() {
  if (!win || win.isDestroyed()) return;
  if (win.isVisible() && !win.isMinimized()) {
    win.hide();
  } else {
    // showInactive: hien len ma khong cuop focus cua game
    win.showInactive();
    win.setAlwaysOnTop(true, 'screen-saver');
  }
}

const HANDLERS = {
  copy: toRenderer('hotkey:copy-next'),
  toggle: () => setClickThrough(!clickThrough),
  undo: toRenderer('hotkey:undo'),
  reset: toRenderer('hotkey:reset-list'),
  show: toggleVisible,
  panic: () => macro.abort()
};

function tryRegister(accel, handler) {
  try {
    return globalShortcut.register(accel, handler) === true;
  } catch (_) {
    return false; // accelerator khong hop le
  }
}

/* Tra ve { <id>: 'ok' | 'off' | 'fail' } */
function applyHotkeys(map) {
  globalShortcut.unregisterAll();
  const state = {};
  for (const id of ACTIONS) {
    const accel = String(map[id] || '').trim();
    if (!accel) { state[id] = 'off'; continue; }
    if (RUNTIME_ONLY.has(id)) { state[id] = 'ok'; continue; } // dang ky sau, luc can
    state[id] = tryRegister(accel, HANDLERS[id]) ? 'ok' : 'fail';
  }
  return state;
}

function statusPayload() {
  return {
    hotkeys: { ...hotkeys },
    state: { ...hotkeyState },
    options: { ...options },
    defaults: { ...DEFAULT_HOTKEYS },
    actions: [...ACTIONS]
  };
}

function sendStatus() {
  if (win && !win.isDestroyed()) win.webContents.send('hotkey:status', statusPayload());
}

function setClickThrough(on) {
  if (!win) return clickThrough;
  clickThrough = !!on;
  // forward: true -> cua so van nhan duoc su kien di chuyen chuot de ve hover
  win.setIgnoreMouseEvents(clickThrough, { forward: true });
  win.webContents.send('click-through:changed', clickThrough);
  return clickThrough;
}

/* ---------- Cua so ---------- */

/* Keo cua so ve trong vung nhin thay duoc - phong truong hop doi do phan giai */
function clampToDisplay(b) {
  const area = screen.getDisplayMatching(b).workArea;
  const width = Math.min(Math.max(MIN_W, Math.round(b.width)), area.width);
  const height = Math.min(Math.max(MIN_H, Math.round(b.height)), area.height);
  return {
    width,
    height,
    x: Math.min(Math.max(area.x, Math.round(b.x)), area.x + area.width - width),
    y: Math.min(Math.max(area.y, Math.round(b.y)), area.y + area.height - height)
  };
}

let boundsTimer = null;
function queueSaveBounds() {
  if (!options.rememberBounds || !win || win.isDestroyed()) return;
  if (win.isMinimized() || !win.isVisible()) return;
  clearTimeout(boundsTimer);
  boundsTimer = setTimeout(() => {
    if (!win || win.isDestroyed()) return;
    bounds = win.getBounds();
    saveConfig();
  }, 400);
}

function createWindow() {
  const { workAreaSize } = screen.getPrimaryDisplay();

  const start = (options.rememberBounds && isBounds(bounds))
    ? clampToDisplay(bounds)
    : { width: 460, height: 620, x: Math.max(0, workAreaSize.width - 500), y: 60 };

  win = new BrowserWindow({
    ...start,
    minWidth: MIN_W,
    minHeight: MIN_H,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    backgroundColor: '#12141a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  // 'screen-saver' giu cua so noi tren ca cac app fullscreen tren Windows
  win.setAlwaysOnTop(true, 'screen-saver');
  if (options.rememberOpacity) win.setOpacity(options.opacity);

  win.on('resize', queueSaveBounds);
  win.on('move', queueSaveBounds);

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  loadConfig();
  codes.load(app.getPath('userData'));
  createWindow();
  hotkeyState = applyHotkeys(hotkeys);

  win.webContents.once('did-finish-load', sendStatus);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  macro.shutdown();
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ---------- IPC: cua so ---------- */

ipcMain.handle('clipboard:write', (_e, text) => {
  clipboard.writeText(String(text ?? ''));
  return true;
});

ipcMain.handle('win:minimize', () => win && win.minimize());

ipcMain.handle('win:close', () => win && win.close());

ipcMain.handle('win:toggle-pin', () => {
  if (!win) return false;
  const next = !win.isAlwaysOnTop();
  win.setAlwaysOnTop(next, 'screen-saver');
  return next;
});

ipcMain.handle('win:toggle-click-through', () => setClickThrough(!clickThrough));

ipcMain.handle('win:set-opacity', (_e, value) => {
  if (!win) return;
  const v = clampOpacity(value);
  win.setOpacity(v);
  if (options.rememberOpacity) {
    options.opacity = v;
    saveConfig();
  }
});

/* ---------- IPC: phim tat ---------- */

ipcMain.handle('hotkey:get', () => statusPayload());

/* Trong luc cho nguoi dung bam phim moi, phai nha het phim tat toan cuc,
   neu khong chung se nuot su kien truoc khi cua so nhan duoc. */
ipcMain.handle('hotkey:capture-start', () => {
  globalShortcut.unregisterAll();
  return true;
});

ipcMain.handle('hotkey:capture-end', () => {
  hotkeyState = applyHotkeys(hotkeys);
  sendStatus();
  return statusPayload();
});

ipcMain.handle('hotkey:set', (_e, payload) => {
  const next = { ...hotkeys };
  for (const id of ACTIONS) {
    if (payload && typeof payload[id] === 'string') next[id] = payload[id].trim();
  }

  // khong cho hai chuc nang dung chung mot to hop
  const seen = new Map();
  for (const id of ACTIONS) {
    const k = next[id].toLowerCase();
    if (!k) continue;
    if (seen.has(k)) {
      hotkeyState = applyHotkeys(hotkeys);
      return { ok: false, code: 'dupe', accel: next[id], status: statusPayload() };
    }
    seen.set(k, id);
  }

  const state = applyHotkeys(next);
  const bad = ACTIONS.filter((id) => state[id] === 'fail').map((id) => next[id]);

  if (bad.length) {
    hotkeyState = applyHotkeys(hotkeys); // quay ve cau hinh cu
    sendStatus();
    return { ok: false, code: 'fail', keys: bad, status: statusPayload() };
  }

  hotkeys = next;
  hotkeyState = state;
  const saved = saveConfig();
  sendStatus();
  return { ok: true, saved, status: statusPayload() };
});

ipcMain.handle('hotkey:reset', () => {
  hotkeys = { ...DEFAULT_HOTKEYS };
  hotkeyState = applyHotkeys(hotkeys);
  saveConfig();
  sendStatus();
  return { ok: true, status: statusPayload() };
});

/* ---------- IPC: tuy chon ---------- */

ipcMain.handle('options:set', (_e, patch) => {
  if (patch && typeof patch === 'object') {
    if ('rememberOpacity' in patch) options.rememberOpacity = patch.rememberOpacity === true;
    if ('rememberBounds' in patch) options.rememberBounds = patch.rememberBounds === true;
    if ('lineMode' in patch) options.lineMode = patch.lineMode === true;
    if ('lang' in patch && LANGS.includes(patch.lang)) options.lang = patch.lang;
  }
  if (options.rememberBounds && win && !win.isDestroyed()) bounds = win.getBounds();
  saveConfig();
  sendStatus();
  return { ...options };
});

ipcMain.handle('options:reset', () => {
  options = { ...DEFAULT_OPTIONS };
  bounds = null;
  if (win && !win.isDestroyed()) win.setOpacity(1);
  saveConfig();
  sendStatus();
  return { ...options };
});

/* ---------- IPC: macro ---------- */

function macroStatus(extra) {
  return {
    available: macro.available(),
    why: macro.why(),
    recording: macro.isRecording(),
    playing: macro.isPlaying(),
    steps: macroData.steps,
    gapMs: macroData.gapMs,
    labels: macroData.steps.map((s) => macro.describe(s)),
    pasteStep: macro.available() ? macro.pasteStep() : null,
    ...extra
  };
}

function sendMacro(extra) {
  if (win && !win.isDestroyed()) win.webContents.send('macro:status', macroStatus(extra));
}

ipcMain.handle('macro:get', () => macroStatus());

ipcMain.handle('macro:record-start', () => {
  const r = macro.startRecording({
    // moi cu nhap vao chinh cua so overlay se khong bi ghi
    skipRect: win && !win.isDestroyed() ? win.getBounds() : null,
    base: macroData.steps, // ghi noi tiep vao nhung buoc da co
    onStep: (steps) => sendMacro({ recording: true, steps, labels: steps.map((s) => macro.describe(s)) })
  });
  sendMacro();
  return { ...r, status: macroStatus() };
});

ipcMain.handle('macro:record-stop', () => {
  const steps = macro.stopRecording();
  if (steps.length) macroData.steps = steps;
  saveConfig();
  sendMacro();
  return macroStatus();
});

ipcMain.handle('macro:set', (_e, patch) => {
  if (patch && Array.isArray(patch.steps)) macroData.steps = patch.steps;
  if (patch && Number.isFinite(patch.gapMs)) {
    macroData.gapMs = Math.min(10000, Math.max(0, Math.round(patch.gapMs)));
  }
  saveConfig();
  sendMacro();
  return macroStatus();
});

/* codes: [{ i, text }] cac dong con lai theo dung thu tu */
ipcMain.handle('macro:play', async (_e, payload) => {
  const codes = Array.isArray(payload && payload.codes) ? payload.codes.slice() : [];
  const loops = Math.max(1, Math.min(9999, Number(payload && payload.loops) || 1));

  // phim dung khan cap chi song trong luc chay
  const panic = String(hotkeys.panic || '').trim();
  let panicOk = false;
  if (panic) panicOk = tryRegister(panic, () => macro.abort());

  sendMacro({ playing: true });

  const res = await macro.play({
    steps: macroData.steps,
    loops,
    gapMs: macroData.gapMs,
    nextCode: async () => {
      const item = codes.shift();
      if (!item) return false;
      clipboard.writeText(String(item.text ?? ''));
      if (win && !win.isDestroyed()) win.webContents.send('macro:code-used', item.i);
      return true;
    },
    onTick: (loop, step, total) => sendMacro({ playing: true, tick: { loop, step, total } })
  });

  if (panicOk) { try { globalShortcut.unregister(panic); } catch (_) {} }
  sendMacro();
  return res;
});

ipcMain.handle('macro:abort', () => {
  macro.abort();
  sendMacro();
  return true;
});

/* ---------- IPC: danh sach gift code ---------- */

ipcMain.handle('codes:get', () => codes.status());

ipcMain.handle('codes:ensure', () => codes.ensure(app.getPath('userData')));

ipcMain.handle('codes:refresh', () => codes.refresh(app.getPath('userData')));
