import React from 'react'
export default function TopBar(){
  const [remoteURL, setRemoteURL] = React.useState('')
  React.useEffect(()=>{
    if (window.smartTV && window.smartTV.getRemoteURL) {
      window.smartTV.getRemoteURL().then(setRemoteURL).catch(() => {
        // In web browser, smartTV API not available
        setRemoteURL('http://localhost:3000')
      })
    } else {
      // Fallback for web browser
      setRemoteURL('')
    }
  },[])
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-accent"/>
        <strong>SmartTV PC</strong>
      </div>
      {remoteURL && <span className="remote-badge">Remote: {remoteURL}</span>}
    </header>
  )
}