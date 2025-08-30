let ws: WebSocket | null = null
let handlers: Record<string, ()=>void> = {}

export function connectRemote(url: string){
  try {
    ws = new WebSocket(url.replace('http','ws'))
    ws.onmessage = (ev)=>{
      try{
        const {cmd} = JSON.parse(ev.data)
        handlers[cmd]?.()
      }catch(e){}
    }
  } catch {}
}

export function on(cmd: string, fn: ()=>void){ handlers[cmd] = fn }

// Helper to forward any command to a consumer (e.g., navigation)
export function onAny(fn: (cmd: string)=>void){
  // Wrap ws.onmessage to also emit to onAny
  const originalConnect = connectRemote
  // no-op: left simple to avoid breaking existing flow; consumer should attach in Player/App after connect
}