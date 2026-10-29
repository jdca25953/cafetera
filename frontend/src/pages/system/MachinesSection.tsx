import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createMachine, errorMessage, getMyMachines } from '../../api'
import QrCode from '../../components/QrCode'
import Status from '../../components/Status'
import { useLoad } from '../../hooks'

export default function MachinesSection() {
  const { data, error, loading, reload } = useLoad(getMyMachines, [])
  const [name, setName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [qrFor, setQrFor] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setFormError(null)
    try {
      const created = await createMachine(name.trim())
      setName('')
      setQrFor(created.code)
      reload()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <form className="form-card" onSubmit={submit}>
        <h2>Nueva cafetera</h2>
        <label>Nombre
          <input className="field" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Cafetera del hall" />
        </label>
        {formError && <p className="error" role="alert">{formError}</p>}
        <button className="btn primary" disabled={busy || !name.trim()}>{busy ? 'Creando…' : 'Crear cafetera'}</button>
        <p className="muted small">El código de 8 caracteres se genera solo. Una cafetera nueva empieza sin stock: repónlo desde su gestión.</p>
      </form>

      <Status loading={loading} error={error} />
      <ul className="machines">
        {data?.map((m) => (
          <li key={m.code} className="machine-card stack-card">
            <div className="machine-head">
              <div>
                <strong>{m.name}</strong>
                <div className="muted small">Código {m.code}</div>
              </div>
              <div className="row-actions">
                <Link className="btn primary compact" to={`/admin/m/${m.code}`}>Gestionar</Link>
                <button className="btn secondary compact" onClick={() => setQrFor(qrFor === m.code ? null : m.code)}>
                  {qrFor === m.code ? 'Ocultar QR' : 'Ver QR'}
                </button>
              </div>
            </div>
            {qrFor === m.code && <QrCode code={m.code} />}
          </li>
        ))}
      </ul>
    </section>
  )
}
