import React from 'react'
import Tile from '../components/Tile'
import RemoteQR from '../components/RemoteQR'
import { connectRemote, on } from '../remote/client'
import { handleRemoteCommand } from '../utils/navigation'

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
  
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>SmartTV PC</h1>
          <p>Guarda i tuoi contenuti con un'esperienza 10-foot moderna</p>
        </div>
      </section>

      <div className="grid">
        <Tile label="Libreria" subtitle="File locali e playlist" to="/library"/>
        <Tile label="YouTube" subtitle="Apri nel browser" to="/player?url=https://www.youtube.com"/>
        <Tile label="Netflix" subtitle="Apri nel browser" to="/player?url=https://www.netflix.com"/>
        <Tile label="Impostazioni" subtitle="Preferenze app" to="/settings"/>
        <RemoteQR/>
      </div>
    </>
  )
}