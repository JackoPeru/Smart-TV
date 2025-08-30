import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'node:path'
import { startRemoteServer, getRemoteURL } from '../src/remote/server'

let win: BrowserWindow | null = null
const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !isDev, // Windowed mode in development for easier debugging
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Disable sandbox for debugging
      webSecurity: false, // Disable web security for debugging
    },
  })

  // Debug: Enable DevTools automatically in development
  if (isDev) {
    win.webContents.openDevTools()
    console.log('DevTools opened in development mode')
  }

  // Debug: Add detailed logging for page load events
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load page: ${errorCode} - ${errorDescription} - ${validatedURL}`)
  })

  win.webContents.on('did-finish-load', () => {
    console.log('Page finished loading')
  })

  win.webContents.on('dom-ready', () => {
    console.log('DOM is ready')
    // Inject debug script to check if React is loading
    win?.webContents.executeJavaScript(`
      console.log('ELECTRON INJECTED: DOM ready, checking elements...');
      console.log('ELECTRON INJECTED: Root element:', document.getElementById('root'));
      console.log('ELECTRON INJECTED: Body innerHTML length:', document.body.innerHTML.length);
      console.log('ELECTRON INJECTED: First 500 chars:', document.body.innerHTML.substring(0, 500));
    `)
  })

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`RENDERER CONSOLE [${level}]: ${message} (${sourceId}:${line})`)
  })

  const url = process.env.ELECTRON_RENDERER_URL
  if (url) {
    console.log('Loading renderer URL:', url)
    win.loadURL(url)
  } else {
    const htmlPath = join(__dirname, '../renderer/index.html')
    console.log('Loading HTML file:', htmlPath)
    win.loadFile(htmlPath)
  }

  win.on('closed', () => { win = null })
}

app.whenReady().then(async () => {
  console.log('App ready, starting remote server...')
  const port = await startRemoteServer()
  console.log('Remote server started on port:', port)
  createWindow()
  ipcMain.handle('remote:get-url', () => getRemoteURL(port))

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('open-external', (_e, target: string) => {
  shell.openExternal(target)
})