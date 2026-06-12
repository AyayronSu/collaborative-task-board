import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

export default function Login({ onLogin }) {
    const [form, setForm]   = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const navigate          = useNavigate()

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const res = await login(form)
            onLogin(res.data.user)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed.')
        }
    }

    return (
        <div>
            <h1>Login</h1>
            <form className="form" onSubmit={submit}>
                <label>Email</label>
                <input type="email" value={form.email} onChange={set('email')} required />
                <label>Password</label>
                <input type="password" value={form.password} onChange={set('password')} required/>
                <button type="submit">Log in</button>
                {error && <p className="error">{error}</p>}
            </form>
            <p style={{ marginTop: '1rem'}}>
                No account? <Link to="/signup">Sign up</Link>
            </p>
        </div>
    )
}