import React from 'react'

export default function RootNode({ data }: any) {
  return (
    <div className="px-4 py-3 bg-white/90 backdrop-blur border rounded-2xl shadow-lg text-center">
      <div className="text-xl font-semibold">{data.label}</div>
      <div className="text-xs text-muted-foreground">Drag, zoom, add ideas. Click nodes to edit.</div>
    </div>
  )
}

