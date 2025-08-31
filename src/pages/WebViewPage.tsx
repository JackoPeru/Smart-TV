import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { resolveServiceForUrl } from '../services/adapters'
import { connectRemote, on, off } from '../remote/client'

export default function WebViewPage(){
  const [params] = useSearchParams()
  const nav = useNavigate()
  const webviewRef = React.useRef<Electron.WebviewTag | null>(null)
  const overlayRef = React.useRef<HTMLDivElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const webviewReadyRef = React.useRef(false)

  // Cursor state in pixels relative to container
  const cursorPos = React.useRef({ x: 200, y: 200 })

  const isElectron = React.useMemo(() => {
    return (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron')) || !!(window as any).smartTV
  }, [])

  const urlParam = params.get('url') || ''

  // Se non c'è URL, torna alla home
  React.useEffect(() => {
    if (!urlParam) nav('/')
  }, [urlParam, nav])

  // Calcola configurazione
  const config = React.useMemo(() => {
    if (!urlParam) return { ua: undefined as string | undefined, partition: 'persist:apps', allowedHosts: [] as string[] }
    try {
      const conf = resolveServiceForUrl(urlParam)
      const ua = params.get('ua') || conf.tvUserAgent
      const partition = `persist:${conf.partition || 'apps'}`
      const allowedHosts = conf.allowedHosts && conf.allowedHosts.length > 0
        ? conf.allowedHosts
        : [new URL(urlParam).hostname]
      return { ua: ua || undefined, partition, allowedHosts }
    } catch {
      try {
        const host = new URL(urlParam).hostname
        return { ua: undefined, partition: 'persist:apps', allowedHosts: [host] }
      } catch {
        return { ua: undefined, partition: 'persist:apps', allowedHosts: [] }
      }
    }
  }, [urlParam, params])

  // Helpers for cursor overlay and event injection
  const updateOverlay = React.useCallback(() => {
    const overlay = overlayRef.current
    const container = containerRef.current
    if (!overlay || !container) return
    overlay.style.transform = `translate(${cursorPos.current.x}px, ${cursorPos.current.y}px)`
  }, [])

  const clampToContainer = React.useCallback((x: number, y: number) => {
    const container = containerRef.current
    if (!container) return { x, y }
    const rect = container.getBoundingClientRect()
    const maxX = Math.max(0, rect.width - 1)
    const maxY = Math.max(0, rect.height - 1)
    return { x: Math.max(0, Math.min(maxX, x)), y: Math.max(0, Math.min(maxY, y)) }
  }, [])

  const injectMouseMove = React.useCallback((x: number, y: number) => {
    const tag = webviewRef.current
    if (!tag || !webviewReadyRef.current) return
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
    try { tag.executeJavaScript(code, false) } catch {}
  }, [])

  const injectMouseClick = React.useCallback((x: number, y: number) => {
    const tag = webviewRef.current
    if (!tag || !webviewReadyRef.current) return
    const code = `(() => {
      const x=${Math.round(x)}, y=${Math.round(y)};
      const opts = { clientX: x, clientY: y, bubbles: true };
      const target = document.elementFromPoint(x, y) || document.body;
      try { target.dispatchEvent(new MouseEvent('mousemove', opts)); } catch {}
      try { target.dispatchEvent(new MouseEvent('mousedown', opts)); } catch {}
      try { target.dispatchEvent(new MouseEvent('mouseup', opts)); } catch {}
      try { if (target && typeof target.click === 'function') target.click(); } catch {}
    })();`
    try { tag.executeJavaScript(code, false) } catch {}
  }, [])

  const injectScroll = React.useCallback((dx: number, dy: number) => {
    const tag = webviewRef.current
    if (!tag || !webviewReadyRef.current) return
    const code = `(() => {
      try {
        window.scrollBy({ left: ${Math.round(dx)}, top: ${Math.round(dy)}, behavior: 'auto' });
      } catch {}
    })();`
    try { tag.executeJavaScript(code, false) } catch {}
  }, [])

  React.useEffect(() => {
    if (!isElectron) return
    const container = containerRef.current
    if (!container) return

    const tag = document.createElement('webview')
    tag.style.width = '100%'
    tag.style.height = '100%'
    tag.style.border = '0'
    tag.setAttribute('src', urlParam)
    tag.setAttribute('allowpopups', 'true')
    if (config.partition) tag.setAttribute('partition', config.partition)

    const onNewWindow = (e: any) => {
      const url = e.url as string
      window.smartTV.openExternal(url)
      e.preventDefault?.()
    }
    const onWillNavigate = (e: any) => {
      const url = e.url as string
      const host = new URL(url).host
      if (config.allowedHosts.length && !config.allowedHosts.includes(host)) {
        window.smartTV.openExternal(url)
        e.preventDefault?.()
      }
    }
    const onDomReady = () => {
      webviewReadyRef.current = true
      try { tag.insertCSS('html,body{height:100%;} ::-webkit-scrollbar{display:none;} body{overscroll-behavior:none; touch-action:none !important;}') } catch {}
      try { tag.executeJavaScript('document.addEventListener("wheel", e=>{ if(e.ctrlKey){ e.preventDefault(); } }, {passive:false});', false) } catch {}
    }

    tag.addEventListener('new-window', onNewWindow as any)
    tag.addEventListener('will-navigate', onWillNavigate as any)
    tag.addEventListener('dom-ready', onDomReady as any)

    container.appendChild(tag as any)
    webviewRef.current = tag

    ;(async () => {
      try{
        const base = await window.smartTV.getRemoteURL()
        connectRemote(base)
        // TRACKPAD: move cursor and inject mouse events
        on('pad:move', ({dx, dy}: {dx:number, dy:number}) => {
          const cont = containerRef.current
          if (!cont) return
          const speed = 1.4
          const nx = cursorPos.current.x + (dx * speed)
          const ny = cursorPos.current.y + ((-dy) * speed)
          const clamped = clampToContainer(nx, ny)
          cursorPos.current = clamped
          updateOverlay()
          injectMouseMove(clamped.x, clamped.y)
        })
        on('pad:click', () => {
          const { x, y } = cursorPos.current
          injectMouseClick(x, y)
        })
        // Scroll remoto (es. due dita sul trackpad mobile)
        on('pad:scroll', ({dx, dy}: {dx:number, dy:number}) => {
          injectScroll(dx, dy)
        })
        on('nav:back', () => { try { tag.goBack() } catch {} })
        on('play:toggle', () => {
          if (!webviewReadyRef.current) return
          try {
            tag.executeJavaScript(`document.dispatchEvent(new KeyboardEvent('keydown',{key:' '}));document.dispatchEvent(new KeyboardEvent('keyup',{key:' '}));`, false)
          } catch {}
        })
        on('menu', () => { if (!webviewReadyRef.current) return; try { tag.openDevTools() } catch {} })
      }catch{}
    })()

    return () => {
      tag.removeEventListener('new-window', onNewWindow as any)
      tag.removeEventListener('will-navigate', onWillNavigate as any)
      tag.removeEventListener('dom-ready', onDomReady as any)
      ;(tag as any).remove?.()
      off('pad:move'); off('pad:click'); off('pad:scroll'); off('nav:back'); off('play:toggle'); off('menu')
      webviewReadyRef.current = false
      webviewRef.current = null
    }
  }, [isElectron, config.allowedHosts, config.partition, config.ua, urlParam, clampToContainer, injectMouseMove, injectMouseClick, injectScroll, updateOverlay])

  if (!isElectron) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
        <div style={{ color: '#fff', padding: 20 }}>Questa pagina richiede Electron.</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      {/* Cursor overlay in renderer */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: 'rgba(102,217,239,0.9)',
          boxShadow: '0 0 12px rgba(102,217,239,0.8)',
          pointerEvents: 'none',
          transform: `translate(${cursorPos.current.x}px, ${cursorPos.current.y}px)`,
          transition: 'transform 36ms linear',
          zIndex: 10,
        }}
      />
    </div>
  )
}