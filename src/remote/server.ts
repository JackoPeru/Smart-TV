import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import http from 'http'
import { networkInterfaces } from 'os'
import { join } from 'node:path'

let lastBroadcast: (msg: any) => void = () => {}

export async function startRemoteServer(preferredPort?: number) {
  const app = express()
  app.use(cors())
  app.use('/', express.static(join(process.cwd(), 'remote-web')))

  const server = http.createServer(app)
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        // Broadcast al renderer (bridge opzionale)
        lastBroadcast(msg)
        // Echo/broadcast: inoltra a tutti i client connessi (compreso il renderer)
        const data = JSON.stringify(msg)
        for (const client of wss.clients) {
          if ((client as any).readyState === 1) {
            client.send(data)
          }
        }
      } catch (e) {}
    })
  })

  const fixedPort = preferredPort ?? (parseInt(process.env.SMARTTV_REMOTE_PORT || '', 10) || 64028)

  const port = await new Promise<number>((resolve) => {
    const onListening = () => {
      const address = server.address()
      if (typeof address === 'object' && address) resolve(address.port)
    }
    const onError = (err: any) => {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`[remote] Port ${fixedPort} in use, falling back to a random port`)
        server.removeListener('error', onError)
        server.listen(0)
      } else {
        console.error('[remote] Server error:', err)
      }
    }
    server.on('listening', onListening)
    server.on('error', onError)
    server.listen(fixedPort)
  })

  return port
}

export function getRemoteURL(port: number) {
  const nets = networkInterfaces()
  let ip = '127.0.0.1'
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) { ip = net.address; break }
    }
  }
  return `http://${ip}:${port}`
}

// bridge verso il renderer
export function onRemoteMessage(cb: (msg: any) => void) {
  lastBroadcast = cb
}