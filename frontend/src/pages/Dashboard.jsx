import { useEffect, useState } from "react";
import { Link } from 'react-router-dom'
import { getWorkspaces, createWorkspace, deleteWorkspace } from '../api/workspaces'

export default function Dashboard({ user, onLogout }) {
    const [workspaces, setWorkspaces] = useState([])
    const [title, setTitle]           = useState('')
    const [error, setError]           = useState('')

    useEffect(() => {
        getWorkspaces()
          .then(res => setWorkspaces(res.data.workspaces))
          .catch(() => setError('Failed to load workspaces.'))
    }, [])

    const create = async (e) => {
        e.preventDefault()
        if (!title.trim()) return 
        try {
            const res = await createWorkspace({ title })
            setWorkspaces(ws => [...ws, res.data.workspace])
            setTitle('')
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create workspace.")
        }
    }

    const remove = async (id) => {
        try {
            await deleteWorkspace(id)
            setWorkspaces(ws => ws.filter(w => w.id !== id))
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete workspace')
        }
    }

    return (
        <>
            <nav>
                <span style={{ fontWeight: 600 }}>Taskboard</span>
                <span style={{ fontSize: '0.85rem', color: '#555'}}>{user.username}</span>
                <button className="ghost" onClick={onLogout}>Sign out</button>
            </nav>

            <div className="dashboard">
                <h2>Workspaces</h2>

                <form className="row" onSubmit={create} style={{ marginBottom: '1.25rem' }}>
                    <input
                        placeholder="New workspace name"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                    <button type="submit" className="primary">Create</button>
                </form>

                {error && <p className="error">{error}</p>}

                <div className="workspace-list">
                    {workspaces.length === 0
                      ? <p className="empty-state">No workspaces yet. Create one above.</p>
                      : workspaces.map(w => (
                        <div className="workspace-item" key={w.id}>
                            <Link to={`/workspace/${w.id}`}>{w.title}</Link>
                            {w.created_by === user.id && (
                                <button className="danger" onClick={() => remove(w.id)}>Delete</button>
                            )}
                        </div>
                      ))
                    }
                </div>
            </div>
        </>
    )
}