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
        <div>
            <nav>
                <span>Hey, {user.username}</span>
                <button className="ghost" onClick={onLogout}>Log out</button>
            </nav>

            <h2>Workspaces</h2>

            <form className="row" onSubmit={create} style={{ marginBottom: '1rem'}}>
                <input
                    placeholder="New workspace name"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                <button type="submit">Create</button>
            </form>

            {error && <p className="error">{error}</p>}

            {workspaces.length === 0 && <p>No workspaces yet.</p>}

            {workspaces.map(w => (
                <div className="workspace-item" key={w.id}>
                    <Link to={`/workspaces/${w.id}`}>{w.title}</Link>
                    {w.created_by === user.id && (
                        <button className="danger" onClick={() => remove(w.id)}>Delete</button>
                    )}
                </div>
            ))}
        </div>
    )
}