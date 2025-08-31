import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'node:path'
import { startRemoteServer, getRemoteURL } from '../src/remote/server'
import { spawn } from 'child_process'
import net from 'net'

const isDev = !!process.env.ELECTRON_RENDERER_URL

// Disabilita pinch-zoom a livello di Chromium per evitare rimpicciolimenti accidentali
app.commandLine.appendSwitch('disable-pinch')

let win: BrowserWindow | null = null

// DRM bridge state
let hostProc: any = null
let pipe: net.Socket | null = null
// Percorso corretto delle Named Pipe in Windows: \\.\pipe\smarttv_webview2
const PIPE_NAME = "\\\\.\\pipe\\smarttv_webview2"

function killHost() {
  try { pipe?.destroy() } catch {}
  pipe = null
  try { hostProc?.kill?.() } catch {}
  hostProc = null
}

function connectPipe(): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    console.log('Attempting to connect to DRM host pipe at', PIPE_NAME)
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
      socket.on('close', () => {
        console.warn('DRM host pipe closed')
      })
      resolve()
    })
    socket.on('error', (err) => {
      console.error('Pipe connection error:', err)
      reject(err)
    })
  })
}

async function connectPipeWithRetry(retries = 15, delayMs = 200): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Connecting to DRM host pipe (attempt ${i + 1}/${retries})...`)
      await connectPipe()
      return
    } catch (err) {
      console.warn('Failed to connect to DRM host pipe:', (err as Error)?.message || err)
      // Se l'host non è avviato o è terminato, rilancialo
      if (!hostProc) spawnHost()
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  // Dopo i tentativi falliti, uccidi l'host per evitare finestra nera persistente
  killHost()
  throw new Error(`Failed to connect to DRM host pipe after ${retries} attempts`)
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
  console.log('Spawning WebView2 host:', exePath)
  const child = spawn(exePath, [], { stdio: 'inherit' })
  hostProc = child
  child.on('exit', (code) => {
    console.log('WebView2 host exited with code', code)
    hostProc = null
    try { pipe?.destroy() } catch {}
    pipe = null
  })
}

function createWindow() {
  win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#000000',
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.on('ready-to-show', () => {
    win?.show()
  })

  win.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {})
  win.webContents.setZoomFactor(1.0)
}

app.whenReady().then(async () => {
  console.log('App ready, starting remote server...')
  const fixedPort = parseInt(process.env.SMARTTV_REMOTE_PORT || '', 10) || 64028
  const port = await startRemoteServer(fixedPort)
  console.log('Remote server started on port:', port)
  createWindow()
  ipcMain.handle('remote:get-url', () => getRemoteURL(port))

  // DRM bridge
  ipcMain.handle('drm:open', async (_e, opts) => {
    // lazy spawn and connect
    if (!hostProc) spawnHost()
    if (!pipe) await connectPipeWithRetry(15, 200)
    sendToHost({ type: 'open', ...opts })
  })
  ipcMain.handle('drm:nav', (_e, { cmd }) => sendToHost({ type: 'nav', cmd }))
  ipcMain.handle('drm:exec', (_e, { code }) => sendToHost({ type: 'exec', code }))
  ipcMain.handle('drm:postMessage', (_e, { payload }) => sendToHost({ type: 'postMessage', payload }))
  ipcMain.handle('drm:close', () => {
    if (pipe) sendToHost({ type: 'close' })
    else killHost()
  })
  ipcMain.handle('drm:kill', () => {
    killHost()
  })

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