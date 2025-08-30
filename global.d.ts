declare global {
  interface Window {
    smartTV: {
      getRemoteURL: () => Promise<string>
      openExternal: (url: string) => Promise<void>
      // Optional: open target URL inside in-app WebView route
      openInApp?: (url: string) => Promise<void>
      drm: {
        open: (opts: { service: string; url: string; sessionKey: string; display?: 'primary'|'secondary'; fullscreen?: boolean }) => Promise<void>
        nav: (cmd: 'back'|'forward'|'reload') => Promise<void>
        exec: (code: string) => Promise<void>
        postMessage: (payload: any) => Promise<void>
        close: () => Promise<void>
        onEvent: (handler: (ev: any)=>void) => ()=>void
      }
    }
  }
}
export {}