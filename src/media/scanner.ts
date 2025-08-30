import { readdirSync, statSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import type { MediaItem } from './types'

const exts = new Set(['.mp4','.mkv','.mov','.webm','.mp3','.flac'])

export function scanFolder(dir: string): MediaItem[] {
  const out: MediaItem[] = []
  for (const f of readdirSync(dir)){
    const p = join(dir,f)
    const st = statSync(p)
    if (st.isDirectory()) {
      out.push(...scanFolder(p))
    } else if (exts.has(extname(f).toLowerCase())) {
      out.push({ id: p, title: basename(f), path: p })
    }
  }
  return out
}