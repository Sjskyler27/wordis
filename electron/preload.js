const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('steam', {
  unlockAchievement: (id) => ipcRenderer.invoke('unlock-achievement', id),

});

contextBridge.exposeInMainWorld('electron', {
  quitApp: () => ipcRenderer.send('quit-app')
});