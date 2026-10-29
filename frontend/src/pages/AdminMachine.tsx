import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { errorMessage, getMachine, getRestocks, getServings, getStats, getStock, restock, setMinStock } from '../api'
import StatsPanel from '../components/StatsPanel'
import Status from '../components/Status'
import { money, when } from '../format'
import { useLoad } from '../hooks'
import type { StockItem } from '../types'

type Tab = 'stock' | 'servings' | 'restocks' | 'stats'

const TABS: { id: Tab; label: string }[] = [
  { id: 'stock', label: 'Stock' },
  { id: 'servings', label: 'Servicios' },
  { id: 'restocks', label: 'Reposiciones' },
  { id: 'stats', label: 'Estadísticas' },
]

const SIZE_LABEL = { SMALL: 'Pequeño', MEDIUM: 'Mediano', LARGE: 'Grande' } as const

export default function AdminMachine() {
  const { code = '' } = useParams()
  const [tab, setTab] = useState<Tab>('stock')
  const { data: machine } = useLoad(() => getMachine(code), [code])

  return (
    <main className="screen wide">
      <header className="bar">
        <Link to="/admin" className="link">Mis cafeteras</Link>
        <span className="bar-title">{machine?.name ?? code}</span>
      </header>

      <div className="tabs" role="tablist" aria-label="Secciones">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="panel"
            className={`tab${tab === t.id ? ' selected' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'stock' && <StockTab code={code} />}
        {tab === 'servings' && <ServingsTab code={code} />}
        {tab === 'restocks' && <RestocksTab code={code} />}
        {tab === 'stats' && <StatsPanel id={code} load={(f, t) => getStats(code, f, t)} />}
      </div>
    </main>
  )
}

function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <nav className="pager" aria-label="Paginación">
      <button className="btn secondary compact" disabled={page === 0} onClick={() => onPage(page - 1)}>Anterior</button>
      <span>Página {page + 1} de {totalPages}</span>
      <button className="btn secondary compact" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}>Siguiente</button>
    </nav>
  )
}

function StockTab({ code }: { code: string }) {
  const { data, error, loading, setData } = useLoad(() => getStock(code), [code])
  const [qty, setQty] = useState<Record<number, string>>({})
  const [min, setMin] = useState<Record<number, string>>({})
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const replace = (item: StockItem) =>
    setData((prev) => prev && prev.map((i) => (i.ingredientId === item.ingredientId ? item : i)))
  const num = (s: string | undefined) => Number((s ?? '').replace(',', '.'))

  async function doRestock(i: StockItem) {
    const q = num(qty[i.ingredientId])
    if (!(q > 0)) return setMsg('Escribe una cantidad mayor que 0.')
    setBusy(i.ingredientId)
    try {
      replace(await restock(code, i.ingredientId, q))
      setQty((s) => ({ ...s, [i.ingredientId]: '' }))
      setMsg(`Repuestos ${q} ${i.unit} de ${i.name}.`)
    } catch (e) {
      setMsg(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  async function doMin(i: StockItem) {
    const v = num(min[i.ingredientId])
    if (min[i.ingredientId] === undefined || min[i.ingredientId] === '' || !(v >= 0)) return setMsg('Escribe un umbral válido (0 o más).')
    setBusy(i.ingredientId)
    try {
      replace(await setMinStock(code, i.ingredientId, v))
      setMin((s) => ({ ...s, [i.ingredientId]: '' }))
      setMsg(`Umbral de ${i.name}: ${v} ${i.unit}.`)
    } catch (e) {
      setMsg(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section>
      <Status loading={loading} error={error} />
      {msg && <p className="banner" role="status">{msg}</p>}
      <ul className="lines">
        {data?.map((i) => (
          <li key={i.ingredientId} className="stock-row">
            <div className="line-info">
              <span className="line-name">{i.name}</span>
              <span className={`line-stock${i.low ? ' warn' : ''}`}>
                {i.stock} {i.unit} · umbral {i.minStock}{i.low ? ' · hay que reponer' : ''}
              </span>
            </div>
            <form className="inline-form" onSubmit={(e) => { e.preventDefault(); doRestock(i) }}>
              <label className="sr-only" htmlFor={`q${i.ingredientId}`}>Cantidad a reponer de {i.name}</label>
              <input id={`q${i.ingredientId}`} className="field compact-field" inputMode="decimal" placeholder={`+ ${i.unit}`}
                     value={qty[i.ingredientId] ?? ''} onChange={(e) => setQty((s) => ({ ...s, [i.ingredientId]: e.target.value }))} />
              <button className="btn primary compact" disabled={busy === i.ingredientId}>Reponer</button>
            </form>
            <form className="inline-form" onSubmit={(e) => { e.preventDefault(); doMin(i) }}>
              <label className="sr-only" htmlFor={`m${i.ingredientId}`}>Umbral de reposición de {i.name}</label>
              <input id={`m${i.ingredientId}`} className="field compact-field" inputMode="decimal" placeholder="Umbral"
                     value={min[i.ingredientId] ?? ''} onChange={(e) => setMin((s) => ({ ...s, [i.ingredientId]: e.target.value }))} />
              <button className="btn secondary compact" disabled={busy === i.ingredientId}>Guardar umbral</button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ServingsTab({ code }: { code: string }) {
  const [page, setPage] = useState(0)
  const { data, error, loading } = useLoad(() => getServings(code, page), [code, page])
  return (
    <section>
      <Status loading={loading} error={error} />
      {data && data.content.length === 0 && <p className="muted">Todavía no hay servicios.</p>}
      {data && data.content.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Café</th><th>Tamaño</th><th>Precio</th></tr></thead>
            <tbody>
              {data.content.map((s) => (
                <tr key={s.id}>
                  <td>{when(s.servedAt)}</td>
                  <td>{s.coffeeName}{s.customized ? ' (personalizado)' : ''}</td>
                  <td>{SIZE_LABEL[s.size]}</td>
                  <td>{money(s.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </section>
  )
}

function RestocksTab({ code }: { code: string }) {
  const [page, setPage] = useState(0)
  const { data, error, loading } = useLoad(() => getRestocks(code, page), [code, page])
  return (
    <section>
      <Status loading={loading} error={error} />
      {data && data.content.length === 0 && <p className="muted">Todavía no hay reposiciones.</p>}
      {data && data.content.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Ingrediente</th><th>Cantidad</th><th>Usuario</th></tr></thead>
            <tbody>
              {data.content.map((r) => (
                <tr key={r.id}>
                  <td>{when(r.restockedAt)}</td>
                  <td>{r.ingredientName}</td>
                  <td>{r.quantity} {r.unit}</td>
                  <td>{r.username ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </section>
  )
}
