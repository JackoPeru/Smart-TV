import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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
      // Streaming services - open externally for best compatibility
      if (window.smartTV && window.smartTV.openExternal) {
        window.smartTV.openExternal(url)
        nav('/')
      } else {
        // In browser, open in new tab
        window.open(url, '_blank')
        nav('/')
      }
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