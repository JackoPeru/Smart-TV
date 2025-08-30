export function openYouTube(query?: string){
  const base = 'https://www.youtube.com'
  const url = query ? `${base}/results?search_query=${encodeURIComponent(query)}` : base
  return window.smartTV.openExternal(url)
}