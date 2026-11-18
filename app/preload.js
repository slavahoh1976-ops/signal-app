// мост между программой и оболочкой: версия оболочки и ручная проверка обновлений
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('SIGNAL_DESKTOP', {
  shell: require('./package.json').version,
  platform: process.platform,
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
});
