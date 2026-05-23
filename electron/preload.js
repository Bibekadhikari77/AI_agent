const { contextBridge, ipcRenderer } = require('electron')

// Expose secure Electron APIs to the renderer (React app)
contextBridge.exposeInMainWorld('electron', {
  // Open URL in default browser
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),

  // System notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),

  // App version
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Persistent store
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value),
    delete: (key) => ipcRenderer.invoke('store-delete', key)
  },

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Platform info
  platform: process.platform,
  isElectron: true
})
