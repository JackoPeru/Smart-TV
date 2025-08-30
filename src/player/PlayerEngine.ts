export interface PlayerEngine {
  mount(el: HTMLElement): void
  load(source: string): Promise<void>
  play(): void
  pause(): void
  toggle(): void
  seek(seconds: number): void
  setVolume(v: number): void
}