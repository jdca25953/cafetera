import { getGlobalStats, getMachineStats } from '../../api'
import Status from '../../components/Status'
import StatsPanel from '../../components/StatsPanel'
import { money } from '../../format'
import { useLoad } from '../../hooks'

export default function GlobalStatsSection() {
  const byMachine = useLoad(() => getMachineStats(), [])
  return (
    <section>
      <StatsPanel id="global" load={getGlobalStats} />
      <h2>Por cafetera (últimos 30 días)</h2>
      <Status loading={byMachine.loading} error={byMachine.error} />
      {byMachine.data && byMachine.data.length === 0 && <p className="muted">Sin servicios en este periodo.</p>}
      {byMachine.data && byMachine.data.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Cafetera</th><th>Servicios</th><th>Ingresos</th></tr></thead>
            <tbody>
              {byMachine.data.map((m) => (
                <tr key={m.code}><td>{m.name} ({m.code})</td><td>{m.servings}</td><td>{money(m.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
