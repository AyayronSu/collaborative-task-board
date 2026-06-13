// frontend/src/pages/Board.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import { getMembers, addMember, removeMember } from '../api/memberships'
import socket from '../socket'

const STATUSES = ['todo', 'in_progress', 'done']
const LABELS   = { todo: 'To do', in_progress: 'In progress', done: 'Done' }

export default function Board({ user, onLogout }) {
  const { id: workspaceId }      = useParams()
  const [tasks,    setTasks]     = useState([])
  const [title,    setTitle]     = useState('')
  const [error,    setError]     = useState('')
  const [members,  setMembers]   = useState([])
  const [email,    setEmail]     = useState('')
  const [memError, setMemError]  = useState('')
  const [online,   setOnline]    = useState([])
  const [activity, setActivity]  = useState([])

  const pushActivity = (message) => {
    setActivity(log => [
      { id: Date.now(), message, ts: new Date().toLocaleTimeString() },
      ...log,
    ].slice(0, 30))
  }

  useEffect(() => {
    socket.emit("join_workspace", {
      workspace_id: workspaceId,
      user: { id: user.id, username: user.username },
    })
    socket.on("presence_updated", (data) => setOnline(data.users))
    socket.on("activity",         (data) => pushActivity(data.message))
    return () => {
      socket.emit("leave_workspace", { workspace_id: workspaceId })
      socket.off("presence_updated")
      socket.off("activity")
    }
  }, [workspaceId])

  useEffect(() => {
    socket.on("task_created", (data) => setTasks(ts => [...ts, data.task]))
    socket.on("task_updated", (data) => setTasks(ts => ts.map(t => t.id === data.task.id ? data.task : t)))
    socket.on("task_deleted", (data) => setTasks(ts => ts.filter(t => t.id !== data.task_id)))
    return () => {
      socket.off("task_created")
      socket.off("task_updated")
      socket.off("task_deleted")
    }
  }, [])

  useEffect(() => {
    getTasks(workspaceId)
      .then(res => setTasks(res.data.tasks))
      .catch(()  => setError('Failed to load tasks.'))
    getMembers(workspaceId)
      .then(res => setMembers(res.data.members))
      .catch(()  => setMemError('Failed to load members.'))
  }, [workspaceId])

  const create = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await createTask(workspaceId, { title })
      setTitle('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task.')
    }
  }

  const move = async (task, newStatus) => {
    try { await updateTask(workspaceId, task.id, { status: newStatus }) }
    catch { setError('Failed to update task.') }
  }

  const remove = async (id) => {
    try { await deleteTask(workspaceId, id) }
    catch { setError('Failed to delete task.') }
  }

  const inviteMember = async (e) => {
    e.preventDefault()
    setMemError('')
    if (!email.trim()) return
    try {
      const res = await addMember(workspaceId, { email })
      setMembers(ms => [...ms, res.data.member])
      setEmail('')
    } catch (err) {
      setMemError(err.response?.data?.error || 'Failed to add member.')
    }
  }

  const kickMember = async (targetUserId) => {
    try {
      await removeMember(workspaceId, targetUserId)
      setMembers(ms => ms.filter(m => m.id !== targetUserId))
    } catch (err) {
      setMemError(err.response?.data?.error || 'Failed to remove member.')
    }
  }

  const isOnline  = (id) => online.some(u => u.id === id)
  const byStatus  = (status) => tasks.filter(t => t.status === status)

  return (
    <>
      <nav>
        <Link to="/">← Workspaces</Link>
        <div className="nav-presence">
          {online.map(u => (
            <span key={u.id} className="presence-pill">
              <span className="presence-dot" />
              {u.username}
            </span>
          ))}
        </div>
        <button className="ghost" onClick={onLogout}>Sign out</button>
      </nav>

      <div className="board-layout">
        {/* main board */}
        <div className="board-main">
          <div className="add-task-bar">
            <input
              placeholder="New task title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create(e)}
            />
            <button className="primary" onClick={create}>Add task</button>
          </div>
          {error && <p className="error" style={{ marginBottom: '1rem' }}>{error}</p>}

          <div className="board">
            {STATUSES.map(status => (
              <div className="column" key={status}>
                <div className="column-header">
                  <span className="column-title">{LABELS[status]}</span>
                  <span className="column-count">{byStatus(status).length}</span>
                </div>
                {byStatus(status).map(task => (
                  <div className="task-card" key={task.id}>
                    <p className="task-card-title">{task.title}</p>
                    <div className="task-actions">
                      {STATUSES.filter(s => s !== status).map(s => (
                        <button key={s} className="move-btn" onClick={() => move(task, s)}>
                          → {LABELS[s]}
                        </button>
                      ))}
                      <button className="danger" onClick={() => remove(task.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* sidebar */}
        <div className="board-sidebar">
          {/* members */}
          <div className="sidebar-section">
            <h3>Members</h3>
            {members.map(m => (
              <div className="member-row" key={m.id}>
                <div className="member-info">
                  <span className={`member-dot ${isOnline(m.id) ? 'online' : 'offline'}`} />
                  <span>{m.username}</span>
                </div>
                {m.id !== user.id && (
                  <button className="danger" onClick={() => kickMember(m.id)}>Remove</button>
                )}
              </div>
            ))}
            {memError && <p className="error">{memError}</p>}
            <form className="invite-row" onSubmit={inviteMember}>
              <input
                type="email"
                placeholder="Invite by email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button type="submit" className="primary">Add</button>
            </form>
          </div>

          {/* activity */}
          <div className="sidebar-section" style={{ borderBottom: 'none' }}>
            <h3>Activity</h3>
          </div>
          <div className="activity-feed">
            {activity.length === 0
              ? <p className="activity-empty">No activity yet.</p>
              : activity.map(e => (
                <div className="activity-item" key={e.id}>
                  {e.message}
                  <span className="activity-time">{e.ts}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </>
  )
}