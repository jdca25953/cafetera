import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, getMachine } from '../api'
import { getSession } from '../auth'
import CupSvg from '../components/CupSvg'

const KEY = 'lastMachine'

function remembered(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export default function EnterCode() {
  const navigate = useNavigate()
  const [code, setCode] = useState(remembered)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = code.trim().toUpperCase()
    if (value.length !== 8) {
      setError('El código tiene 8 caracteres.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await getMachine(value)
      try {
        localStorage.setItem(KEY, value)
      } catch {
        /* sin almacenamiento: no pasa nada */
      }
      navigate(`/m/${value}`)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? 'No existe ninguna cafetera con ese código.'
          : 'No se puede conectar con el servidor.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="screen center">
      <CupSvg height={170} layers={[
        { ingredientId: 1, ingredientName: 'Café', unit: 'g', quantity: 3 },
        { ingredientId: 2, ingredientName: 'Leche', unit: 'ml', quantity: 3 },
        { ingredientId: 3, ingredientName: 'Espuma', unit: 'ml', quantity: 2 },
      ]} />
      <h1>¿Qué cafetera es?</h1>
      <p className="muted">Escribe el código de 8 caracteres que ves en la máquina, o escanea su QR.</p>
      <form onSubmit={submit} className="stack">
        <label className="sr-only" htmlFor="code">Código de la cafetera</label>
        <input
          id="code"
          className="code-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="K7QX2M9P"
        />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Buscando…' : 'Abrir cafetera'}</button>
      </form>

      <Link className="link" to="/admin">
        {getSession() ? 'Ir a gestión' : 'Acceso de gestión'}
      </Link>
    </main>
  )
}
