import type { PlayerEngine } from './PlayerEngine'

export class Html5Engine implements PlayerEngine {
  private video?: HTMLVideoElement

  mount(el: HTMLElement){
    const v = document.createElement('video')
    v.className='video'
    v.controls=false
    v.autoplay=true
    v.playsInline=true
    v.disablePictureInPicture = true
    el.appendChild(v)
    this.video = v
  }
  async load(src: string){
    if(!this.video) throw new Error('mount first')
    // Se è URL http/https apri webview esterna: per i servizi DRM meglio usare openExternal
    this.video.src = src.startsWith('file:')||src.startsWith('data:')||src.startsWith('blob:')||src.startsWith('/')? src : src
    await this.video.play().catch(()=>{})
  }
  play(){ this.video?.play() }
  pause(){ this.video?.pause() }
  toggle(){ if(!this.video) return; this.video.paused?this.video.play():this.video.pause() }
  seek(s: number){ if(this.video) this.video.currentTime += s }
  setVolume(v: number){ if(this.video) this.video.volume = Math.max(0, Math.min(1, v)) }
}