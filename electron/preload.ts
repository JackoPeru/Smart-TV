import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('smartTV', {
  getRemoteURL: () => ipcRenderer.invoke('remote:get-url'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
})