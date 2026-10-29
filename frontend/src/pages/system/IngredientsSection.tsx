import { useState, type FormEvent } from 'react'
import { deleteIngredient, errorMessage, getIngredients, saveIngredient } from '../../api'
import Status from '../../components/Status'
import { useLoad } from '../../hooks'
import type { IngredientView } from '../../types'

const price = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 4 })

export default function IngredientsSection() {
  const { data, error, loading, reload } = useLoad(getIngredients, [])
  const [editing, setEditing] = useState<IngredientView | 'new' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function remove(i: IngredientView) {
    if (!window.confirm(`¿Borrar ${i.name}? Se elimina también su stock en todas las cafeteras.`)) return
    try {
      await deleteIngredient(i.id)
      setMsg(`${i.name} borrado.`)
      reload()
    } catch (e) {
      setMsg(errorMessage(e))
    }
  }

  if (editing)
    return (
      <IngredientForm
        key={editing === 'new' ? 'new' : editing.id}
        initial={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onDone={(text) => { setEditing(null); setMsg(text); reload() }}
      />
    )

  return (
    <section>
      <button className="btn primary" onClick={() => { setMsg(null); setEditing('new') }}>Nuevo ingrediente</button>
      {msg && <p className="banner" role="status">{msg}</p>}
      <p className="muted small">Cambiar un precio actualiza el precio de todos los cafés que lo usan.</p>
      <Status loading={loading} error={error} />
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Ingrediente</th><th>Precio por unidad</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            {data?.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{price(i.price)} € / {i.unit}</td>
                <td className="actions">
                  <button className="link-btn" onClick={() => { setMsg(null); setEditing(i) }}>Editar</button>{' '}
                  <button className="link-btn" onClick={() => remove(i)}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function IngredientForm({ initial, onCancel, onDone }: {
  initial: IngredientView | null
  onCancel: () => void
  onDone: (message: string) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [unit, setUnit] = useState(initial?.unit ?? 'ml')
  const [cost, setCost] = useState(initial ? String(initial.price) : '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const value = Number(cost.replace(',', '.'))
  const valid = name.trim() && unit.trim() && cost !== '' && value >= 0

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await saveIngredient(initial?.id ?? null, { name: name.trim(), unit: unit.trim(), price: value })
      onDone(initial ? 'Ingrediente actualizado.' : 'Ingrediente creado.')
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <h2>{initial ? `Editar ${initial.name}` : 'Nuevo ingrediente'}</h2>
      <label>Nombre
        <input className="field" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>Unidad (g, ml, ud…)
        <input className="field" value={unit} maxLength={10} onChange={(e) => setUnit(e.target.value)} />
      </label>
      <label>Precio por unidad, en euros
        <input className="field" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0,005" />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn primary" disabled={busy || !valid}>Guardar</button>
      </div>
    </form>
  )
}
