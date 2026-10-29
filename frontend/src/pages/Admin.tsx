import { Link, useNavigate } from 'react-router-dom'
import { getMyMachines } from '../api'
import { clearSession, getSession } from '../auth'
import { useLoad } from '../hooks'

export default function Admin() {
  const navigate = useNavigate()
  const session = getSession()
  const { data, error, loading } = useLoad(getMyMachines, [])

  function logout() {
    clearSession()
    navigate('/login')
  }

  return (
    <main className="screen wide">
      <header className="bar">
        <span className="bar-title">{session?.username} · {session?.role === 'ADMIN' ? 'Administrador' : 'Operador'}</span>
        <button className="link-btn" onClick={logout}>Salir</button>
      </header>

      {session?.role === 'ADMIN' && (
        <Link className="btn secondary" to="/admin/system">Administración del sistema</Link>
      )}

      <h1>Mis cafeteras</h1>
      {loading && <p>Cargando…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {data && data.length === 0 && <p className="muted">No tienes cafeteras asignadas.</p>}

      <ul className="machines">
        {data?.map((m) => (
          <li key={m.code} className="machine-card">
            <div>
              <strong>{m.name}</strong>
              <div className="muted small">Código {m.code}</div>
            </div>
            <div className="row-actions">
              <Link className="btn primary compact" to={`/admin/m/${m.code}`}>Gestionar</Link>
              <Link className="btn secondary compact" to={`/m/${m.code}`}>Ver pantalla</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
