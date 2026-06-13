import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { getMe, logout } from './api/auth'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Board from './pages/Board'

export default function App() {
  const [user, setUser]       = useState(undefined)
  const navigate              = useNavigate()

  useEffect(() => {
    getMe()
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
  }, [])

  const handleLogout = async () => {
    await logout()
    setUser(null)
    navigate('/login')
  }

  if (user === undefined) return <p>Loading...</p>

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
      <Route path="/signup" element={!user ? <Signup onLogin={setUser} /> : <Navigate to="/" />} />
      <Route path="/" element={
              user
                ? <Dashboard user={user} onLogout={handleLogout} />
                : <Navigate to="/login" />
      } />
      <Route path="/workspace/:id" element={
        user
          ? <Board user={user} onLogout={handleLogout} />
          : <Navigate to="/login" />
      } />
    </Routes>
  )
}