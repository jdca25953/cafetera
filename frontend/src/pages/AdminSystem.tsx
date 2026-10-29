import { useState } from 'react'
import { Link } from 'react-router-dom'
import CoffeesSection from './system/CoffeesSection'
import GlobalStatsSection from './system/GlobalStatsSection'
import IngredientsSection from './system/IngredientsSection'
import MachinesSection from './system/MachinesSection'
import UsersSection from './system/UsersSection'

type Tab = 'machines' | 'users' | 'ingredients' | 'coffees' | 'stats'

const TABS: { id: Tab; label: string }[] = [
  { id: 'machines', label: 'Cafeteras' },
  { id: 'users', label: 'Usuarios' },
  { id: 'ingredients', label: 'Ingredientes' },
  { id: 'coffees', label: 'Cafés' },
  { id: 'stats', label: 'Estadísticas' },
]

export default function AdminSystem() {
  const [tab, setTab] = useState<Tab>('machines')
  return (
    <main className="screen wide">
      <header className="bar">
        <Link to="/admin" className="link">Mis cafeteras</Link>
        <span className="bar-title">Administración</span>
      </header>

      <div className="tabs" role="tablist" aria-label="Secciones">
        {TABS.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls="panel"
                  className={`tab${tab === t.id ? ' selected' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div id="panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'machines' && <MachinesSection />}
        {tab === 'users' && <UsersSection />}
        {tab === 'ingredients' && <IngredientsSection />}
        {tab === 'coffees' && <CoffeesSection />}
        {tab === 'stats' && <GlobalStatsSection />}
      </div>
    </main>
  )
}
