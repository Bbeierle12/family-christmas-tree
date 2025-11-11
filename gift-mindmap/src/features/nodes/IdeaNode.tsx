import React from 'react'
import ColorDot from './ColorDot'
import { CheckCircle2, Plus } from 'lucide-react'

export default function IdeaNode({ data }: any) {
  const borderStyle = data.__color ? { borderLeft: `4px solid ${data.__color}` } : undefined
  return (
    <div className={`rounded-xl border shadow px-3 py-2 bg-white w-56 ${data.status === 'purchased' ? 'opacity-70' : ''}`} style={borderStyle}>
      <div className="text-sm font-medium flex items-center gap-2">
        <ColorDot color={data.__color} />
        {data.status === 'purchased' ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {data.title || 'Idea'}
      </div>
      {data.notes && <div className="text-xs mt-1 text-muted-foreground line-clamp-2">{data.notes}</div>}
    </div>
  )}

