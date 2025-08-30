import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Library from './pages/Library'
import Player from './pages/Player'
import Settings from './pages/Settings'

export const router = createBrowserRouter([
  { path: '/', element: <App/>, children: [
    { index: true, element: <Home/> },
    { path: 'library', element: <Library/> },
    { path: 'player', element: <Player/> },
    { path: 'settings', element: <Settings/> }
  ]}
])