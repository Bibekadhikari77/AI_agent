const { app, BrowserWindow, ipcMain, shell, Notification, Menu, Tray, nativeImage } = require('electron')
const path = require('path')
const Store = require('electron-store')
const fs = require('fs')

const store = new Store()

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

let mainWindow
let tray

function getIconPath(name) {
  const iconPath = path.join(__dirname, 'assets', name)
  return fs.existsSync(iconPath) ? iconPath : undefined
}

function getFrontendIndexPath() {
  const basePath = app.isPackaged
    ? path.join(process.resourcesPath, 'frontend', 'dist')
    : path.join(__dirname, '..', 'frontend', 'dist')

  return path.join(basePath, 'index.html')
}

// ─── Create Main Window ──────────────────────────────────────────────────
function createWindow() {
  const { width, height } = store.get('windowBounds', { width: 1280, height: 820 })

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 900,
    minHeight: 600,
    x: store.get('windowX'),
    y: store.get('windowY'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev
    },
    backgroundColor: '#0A0A0F',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: getIconPath('icon.png'),
    show: false,
    frame: true,
    title: 'ARIA — AI Desktop Agent'
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL(FRONTEND_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(getFrontendIndexPath())
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // Save window bounds
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds()
    store.set('windowBounds', { width: bounds.width, height: bounds.height })
    store.set('windowX', bounds.x)
    store.set('windowY', bounds.y)
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// ─── System Tray ────────────────────────────────────────────────────────
function createTray() {
  const iconPath = getIconPath('tray-icon.png')
  if (!iconPath) return
  tray = new Tray(nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    { label: 'ARIA AI Agent', enabled: false },
    { type: 'separator' },
    { label: 'Show Window', click: () => { mainWindow.show(); mainWindow.focus() } },
    { label: 'Hide Window', click: () => mainWindow.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuiting = true; app.quit() } }
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('ARIA AI Desktop Agent')
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus() })
}

// ─── IPC Handlers ───────────────────────────────────────────────────────
// Open URL in default browser
ipcMain.handle('open-external-url', async (event, url) => {
  await shell.openExternal(url)
  return { success: true }
})

// System notification
ipcMain.handle('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: getIconPath('icon.png') }).show()
  }
})

// Get app version
ipcMain.handle('get-version', () => app.getVersion())

// Store operations
ipcMain.handle('store-get', (event, key) => store.get(key))
ipcMain.handle('store-set', (event, key, value) => { store.set(key, value); return true })
ipcMain.handle('store-delete', (event, key) => { store.delete(key); return true })

// Minimize/maximize/close controls
ipcMain.on('window-minimize', () => mainWindow.minimize())
ipcMain.on('window-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
})
ipcMain.on('window-close', () => mainWindow.close())

// ─── App Lifecycle ───────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()

  // Create tray (optional — skip if no assets)
  try { createTray() } catch (_) {}

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  app.isQuiting = true
})

// Security: prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })
})
