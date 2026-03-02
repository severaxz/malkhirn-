import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import Layout from './components/Layout'
import Home from './pages/Home'
import Market from './pages/Market'
import Portfolio from './pages/Portfolio'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

const MANIFEST_URL = `data:application/json,${encodeURIComponent(JSON.stringify({
  url: window.location.origin,
  name: 'Malkhirn',
  iconUrl: `${window.location.origin}/icon.png`,
}))}`

export default function App() {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/market/:id" element={<Market />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TonConnectUIProvider>
  )
}
