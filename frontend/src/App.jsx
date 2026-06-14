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
  const [user,        setUser]        = useState(undefined)
  const [removedIds,  setRemovedIds]  = useState([])
  const [reconnecting, setReconnecting] = useState(false)
  const navigate = useNavigate()

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

    socket.on("connect", () => {
      console.log("[WS] connected:", socket.id)
      setReconnecting(false)
    })

    socket.on("disconnect", () => {
      console.log("[WS] disconnected")
      setReconnecting(true)
    })

    socket.on("connect_error", () => {
      setReconnecting(true)
    })

    socket.on("workspace_removed", (data) => {
      const { workspace_id } = data
      setRemovedIds(ids => [...ids, workspace_id])
      const onBoard = window.location.pathname === `/workspace/${workspace_id}`
      if (onBoard) {
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

  // initial app load
  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
        fontSize: '0.9rem',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: '0.75rem' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {reconnecting && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a1a',
          color: '#fff',
          padding: '0.5rem 1.25rem',
          borderRadius: '999px',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 100,
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}>
          <div className="spinner spinner-white" />
          Reconnecting...
        </div>
      )}

      <Routes>
        <Route path="/login"  element={!user ? <Login  onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/" element={
          user
            ? <Dashboard user={user} onLogout={handleLogout} removedIds={removedIds} />
            : <Navigate to="/login" />
        } />
        <Route path="/workspace/:id" element={
          user ? <Board user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
      </Routes>
    </>
  )
}