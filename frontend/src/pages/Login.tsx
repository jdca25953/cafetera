import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { errorMessage, login } from '../api'
import { getSession, saveSession } from '../auth'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (getSession()) return <Navigate to="/admin" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      saveSession(await login(username.trim(), password))
      navigate('/admin')
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <main className="screen center">
      <h1>Gestión</h1>
      <p className="muted">Acceso para administradores y operadores.</p>
      <form className="stack" onSubmit={submit}>
        <label className="sr-only" htmlFor="user">Usuario</label>
        <input id="user" className="field" value={username} onChange={(e) => setUsername(e.target.value)}
               placeholder="Usuario" autoComplete="username" autoCapitalize="none" />
        <label className="sr-only" htmlFor="pass">Contraseña</label>
        <input id="pass" className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
               placeholder="Contraseña" autoComplete="current-password" />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy || !username.trim() || !password}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <Link className="link" to="/">Volver a la cafetera</Link>
    </main>
  )
}
