import type { GiftNode } from '@/types/gift'

// Simple radial layout helper. Returns a new nodes array with updated positions.
export function radialLayout(nodes: GiftNode[], center = { x: 0, y: 0 }, radius = 240): GiftNode[] {
  if (nodes.length === 0) return nodes
  const root = nodes.find((n) => n.type === 'root')
  const others = nodes.filter((n) => n !== root)
  const step = (Math.PI * 2) / Math.max(1, others.length)
  let angle = 0

  return nodes.map((n) => {
    if (n === root) {
      return { ...n, position: { x: center.x, y: center.y } }
    }
    const x = center.x + Math.cos(angle) * radius
    const y = center.y + Math.sin(angle) * radius
    angle += step
    return { ...n, position: { x, y } }
  })
}

export function translate(nodes: GiftNode[], dx: number, dy: number): GiftNode[] {
  return nodes.map((n) => ({ ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }))
}

