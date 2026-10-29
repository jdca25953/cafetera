import { useState } from 'react'
import { money } from '../format'
import { useLoad } from '../hooks'
import type { StatsView } from '../types'
import Status from './Status'

interface Props {
  id: string // identifica el origen de los datos (cafetera o "global")
  load: (from?: string, to?: string) => Promise<StatsView>
}

export default function StatsPanel({ id, load }: Props) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { data, error, loading } = useLoad(() => load(from || undefined, to || undefined), [id, from, to])
  const maxServings = Math.max(1, ...(data?.topCoffees.map((c) => c.servings) ?? [1]))

  return (
    <section>
      <div className="range">
        <label>Desde <input className="field compact-field" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>Hasta <input className="field compact-field" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      <p className="muted small">Sin fechas se muestran los últimos 30 días.</p>
      <Status loading={loading} error={error} />

      {data && (
        <>
          <p className="muted small">Del {data.from} al {data.to}</p>
          <div className="totals">
            <div className="total-card"><span className="total-num">{data.servings}</span>servicios</div>
            <div className="total-card"><span className="total-num">{money(data.revenue)}</span>ingresos</div>
            <div className="total-card"><span className="total-num">{data.customized}</span>personalizados</div>
          </div>

          <h2>Cafés más pedidos</h2>
          {data.topCoffees.length === 0 && <p className="muted">Sin datos en este periodo.</p>}
          <ul className="ranking">
            {data.topCoffees.map((c) => (
              <li key={c.coffeeName}>
                <div className="rank-head"><span>{c.coffeeName}</span><span>{c.servings} · {money(c.revenue)}</span></div>
                <div className="meter"><div style={{ width: `${(c.servings / maxServings) * 100}%` }} /></div>
              </li>
            ))}
          </ul>

          <h2>Consumo de ingredientes</h2>
          <ul className="ranking">
            {data.ingredientUsage.map((u) => (
              <li key={u.name}>
                <div className="rank-head"><span>{u.name}</span><span>{u.totalQuantity} {u.unit}</span></div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
