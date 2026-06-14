// frontend/src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

export default function Login({ onLogin }) {
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const navigate          = useNavigate()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError('')
    try { const res = await login(form); onLogin(res.data.user); navigate('/') }
    catch (err) { setError(err?.message || 'Sign in failed.') }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-logo">Taskboard</p>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue.</p>
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="primary" style={{ marginTop: '0.25rem' }}>Sign in</button>
        </form>
        <p className="auth-footer">No account? <Link to="/signup">Create one</Link></p>
      </div>
    </div>
  )
}