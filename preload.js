const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  copy: (text) => ipcRenderer.invoke('clipboard:write', text),
  minimize: () => ipcRenderer.invoke('win:minimize'),
  close: () => ipcRenderer.invoke('win:close'),
  togglePin: () => ipcRenderer.invoke('win:toggle-pin'),
  setOpacity: (v) => ipcRenderer.invoke('win:set-opacity', v),

  toggleClickThrough: () => ipcRenderer.invoke('win:toggle-click-through'),
  onClickThroughChanged: (fn) => ipcRenderer.on('click-through:changed', (_e, on) => fn(on)),
  onHotkeyStatus: (fn) => ipcRenderer.on('hotkey:status', (_e, s) => fn(s)),

  // Phim tat toan cuc goi nguoc ve renderer
  onHotkeyCopyNext: (fn) => ipcRenderer.on('hotkey:copy-next', () => fn()),
  onHotkeyUndo: (fn) => ipcRenderer.on('hotkey:undo', () => fn()),
  onHotkeyResetList: (fn) => ipcRenderer.on('hotkey:reset-list', () => fn()),

  // Cai dat nang cao
  platform: process.platform,
  getHotkeys: () => ipcRenderer.invoke('hotkey:get'),
  setHotkeys: (v) => ipcRenderer.invoke('hotkey:set', v),
  resetHotkeys: () => ipcRenderer.invoke('hotkey:reset'),
  captureStart: () => ipcRenderer.invoke('hotkey:capture-start'),
  captureEnd: () => ipcRenderer.invoke('hotkey:capture-end'),
  setOptions: (v) => ipcRenderer.invoke('options:set', v),
  resetOptions: () => ipcRenderer.invoke('options:reset'),

  // Macro
  macroGet: () => ipcRenderer.invoke('macro:get'),
  macroRecordStart: () => ipcRenderer.invoke('macro:record-start'),
  macroRecordStop: () => ipcRenderer.invoke('macro:record-stop'),
  macroSet: (v) => ipcRenderer.invoke('macro:set', v),
  macroPlay: (v) => ipcRenderer.invoke('macro:play', v),
  macroAbort: () => ipcRenderer.invoke('macro:abort'),
  onMacroStatus: (fn) => ipcRenderer.on('macro:status', (_e, s) => fn(s)),
  onMacroCodeUsed: (fn) => ipcRenderer.on('macro:code-used', (_e, i) => fn(i)),

  // Danh sach gift code lay tu mang
  codesGet: () => ipcRenderer.invoke('codes:get'),
  codesEnsure: () => ipcRenderer.invoke('codes:ensure'),
  codesRefresh: () => ipcRenderer.invoke('codes:refresh')
});
