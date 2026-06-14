// frontend/src/pages/Signup.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api/auth'

export default function Signup({ onLogin }) {
  const [form, setForm]   = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const navigate          = useNavigate()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError('')
    try { const res = await signup(form); onLogin(res.data.user); navigate('/') }
    catch (err) { setError(err?.message || 'Sign up failed.') }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-logo">Taskboard</p>
        <h1>Create account</h1>
        <p className="auth-subtitle">Start collaborating with your team.</p>
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label>Username</label>
            <input value={form.username} onChange={set('username')} required placeholder="yourname" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} required placeholder="Min. 8 characters" />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="primary" style={{ marginTop: '0.25rem' }}>Create account</button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}