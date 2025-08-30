import React from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './components/TopBar'
import { initNavigation, updateFocusableElements } from './utils/navigation'

export default function App(){
  console.log('App component rendered')
  
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
  
  return (
    <>
      <TopBar/>
      <main>
        <Outlet/>
      </main>
    </>
  )
}