import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import TopBar from './components/TopBar'
import { initNavigation, updateFocusableElements } from './utils/navigation'

export default function App(){
  console.log('App component rendered')
  const loc = useLocation()
  
  React.useEffect(()=>{
    console.log('App useEffect: adding hidden-cursor class and initializing navigation')
    document.body.classList.add('hidden-cursor')
    
    // Initialize TV navigation
    initNavigation()
    
    // Update focusable elements when route changes
    const observer = new MutationObserver(() => {
      updateFocusableElements()
    })
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    })
    
    return () => observer.disconnect()
  },[])

  // Imposta un attributo sul root per consentire regole CSS per route (es. full-screen)
  React.useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    // route key: prima parte del path ('' -> home)
    const seg = (loc.pathname.split('/')[1] || 'home').toLowerCase()
    root.setAttribute('data-route', seg)
  }, [loc.pathname])
  
  return (
    <>
      <TopBar/>
      <main>
        <Outlet/>
      </main>
    </>
  )
}