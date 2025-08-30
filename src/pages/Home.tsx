import React from 'react'
import Tile from '../components/Tile'
import RemoteQR from '../components/RemoteQR'
import { connectRemote, on } from '../remote/client'
import { handleRemoteCommand } from '../utils/navigation'
import { getServiceEntry } from '../services/adapters'

export default function Home(){
  console.log('Home component rendered')
  
  React.useEffect(() => {
    // Connect remote control for navigation on home page
    (async () => {
      try {
        const base = await window.smartTV.getRemoteURL()
        connectRemote(base)
        
        // Handle navigation commands
        on('nav:up', () => handleRemoteCommand('nav:up'))
        on('nav:down', () => handleRemoteCommand('nav:down'))
        on('nav:left', () => handleRemoteCommand('nav:left'))
        on('nav:right', () => handleRemoteCommand('nav:right'))
        on('nav:ok', () => handleRemoteCommand('nav:ok'))
        on('nav:back', () => handleRemoteCommand('nav:back'))
        on('home', () => handleRemoteCommand('home'))
      } catch {}
    })()
  }, [])
  
  const yt = getServiceEntry('youtube')
  const nf = getServiceEntry('netflix')
  const pv = getServiceEntry('prime')
  const dp = getServiceEntry('disney')
  const sp = getServiceEntry('spotify')
  const tw = getServiceEntry('twitch')
  const pl = getServiceEntry('plex')

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>SmartTV PC</h1>
          <p>Guarda i tuoi contenuti con un'esperienza 10-foot moderna</p>
        </div>
      </section>

      <div className="grid grid-large">
        <Tile label="Libreria" subtitle="File locali e playlist" to="/library"/>
        <Tile label="YouTube" subtitle="Apri in app" to={`/player?url=${encodeURIComponent(yt)}`}/>
        <Tile label="Netflix" subtitle="Apri in app" to={`/player?url=${encodeURIComponent(nf)}`}/>
        <Tile label="Prime Video" subtitle="Apri in app" to={`/player?url=${encodeURIComponent(pv)}`}/>
        <Tile label="Disney+" subtitle="Apri in app" to={`/player?url=${encodeURIComponent(dp)}`}/>
        <Tile label="Spotify" subtitle="Apri in app" to={`/player?url=${encodeURIComponent(sp)}`}/>
        <Tile label="Twitch" subtitle="Apri in app" to={`/player?url=${encodeURIComponent(tw)}`}/>
        <Tile label="Plex" subtitle="Apri in app" to={`/player?url=${encodeURIComponent(pl)}`}/>
        <Tile label="Impostazioni" subtitle="Preferenze app" to="/settings"/>
        <RemoteQR/>
      </div>
    </>
  )
}