import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useFetcher } from 'react-router-dom'
import { getMe, logout } from './api/auth'
import socket from './socket'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Board from './pages/Board'

export default function App() {
  const [user, setUser]       = useState(undefined)
  const navigate              = useNavigate()

  useEffect(() => {
    getMe()
      .then(res => {
        setUser(res.data.user)
        socket.connect()
      })
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    socket.on("connect", () => {
      console.log("[WS] connected:", socket.id)
    })

    socket.on("disconnect", () => {
      console.log("[WS] disconnected")
    })

    socket.on("connected", (data) => {
      console.log("[WS] server says:", data.message)
    })

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("connected")
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    socket.disconnect()
    setUser(null)
    navigate('/login')
  }

  if (user === undefined) return <p>Loading...</p>

    return (
      <Routes>
        <Route path="/login"  element={!user ? <Login  onLogin={(u) => { setUser(u); socket.connect() }} /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup onLogin={(u) => { setUser(u); socket.connect() }} /> : <Navigate to="/" />} />
        <Route path="/" element={
          user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/workspace/:id" element={
          user ? <Board user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
      </Routes>
    )
}