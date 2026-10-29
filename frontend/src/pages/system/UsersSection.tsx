import { useState, type FormEvent } from 'react'
import { createUser, deactivateUser, errorMessage, getMyMachines, getUsers, updateUser } from '../../api'
import Status from '../../components/Status'
import { useLoad } from '../../hooks'
import type { Machine, Role, UserView } from '../../types'

export default function UsersSection() {
  const users = useLoad(getUsers, [])
  const machines = useLoad(getMyMachines, [])
  const [editing, setEditing] = useState<UserView | 'new' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function deactivate(u: UserView) {
    if (!window.confirm(`¿Desactivar a ${u.username}? Ya no podrá entrar.`)) return
    try {
      await deactivateUser(u.id)
      setMsg(`${u.username} desactivado.`)
      users.reload()
    } catch (e) {
      setMsg(errorMessage(e))
    }
  }

  if (editing)
    return (
      <UserForm
        key={editing === 'new' ? 'new' : editing.id}
        initial={editing === 'new' ? null : editing}
        machines={machines.data ?? []}
        onCancel={() => setEditing(null)}
        onDone={(text) => { setEditing(null); setMsg(text); users.reload() }}
      />
    )

  return (
    <section>
      <button className="btn primary" onClick={() => { setMsg(null); setEditing('new') }}>Nuevo usuario</button>
      {msg && <p className="banner" role="status">{msg}</p>}
      <Status loading={users.loading} error={users.error} />
      <ul className="machines">
        {users.data?.map((u) => (
          <li key={u.id} className="machine-card stack-card">
            <div className="machine-head">
              <div>
                <strong>{u.username}</strong> {!u.active && <span className="chip off">Desactivado</span>}
                <div className="muted small">
                  {u.role === 'ADMIN' ? 'Administrador' : `Operador · ${u.machineCodes.length ? u.machineCodes.join(', ') : 'sin cafeteras'}`}
                </div>
              </div>
              <div className="row-actions">
                <button className="btn secondary compact" onClick={() => { setMsg(null); setEditing(u) }}>Editar</button>
                {u.active && <button className="btn secondary compact" onClick={() => deactivate(u)}>Desactivar</button>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function UserForm({ initial, machines, onCancel, onDone }: {
  initial: UserView | null
  machines: Machine[]
  onCancel: () => void
  onDone: (message: string) => void
}) {
  const [username, setUsername] = useState(initial?.username ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(initial?.role ?? 'OPERATOR')
  const [codes, setCodes] = useState<string[]>(initial?.machineCodes ?? [])
  const [active, setActive] = useState(initial?.active ?? true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const toggle = (code: string) => setCodes((c) => (c.includes(code) ? c.filter((x) => x !== code) : [...c, code]))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const input = {
      username: username.trim(),
      password: password || undefined,
      role,
      machineCodes: role === 'ADMIN' ? [] : codes,
      active,
    }
    try {
      if (initial) await updateUser(initial.id, input)
      else await createUser(input)
      onDone(initial ? 'Usuario actualizado.' : 'Usuario creado.')
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <h2>{initial ? `Editar ${initial.username}` : 'Nuevo usuario'}</h2>
      <label>Usuario
        <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
      </label>
      <label>{initial ? 'Contraseña (vacía = no cambiar)' : 'Contraseña (mínimo 8 caracteres)'}
        <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </label>
      <label>Rol
        <select className="field" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="OPERATOR">Operador</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </label>
      {role === 'OPERATOR' && (
        <fieldset className="check-list">
          <legend>Cafeteras que puede gestionar</legend>
          {machines.map((m) => (
            <label key={m.code} className="check">
              <input type="checkbox" checked={codes.includes(m.code)} onChange={() => toggle(m.code)} />
              {m.name} <span className="muted small">({m.code})</span>
            </label>
          ))}
        </fieldset>
      )}
      {initial && (
        <label className="check">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Usuario activo
        </label>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn primary" disabled={busy || !username.trim() || (!initial && !password)}>Guardar</button>
      </div>
    </form>
  )
}
