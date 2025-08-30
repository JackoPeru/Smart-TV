import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Tile({ label, to, subtitle }: { label: string, to: string, subtitle?: string }){
  const nav = useNavigate()

  const Icon = React.useMemo(() => {
    const commonProps = { width: 42, height: 42, fill: 'currentColor' }
    switch (label.toLowerCase()) {
      case 'libreria':
        return (
          <svg viewBox="0 0 24 24" {...commonProps}>
            <path d="M4 5h14a2 2 0 0 1 2 2v11h-2V7H4V5zm-2 4h14a2 2 0 0 1 2 2v7H4a2 2 0 0 1-2-2V9zm6 2h6v2H8v-2z" />
          </svg>
        )
      case 'youtube':
        return (
          <svg viewBox="0 0 24 24" {...commonProps}>
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.4-1.9.5-3.8.5-5.8 0-2-.1-3.9-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
          </svg>
        )
      case 'netflix':
        return (
          <svg viewBox="0 0 24 24" {...commonProps}>
            <path d="M4 3h3l5 10V3h3v18h-3l-5-10v10H4V3z" />
          </svg>
        )
      case 'prime video':
        return (
          <svg viewBox="0 0 24 24" {...commonProps}>
            <rect x="3" y="5" width="18" height="14" rx="2" ry="2"/>
            <polygon points="11,9 11,15 16,12" fill="#fff"/>
          </svg>
        )
      case 'disney+':
        return (
          <svg viewBox="0 0 24 24" {...commonProps}>
            <path d="M12 20a8 8 0 1 1 6.93-12.06" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M14 10h2v2h2v2h-2v2h-2v-2h-2v-2h2z"/>
          </svg>
        )
      case 'spotify':
        return (
          <svg viewBox="0 0 24 24" {...commonProps}>
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
            <path d="M7 10c3-1 7-1 10 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M8 13c2.5-0.8 5.5-0.8 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M9 16c2-0.6 4-0.6 6 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        )
      case 'twitch':
        return (
          <svg viewBox="0 0 24 24" {...commonProps}>
            <path d="M4 3h16v10l-4 4h-4l-2 2H8v-2H4V3z"/>
            <rect x="9" y="7" width="2" height="4" fill="#fff"/>
            <rect x="13" y="7" width="2" height="4" fill="#fff"/>
          </svg>
        )
      case 'plex':
        return (
          <svg viewBox="0 0 24 24" {...commonProps}>
            <path d="M5 3h14v18H5z" fill="none"/>
            <path d="M9 5l6 7-6 7V5z"/>
          </svg>
        )
      case 'impostazioni':
      case 'settings':
        return (
          <svg viewBox="0 0 24 24" {...commonProps}>
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 14.91 1h-3.82a.5.5 0 0 0-.49.41l-.36 2.54c-.59.23-1.14.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L1.7 7.01a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L1.82 12.7a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.49.4 1.04.71 1.63.94l.36 2.54c.06.24.25.41.49.41h3.82c.24 0 .44-.17.49-.41l.36-2.54c.59-.23 1.14-.54 1.63-.94l2.39.96c.24.1.51.01.64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 24 24" {...commonProps}>
            <circle cx="12" cy="12" r="9" />
          </svg>
        )
    }
  }, [label])

  // Use data-brand to style icon color via CSS brand rules
  return (
    <button className="tile" data-brand={label} onClick={() => nav(to)} tabIndex={0}>
      <div className="tile-icon">{Icon}</div>
      <div className="tile-text">
        <div className="tile-title">{label}</div>
        {subtitle && <div className="tile-subtitle">{subtitle}</div>}
      </div>
    </button>
  )
}