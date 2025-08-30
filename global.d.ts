declare global {
  interface Window {
    smartTV: {
      getRemoteURL: () => Promise<string>
      openExternal: (url: string) => Promise<void>
    }
  }
}
export {}