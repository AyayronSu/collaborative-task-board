// frontend/src/App.jsx
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { getMe, logout } from './api/auth'
import socket from './socket'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Board from './pages/Board'

export default function App() {
  const [user, setUser]              = useState(undefined)
  const [removedIds, setRemovedIds]  = useState([])
  const navigate                     = useNavigate()

  const connectSocket = (u) => {
    socket.connect()
    socket.once("connect", () => {
      socket.emit("join_user_room", { user_id: u.id })
    })
  }

  useEffect(() => {
    getMe()
      .then(res => {
        setUser(res.data.user)
        connectSocket(res.data.user)
      })
      .catch(() => setUser(null))

    socket.on("connect", () => console.log("[WS] connected:", socket.id))
    socket.on("disconnect", () => console.log("[WS] disconnected"))

    socket.on("workspace_removed", (data) => {
      const { workspace_id } = data
      console.log("[WS] removed from workspace:", workspace_id)

      setRemovedIds(ids => [...ids, workspace_id])

      const onBoard = window.location.pathname === `/workspace/${workspace_id}`
      if (onBoard) {
        navigate('/', { state: { removedMessage: "You were removed from this workspace." } })
      }
    })

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("workspace_removed")
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    socket.disconnect()
    setUser(null)
    navigate('/login')
  }

  const handleLogin = (u) => {
    setUser(u)
    connectSocket(u)
  }

  if (user === undefined) return <p style={{ padding: '2rem' }}>Loading...</p>

  return (
    <Routes>
      <Route path="/login"  element={!user ? <Login  onLogin={handleLogin} /> : <Navigate to="/" />} />
      <Route path="/signup" element={!user ? <Signup onLogin={handleLogin} /> : <Navigate to="/" />} />
      <Route path="/" element={
        user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
      } />
      <Route path="/workspace/:id" element={
        user ? <Board user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
      } />
    </Routes>
  )
}