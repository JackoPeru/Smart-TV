import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { resolveServiceForUrl } from '../services/adapters'

export default function WebViewPage(){
  const [params] = useSearchParams()
  const nav = useNavigate()
  const webviewRef = React.useRef<Electron.WebviewTag | null>(null)
  const [currentURL, setCurrentURL] = React.useState<string>('about:blank')

  const isElectron = React.useMemo(() => {
    return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron') || !!(window as any).smartTV
  }, [])

  // Keep a stable configuration for the lifetime of this component (partition cannot change after creation)
  const configRef = React.useRef<{ ua?: string; partition?: string; allowedHosts: string[] }>({ ua: undefined, partition: undefined, allowedHosts: [] })

  React.useEffect(() => {
    const url = params.get('url')
    if (!url) {
      nav('/')
      return
    }
    setCurrentURL(url)

    try {
      const conf = resolveServiceForUrl(url)
      const ua = params.get('ua') || conf.tvUserAgent
      const partition = `persist:${conf.partition || 'apps'}`
      const allowedHosts = conf.allowedHosts && conf.allowedHosts.length > 0
        ? conf.allowedHosts
        : [new URL(url).hostname]
      configRef.current = { ua: ua || undefined, partition, allowedHosts }
    } catch {
      // Fallback: restrict to same host
      try {
        const host = new URL(url).hostname
        configRef.current = { ua: undefined, partition: 'persist:apps', allowedHosts: [host] }
      } catch {
        configRef.current = { ua: undefined, partition: 'persist:apps', allowedHosts: [] }
      }
    }
  }, [params])

  React.useEffect(() => {
    const handler = (evt: MessageEvent) => {
      if ((evt as any).data?.type === 'smarttv:navigate') {
        const url = (evt as any).data?.payload?.url as string
        if (url) nav(`/webview?url=${encodeURIComponent(url)}`)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [nav])

  React.useEffect(() => {
    if (!isElectron) return
    const tag = webviewRef.current
    if (!tag) return

    const isAllowed = (raw: string | URL) => {
      try {
        const u = typeof raw === 'string' ? new URL(raw) : raw
        return configRef.current.allowedHosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
      } catch {
        return false
      }
    }

    const onNewWindow = (e: any) => {
      // Keep navigation inside the webview if allowed, otherwise open externally
      e.preventDefault()
      const target = e.url || e.targetUrl
      if (target && isAllowed(target)) {
        tag.loadURL(target)
      } else if (target && (window as any).smartTV?.openExternal) {
        ;(window as any).smartTV.openExternal(target)
      }
    }
    const onWillNavigate = (e: any) => {
      if (e.url && isAllowed(e.url)) {
        e.preventDefault()
        tag.loadURL(e.url)
      } else if (e.url && (window as any).smartTV?.openExternal) {
        e.preventDefault()
        ;(window as any).smartTV.openExternal(e.url)
      }
    }
    const onDomReady = () => {
      // Optional: inject CSS to hide scrollbars or tweak UI
      tag.insertCSS('::-webkit-scrollbar{display:none;} body{overscroll-behavior:none;}')
    }

    tag.addEventListener('new-window', onNewWindow as any)
    tag.addEventListener('will-navigate', onWillNavigate as any)
    tag.addEventListener('dom-ready', onDomReady as any)

    return () => {
      tag.removeEventListener('new-window', onNewWindow as any)
      tag.removeEventListener('will-navigate', onWillNavigate as any)
      tag.removeEventListener('dom-ready', onDomReady as any)
    }
  }, [isElectron])

  const tvUA = configRef.current.ua
  const partition = configRef.current.partition || 'persist:apps'

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {isElectron ? (
        // Note: partition cannot change after creation; we compute it once from configRef
        <webview
          ref={webviewRef as any}
          src={currentURL}
          style={{ width: '100%', height: '100%' }}
          allowpopups
          webpreferences="nativeWindowOpen=yes"
          useragent={tvUA}
          partition={partition}
        />
      ) : (
        <iframe title="app" src={currentURL} style={{ width: '100%', height: '100%', border: 'none' }} />
      )}
    </div>
  )
}