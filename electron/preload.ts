import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('smartTV', {
  getRemoteURL: () => ipcRenderer.invoke('remote:get-url'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  openInApp: async (url: string) => {
    // Notify renderer to navigate to /webview?url=...
    window.postMessage({ type: 'smarttv:navigate', payload: { url } }, '*')
  },
  drm: {
    open: (opts: { service: string; url: string; sessionKey: string; display?: 'primary'|'secondary'; fullscreen?: boolean; userAgent?: string }) => ipcRenderer.invoke('drm:open', opts),
    nav: (cmd: 'back'|'forward'|'reload') => ipcRenderer.invoke('drm:nav', { cmd }),
    exec: (code: string) => ipcRenderer.invoke('drm:exec', { code }),
    postMessage: (payload: any) => ipcRenderer.invoke('drm:postMessage', { payload }),
    close: () => ipcRenderer.invoke('drm:close'),
    onEvent: (handler: (ev: any)=>void) => {
      const ch = 'drm:event'
      const l = (_e: any, data: any)=> handler(data)
      ipcRenderer.on(ch, l)
      return () => ipcRenderer.off(ch, l)
    }
  }
})