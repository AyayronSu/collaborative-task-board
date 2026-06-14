// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getWorkspaces, createWorkspace, deleteWorkspace } from '../api/workspaces'
import socket from '../socket'

export default function Dashboard({ user, onLogout, removedIds = [] }) {
  const [workspaces, setWorkspaces] = useState([])
  const [title,      setTitle]      = useState('')
  const [error,      setError]      = useState('')
  const location                    = useLocation()
  const removedMessage              = location.state?.removedMessage

  useEffect(() => {
    getWorkspaces()
      .then(res => setWorkspaces(res.data.workspaces))
      .catch(()  => setError('Failed to load workspaces.'))

    socket.on("workspace_added", (data) => {
      setWorkspaces(ws => ws.find(w => w.id === data.workspace.id) ? ws : [...ws, data.workspace])
    })
    return () => socket.off("workspace_added")
  }, [])

  const visible = workspaces.filter(w => !removedIds.includes(w.id))

  const create = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const res = await createWorkspace({ title })
      setWorkspaces(ws => [...ws, res.data.workspace])
      setTitle('')
    } catch (err) { setError(err?.message || 'Failed to create workspace.') }
  }

  const remove = async (id) => {
    try { await deleteWorkspace(id); setWorkspaces(ws => ws.filter(w => w.id !== id)) }
    catch (err) { setError(err?.message || 'Failed to delete workspace.') }
  }

  return (
    <>
      <nav>
        <span className="nav-brand">Taskboard</span>
        <div className="nav-right">
          <span className="nav-user">{user.username}</span>
          <button className="ghost" onClick={onLogout}>Sign out</button>
        </div>
      </nav>

      <div className="dashboard-page">
        {removedMessage && (
          <div style={{
            background: 'var(--warn-bg)', border: '1px solid var(--warn-border)',
            borderRadius: 'var(--radius)', padding: '0.65rem 1rem',
            marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--warn-ink)',
          }}>
            {removedMessage}
          </div>
        )}

        <div className="dashboard-header">
          <h2>Workspaces</h2>
          <span className="dashboard-count">{visible.length} workspace{visible.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="new-workspace-bar">
          <input
            placeholder="New workspace name"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create(e)}
          />
          <button className="primary" onClick={create}>Create</button>
        </div>

        {error && <p className="error" style={{ marginBottom: '0.75rem' }}>{error}</p>}

        <div className="workspace-list">
          {visible.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: '1.5rem' }}>📋</p>
              <p>No workspaces yet. Create one above.</p>
            </div>
          ) : visible.map(w => (
            <div className="workspace-item" key={w.id}>
              <div className="workspace-item-icon">{w.title.charAt(0)}</div>
              <div className="workspace-item-body">
                <Link className="workspace-item-name" to={`/workspace/${w.id}`}>{w.title}</Link>
                <p className="workspace-item-meta">{w.created_by === user.id ? 'Owner' : 'Member'}</p>
              </div>
              <div className="workspace-item-actions">
                {w.created_by === user.id && (
                  <button className="danger" onClick={() => remove(w.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}