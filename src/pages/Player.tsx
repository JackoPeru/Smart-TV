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
    let cleanup: (() => void) | undefined

    if (url) {
      const svc = resolveServiceForUrl(url)
      const drmServices = new Set(['netflix','prime','disney'])
      const useDrm = !!(svc.key && drmServices.has(svc.key))
      setIsDrm(useDrm)
      if (useDrm && svc.key){
        const serviceKey = svc.key
        // Open via WebView2 host
        window.smartTV.drm.open({ service: serviceKey, url, sessionKey: serviceKey, display: 'primary', fullscreen: true })
        // Listen basic events for OSD
        const offEv = window.smartTV.drm.onEvent((ev) => {
          if (ev?.type === 'error'){
            // Fallback: open externally
            window.smartTV.openExternal(url)
          }
        })
        cleanup = () => { offEv?.() }
      } else {
        // Non-DRM: open in internal WebView route
        nav(`/webview?url=${encodeURIComponent(url)}`)
      }
    }

    return () => { cleanup?.() }
  }, [url])

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
          el.style.cssText = 'position:fixed;z-index:2147483647;left:0;top:0;width:16px;height:16px;border-radius:50%;background:rgba(102,217,239,0.9);box-shadow:0 0 10px rgba(102,217,239,0.7);pointer-events:none;transform:translate(-100px,-100px);';
          document.documentElement.appendChild(el);
        }
        el.style.transform = 'translate(' + (x-8) + 'px,' + (y-8) + 'px)';
      } catch {}
      const ev = new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true });
      document.dispatchEvent(ev);
    })();`
    try { window.smartTV.drm.exec(code) } catch {}
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
    try { window.smartTV.drm.exec(code) } catch {}
  }, [])

  // Remote bindings
  React.useEffect(() => {
    (async () => {
      try{
        const base = await window.smartTV.getRemoteURL()
        connectRemote(base)
        on('nav:back', () => nav(-1))
        on('home', () => nav('/'))
        on('play:toggle', () => { try { window.smartTV.drm.exec("document.dispatchEvent(new KeyboardEvent('keydown', {key:'k'})); document.dispatchEvent(new KeyboardEvent('keyup', {key:'k'}));") } catch {} })
        on('pad:move', ({dx, dy}) => {
          if (!isDrm) return
          const speed = 1.2
          cursorRef.current = { x: cursorRef.current.x + dx * speed, y: cursorRef.current.y + (-dy) * speed }
          const { x, y } = cursorRef.current
          injectMove(x, y)
        })
        on('pad:click', () => {
          if (!isDrm) return
          const { x, y } = cursorRef.current
          injectClick(x, y)
        })
      }catch{}
    })()
    return () => { off('nav:back'); off('home'); off('play:toggle'); off('pad:move'); off('pad:click') }
  }, [isDrm, injectMove, injectClick])

  return (
    <div style={{color:'#fff', padding: 24}}>
      <h2>Avvio riproduzione…</h2>
      <p>URL: {url}</p>
      <button onClick={()=> nav(-1)}>Indietro</button>
    </div>
  )
}