import type {
  CoffeeView, CupSize, DraftLine, IngredientInfo, IngredientInput, IngredientView, Machine, MachineCoffee, MachineStat,
  PageView, Quote, RestockView, ServeResult, ServingSummary, Session, SizeInfo, StatsView, StockItem,
  UserInput, UserView,
} from './types'
import { clearSession, getSession } from './auth'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(status: number, body: any) {
    const fields = body?.fields
      ? ': ' + Object.entries(body.fields).map(([k, v]) => `${k} ${v}`).join(', ')
      : ''
    super((body?.error ?? `Error ${status}`) + fields)
    this.status = status
    this.body = body
  }
}

// authed = true solo en las rutas de gestión: las públicas nunca envían el token
async function request<T>(path: string, init?: RequestInit, authed = false): Promise<T> {
  const token = authed ? getSession()?.token : undefined
  let res: Response
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(0, { error: 'No se puede conectar con el servidor' })
  }
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) {
    if (authed && res.status === 401) {
      clearSession() // sesión caducada o token no válido
      window.location.hash = '#/login'
    }
    throw new ApiError(res.status, body)
  }
  return body as T
}

const m = (code: string) => `/api/machines/${encodeURIComponent(code)}`

export const getMachine = (code: string) => request<Machine>(m(code))
export const getCoffees = (code: string) => request<MachineCoffee[]>(`${m(code)}/coffees`)
export const getLowStock = (code: string) => request<StockItem[]>(`${m(code)}/stock/low`)
export const getSizes = () => request<SizeInfo[]>('/api/sizes')

export const quote = (code: string, coffeeId: number, size: CupSize, recipe?: DraftLine[]) =>
  request<Quote>(`${m(code)}/coffees/${coffeeId}/quote`, {
    method: 'POST',
    body: JSON.stringify({ size, recipe }),
  })

export const serve = (code: string, coffeeId: number, size: CupSize, expectedPrice: number, recipe?: DraftLine[]) =>
  request<ServeResult>(`${m(code)}/coffees/${coffeeId}/serve`, {
    method: 'POST',
    body: JSON.stringify({ size, expectedPrice, recipe }),
  })

export const getStock = (code: string) => request<StockItem[]>(`${m(code)}/stock`)
export const getIngredients = () => request<IngredientView[]>('/api/ingredients')

export const createCoffee = (name: string, recipe: DraftLine[]) =>
  request<CoffeeView>('/api/coffees', { method: 'POST', body: JSON.stringify({ name, recipe }) })

/** Ingredientes con su precio y el stock de esta cafetera (lo que necesita el editor). */
export async function getCatalog(code: string): Promise<IngredientInfo[]> {
  const [ingredients, stock] = await Promise.all([getIngredients(), getStock(code)])
  const byId = new Map(stock.map((s) => [s.ingredientId, s.stock]))
  return ingredients.map((i) => ({ ...i, stock: byId.get(i.id) ?? 0 }))
}

export const login = (username: string, password: string) =>
  request<Session>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })

export const getMyMachines = () => request<Machine[]>('/api/me/machines', undefined, true)

export const restock = (code: string, ingredientId: number, quantity: number) =>
  request<StockItem>(`${m(code)}/stock/${ingredientId}/restock`, { method: 'POST', body: JSON.stringify({ quantity }) }, true)

export const setMinStock = (code: string, ingredientId: number, minStock: number) =>
  request<StockItem>(`${m(code)}/stock/${ingredientId}`, { method: 'PUT', body: JSON.stringify({ minStock }) }, true)

export const getServings = (code: string, page: number) =>
  request<PageView<ServingSummary>>(`${m(code)}/servings?page=${page}&size=15`, undefined, true)

export const getRestocks = (code: string, page: number) =>
  request<PageView<RestockView>>(`${m(code)}/restocks?page=${page}&size=15`, undefined, true)

const range = (from?: string, to?: string) => {
  const q = new URLSearchParams()
  if (from) q.set('from', from)
  if (to) q.set('to', to)
  const qs = q.toString()
  return qs ? `?${qs}` : ''
}

export const getStats = (code: string, from?: string, to?: string) =>
  request<StatsView>(`${m(code)}/stats${range(from, to)}`, undefined, true)

// ---- Administración (solo ADMIN)
export const getGlobalStats = (from?: string, to?: string) =>
  request<StatsView>(`/api/stats${range(from, to)}`, undefined, true)
export const getMachineStats = (from?: string, to?: string) =>
  request<MachineStat[]>(`/api/stats/machines${range(from, to)}`, undefined, true)

export const createMachine = (name: string) =>
  request<Machine>('/api/machines', { method: 'POST', body: JSON.stringify({ name }) }, true)

export const getUsers = () => request<UserView[]>('/api/users', undefined, true)
export const createUser = (u: UserInput) =>
  request<UserView>('/api/users', { method: 'POST', body: JSON.stringify(u) }, true)
export const updateUser = (id: number, u: UserInput) =>
  request<UserView>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(u) }, true)
export const deactivateUser = (id: number) => request<void>(`/api/users/${id}`, { method: 'DELETE' }, true)

export const saveIngredient = (id: number | null, i: IngredientInput) =>
  request<IngredientView>(id === null ? '/api/ingredients' : `/api/ingredients/${id}`,
    { method: id === null ? 'POST' : 'PUT', body: JSON.stringify(i) }, true)
export const deleteIngredient = (id: number) => request<void>(`/api/ingredients/${id}`, { method: 'DELETE' }, true)

export const getAllCoffees = () => request<CoffeeView[]>('/api/coffees')
export const updateCoffee = (id: number, name: string, recipe: DraftLine[]) =>
  request<CoffeeView>(`/api/coffees/${id}`, { method: 'PUT', body: JSON.stringify({ name, recipe }) }, true)
export const deleteCoffee = (id: number) => request<void>(`/api/coffees/${id}`, { method: 'DELETE' }, true)

export const errorMessage = (e: unknown) =>
  e instanceof ApiError ? e.message : 'Algo ha fallado. Inténtalo de nuevo.'
