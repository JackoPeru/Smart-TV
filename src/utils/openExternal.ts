export function openYouTube(query?: string){
  const base = 'https://www.youtube.com'
  const url = query ? `${base}/results?search_query=${encodeURIComponent(query)}` : base
  if (window.smartTV?.openInApp) {
    return window.smartTV.openInApp(url)
  }
  // fallback browser-router navigation
  window.location.href = `/webview?url=${encodeURIComponent(url)}`
  return Promise.resolve()
}