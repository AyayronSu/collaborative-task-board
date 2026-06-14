// frontend/src/pages/Board.jsx
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import { getMembers, addMember, removeMember } from '../api/memberships'
import socket from '../socket'

const STATUSES = ['todo', 'in_progress', 'done']
const LABELS   = { todo: 'To do', in_progress: 'In progress', done: 'Done' }
const COL_CLS  = { todo: 'todo', in_progress: 'progress', done: 'done' }

export default function Board({ user, onLogout }) {
  const { id: workspaceId }        = useParams()
  const navigate                   = useNavigate()
  const [tasks,      setTasks]     = useState([])
  const [title,      setTitle]     = useState('')
  const [error,      setError]     = useState('')
  const [members,    setMembers]   = useState([])
  const [email,      setEmail]     = useState('')
  const [memError,   setMemError]  = useState('')
  const [online,     setOnline]    = useState([])
  const [activity,   setActivity]  = useState([])
  const [loadingTasks,   setLoadingTasks]   = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [socketReady,    setSocketReady]    = useState(false)
  const [accessError,    setAccessError]    = useState('')

  const pushActivity = (msg) => setActivity(log =>
    [{ id: Date.now(), message: msg, ts: new Date().toLocaleTimeString() }, ...log].slice(0, 30)
  )

  useEffect(() => {
    const join = () => {
      socket.emit("join_workspace", { workspace_id: workspaceId, user: { id: user.id, username: user.username } })
      setSocketReady(true)
    }
    if (socket.connected) join()
    socket.on("connect",          join)
    socket.on("presence_updated", (d) => setOnline(d.users))
    socket.on("activity",         (d) => pushActivity(d.message))
    return () => {
      socket.emit("leave_workspace", { workspace_id: workspaceId })
      socket.off("connect"); socket.off("presence_updated"); socket.off("activity")
    }
  }, [workspaceId])

  useEffect(() => {
    socket.on("task_created", (d) => setTasks(ts => [...ts, d.task]))
    socket.on("task_updated", (d) => setTasks(ts => ts.map(t => t.id === d.task.id ? d.task : t)))
    socket.on("task_deleted", (d) => setTasks(ts => ts.filter(t => t.id !== d.task_id)))
    return () => { socket.off("task_created"); socket.off("task_updated"); socket.off("task_deleted") }
  }, [])

  useEffect(() => {
    getTasks(workspaceId)
      .then(res => setTasks(res.data.tasks))
      .catch(err => {
        if (err?.status === 403) setAccessError("You don't have access to this workspace.")
        else if (err?.status === 404) setAccessError("This workspace doesn't exist.")
        else setError(err?.message || 'Failed to load tasks.')
      })
      .finally(() => setLoadingTasks(false))

    getMembers(workspaceId)
      .then(res => setMembers(res.data.members))
      .catch(() => setMemError('Failed to load members.'))
      .finally(() => setLoadingMembers(false))
  }, [workspaceId])

  const create = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    try { await createTask(workspaceId, { title }); setTitle('') }
    catch (err) { setError(err?.message || 'Failed to create task.') }
  }

  const move   = async (task, s) => { try { await updateTask(workspaceId, task.id, { status: s }) } catch (err) { setError(err?.message || 'Failed to move task.') } }
  const remove = async (id)      => { try { await deleteTask(workspaceId, id) }                      catch (err) { setError(err?.message || 'Failed to delete task.') } }

  const inviteMember = async (e) => {
    e.preventDefault(); setMemError('')
    if (!email.trim()) return
    try { const res = await addMember(workspaceId, { email }); setMembers(ms => [...ms, res.data.member]); setEmail('') }
    catch (err) { setMemError(err?.message || 'Failed to add member.') }
  }

  const kickMember = async (tid) => {
    try { await removeMember(workspaceId, tid); setMembers(ms => ms.filter(m => m.id !== tid)) }
    catch (err) { setMemError(err?.message || 'Failed to remove member.') }
  }

  const isOnline = (id) => online.some(u => u.id === id)
  const byStatus = (s)  => tasks.filter(t => t.status === s)

  if (accessError) return (
    <>
      <nav>
        <Link className="nav-back" to="/">← Workspaces</Link>
        <div /><button className="ghost" onClick={onLogout}>Sign out</button>
      </nav>
      <div className="fullscreen-state">
        <span className="state-icon">🔒</span>
        <h2>{accessError}</h2>
        <p>You may not have permission, or the link may be invalid.</p>
        <button className="primary" onClick={() => navigate('/')}>Back to workspaces</button>
      </div>
    </>
  )

  if (loadingTasks && !socketReady) return (
    <>
      <nav>
        <Link className="nav-back" to="/">← Workspaces</Link>
        <div /><button className="ghost" onClick={onLogout}>Sign out</button>
      </nav>
      <div className="fullscreen-state">
        <div className="spinner" />
        <p>Loading workspace...</p>
      </div>
    </>
  )

  return (
    <>
      <nav>
        <Link className="nav-back" to="/">← Workspaces</Link>
        <div className="nav-presence">
          {!socketReady
            ? <span className="connecting-label">Connecting...</span>
            : online.map(u => (
              <span key={u.id} className="presence-pill">
                <span className="presence-dot" />{u.username}
              </span>
            ))
          }
        </div>
        <div className="nav-right">
          <button className="ghost" onClick={onLogout}>Sign out</button>
        </div>
      </nav>

      <div className="board-layout">
        <div className="board-main">
          <div className="add-task-bar">
            <input
              placeholder="Add a task..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create(e)}
            />
            <button className="primary" onClick={create}>Add task</button>
          </div>

          {error && (
            <div className="error-banner">
              {error}
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          <div className="board-columns">
            {STATUSES.map(status => (
              <div className="column" key={status}>
                <div className="column-header">
                  <span className={`column-title ${COL_CLS[status]}`}>{LABELS[status]}</span>
                  <span className="column-count">{byStatus(status).length}</span>
                </div>
                <div className="column-body">
                  {byStatus(status).map(task => (
                    <div className={`task-card ${COL_CLS[status]}`} key={task.id}>
                      <p className="task-card-title">{task.title}</p>
                      <div className="task-actions">
                        {STATUSES.filter(s => s !== status).map(s => (
                          <button key={s} className="move-btn" onClick={() => move(task, s)}>
                            {LABELS[s]}
                          </button>
                        ))}
                        <button className="danger" onClick={() => remove(task.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="board-sidebar">
          <div className="sidebar-section">
            <h3>Members</h3>
            {loadingMembers ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-3)', fontSize: '0.8rem' }}>
                <div className="spinner spinner-sm" /> Loading...
              </div>
            ) : members.map(m => (
              <div className="member-row" key={m.id}>
                <div className="member-info">
                  <div className="member-avatar">{m.username.charAt(0)}</div>
                  <span className="member-name">{m.username}</span>
                  <span className={`member-status-dot ${isOnline(m.id) ? 'online' : 'offline'}`} />
                </div>
                {m.id !== user.id && (
                  <button className="danger" onClick={() => kickMember(m.id)}>Remove</button>
                )}
              </div>
            ))}
            {memError && <p className="error">{memError}</p>}
            <form className="invite-form" onSubmit={inviteMember}>
              <input type="email" placeholder="Invite by email" value={email} onChange={e => setEmail(e.target.value)} />
              <button type="submit" className="primary">Add</button>
            </form>
          </div>

          <div className="sidebar-section">
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