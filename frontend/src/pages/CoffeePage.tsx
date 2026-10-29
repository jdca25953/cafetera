import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, createCoffee, errorMessage, getCatalog, getCoffees, getSizes, quote, serve } from '../api'
import CupSvg from '../components/CupSvg'
import RecipeEditor from '../components/RecipeEditor'
import { list, money } from '../format'
import type { CupSize, DraftLine, IngredientInfo, MachineCoffee, Quote, ServeResult, SizeInfo } from '../types'

type Step = 'choose' | 'edit' | 'confirm' | 'serving' | 'done' | 'error'

const CUP_HEIGHT: Record<CupSize, number> = { SMALL: 170, MEDIUM: 200, LARGE: 230 }
const ICON_HEIGHT: Record<CupSize, number> = { SMALL: 40, MEDIUM: 50, LARGE: 60 }

// Se identifica por código+id: al guardar un café nuevo, la pantalla empieza limpia
export default function CoffeePage() {
  const { code = '', id = '' } = useParams()
  return <CoffeeScreen key={`${code}-${id}`} code={code} coffeeId={Number(id)} />
}

function CoffeeScreen({ code, coffeeId }: { code: string; coffeeId: number }) {
  const navigate = useNavigate()

  const [coffee, setCoffee] = useState<MachineCoffee | null>(null)
  const [sizes, setSizes] = useState<SizeInfo[]>([])
  const [quotes, setQuotes] = useState<Partial<Record<CupSize, Quote>>>({})
  const [size, setSize] = useState<CupSize>('MEDIUM')
  const [step, setStep] = useState<Step>('choose')
  const [notice, setNotice] = useState<string | null>(null)
  const [result, setResult] = useState<ServeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Receta personalizada para este servicio (null = la original) y borrador del editor
  const [custom, setCustom] = useState<DraftLine[] | null>(null)
  const [draft, setDraft] = useState<DraftLine[]>([])
  const [catalog, setCatalog] = useState<IngredientInfo[]>([])
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Carga el café y el presupuesto (precio + disponibilidad) de cada tamaño
  const load = useCallback(async (): Promise<Partial<Record<CupSize, Quote>>> => {
    const [coffees, sz] = await Promise.all([getCoffees(code), getSizes()])
    const found = coffees.find((c) => c.id === coffeeId)
    if (!found) throw new ApiError(404, { error: 'Ese café ya no existe.' })
    const results = await Promise.all(sz.map((s) => quote(code, coffeeId, s.code, custom ?? undefined)))
    const map: Partial<Record<CupSize, Quote>> = {}
    sz.forEach((s, i) => (map[s.code] = results[i]))
    setCoffee(found)
    setSizes(sz)
    setQuotes(map)
    return map
  }, [code, coffeeId, custom])

  useEffect(() => {
    let alive = true
    load()
      .then((map) => {
        if (!alive) return
        if (!map.MEDIUM?.available) {
          const first = (Object.keys(map) as CupSize[]).find((k) => map[k]?.available)
          if (first) setSize(first)
        }
      })
      .catch((e) => alive && (setError(errorMessage(e)), setStep('error')))
    return () => {
      alive = false
    }
  }, [load])

  async function openEditor() {
    if (!coffee) return
    try {
      setCatalog(await getCatalog(code))
    } catch (e) {
      setError(errorMessage(e))
      setStep('error')
      return
    }
    setDraft(custom ?? coffee.recipe.map((r) => ({ ingredientId: r.ingredientId, quantity: r.quantity })))
    setNewName('')
    setSaveError(null)
    setStep('edit')
  }

  async function saveAsNew() {
    setSaving(true)
    setSaveError(null)
    try {
      const created = await createCoffee(newName.trim(), draft)
      navigate(`/m/${code}/coffee/${created.id}`)
    } catch (e) {
      setSaveError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function accept() {
    const q = quotes[size]
    if (!q) return
    setStep('serving')
    try {
      setResult(await serve(code, coffeeId, size, q.price, custom ?? undefined))
      setStep('done')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.body?.currentPrice !== undefined) {
        setNotice(`El precio ha cambiado a ${money(e.body.currentPrice)}. Revísalo antes de aceptar.`)
        await load().catch(() => undefined)
        setStep('confirm')
        return
      }
      if (e instanceof ApiError && e.status === 409 && Array.isArray(e.body?.ingredients)) {
        setError(`Ya no queda ${list(e.body.ingredients)}. No se ha cobrado nada.`)
        await load().catch(() => undefined)
      } else {
        setError(errorMessage(e))
      }
      setStep('error')
    }
  }

  if (step === 'done' && result)
    return (
      <main className="screen center">
        <CupSvg layers={result.recipe} height={200} />
        <h1>Tu {result.coffeeName.toLowerCase()} está listo</h1>
        <p className="muted">Has pagado {money(result.price)}.</p>
        {result.alerts.length > 0 && (
          <p className="banner" role="status">
            Aviso de reposición: {list(result.alerts.map((a) => (a.empty ? `${a.name} (agotado)` : `${a.name} (quedan ${a.stock} ${a.unit})`)))}.
          </p>
        )}
        <button className="btn primary" onClick={() => navigate(`/m/${code}`)}>Pedir otro café</button>
      </main>
    )

  if (step === 'error')
    return (
      <main className="screen center">
        <p className="error" role="alert">{error}</p>
        <button className="btn primary" onClick={() => { setError(null); setStep('choose') }}>Volver</button>
        <Link className="btn secondary" to={`/m/${code}`}>Ir al menú</Link>
      </main>
    )

  if (!coffee) return <main className="screen center"><p>Cargando…</p></main>

  if (step === 'edit')
    return (
      <main className="screen">
        <header className="bar">
          <button className="link-btn" onClick={() => setStep('choose')}>Cancelar</button>
        </header>
        <h1>Personaliza tu {coffee.name.toLowerCase()}</h1>
        <RecipeEditor lines={draft} onChange={setDraft} catalog={catalog} />

        <button className="btn primary block" disabled={draft.length === 0} onClick={() => { setCustom(draft); setStep('choose') }}>
          Usar esta receta
        </button>

        <section className="save-box">
          <h2>¿Quieres guardarla?</h2>
          <p className="muted small">Se añade al menú de todas las cafeteras.</p>
          <label className="sr-only" htmlFor="new-name">Nombre del café nuevo</label>
          <input
            id="new-name"
            className="field"
            value={newName}
            maxLength={80}
            placeholder="Nombre del café nuevo"
            onChange={(e) => setNewName(e.target.value)}
          />
          {saveError && <p className="error" role="alert">{saveError}</p>}
          <button className="btn secondary block" disabled={!newName.trim() || draft.length === 0 || saving} onClick={saveAsNew}>
            {saving ? 'Guardando…' : 'Guardar como café nuevo'}
          </button>
        </section>
      </main>
    )

  const q = quotes[size]
  const info = sizes.find((s) => s.code === size)

  return (
    <main className="screen">
      <header className="bar">
        <Link to={`/m/${code}`} className="link">Volver</Link>
      </header>

      <div className="stage">
        <CupSvg layers={q?.recipe ?? coffee.recipe} height={CUP_HEIGHT[size]} />
      </div>
      <h1 className="center-text">{coffee.name}</h1>
      <p className="muted center-text">{info ? `${info.volumeMl} ml` : ''}</p>

      {custom && (
        <p className="chip-row">
          <span className="chip">Receta personalizada</span>
          <button className="link-btn" onClick={() => setCustom(null)}>Volver a la original</button>
        </p>
      )}

      <div className="sizes" role="radiogroup" aria-label="Tamaño">
        {sizes.map((s) => {
          const sq = quotes[s.code]
          const ok = sq?.available ?? false
          return (
            <button
              key={s.code}
              role="radio"
              aria-checked={size === s.code}
              className={`size${size === s.code ? ' selected' : ''}`}
              disabled={!ok}
              onClick={() => setSize(s.code)}
            >
              <CupSvg height={ICON_HEIGHT[s.code]} />
              <span className="size-ml">{s.volumeMl} ml</span>
              <span className="size-price">{ok && sq ? money(sq.price) : 'Sin stock'}</span>
            </button>
          )
        })}
      </div>

      {q && !q.available && <p className="error">Falta {list(q.missing)} para este tamaño.</p>}

      <button className="btn secondary block" onClick={openEditor}>Personalizar receta</button>
      <button className="btn primary wide" disabled={!q?.available} onClick={() => { setNotice(null); setStep('confirm') }}>
        {q ? `Pagar ${money(q.price)}` : 'Pagar'}
      </button>

      {(step === 'confirm' || step === 'serving') && q && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="pay-title">
          <div className="sheet">
            <h2 id="pay-title">Confirmar pago</h2>
            <p>
              {coffee.name}, {info?.volumeMl} ml{custom ? ', receta personalizada' : ''}
            </p>
            <p className="total">{money(q.price)}</p>
            {notice && <p className="error" role="alert">{notice}</p>}
            <div className="row">
              <button className="btn secondary" disabled={step === 'serving'} onClick={() => setStep('choose')}>Cancelar</button>
              <button className="btn primary" disabled={step === 'serving'} onClick={accept}>
                {step === 'serving' ? 'Sirviendo…' : 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
