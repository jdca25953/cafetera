import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import EnterCode from './pages/EnterCode'
import Menu from './pages/Menu'
import CoffeePage from './pages/CoffeePage'
import NewCoffee from './pages/NewCoffee'
import Login from './pages/Login'
import Admin from './pages/Admin'
import AdminMachine from './pages/AdminMachine'
import AdminSystem from './pages/AdminSystem'
import RequireAuth from './components/RequireAuth'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<EnterCode />} />
        <Route path="/m/:code" element={<Menu />} />
        <Route path="/m/:code/coffee/:id" element={<CoffeePage />} />
        <Route path="/m/:code/new" element={<NewCoffee />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
        <Route path="/admin/system" element={<RequireAuth role="ADMIN"><AdminSystem /></RequireAuth>} />
        <Route path="/admin/m/:code" element={<RequireAuth><AdminMachine /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
