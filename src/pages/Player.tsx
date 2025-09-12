import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { resolveServiceForUrl } from '../services/adapters'
import { connectRemote, on, off } from '../remote/client'

export default function Player(){
  const loc = useLocation()
  const nav = useNavigate()
  const params = new URLSearchParams(loc.search)
  const url = params.get('url') || ''

  const [isDrm, setIsDrm] = React.useState(false)
  const cursorRef = React.useRef({ x: 200, y: 200 })

  React.useEffect(() => {
    const api: any = (window as any).smartTV
    let cleanup: (() => void) | undefined
    let startTimeout: any
    let removeHandler: (() => void) | undefined

    if (url) {
      const svc = resolveServiceForUrl(url)
      const drmServices = new Set(['netflix','prime','disney'])
      const useDrm = !!(svc.key && drmServices.has(svc.key))
      setIsDrm(useDrm)
      if (useDrm && svc.key){
        const serviceKey = svc.key
        // Se l'API preload non è disponibile, evita crash e fai fallback
        if (!api?.drm) {
          try {
            if (api?.openExternal) { api.openExternal(url) } else { window.open(url, '_blank') }
          } catch {}
          // Torna alla home per coerenza dell'app
          try { nav('/') } catch {}
          return
        }
        // Open via WebView2 host
        try { api.drm.open({ service: serviceKey, url, sessionKey: serviceKey, display: 'primary', fullscreen: true, userAgent: svc.tvUserAgent }) } catch {}
        // Startup safety timeout: if no events after 8s, close and fallback
        startTimeout = setTimeout(() => {
          try { api.drm.close() } catch {}
          try { api.openExternal?.(url) } catch { try { window.open(url, '_blank') } catch {} }
        }, 8000)
        // Listen basic events for OSD and mark as started
        const offEv = api.drm.onEvent((ev: any) => {
          if (ev?.type === 'navigated' || ev?.type === 'ready'){
            try { clearTimeout(startTimeout) } catch {}
          }
          if (ev?.type === 'error'){
            try { clearTimeout(startTimeout) } catch {}
            // Fallback: open externally
            try { api.openExternal?.(url) } catch { try { window.open(url, '_blank') } catch {} }
          }
        })
        removeHandler = offEv
        // Ensure DRM host is closed when leaving the Player page or unloading window
        cleanup = () => { try { clearTimeout(startTimeout) } catch {}; try { removeHandler?.() } catch {}; try { api.drm.close() } catch {} }
        window.addEventListener('beforeunload', cleanup)
      } else {
        // Non-DRM: open in internal WebView route
        nav(`/webview?url=${encodeURIComponent(url)}`)
      }
    }

    return () => { try { cleanup?.() } finally { if (cleanup) window.removeEventListener('beforeunload', cleanup as any) } }
  }, [url, nav])

  // Helpers to inject cursor events into DRM page
  const injectMove = React.useCallback((x: number, y: number) => {
    const code = `(() => {
      const x=${Math.round(x)}, y=${Math.round(y)};
      try {
        const id='__smarttv_cursor';
        let el = document.getElementById(id);
        if (!el) {
          el = document.createElement('div');
          el.id = id;
          el.style.cssText = 'position:fixed;z-index:2147483647;left:0;top:0;width:22px;height:22px;border-radius:50%;background:rgba(102,217,239,0.9);box-shadow:0 0 12px rgba(102,217,239,0.8);pointer-events:none;transform:translate(-100px,-100px);';
          document.documentElement.appendChild(el);
        }
        el.style.transform = 'translate(' + (x-11) + 'px,' + (y-11) + 'px)';
      } catch {}
      const ev = new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true });
      document.dispatchEvent(ev);
    })();`
    try { (window as any).smartTV?.drm?.exec(code) } catch {}
  }, [])

  const injectClick = React.useCallback((x: number, y: number) => {
    const code = `(() => {
      const x=${Math.round(x)}, y=${Math.round(y)};
      const opts = { clientX: x, clientY: y, bubbles: true };
      const target = document.elementFromPoint(x, y) || document.body;
      try { target.dispatchEvent(new MouseEvent('mousemove', opts)); } catch {}
      try { target.dispatchEvent(new MouseEvent('mousedown', opts)); } catch {}
      try { target.dispatchEvent(new MouseEvent('mouseup', opts)); } catch {}
      try { if (target && typeof target.click === 'function') target.click(); } catch {}
    })();`
    try { (window as any).smartTV?.drm?.exec(code) } catch {}
  }, [])

  // Helper to inject keyboard events into DRM pages
  const injectKey = React.useCallback((key: string) => {
    const code = `(() => {
      try {
        const k = ${JSON.stringify(key)};
        const down = new KeyboardEvent('keydown', { key: k, bubbles: true });
        const up = new KeyboardEvent('keyup', { key: k, bubbles: true });
        document.dispatchEvent(down);
        document.dispatchEvent(up);
      } catch {}
    })();`
    try { (window as any).smartTV?.drm?.exec(code) } catch {}
  }, [])

  // Remote bindings
  React.useEffect(() => {
    (async () => {
      const api: any = (window as any).smartTV
      try{
        if (!api?.getRemoteURL) return
        const base = await api.getRemoteURL()
        connectRemote(base)
        // Previeni zoom nella pagina DRM (Ctrl +/−/0 o pinch)
        try { api.drm?.exec(`document.addEventListener('wheel', e=>{ if(e.ctrlKey){ e.preventDefault(); } }, {passive:false});`) } catch {}
        // Navigation/back/home must also control DRM host lifecycle
        on('nav:back', () => { try { api.drm?.close() } catch {} ; nav(-1) })
        on('home', () => { try { api.drm?.close() } catch {} ; nav('/') })
        // Playback toggle (try YouTube-style "k" as fallback)
        on('play:toggle', () => { try { api.drm?.exec("document.dispatchEvent(new KeyboardEvent('keydown', {key:'k'})); document.dispatchEvent(new KeyboardEvent('keyup', {key:'k'}));") } catch {} })
        // Trackpad
        on('pad:move', ({dx, dy}) => {
          if (!isDrm) return
          const speed = 1.4
          cursorRef.current = { x: cursorRef.current.x + dx * speed, y: cursorRef.current.y + (-dy) * speed }
          const { x, y } = cursorRef.current
          injectMove(x, y)
        })
        on('pad:click', () => {
          if (!isDrm) return
          const { x, y } = cursorRef.current
          injectClick(x, y)
        })
        // D-Pad → keyboard arrows/enter in DRM page
        on('nav:up', () => { if (isDrm) injectKey('ArrowUp') })
        on('nav:down', () => { if (isDrm) injectKey('ArrowDown') })
        on('nav:left', () => { if (isDrm) injectKey('ArrowLeft') })
        on('nav:right', () => { if (isDrm) injectKey('ArrowRight') })
        on('nav:ok', () => { if (isDrm) injectKey('Enter') })
      }catch{}
    })()
    return () => {
      off('nav:back'); off('home'); off('play:toggle'); off('pad:move'); off('pad:click');
      off('nav:up'); off('nav:down'); off('nav:left'); off('nav:right'); off('nav:ok')
    }
  }, [isDrm, injectMove, injectClick, injectKey, nav])

  return (
    <div style={{color:'#fff', padding: 24}}>
      <h2>Avvio riproduzione…</h2>
      <p>URL: {url}</p>
      <button onClick={()=> { try { (window as any).smartTV?.drm?.close() } catch {} ; nav(-1) }}>Indietro</button>
    </div>
  )
}