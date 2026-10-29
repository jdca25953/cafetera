export type CupSize = 'SMALL' | 'MEDIUM' | 'LARGE'

export interface RecipeLine {
  ingredientId: number
  ingredientName: string
  unit: string
  quantity: number
}

export interface Machine {
  code: string
  name: string
  active: boolean
}

export interface MachineCoffee {
  id: number
  name: string
  price: number
  predefined: boolean
  available: boolean
  recipe: RecipeLine[]
}

export interface SizeInfo {
  code: CupSize
  volumeMl: number
  factor: number
}

export interface StockItem {
  ingredientId: number
  name: string
  unit: string
  stock: number
  minStock: number
  low: boolean
}

export interface Quote {
  price: number
  available: boolean
  missing: string[]
  recipe: RecipeLine[]
  size: CupSize
}

export interface StockAlert {
  ingredientId: number
  name: string
  unit: string
  stock: number
  minStock: number
  empty: boolean
}

export interface ServeResult {
  servingId: number
  machineCode: string
  coffeeName: string
  size: CupSize
  price: number
  customized: boolean
  recipe: RecipeLine[]
  servedAt: string
  alerts: StockAlert[]
}

/** Línea de receta que se envía al backend (cantidades para el tamaño mediano, 250 ml). */
export interface DraftLine {
  ingredientId: number
  quantity: number
}

export interface IngredientView {
  id: number
  name: string
  unit: string
  price: number
}

/** Ingrediente del catálogo con el stock que tiene esta cafetera. */
export interface IngredientInfo extends IngredientView {
  stock: number
}

export interface CoffeeView {
  id: number
  name: string
  price: number
  predefined: boolean
  recipe: RecipeLine[]
}

export interface Session {
  token: string
  username: string
  role: Role
  expiresAt: string
}

export interface PageView<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ServingSummary {
  id: number
  coffeeName: string
  size: CupSize
  price: number
  customized: boolean
  servedAt: string
}

export interface RestockView {
  id: number
  ingredientName: string
  unit: string
  quantity: number
  username: string | null
  restockedAt: string
}

export interface CoffeeStat {
  coffeeName: string
  servings: number
  revenue: number
}

export interface IngredientUsage {
  name: string
  unit: string
  totalQuantity: number
}

export interface StatsView {
  from: string
  to: string
  servings: number
  revenue: number
  customized: number
  topCoffees: CoffeeStat[]
  ingredientUsage: IngredientUsage[]
}

export type Role = 'ADMIN' | 'OPERATOR'

export interface UserView {
  id: number
  username: string
  role: Role
  active: boolean
  machineCodes: string[]
}

export interface UserInput {
  username: string
  password?: string
  role: Role
  machineCodes: string[]
  active?: boolean
}

export interface IngredientInput {
  name: string
  unit: string
  price: number
}

export interface MachineStat {
  code: string
  name: string
  servings: number
  revenue: number
}
