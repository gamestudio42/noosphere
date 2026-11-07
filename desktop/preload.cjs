// Minimal bridge: the page can ask the shell to quit, and nothing else.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('noosphereDesktop', {
  quit: () => ipcRenderer.send('noosphere:quit'),
});
