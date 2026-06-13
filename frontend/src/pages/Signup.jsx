import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom'
import { signup } from "../api/auth";

export default function Signup({ onLogin }) {
    const [form, setForm] = useState({ username: '', email: '', password: '' })
    const [error, setError] = useState('')
    const navigate          = useNavigate()

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const res = await signup(form)
            onLogin(res.data.user)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed.')
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Create account</h1>
                <form className="form" onSubmit={submit}>
                    <label>Username</label>
                    <input value={form.username} onChange={set('username')} required />
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={set('email')} required />
                    <label>Password</label>
                    <input type="password" value={form.password} onChange={set('password')} required />
                    <button type="submit" className="primary">Create account</button>
                    {error && <p className="error">{error}</p>}
                </form>
                <p className="auth-footer">Have an account? <Link to="/login">Sign in</Link></p>
            </div>
        </div>
    )
}