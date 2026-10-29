import CupSvg from './CupSvg'
import { money } from '../format'
import type { DraftLine, IngredientInfo, RecipeLine } from '../types'

interface Props {
  lines: DraftLine[]
  onChange: (lines: DraftLine[]) => void
  catalog: IngredientInfo[]
  /** true: sin tope de stock (edición de recetas del catálogo) */
  unlimited?: boolean
}

const stepOf = (unit: string) => (unit === 'ml' ? 10 : 1)
const defaultOf = (unit: string) => (unit === 'ml' ? 30 : 5)

/** Estimación para la vista previa. El precio real lo calcula el servidor al pedir el presupuesto. */
export function estimate(lines: DraftLine[], catalog: IngredientInfo[]): number {
  const total = lines.reduce((sum, l) => sum + (catalog.find((i) => i.id === l.ingredientId)?.price ?? 0) * l.quantity, 0)
  return Math.round(total * 100) / 100
}

export default function RecipeEditor({ lines, onChange, catalog, unlimited = false }: Props) {
  const byId = new Map(catalog.map((i) => [i.id, i]))
  const layers: RecipeLine[] = lines.flatMap((l) => {
    const i = byId.get(l.ingredientId)
    return i ? [{ ingredientId: i.id, ingredientName: i.name, unit: i.unit, quantity: l.quantity }] : []
  })
  const unused = catalog.filter((i) => !lines.some((l) => l.ingredientId === i.id))

  const setQty = (id: number, quantity: number) =>
    onChange(lines.map((l) => (l.ingredientId === id ? { ...l, quantity } : l)))
  const remove = (id: number) => onChange(lines.filter((l) => l.ingredientId !== id))
  const add = (id: number) => {
    const i = byId.get(id)
    if (!i) return
    onChange([...lines, { ingredientId: id, quantity: Math.max(stepOf(i.unit), Math.min(defaultOf(i.unit), unlimited ? Infinity : i.stock)) }])
  }

  return (
    <div className="editor">
      <div className="stage">
        <CupSvg layers={layers} height={170} />
      </div>
      <p className="center-text">
        <strong>{money(estimate(lines, catalog))}</strong> <span className="muted">estimado, tamaño mediano</span>
      </p>

      {lines.length === 0 && <p className="muted center-text">Añade al menos un ingrediente.</p>}

      <ul className="lines">
        {lines.map((l) => {
          const i = byId.get(l.ingredientId)
          if (!i) return null
          const step = stepOf(i.unit)
          const limit = unlimited ? Infinity : i.stock
          const over = l.quantity > limit
          return (
            <li key={l.ingredientId} className="line">
              <div className="line-info">
                <span className="line-name">{i.name}</span>
                {!unlimited && (
                  <span className={`line-stock${over ? ' warn' : ''}`}>
                    {over ? `Solo quedan ${i.stock} ${i.unit}` : `Quedan ${i.stock} ${i.unit}`}
                  </span>
                )}
              </div>
              <div className="stepper">
                <button
                  className="step"
                  aria-label={`Menos ${i.name}`}
                  disabled={l.quantity - step < step}
                  onClick={() => setQty(i.id, l.quantity - step)}
                >
                  −
                </button>
                <span className="qty" aria-live="polite">{l.quantity} {i.unit}</span>
                <button
                  className="step"
                  aria-label={`Más ${i.name}`}
                  disabled={l.quantity + step > limit}
                  onClick={() => setQty(i.id, l.quantity + step)}
                >
                  +
                </button>
              </div>
              <button className="link-btn" aria-label={`Quitar ${i.name}`} onClick={() => remove(i.id)}>Quitar</button>
            </li>
          )
        })}
      </ul>

      <label className="sr-only" htmlFor="add-ingredient">Añadir ingrediente</label>
      <select
        id="add-ingredient"
        className="field"
        value=""
        disabled={unused.length === 0}
        onChange={(e) => e.target.value && add(Number(e.target.value))}
      >
        <option value="">{unused.length ? 'Añadir ingrediente…' : 'Ya están todos los ingredientes'}</option>
        {unused.map((i) => (
          <option key={i.id} value={i.id} disabled={!unlimited && i.stock <= 0}>
            {i.name}{!unlimited && i.stock <= 0 ? ' (sin stock)' : ''}
          </option>
        ))}
      </select>
      <p className="muted small">La receta es para el tamaño mediano (250 ml); los otros tamaños se escalan.</p>
    </div>
  )
}
