let __uidCounter = 0

export function uid(prefix = 'id'): string {
  __uidCounter += 1
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${__uidCounter}_${rand}`
}

export default uid

