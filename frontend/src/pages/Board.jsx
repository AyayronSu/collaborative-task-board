import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks'

const STATUSES = ['todo', 'in_progress', 'done']
const LABELS   = { todo: 'To do', in_progress: 'In progress', done: 'Done' }

export default function Board({ user, onLogout }) {
    const { id: workspaceId } = useParams()
    const [tasks,   setTasks] = useState([])
    const [title, setTitle] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        console.log('workspace id:', workspaceId)
        getTasks(workspaceId)
            .then(res => {
            console.log('tasks response:', res.data)
            setTasks(res.data.tasks)
            })
            .catch((err) => {
            console.log('tasks error:', err.response)
            setError('Failed to load tasks.')
            })
    }, [workspaceId])

    const create = async (e) => {
        e.preventDefault()
        if (!title.trim()) return
        try {
            const res = await createTask(workspaceId, { title })
            setTasks(ts => [...ts, res.data.task])
            setTitle('')
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create task.')
        }
    }

    const move = async (task, newStatus) => {
        try {
            const res = await updateTask(workspaceId, task.id, { status: newStatus })
            setTasks(ts => ts.map(t => t.id === task.id ? res.data.task : t))
        } catch (err) {
            setError('Failed to update task.')
        }
    }

    const remove = async (id) => {
        try {
            await deleteTask(workspaceId, id)
            setTasks(ts => ts.filter(t => t.id !== id))
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