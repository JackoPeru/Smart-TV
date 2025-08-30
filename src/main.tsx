import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles.css'

console.log('=== MAIN.TSX STARTING ===')

// Debug: Check if root element exists
const rootElement = document.getElementById('root')
console.log('Root element found:', rootElement)

if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="color: white; background: red; padding: 20px; font-size: 24px;">ERROR: Root element not found!</div>'
} else {
  console.log('Creating React root...')
  const root = ReactDOM.createRoot(rootElement)
  
  console.log('Rendering RouterProvider...')
  root.render(
    <RouterProvider router={router} />
  )
  
  console.log('=== REACT APP RENDERED ===')
}

// Add global debug info
setTimeout(() => {
  console.log('DOM after 1 second:', document.body.innerHTML.substring(0, 500))
}, 1000)