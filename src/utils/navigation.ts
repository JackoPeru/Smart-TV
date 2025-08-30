// Navigation utilities for TV remote control
export type NavigationElement = HTMLElement & { tabIndex: number }

let currentFocusIndex = 0
let focusableElements: NavigationElement[] = []

export function initNavigation() {
  updateFocusableElements()
  document.addEventListener('keydown', handleKeyNavigation)
  
  // Focus first element on load
  if (focusableElements.length > 0) {
    focusableElements[0].focus()
  }
}

export function updateFocusableElements() {
  focusableElements = Array.from(
    document.querySelectorAll('.tile, button, [tabindex="0"]')
  ) as NavigationElement[]
  
  // Ensure all elements have proper tabIndex
  focusableElements.forEach((el, index) => {
    el.tabIndex = 0
  })
}

function handleKeyNavigation(e: KeyboardEvent) {
  const key = e.key
  
  switch (key) {
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
      e.preventDefault()
      navigate(key)
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      activateCurrentElement()
      break
    case 'Escape':
      e.preventDefault()
      // Go back - could be handled by router
      history.back()
      break
  }
}

function navigate(direction: string) {
  if (focusableElements.length === 0) return
  
  const cols = getGridColumns()
  const currentRow = Math.floor(currentFocusIndex / cols)
  const currentCol = currentFocusIndex % cols
  
  let newIndex = currentFocusIndex
  
  switch (direction) {
    case 'ArrowUp':
      newIndex = Math.max(0, currentFocusIndex - cols)
      break
    case 'ArrowDown':
      newIndex = Math.min(focusableElements.length - 1, currentFocusIndex + cols)
      break
    case 'ArrowLeft':
      newIndex = Math.max(currentRow * cols, currentFocusIndex - 1)
      break
    case 'ArrowRight':
      newIndex = Math.min((currentRow + 1) * cols - 1, currentFocusIndex + 1, focusableElements.length - 1)
      break
  }
  
  if (newIndex !== currentFocusIndex) {
    currentFocusIndex = newIndex
    focusableElements[currentFocusIndex].focus()
  }
}

function getGridColumns(): number {
  // Try to determine grid columns from CSS or default to 3
  const gridElement = document.querySelector('.grid')
  if (gridElement) {
    const styles = window.getComputedStyle(gridElement)
    const gridTemplate = styles.gridTemplateColumns
    const columns = gridTemplate.split(' ').length
    return columns || 3
  }
  return 3
}

function activateCurrentElement() {
  if (focusableElements[currentFocusIndex]) {
    focusableElements[currentFocusIndex].click()
  }
}

// Remote control integration
export function handleRemoteCommand(command: string) {
  switch (command) {
    case 'nav:up':
      navigate('ArrowUp')
      break
    case 'nav:down':
      navigate('ArrowDown')
      break
    case 'nav:left':
      navigate('ArrowLeft')
      break
    case 'nav:right':
      navigate('ArrowRight')
      break
    case 'nav:ok':
      activateCurrentElement()
      break
    case 'nav:back':
      history.back()
      break
    case 'home':
      // Use proper React Router navigation instead of hash
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/'
      }
      break
  }
}