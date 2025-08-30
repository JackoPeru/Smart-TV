let ws: WebSocket | null = null
let handlers: Record<string, (payload?: any) => void> = {}
let anyHandlers: Array<(cmd: string, payload?: any) => void> = []

export function connectRemote(url: string){
  try {
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return
    ws = new WebSocket(url.replace('http','ws'))
    ws.onmessage = (ev)=>{
      try{
        const {cmd, payload} = JSON.parse(ev.data)
        handlers[cmd]?.(payload)
        for (const fn of anyHandlers) fn(cmd, payload)
      }catch(e){}
    }
    ws.onclose = () => { ws = null }
    ws.onerror = () => {}
  } catch {}
}

export function on(cmd: string, fn: (payload?: any)=>void){ handlers[cmd] = fn }
export function off(cmd: string){ delete handlers[cmd] }

// Helper to forward any command to a consumer (e.g., navigation)
export function onAny(fn: (cmd: string, payload?: any)=>void){ anyHandlers.push(fn) }

export function disconnect(){ try { ws?.close() } catch {} finally { ws = null } }