import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Tile({ label, to, subtitle }: { label: string, to: string, subtitle?: string }){
  const nav = useNavigate()

  const Icon = React.useMemo(() => {
    const commonProps = { width: 28, height: 28, fill: 'currentColor' }
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

  return (
    <button className="tile" onClick={() => nav(to)} tabIndex={0}>
      <div className="tile-icon">{Icon}</div>
      <div className="tile-text">
        <div className="tile-title">{label}</div>
        {subtitle && <div className="tile-subtitle">{subtitle}</div>}
      </div>
    </button>
  )
}