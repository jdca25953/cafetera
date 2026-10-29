const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
export const money = (n: number) => eur.format(n)

export const list = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`

const dateTime = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' })
export const when = (iso: string) => dateTime.format(new Date(iso))
