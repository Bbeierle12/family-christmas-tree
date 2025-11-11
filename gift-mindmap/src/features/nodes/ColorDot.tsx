import React from 'react'

export default function ColorDot({ color }: { color?: string }) {
  if (!color) return null
  return <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: color }} />
}

