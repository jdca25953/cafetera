import { useState, type FormEvent } from 'react'
import { deleteCoffee, errorMessage, getAllCoffees, getIngredients, updateCoffee } from '../../api'
import RecipeEditor from '../../components/RecipeEditor'
import Status from '../../components/Status'
import { money } from '../../format'
import { useLoad } from '../../hooks'
import type { CoffeeView, DraftLine, IngredientInfo } from '../../types'

export default function CoffeesSection() {
  const coffees = useLoad(getAllCoffees, [])
  const ingredients = useLoad(getIngredients, [])
  const [editing, setEditing] = useState<CoffeeView | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function remove(c: CoffeeView) {
    if (!window.confirm(`¿Borrar ${c.name} del menú de todas las cafeteras?`)) return
    try {
      await deleteCoffee(c.id)
      setMsg(`${c.name} borrado.`)
      coffees.reload()
    } catch (e) {
      setMsg(errorMessage(e))
    }
  }

  if (editing)
    return (
      <CoffeeForm
        key={editing.id}
        coffee={editing}
        catalog={(ingredients.data ?? []).map((i): IngredientInfo => ({ ...i, stock: 0 }))}
        onCancel={() => setEditing(null)}
        onDone={() => { setEditing(null); setMsg('Café actualizado.'); coffees.reload() }}
      />
    )

  return (
    <section>
      {msg && <p className="banner" role="status">{msg}</p>}
      <p className="muted small">Los cafés nuevos los crean los usuarios desde la pantalla de la cafetera. Aquí puedes corregir o borrar los existentes.</p>
      <Status loading={coffees.loading} error={coffees.error} />
      <ul className="machines">
        {coffees.data?.map((c) => (
          <li key={c.id} className="machine-card stack-card">
            <div className="machine-head">
              <div>
                <strong>{c.name}</strong> {c.predefined && <span className="chip">Predeterminado</span>}
                <div className="muted small">{money(c.price)} · {c.recipe.map((r) => r.ingredientName).join(', ')}</div>
              </div>
              <div className="row-actions">
                <button className="btn secondary compact" onClick={() => { setMsg(null); setEditing(c) }}>Editar</button>
                <button className="btn secondary compact" disabled={c.predefined} title={c.predefined ? 'Los cafés predeterminados no se pueden borrar' : undefined}
                        onClick={() => remove(c)}>Borrar</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CoffeeForm({ coffee, catalog, onCancel, onDone }: {
  coffee: CoffeeView
  catalog: IngredientInfo[]
  onCancel: () => void
  onDone: () => void
}) {
  const [name, setName] = useState(coffee.name)
  const [lines, setLines] = useState<DraftLine[]>(coffee.recipe.map((r) => ({ ingredientId: r.ingredientId, quantity: r.quantity })))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await updateCoffee(coffee.id, name.trim(), lines)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <h2>Editar {coffee.name}</h2>
      <label>Nombre
        <input className="field" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      </label>
      <RecipeEditor lines={lines} onChange={setLines} catalog={catalog} unlimited />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn primary" disabled={busy || !name.trim() || lines.length === 0}>Guardar</button>
      </div>
    </form>
  )
}
