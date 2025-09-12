// Centralized service adapters: entry URL, TV-friendly user agents, allowed hosts and partition names
// This enables consistent behavior inside the WebView (UA spoofing, session isolation and navigation allowlist)

export type ServiceKey = 'youtube' | 'netflix' | 'prime' | 'disney' | 'spotify' | 'twitch' | 'plex'

export interface ServiceAdapter {
  key: ServiceKey
  // Hostnames used to detect the service for an arbitrary URL
  hosts: string[]
  // Default entry URL when user opens the service from Home
  entry: string
  // Optional: a TV-like user agent to trigger 10-foot UI when available
  tvUserAgent?: string
  // Optional: dedicated session partition name (without the persist: prefix)
  partition?: string
  // Allowed hostnames for in-webview navigation (popups, redirects). Subdomains are allowed.
  allowedHosts: string[]
}

const UA = {
  // Common Android TV UA triggers TV UIs in several services
  androidTV: 'Mozilla/5.0 (Linux; Android 10; BRAVIA 4K UR3 Build/QTG3.200305.006; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Safari/537.36 CrKey/1.56.500000',
  tizen: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/3.0 TV Safari/537.36',
}

const SERVICES: Record<ServiceKey, ServiceAdapter> = {
  youtube: {
    key: 'youtube',
    hosts: ['youtube.com', 'youtu.be'],
    entry: 'https://www.youtube.com/tv',
    tvUserAgent: UA.androidTV,
    partition: 'yt',
    allowedHosts: ['youtube.com', 'youtu.be', 'google.com', 'accounts.google.com', 'gstatic.com'],
  },
  netflix: {
    key: 'netflix',
    hosts: ['netflix.com'],
    entry: 'https://www.netflix.com/browse',
    // Force Android TV-like UA to favor TV layout when possible
    tvUserAgent: UA.androidTV,
    partition: 'netflix',
    allowedHosts: ['netflix.com', 'nflxvideo.net', 'nflximg.net', 'nflxext.com', 'nflxso.net'],
  },
  prime: {
    key: 'prime',
    hosts: ['primevideo.com', 'amazon.com'],
    entry: 'https://www.primevideo.com',
    tvUserAgent: UA.androidTV,
    partition: 'prime',
    allowedHosts: ['primevideo.com', 'amazon.com', 'aiv-cdn.net', 'media-amazon.com', 'amazonaws.com'],
  },
  disney: {
    key: 'disney',
    hosts: ['disneyplus.com'],
    entry: 'https://www.disneyplus.com',
    tvUserAgent: UA.androidTV,
    partition: 'disney',
    allowedHosts: ['disneyplus.com', 'bamgrid.com', 'dssott.com'],
  },
  spotify: {
    key: 'spotify',
    hosts: ['spotify.com'],
    entry: 'https://open.spotify.com',
    // tvUserAgent intentionally not overridden; use default desktop UA
    partition: 'spotify',
    allowedHosts: ['spotify.com', 'open.spotify.com', 'accounts.spotify.com'],
  },
  twitch: {
    key: 'twitch',
    hosts: ['twitch.tv'],
    entry: 'https://www.twitch.tv',
    tvUserAgent: UA.androidTV,
    partition: 'twitch',
    allowedHosts: ['twitch.tv', 'id.twitch.tv', 'ttvnw.net'],
  },
  plex: {
    key: 'plex',
    hosts: ['plex.tv'],
    entry: 'https://app.plex.tv',
    tvUserAgent: UA.androidTV,
    partition: 'plex',
    allowedHosts: ['plex.tv', 'app.plex.tv', 'the.plex.tv'],
  },
}

// Try to infer the service configuration from any URL
export function resolveServiceForUrl(url: string): { key?: ServiceKey; tvUserAgent?: string; partition?: string; allowedHosts: string[] } {
  const u = new URL(url)
  const host = u.hostname
  const match = (Object.values(SERVICES) as ServiceAdapter[]).find(s => s.hosts.some(h => host === h || host.endsWith(`.${h}`)))
  if (match) return { key: match.key, tvUserAgent: match.tvUserAgent, partition: match.partition, allowedHosts: match.allowedHosts }
  // Fallback: allow only the same hostname; use default partition
  return { allowedHosts: [host], partition: 'apps' }
}

// Utility: retrieve the entry URL for a given service key
export function getServiceEntry(key: ServiceKey): string {
  return SERVICES[key].entry
}