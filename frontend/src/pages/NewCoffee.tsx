import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createCoffee, errorMessage, getCatalog } from '../api'
import RecipeEditor from '../components/RecipeEditor'
import type { DraftLine, IngredientInfo } from '../types'

export default function NewCoffee() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState<IngredientInfo[] | null>(null)
  const [name, setName] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    getCatalog(code)
      .then((c) => alive && setCatalog(c))
      .catch((e) => alive && setError(errorMessage(e)))
    return () => {
      alive = false
    }
  }, [code])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await createCoffee(name.trim(), lines)
      navigate(`/m/${code}/coffee/${created.id}`)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  if (!catalog)
    return (
      <main className="screen center">
        {error ? <p className="error" role="alert">{error}</p> : <p>Cargando…</p>}
        {error && <Link className="btn secondary" to={`/m/${code}`}>Volver al menú</Link>}
      </main>
    )

  return (
    <main className="screen">
      <header className="bar">
        <Link to={`/m/${code}`} className="link">Volver</Link>
      </header>
      <h1>Crea tu café</h1>

      <form className="stack" onSubmit={submit}>
        <label className="sr-only" htmlFor="name">Nombre del café</label>
        <input
          id="name"
          className="field"
          value={name}
          maxLength={80}
          placeholder="Nombre del café"
          onChange={(e) => setName(e.target.value)}
        />
        <RecipeEditor lines={lines} onChange={setLines} catalog={catalog} />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary block" disabled={busy || !name.trim() || lines.length === 0}>
          {busy ? 'Guardando…' : 'Guardar y elegir tamaño'}
        </button>
        <p className="muted small center-text">El café se añade al menú de todas las cafeteras.</p>
      </form>
    </main>
  )
}
