import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'node:path'
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process'
import { startRemoteServer, getRemoteURL } from '../src/remote/server'
import * as net from 'node:net'

let win: BrowserWindow | null = null
const isDev = process.env.NODE_ENV === 'development'

// Optional Widevine setup via env vars (does nothing if not provided)
const widevinePath = process.env.WIDEVINE_CDM_PATH
const widevineVersion = process.env.WIDEVINE_CDM_VERSION
if (widevinePath) {
  try {
    app.commandLine.appendSwitch('widevine-cdm-path', widevinePath)
    if (widevineVersion) app.commandLine.appendSwitch('widevine-cdm-version', widevineVersion)
    console.log('Widevine configured from env path:', widevinePath)
  } catch (e) {
    console.warn('Widevine configuration failed:', e)
  }
}

let hostProc: ChildProcessWithoutNullStreams | null = null
let pipe: net.Socket | null = null
const PIPE_NAME = `\\.\pipe\smarttv_webview2` as const

function connectPipe(): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    socket.connect(PIPE_NAME as any, () => {
      pipe = socket
      pipe.setEncoding('utf8')
      console.log('Connected to WebView2 host pipe')
      // Start read loop
      let buffer = ''
      socket.on('data', (chunk) => {
        buffer += chunk.toString('utf8')
        let idx
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 1)
          try {
            const evt = JSON.parse(line)
            win?.webContents.send('drm:event', evt)
          } catch (e) {
            console.warn('Invalid event from DRM host:', e)
          }
        }
      })
      resolve()
    })
    socket.on('error', reject)
  })
}

function sendToHost(payload: any) {
  if (!pipe) throw new Error('DRM host not connected')
  pipe.write(JSON.stringify(payload) + '\n')
}

function spawnHost() {
  if (hostProc) return
  const exePath = isDev
    ? join(process.cwd(), 'win-host', 'SmartTV.WebView2Host', 'bin', 'Debug', 'net8.0-windows', 'SmartTV.WebView2Host.exe')
    : join(process.resourcesPath, 'win-host', 'SmartTV.WebView2Host', 'SmartTV.WebView2Host.exe')
  hostProc = spawn(exePath, [], { stdio: 'inherit' })
  hostProc.on('exit', (code) => {
    console.log('WebView2 host exited with code', code)
    hostProc = null
    pipe?.destroy()
    pipe = null
  })
}

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
      webviewTag: true,
      sandbox: !isDev, // Enable in prod
      webSecurity: !isDev, // Enable in prod
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

  // DRM bridge
  ipcMain.handle('drm:open', async (_e, opts) => {
    // lazy spawn and connect
    if (!hostProc) spawnHost()
    if (!pipe) await connectPipe()
    sendToHost({ type: 'open', ...opts })
  })
  ipcMain.handle('drm:nav', (_e, { cmd }) => sendToHost({ type: 'nav', cmd }))
  ipcMain.handle('drm:exec', (_e, { code }) => sendToHost({ type: 'exec', code }))
  ipcMain.handle('drm:postMessage', (_e, { payload }) => sendToHost({ type: 'postMessage', payload }))
  ipcMain.handle('drm:close', () => sendToHost({ type: 'close' }))

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