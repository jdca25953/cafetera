import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, getCoffees, getLowStock, getMachine } from '../api'
import CupSvg from '../components/CupSvg'
import { list } from '../format'
import type { Machine, MachineCoffee, StockItem } from '../types'

export default function Menu() {
  const { code = '' } = useParams()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [coffees, setCoffees] = useState<MachineCoffee[] | null>(null)
  const [low, setLow] = useState<StockItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([getMachine(code), getCoffees(code), getLowStock(code)])
      .then(([m, c, l]) => {
        if (!alive) return
        setMachine(m)
        setCoffees(c)
        setLow(l)
      })
      .catch((e) => {
        if (alive) setError(e instanceof ApiError && e.status === 404 ? 'No existe esa cafetera.' : 'No se pudo cargar la cafetera.')
      })
    return () => {
      alive = false
    }
  }, [code])

  if (error)
    return (
      <main className="screen center">
        <p className="error" role="alert">{error}</p>
        <Link className="btn secondary" to="/">Cambiar de cafetera</Link>
      </main>
    )
  if (!coffees || !machine) return <main className="screen center"><p>Cargando…</p></main>

  return (
    <main className="screen">
      <header className="bar">
        <Link to="/" className="link">Cambiar</Link>
        <h1 className="bar-title">{machine.name}</h1>
      </header>

      {low.length > 0 && (
        <p className="banner" role="status">
          Hay que reponer {list(low.map((i) => i.name))}.
        </p>
      )}

      <h2 className="section-title">Elige tu bebida</h2>
      <ul className="drinks">
        {coffees.map((c) => (
          <li key={c.id}>
            {c.available ? (
              <Link className="drink" to={`/m/${code}/coffee/${c.id}`}>
                <CupSvg layers={c.recipe} height={120} />
                <span className="drink-name">{c.name}</span>
              </Link>
            ) : (
              <div className="drink off" aria-disabled="true">
                <CupSvg layers={c.recipe} height={120} />
                <span className="drink-name">{c.name}</span>
                <span className="drink-note">Sin stock</span>
              </div>
            )}
          </li>
        ))}
        <li>
          <Link className="drink" to={`/m/${code}/new`}>
            <CupSvg height={120} />
            <span className="drink-name">Crea el tuyo</span>
          </Link>
        </li>
      </ul>

      <footer className="foot">
        <Link to="/admin" className="link">Acceso de gestión</Link>
      </footer>
    </main>
  )
}
