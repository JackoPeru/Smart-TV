import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { resolveServiceForUrl } from '../services/adapters'
import { Html5Engine } from '../player/Html5Engine'
import { connectRemote, on } from '../remote/client'

export default function Player(){
  const loc = useLocation()
  const nav = useNavigate()
  const params = new URLSearchParams(loc.search)
  const url = params.get('url') || ''

  React.useEffect(() => {
    if (!url) return
    const svc = resolveServiceForUrl(url)
    const drmServices = new Set(['netflix','prime','disney'])
    if (svc.key && drmServices.has(svc.key)){
      // Open via WebView2 host
      window.smartTV.drm.open({ service: svc.key, url, sessionKey: svc.key, display: 'primary', fullscreen: true })
      // Listen basic events for OSD
      const off = window.smartTV.drm.onEvent((ev) => {
        if (ev?.type === 'error'){
          // Fallback: open externally
          window.smartTV.openExternal(url)
        }
      })
      return () => { off?.() }
    } else {
      // Non-DRM: open in internal WebView route
      nav(`/webview?url=${encodeURIComponent(url)}`)
    }
  }, [url])

  return (
    <div style={{color:'#fff', padding: 24}}>
      <h2>Avvio riproduzione…</h2>
      <p>URL: {url}</p>
      <button onClick={()=> nav(-1)}>Indietro</button>
    </div>
  )
}

import { Html5Engine } from '../player/Html5Engine'
import { connectRemote, on } from '../remote/client'

export default function Player(){
  const [params] = useSearchParams()
  const nav = useNavigate()
  const ref = React.useRef<HTMLDivElement>(null)
  const engine = React.useRef(new Html5Engine())
  const volRef = React.useRef(0.7)

  React.useEffect(()=>{
    const file = params.get('file')
    const url = params.get('url')
    
    if (file) {
      // Local media file - use HTML5 video engine
      if(ref.current) engine.current.mount(ref.current)
      engine.current.load(file)
    } else if (url) {
      // Streaming services - open in-app WebView for immersive experience
      if (window.smartTV?.openInApp) {
        window.smartTV.openInApp(url)
      }
      nav(`/webview?url=${encodeURIComponent(url)}`)
      return
    } else {
      nav('/')
    }

    // Setup remote controls
    ;(async ()=>{
      try {
        const base = await window.smartTV.getRemoteURL()
        connectRemote(base)
        on('play:toggle', ()=> engine.current.toggle())
        on('vol:up', ()=> {
          volRef.current = Math.min(1, volRef.current + 0.1)
          engine.current.setVolume(volRef.current)
        })
        on('vol:down', ()=> {
          volRef.current = Math.max(0, volRef.current - 0.1)
          engine.current.setVolume(volRef.current)
        })
        on('nav:back', ()=> nav(-1))
        on('home', ()=> nav('/'))
        on('nav:left', ()=> engine.current.seek(-10))
        on('nav:right', ()=> engine.current.seek(10))
      } catch {}
    })()
  },[])

  return <div ref={ref} style={{ width: '100vw', height: '100vh', background: '#000' }}></div>
}