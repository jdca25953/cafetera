import { useEffect, useState, type DependencyList } from 'react'
import { errorMessage } from './api'

/** Carga datos al montar y cuando cambian las dependencias. */
export function useLoad<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fn()
      .then((d) => {
        if (alive) {
          setData(d)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (alive) {
          setError(errorMessage(e))
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { data, error, loading, setData, reload: () => setTick((t) => t + 1) }
}
