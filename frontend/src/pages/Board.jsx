// frontend/src/pages/Board.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import socket from '../socket'

const STATUSES = ['todo', 'in_progress', 'done']
const LABELS   = { todo: 'To do', in_progress: 'In progress', done: 'Done' }

export default function Board({ user, onLogout }) {
  const { id: workspaceId }  = useParams()
  const [tasks,   setTasks]  = useState([])
  const [title,   setTitle]  = useState('')
  const [error,   setError]  = useState('')

  useEffect(() => {
    socket.emit("join_workspace", { workspace_id: workspaceId })

    socket.on("room_joined", (data) => {
      console.log(`[WS] room joined: ${data.workspace_id}`)
    })

    return () => {
      socket.emit("leave_workspace", { workspace_id: workspaceId })
      socket.off("room_joined")
    }
  }, [workspaceId])

  useEffect(() => {
    socket.on("task_created", (data) => {
      console.log("[WS] task_created received:", data.task)
      setTasks(ts => [...ts, data.task])
    })

    socket.on("task_updated", (data) => {
      console.log("[WS] task_updated:", data.task)
      setTasks(ts => ts.map(t => t.id === data.task.id ? data.task : t))
    })

    socket.on("task_deleted", (data) => {
      console.log("[WS] task_deleted:", data.task_id)
      setTasks(ts => ts.filter(t => t.id !== data.task_id))
    })

    return () => {
      socket.off("task_created")
      socket.off("task_updated")
      socket.off("task_deleted")
    }
  }, [])

  // load tasks on mount
  useEffect(() => {
    getTasks(workspaceId)
      .then(res => setTasks(res.data.tasks))
      .catch(()  => setError('Failed to load tasks.'))
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
    try {
      await updateTask(workspaceId, task.id, { status: newStatus })
    } catch (err) {
      setError('Failed to update task.')
    }
  }

  const remove = async (id) => {
    try {
      await deleteTask(workspaceId, id)
    } catch (err) {
      setError('Failed to delete task.')
    }
  }

  const byStatus = (status) => tasks.filter(t => t.status === status)

  return (
    <div>
      <nav>
        <Link to="/">← Workspaces</Link>
        <button className="ghost" onClick={onLogout}>Log out</button>
      </nav>

      <h2>Board</h2>

      <form className="row" onSubmit={create} style={{ marginBottom: '1rem' }}>
        <input
          placeholder="New task title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <button type="submit">Add task</button>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="board">
        {STATUSES.map(status => (
          <div className="column" key={status}>
            <h3>{LABELS[status]}</h3>
            {byStatus(status).map(task => (
              <div className="task-card" key={task.id}>
                <span>{task.title}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {STATUSES.filter(s => s !== task.status).map(s => (
                    <button
                      key={s}
                      className="ghost"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                      onClick={() => move(task, s)}
                    >
                      → {LABELS[s]}
                    </button>
                  ))}
                  <button
                    className="danger"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                    onClick={() => remove(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}