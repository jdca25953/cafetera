export default function Status({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <p>Cargando…</p>
  if (error) return <p className="error" role="alert">{error}</p>
  return null
}
