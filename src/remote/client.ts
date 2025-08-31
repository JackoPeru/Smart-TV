let ws: WebSocket | null = null
let handlers: Record<string, (payload?: any) => void> = {}
let anyHandlers: Array<(cmd: string, payload?: any) => void> = []
let lastURL = ''
let retryTimer: any = null
let retryDelay = 1000
let preferLocal = false
let hasEverOpened = false

function toWS(url: string){
  if (!/^https?:\/\//.test(url)) return url
  return url.replace(/^http/,'ws')
}

function toLocalWS(url: string){
  try {
    const u = new URL(url)
    const port = u.port || '80'
    return `ws://127.0.0.1:${port}`
  } catch { return url }
}

function clearRetry(){ if (retryTimer) { clearTimeout(retryTimer); retryTimer = null } }

function scheduleReconnect(){
  clearRetry()
  if (!lastURL) return
  retryTimer = setTimeout(() => {
    try { connectRemote(lastURL) } catch {}
  }, Math.min(retryDelay, 10000))
  retryDelay = Math.min(retryDelay * 2, 10000)
}

export function connectRemote(url: string){
  try {
    lastURL = url
    const external = toWS(url)
    const local = toLocalWS(url)
    const target = preferLocal ? local : external

    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return
    if (ws) { try { ws.close() } catch {} ; ws = null }
    clearRetry()
    // do not reset preferLocal; keep strategy across attempts

    ws = new WebSocket(target)
    ws.onopen = () => {
      console.info(`[remote] Connected to ${target}`)
      retryDelay = 1000
      hasEverOpened = true
    }
    ws.onmessage = (ev)=>{
      try{
        const {cmd, payload} = JSON.parse(ev.data)
        handlers[cmd]?.(payload)
        for (const fn of anyHandlers) fn(cmd, payload)
      }catch(e){ /* ignore malformed */ }
    }
    ws.onclose = () => {
      console.warn('[remote] Connection closed')
      ws = null
      // If we never managed to open yet, flip strategy (external <-> local)
      if (!hasEverOpened) preferLocal = !preferLocal
      scheduleReconnect()
    }
    ws.onerror = (err) => {
      console.warn('[remote] Connection error', err)
      try { ws?.close() } catch {}
      ws = null
      if (!hasEverOpened) preferLocal = !preferLocal
      scheduleReconnect()
    }
  } catch {}
}

export function on(cmd: string, fn: (payload?: any)=>void){ handlers[cmd] = fn }
export function off(cmd: string){ delete handlers[cmd] }

// Helper to forward any command to a consumer (e.g., navigation)
export function onAny(fn: (cmd: string, payload?: any)=>void){ anyHandlers.push(fn) }

export function disconnect(){
  try { ws?.close() } catch {} finally { ws = null }
  clearRetry()
  lastURL = ''
  retryDelay = 1000
  preferLocal = false
  hasEverOpened = false
}