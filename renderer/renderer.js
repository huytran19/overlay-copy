/* Overlay Copy - renderer */

const $ = (id) => document.getElementById(id);

const el = {
  input: $('input'),
  count: $('count'),
  lineMode: $('line-mode'),
  btnRun: $('btn-run'),
  viewInput: $('view-input'),
  viewList: $('view-list'),
  list: $('list'),
  doneCount: $('done-count'),
  totalCount: $('total-count'),
  progressFill: $('progress-fill'),
  doneBanner: $('done-banner'),
  btnBack: $('btn-back'),
  btnUndo: $('btn-undo'),
  btnReset: $('btn-reset'),
  toast: $('toast'),
  btnPin: $('btn-pin'),
  btnMin: $('btn-min'),
  btnClose: $('btn-close'),
  opacity: $('opacity'),
  btnThrough: $('btn-through'),
  throughHint: $('through-hint'),
  hintKeys: $('hint-keys'),
  btnKeys: $('btn-keys'),
  keysPanel: $('keys-panel'),
  keysClose: $('keys-close'),
  keysReset: $('keys-reset'),
  keysMsg: $('keys-msg')
};

let hotkeys = { copy: 'Control+Alt+C', toggle: 'Control+Alt+Space', undo: '', reset: '', show: '' };
let hkState = {};   // id -> 'ok' | 'off' | 'fail'
let options = { rememberOpacity: true, rememberBounds: true, opacity: 1, lineMode: false, lang: 'vi' };

/* ---------- Ngon ngu ---------- */

function t(key, vars) {
  const dict = I18N[options.lang] || I18N.vi;
  let s = dict[key] ?? I18N.vi[key] ?? key;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(vars[k]);
  return s;
}

/* Dich moi phan tu tinh trong HTML */
function applyLang() {
  document.documentElement.lang = options.lang;
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach((n) => { n.title = t(n.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-ph]').forEach((n) => { n.placeholder = t(n.dataset.i18nPh); });
  // rieng doan nay co the <b>, deu la chuoi cua chinh app
  $('panel-note').innerHTML = t('panel.note');

  buildLangSwitch();
  buildRows();
  refreshCount();
  paintFields();
  paintPin(el.btnPin.classList.contains('active'));
  paintThrough(document.body.classList.contains('click-through'));
  paintHint();
  paintMacro();
}

function buildLangSwitch() {
  const box = $('lang-switch');
  box.innerHTML = '';
  for (const code of LANGS) {
    const b = document.createElement('button');
    b.className = 'seg-btn' + (options.lang === code ? ' on' : '');
    b.textContent = I18N[code]['lang.name'];
    b.addEventListener('click', async () => {
      if (options.lang === code) return;
      options.lang = code;
      await window.api.setOptions({ lang: code });
      applyLang(); // ve lai sau khi da luu - ham nay dung chinh nut dang bam
      msg('');
    });
    box.appendChild(b);
  }
}

/* ---------- State ---------- */

let items = [];        // noi dung tung dong
let rowEls = [];       // DOM cua tung dong
let copyStack = [];    // thu tu index da copy (phan tu cuoi = vua copy)
let copied = new Set();

/* ---------- Tach chuoi ---------- */

function parse(raw, lineOnly) {
  const parts = lineOnly ? raw.split(/\r?\n/) : raw.split(/\s+/);
  return parts.map((s) => s.trim()).filter((s) => s.length > 0);
}

function refreshCount() {
  const n = parse(el.input.value, el.lineMode.checked).length;
  el.count.textContent = t('input.count', { n });
  el.btnRun.disabled = n === 0;
}

el.input.addEventListener('input', refreshCount);
el.lineMode.addEventListener('change', refreshCount);

/* ---------- Render danh sach ---------- */

function buildList() {
  el.list.innerHTML = '';
  rowEls = items.map((text, i) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.dataset.state = 'pending';

    const idx = document.createElement('span');
    idx.className = 'idx';
    idx.textContent = String(i + 1);

    const txt = document.createElement('span');
    txt.className = 'text';
    txt.textContent = text;
    txt.title = text;

    const btn = document.createElement('button');
    btn.className = 'copy';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => doCopy(i));

    row.append(idx, txt, btn);
    el.list.appendChild(row);
    return row;
  });
}

function nextIndex() {
  for (let i = 0; i < items.length; i++) if (!copied.has(i)) return i;
  return -1;
}

function paint() {
  const last = copyStack.length ? copyStack[copyStack.length - 1] : -1;
  const next = nextIndex();

  rowEls.forEach((row, i) => {
    if (copied.has(i)) row.dataset.state = i === last ? 'recent' : 'old';
    else row.dataset.state = i === next ? 'next' : 'pending';
  });

  const done = copied.size;
  el.doneCount.textContent = String(done);
  el.totalCount.textContent = String(items.length);
  el.progressFill.style.width = items.length ? `${(done / items.length) * 100}%` : '0%';

  const allDone = items.length > 0 && done === items.length;
  el.doneBanner.classList.toggle('hidden', !allDone);
  el.btnUndo.disabled = copyStack.length === 0;

  if (allDone) el.doneBanner.scrollIntoView({ block: 'nearest' });
  else if (next >= 0 && rowEls[next]) rowEls[next].scrollIntoView({ block: 'nearest' });
}

/* ---------- Hanh dong ---------- */

async function doCopy(i) {
  if (i < 0 || i >= items.length) return;

  try {
    await window.api.copy(items[i]);
  } catch (err) {
    toast(t('toast.clipErr'));
    return;
  }

  if (!copied.has(i)) copied.add(i);
  // dua len dau ngan xep de dong nay thanh "vua copy"
  copyStack = copyStack.filter((x) => x !== i);
  copyStack.push(i);

  rowEls[i].classList.remove('flash');
  void rowEls[i].offsetWidth;
  rowEls[i].classList.add('flash');

  paint();
  toast(t('toast.copied', { n: i + 1 }));
}

function undo() {
  const i = copyStack.pop();
  if (i === undefined) return;
  copied.delete(i);
  paint();
  toast(t('toast.undo', { n: i + 1 }));
}

function reset() {
  copied = new Set();
  copyStack = [];
  paint();
}

function run() {
  items = parse(el.input.value, el.lineMode.checked);
  if (!items.length) return;
  buildList();
  reset();
  el.viewInput.classList.add('hidden');
  el.viewList.classList.remove('hidden');
}

function back() {
  el.viewList.classList.add('hidden');
  el.viewInput.classList.remove('hidden');
  el.input.focus();
}

let toastTimer = null;
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), 900);
}

/* ---------- Su kien ---------- */

el.btnRun.addEventListener('click', run);
el.btnBack.addEventListener('click', back);
el.btnUndo.addEventListener('click', undo);
el.btnReset.addEventListener('click', reset);

el.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
});

document.addEventListener('keydown', (e) => {
  const typing = document.activeElement === el.input;
  if (typing) return;
  // dang mo mot bang bat ky -> khong dung phim cho danh sach
  if (!el.keysPanel.classList.contains('hidden')) return;
  if (!$('macro-panel').classList.contains('hidden')) return;

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
  if (el.viewList.classList.contains('hidden')) return;

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const n = nextIndex();
    if (n >= 0) doCopy(n);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    back();
  }
});

/* ---------- Dieu khien cua so ---------- */

el.btnMin.addEventListener('click', () => window.api.minimize());
el.btnClose.addEventListener('click', () => window.api.close());

function paintPin(on) {
  el.btnPin.classList.toggle('active', on);
  el.btnPin.title = t(on ? 'tip.pinOn' : 'tip.pinOff');
}

el.btnPin.addEventListener('click', async () => paintPin(await window.api.togglePin()));

el.opacity.addEventListener('input', () => {
  window.api.setOpacity(Number(el.opacity.value) / 100);
});

/* ---------- Xuyen chuot (click-through) ---------- */

el.btnThrough.addEventListener('click', () => window.api.toggleClickThrough());

function paintThrough(on) {
  document.body.classList.toggle('click-through', on);
  el.btnThrough.classList.toggle('through-on', on);
  el.btnThrough.textContent = on ? '👻' : '👆';
  el.btnThrough.title = hkState.toggle === 'ok'
    ? t(on ? 'tip.throughOn' : 'tip.throughOff', { key: label(hotkeys.toggle) })
    : t('tip.throughNoKey');
  el.throughHint.classList.toggle('hidden', !on);
}

window.api.onClickThroughChanged(paintThrough);

window.api.onHotkeyStatus(applyStatus);

/* ---------- Cai dat nang cao ---------- */

const IS_MAC = window.api.platform === 'darwin';

const ACTION_IDS = ['copy', 'toggle', 'undo', 'reset', 'show', 'panic'];

/* KeyboardEvent.code -> ten phim cua Electron accelerator */
const CODE_MAP = {
  Space: 'Space', Enter: 'Return', NumpadEnter: 'Return', Tab: 'Tab',
  Backspace: 'Backspace', Delete: 'Delete', Insert: 'Insert',
  Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown',
  ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  Semicolon: ';', Comma: ',', Period: '.', Slash: '/', Backslash: '\\',
  BracketLeft: '[', BracketRight: ']', Quote: "'", Backquote: '`',
  Minus: '-', Equal: '=',
  CapsLock: 'Capslock', NumLock: 'Numlock', ScrollLock: 'Scrolllock',
  PrintScreen: 'PrintScreen', Pause: 'Pause',
  NumpadDecimal: 'numdec', NumpadAdd: 'numadd', NumpadSubtract: 'numsub',
  NumpadMultiply: 'nummult', NumpadDivide: 'numdiv'
};
for (let i = 0; i <= 9; i++) {
  CODE_MAP[`Digit${i}`] = String(i);
  CODE_MAP[`Numpad${i}`] = `num${i}`;
}
for (let i = 1; i <= 24; i++) CODE_MAP[`F${i}`] = `F${i}`;
for (let i = 0; i < 26; i++) {
  const c = String.fromCharCode(65 + i);
  CODE_MAP[`Key${c}`] = c;
}

const META_KEY = IS_MAC ? 'Command' : 'Super';

/* Chuoi accelerator tu su kien ban phim, null neu moi bam phim bo tro */
function accelFrom(e) {
  const key = CODE_MAP[e.code];
  if (!key) return null;

  const mods = [];
  if (e.ctrlKey) mods.push('Control');
  if (e.altKey) mods.push('Alt');
  if (e.shiftKey) mods.push('Shift');
  if (e.metaKey) mods.push(META_KEY);

  return [...mods, key].join('+');
}

/* Nguoi dung go tay: "ctrl + shift + f" -> "Control+Shift+F" */
const MOD_ALIAS = {
  ctrl: 'Control', control: 'Control',
  alt: 'Alt', option: 'Alt', opt: 'Alt',
  shift: 'Shift',
  cmd: META_KEY, command: META_KEY, meta: META_KEY, win: META_KEY, super: META_KEY
};

function normalize(text) {
  const parts = String(text).split('+').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return '';

  const mods = [];
  let key = '';
  for (const p of parts) {
    const alias = MOD_ALIAS[p.toLowerCase()];
    if (alias) { if (!mods.includes(alias)) mods.push(alias); continue; }
    key = p;
  }
  if (!key) return '';

  // chuan hoa ten phim theo dung cach Electron viet
  const known = Object.values(CODE_MAP).find((v) => v.toLowerCase() === key.toLowerCase());
  if (known) key = known;
  else if (key.length === 1) key = key.toUpperCase();

  const order = ['Control', 'Alt', 'Shift', META_KEY];
  mods.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return [...mods, key].join('+');
}

/* Hien thi cho de doc */
function label(accel) {
  if (!accel) return t('key.unset');
  return String(accel)
    .replace('Control', 'Ctrl')
    .replace('Command', 'Cmd')
    .replace('Super', 'Win');
}

function hasModifier(accel) {
  return /(^|\+)(Control|Alt|Shift|Command|Super)\+/.test(accel);
}

let recording = null; // id chuc nang dang cho go phim
const fields = {};    // id -> nut hien phim

function buildRows() {
  const list = $('keys-list');
  list.innerHTML = '';

  for (const id of ACTION_IDS) {
    const row = document.createElement('div');
    row.className = 'key-row';

    const lbl = document.createElement('div');
    lbl.className = 'key-label';
    const b = document.createElement('b');
    b.textContent = t(`act.${id}`);
    const s = document.createElement('span');
    s.textContent = t(`act.${id}.d`);
    lbl.append(b, s);

    const ctl = document.createElement('div');
    ctl.className = 'key-ctl';

    const field = document.createElement('button');
    field.className = 'key-field';
    field.addEventListener('click', () => startRecording(id));

    const edit = document.createElement('button');
    edit.className = 'mini';
    edit.textContent = '✎';
    edit.addEventListener('click', () => typeAccel(id));

    const clear = document.createElement('button');
    clear.className = 'mini';
    clear.textContent = '✕';
    clear.addEventListener('click', () => commit(id, ''));

    ctl.append(field, edit, clear);
    row.append(lbl, ctl);
    list.appendChild(row);
    fields[id] = field;
  }
}

function paintFields() {
  for (const id of ACTION_IDS) {
    const f = fields[id];
    if (!f || recording === id) continue;
    const accel = hotkeys[id] || '';
    f.textContent = label(accel);
    f.classList.toggle('off', !accel);
    f.classList.toggle('bad', hkState[id] === 'fail');
  }
}

function paintOptions() {
  $('opt-opacity').checked = options.rememberOpacity !== false;
  $('opt-bounds').checked = options.rememberBounds !== false;
  $('opt-linemode').checked = options.lineMode === true;
}

function msg(text, kind) {
  if (!text) {
    el.keysMsg.className = 'keys-msg hidden';
    el.keysMsg.textContent = '';
    return;
  }
  el.keysMsg.className = `keys-msg ${kind || 'ok'}`;
  el.keysMsg.textContent = text;
}

async function startRecording(id) {
  if (recording) await stopRecording();
  recording = id;
  // nha phim tat toan cuc, neu khong no se nuot phim truoc khi cua so nhan duoc
  await window.api.captureStart();
  fields[id].classList.add('recording');
  fields[id].textContent = t('key.press');
  msg(t('msg.waiting'), 'ok');
}

async function stopRecording() {
  if (!recording) return;
  fields[recording].classList.remove('recording');
  recording = null;
  await window.api.captureEnd();
  paintFields();
}

/* Go tay to hop phim: doi nut thanh o nhap ngay tai cho
   (Electron khong ho tro window.prompt) */
async function typeAccel(id) {
  await stopRecording();
  const f = fields[id];
  if (!f.parentNode) return; // dang go tay roi

  const input = document.createElement('input');
  input.className = 'key-input';
  input.type = 'text';
  input.spellcheck = false;
  input.value = hotkeys[id] || '';
  input.placeholder = t('key.typePh');

  let closed = false;
  const close = (apply) => {
    if (closed) return;
    closed = true;
    const raw = input.value.trim();
    input.replaceWith(f);
    if (!apply) { msg(t('msg.cancelled'), 'ok'); return; }

    const accel = raw ? normalize(raw) : '';
    if (raw && !accel) { msg(t('msg.badCombo', { raw }), 'err'); return; }
    commit(id, accel);
  };

  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); close(true); }
    else if (e.key === 'Escape') { e.preventDefault(); close(false); }
  });
  input.addEventListener('blur', () => close(false));

  f.replaceWith(input);
  input.focus();
  input.select();
  msg(t('msg.typing'), 'ok');
}

async function commit(id, accel) {
  if (recording === id) {
    fields[id].classList.remove('recording');
    recording = null;
  }

  const next = { ...hotkeys, [id]: accel };
  const res = await window.api.setHotkeys(next);
  if (res.status) applyStatus(res.status);

  if (!res.ok) {
    if (res.code === 'dupe') msg(t('msg.dupe', { key: label(res.accel) }), 'err');
    else msg(t('msg.fail', { keys: (res.keys || []).map(label).join(', ') }), 'err');
    return;
  }

  if (!accel) {
    msg(t('msg.unset', { name: t(`act.${id}`) }), 'ok');
    return;
  }

  msg(t(hasModifier(accel) ? 'msg.set' : 'msg.setBare', { key: label(accel) }),
      hasModifier(accel) ? 'ok' : 'warn');
  toast(t('toast.hotkey', { key: label(accel) }));
}

/* Cap nhat toan bo giao dien theo trang thai tu main */
function paintHint() {
  const parts = [];
  parts.push(hkState.toggle === 'ok'
    ? t('hint.toggle', { key: label(hotkeys.toggle) })
    : t('hint.noToggle'));
  if (hkState.copy === 'ok') parts.push(t('hint.copy', { key: label(hotkeys.copy) }));
  el.hintKeys.textContent = parts.join('  |  ');
}

function applyStatus(s) {
  if (!s) return;
  const langBefore = options.lang;
  hotkeys = s.hotkeys || hotkeys;
  hkState = s.state || hkState;
  options = s.options || options;

  if (options.lang !== langBefore) { applyLang(); paintOptions(); return; }

  paintHint();
  paintThrough(document.body.classList.contains('click-through'));
  paintFields();
  paintOptions();
}

function openKeys() {
  el.keysPanel.classList.remove('hidden');
  paintFields();
  paintOptions();
  msg('');
}

async function closeKeys() {
  await stopRecording();
  el.keysPanel.classList.add('hidden');
  msg('');
}

el.btnKeys.addEventListener('click', openKeys);
el.keysClose.addEventListener('click', closeKeys);
el.keysPanel.addEventListener('mousedown', (e) => {
  if (e.target === el.keysPanel) closeKeys();
});

el.keysReset.addEventListener('click', async () => {
  await stopRecording();
  const res = await window.api.resetHotkeys();
  applyStatus(res.status);
  msg(t('msg.resetKeys'), 'ok');
});

$('opts-reset').addEventListener('click', async () => {
  await window.api.resetOptions();
  const s = await window.api.getHotkeys();
  applyStatus(s);
  el.opacity.value = 100;
  msg(t('msg.resetOpts'), 'ok');
});

for (const [elId, key] of [
  ['opt-opacity', 'rememberOpacity'],
  ['opt-bounds', 'rememberBounds'],
  ['opt-linemode', 'lineMode']
]) {
  $(elId).addEventListener('change', (e) => window.api.setOptions({ [key]: e.target.checked }));
}

/* Bat phim trong luc ghi - dung capture de chan moi handler khac */
window.addEventListener('keydown', (e) => {
  if (!recording) return;
  e.preventDefault();
  e.stopPropagation();

  if (e.code === 'Escape') { stopRecording(); msg(t('msg.cancelled'), 'ok'); return; }

  const accel = accelFrom(e);
  if (!accel) return; // moi bam Ctrl/Alt/Shift, cho phim chinh

  commit(recording, accel);
}, true);

/* ---------- Phim tat toan cuc goi ve ---------- */

window.api.onHotkeyCopyNext(() => {
  if (el.viewList.classList.contains('hidden')) return;
  const n = nextIndex();
  if (n >= 0) doCopy(n);
});

window.api.onHotkeyUndo(() => {
  if (el.viewList.classList.contains('hidden')) return;
  undo();
});

window.api.onHotkeyResetList(() => {
  if (el.viewList.classList.contains('hidden')) return;
  reset();
  toast(t('toast.reset'));
});


/* ---------- Macro ---------- */

const mac = {
  panel: $('macro-panel'),
  close: $('macro-close'),
  na: $('macro-na'),
  perm: $('macro-perm'),
  warn: $('macro-warn'),
  rec: $('macro-rec'),
  count: $('macro-count'),
  hint: $('macro-hint'),
  steps: $('macro-steps'),
  addPaste: $('macro-add-paste'),
  addCode: $('macro-add-code'),
  addWait: $('macro-add-wait'),
  clear: $('macro-clear'),
  gapMs: $('macro-gapms'),
  run: $('macro-run'),
  play: $('macro-play'),
  abort: $('macro-abort')
};

let macState = { available: false, why: '', recording: false, playing: false, steps: [], labels: [], gapMs: 400 };
let counting = false;
let macroLoops = 1; // tong so vong cua lan chay hien tai (so dong con lai giam dan nen khong dung duoc)

/* Nhan cho tung buoc - dung nhan tu main, rieng 2 loai nay dich o day */
function stepLabel(step, fallback) {
  if (step.t === 'code') return t('macro.stepCode');
  if (step.t === 'wait') return t('macro.stepWait', { ms: step.ms });
  return fallback;
}

function pendingCodes() {
  const out = [];
  for (let i = 0; i < items.length; i++) if (!copied.has(i)) out.push({ i, text: items[i] });
  return out;
}

function paintMacro() {
  const on = macState.available;

  mac.na.classList.toggle('hidden', on);
  if (!on) mac.na.textContent = t('macro.na', { why: macState.why || '?' });

  mac.perm.classList.toggle('hidden', !(on && IS_MAC));
  if (on && IS_MAC) mac.perm.textContent = t('macro.mac');

  mac.warn.textContent = t('macro.warn');

  mac.rec.textContent = macState.recording ? t('macro.recStop') : t('macro.rec');
  mac.rec.classList.toggle('rec-on', macState.recording);
  mac.rec.disabled = !on || macState.playing;

  mac.hint.classList.toggle('hidden', !macState.recording);
  mac.hint.textContent = `${t('macro.recHint')} ${t('macro.recAuto')}`;

  mac.count.textContent = t('macro.steps', { n: macState.steps.length });
  mac.addPaste.textContent = t('macro.addPaste');
  mac.addCode.textContent = t('macro.addCode');
  mac.addWait.textContent = t('macro.addWait');
  mac.clear.textContent = t('macro.clear');
  mac.abort.textContent = t('macro.abort');

  for (const b of [mac.addPaste, mac.addCode, mac.addWait, mac.clear]) {
    b.disabled = !on || macState.playing || macState.recording;
  }
  mac.addPaste.disabled = mac.addPaste.disabled || !macState.pasteStep;
  mac.gapMs.disabled = !on || macState.playing;

  // macro khong co buoc 'code' thi khong an dong nao -> chay duoc 1 vong du hang cho rong
  const needsCodes = macState.steps.some((s) => s.t === 'code');
  const n = pendingCodes().length;
  const loops = needsCodes ? n : 1;

  mac.play.textContent = t('macro.play', { n: loops });
  mac.play.disabled = !on || macState.playing || macState.recording || counting
                      || !macState.steps.length || (needsCodes && n === 0);
  mac.abort.classList.toggle('hidden', !macState.playing);

  // Noi thang ly do ngay tren bang, dung doi nguoi dung bam nut moi biet
  if (!runSticky && !macState.playing && !macState.recording && !counting) {
    if (!macState.steps.length) runMsg('');
    else if (needsCodes && n === 0) runMsg(t('macro.noCodes'), 'err');
    else if (!needsCodes) runMsg(t('macro.noCodeStep'), 'warn');
    else runMsg('');
  }

  buildStepList();
}

function buildStepList() {
  mac.steps.innerHTML = '';
  if (!macState.steps.length) {
    const p = document.createElement('p');
    p.className = 'panel-note';
    p.textContent = t('macro.empty');
    mac.steps.appendChild(p);
    return;
  }

  macState.steps.forEach((step, i) => {
    const row = document.createElement('div');
    row.className = 'mstep' + (step.t === 'code' ? ' is-code' : '');

    const idx = document.createElement('span');
    idx.className = 'idx';
    idx.textContent = String(i + 1);

    const txt = document.createElement('span');
    txt.className = 'text';
    txt.textContent = stepLabel(step, macState.labels[i] || step.t);

    const up = document.createElement('button');
    up.className = 'mini';
    up.textContent = '↑';
    up.disabled = i === 0;
    up.addEventListener('click', () => moveStep(i, -1));

    const dn = document.createElement('button');
    dn.className = 'mini';
    dn.textContent = '↓';
    dn.disabled = i === macState.steps.length - 1;
    dn.addEventListener('click', () => moveStep(i, 1));

    const rm = document.createElement('button');
    rm.className = 'mini';
    rm.textContent = '✕';
    rm.addEventListener('click', () => {
      const next = macState.steps.slice();
      next.splice(i, 1);
      saveSteps(next);
    });

    for (const b of [up, dn, rm]) b.disabled = b.disabled || macState.playing || macState.recording;

    row.append(idx, txt, up, dn, rm);
    mac.steps.appendChild(row);
  });
}

function moveStep(i, d) {
  const next = macState.steps.slice();
  const j = i + d;
  if (j < 0 || j >= next.length) return;
  [next[i], next[j]] = [next[j], next[i]];
  saveSteps(next);
}

async function saveSteps(steps) {
  runSticky = false;
  const st = await window.api.macroSet({ steps });
  macState = st;
  paintMacro();
}

/* sticky = ket qua mot lan chay, paintMacro khong duoc ghi de */
let runSticky = false;

function runMsg(text, kind, sticky) {
  runSticky = !!(text && sticky);
  if (!text) { mac.run.className = 'keys-msg hidden'; mac.run.textContent = ''; return; }
  mac.run.className = `keys-msg ${kind || 'ok'}`;
  mac.run.textContent = text;
}

/* ---------- Su kien macro ---------- */

$('btn-macro').addEventListener('click', async () => {
  macState = await window.api.macroGet();
  mac.gapMs.value = String(macState.gapMs);
  mac.panel.classList.remove('hidden');
  runSticky = false;
  runMsg('');
  paintMacro();
});

mac.close.addEventListener('click', async () => {
  if (macState.recording) macState = await window.api.macroRecordStop();
  mac.panel.classList.add('hidden');
});

mac.panel.addEventListener('mousedown', (e) => {
  if (e.target === mac.panel && !macState.playing) mac.close.click();
});

mac.rec.addEventListener('click', async () => {
  if (macState.recording) {
    macState = await window.api.macroRecordStop();
    runMsg('');
  } else {
    const r = await window.api.macroRecordStart();
    macState = r.status;
    runMsg('');
  }
  paintMacro();
});

/* Mot nut ra du ca cap: lay code + dan. Dung khi ghi khong bat duoc Ctrl+V. */
mac.addPaste.addEventListener('click', () => {
  if (!macState.pasteStep) return;
  saveSteps([...macState.steps, { t: 'code' }, macState.pasteStep]);
});

mac.addCode.addEventListener('click', () => saveSteps([...macState.steps, { t: 'code' }]));
mac.addWait.addEventListener('click', () => saveSteps([...macState.steps, { t: 'wait', ms: 500 }]));
mac.clear.addEventListener('click', () => saveSteps([]));

mac.gapMs.addEventListener('change', async () => {
  const v = Math.max(0, Math.min(10000, Number(mac.gapMs.value) || 0));
  mac.gapMs.value = String(v);
  macState = await window.api.macroSet({ gapMs: v });
  paintMacro();
});

mac.abort.addEventListener('click', () => window.api.macroAbort());

mac.play.addEventListener('click', async () => {
  const codes = pendingCodes();
  runSticky = false;
  const hasCodeStep = macState.steps.some((s) => s.t === 'code');
  if (hasCodeStep && !codes.length) { runMsg(t('macro.noCodes'), 'err'); return; }

  // dem nguoc de kip chuyen sang cua so game
  counting = true;
  paintMacro();
  for (let n = 3; n > 0; n--) {
    runMsg(t('macro.count', { n }), 'warn');
    await new Promise((r) => setTimeout(r, 1000));
  }
  counting = false;

  const loops = hasCodeStep ? codes.length : 1;
  macroLoops = loops;
  const res = await window.api.macroPlay({ codes, loops });

  if (res.stopped === 'out-of-codes') runMsg(t('macro.outOfCodes', { n: res.loops }), 'warn', true);
  else if (res.stopped === 'aborted') runMsg(t('macro.aborted', { n: res.loops }), 'warn', true);
  else if (res.ok) runMsg(t('macro.finished', { n: res.loops }), 'ok', true);
  else runMsg(String(res.error || '?'), 'err', true);

  macState = await window.api.macroGet();
  paintMacro();
});

window.api.onMacroStatus((st) => {
  const tick = st.tick;
  macState = st;
  if (st.playing && tick) {
    runMsg(t('macro.running', {
      loop: tick.loop + 1,
      loops: macroLoops,
      step: tick.step + 1,
      total: tick.total,
      key: label(hotkeys.panic)
    }), 'warn');
  }
  paintMacro();
});

/* Main bao da dan xong dong nao -> danh dau nhu vua copy */
window.api.onMacroCodeUsed((i) => {
  if (i < 0 || i >= items.length) return;
  if (!copied.has(i)) copied.add(i);
  copyStack = copyStack.filter((x) => x !== i);
  copyStack.push(i);
  paint();
});

/* ---------- Khoi dong ---------- */

applyLang();

window.api.getHotkeys().then((s) => {
  if (s && s.options) options = s.options;
  applyLang();
  applyStatus(s);
  if (options.lineMode && !el.lineMode.checked) {
    el.lineMode.checked = true;
  }
  if (options.rememberOpacity) {
    el.opacity.value = Math.round((options.opacity ?? 1) * 100);
  }
  refreshCount();
});

window.api.macroGet().then((st) => {
  macState = st;
  mac.gapMs.value = String(st.gapMs);
  paintMacro();
});

refreshCount();
el.input.focus();
