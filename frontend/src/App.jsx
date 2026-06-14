// frontend/src/App.jsx
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { getMe, logout } from './api/auth'
import socket from './socket'
import useNetworkStatus from './hooks/useNetworkStatus'
import useToast from './hooks/useToast'
import Toast from './components/Toast'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Board from './pages/Board'

export default function App() {
  const [user,         setUser]         = useState(undefined)
  const [removedIds,   setRemovedIds]   = useState([])
  const [reconnecting, setReconnecting] = useState(false)
  const isOnline                        = useNetworkStatus()
  const { toasts, addToast, dismissToast } = useToast()
  const navigate = useNavigate()

  const connectSocket = (u) => {
    socket.connect()
    socket.once("connect", () => {
      socket.emit("join_user_room", { user_id: u.id })
    })
  }

  useEffect(() => {
    getMe()
      .then(res => { setUser(res.data.user); connectSocket(res.data.user) })
      .catch(err => {
        setUser(null)
        if (err?.status === 0) addToast('Could not reach the server. Check your connection.', 'error', 6000)
      })

    socket.on("connect", () => { setReconnecting(false) })
    socket.on("disconnect", (reason) => {
      setReconnecting(true)
      if (reason === 'io server disconnect') addToast('Disconnected by server. Reconnecting...', 'warning')
    })
    socket.on("connect_error", () => {
      setReconnecting(true)
      addToast('Connection lost. Retrying...', 'warning', 3000)
    })
    socket.on("workspace_removed", (data) => {
      setRemovedIds(ids => [...ids, data.workspace_id])
      if (window.location.pathname === `/workspace/${data.workspace_id}`) {
        navigate('/', { state: { removedMessage: "You were removed from this workspace." } })
      }
    })

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("connect_error")
      socket.off("workspace_removed")
    }
  }, [])

  useEffect(() => {
    if (!isOnline) addToast("You're offline. Changes won't sync until you reconnect.", 'warning', 8000)
  }, [isOnline])

  const handleLogout = async () => {
    await logout(); socket.disconnect(); setUser(null); navigate('/login')
  }

  const handleLogin = (u) => { setUser(u); connectSocket(u) }

  if (user === undefined) return (
    <div className="fullscreen-state" style={{ height: '100vh' }}>
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  )

  return (
    <>
      {!isOnline && <div className="offline-banner">You're offline — changes won't sync until you reconnect.</div>}
      {reconnecting && isOnline && (
        <div className="reconnecting-pill">
          <div className="spinner spinner-white spinner-sm" />
          Reconnecting...
        </div>
      )}
      <Toast toasts={toasts} onDismiss={dismissToast} />
      <Routes>
        <Route path="/login"  element={!user ? <Login  onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Dashboard user={user} onLogout={handleLogout} removedIds={removedIds} /> : <Navigate to="/login" />} />
        <Route path="/workspace/:id" element={user ? <Board user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </>
  )
}