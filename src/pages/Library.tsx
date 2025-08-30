import React from 'react'
import type { MediaItem } from '../media/types'

export default function Library(){
  const [items,setItems] = React.useState<MediaItem[]>([])
  React.useEffect(()=>{
    // TODO: Integrate with preload IPC to scan the filesystem
    setItems([])
  },[])

  return (
    <div className="grid">
      {items.length===0 && <div>Nessun media indicizzato. Configura la cartella in Impostazioni.</div>}
      {items.map(m => (
        <a key={m.id} className="tile" href={`/player?file=${encodeURIComponent(m.path)}`}>{m.title}</a>
      ))}
    </div>
  )
}