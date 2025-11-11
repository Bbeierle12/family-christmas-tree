import React from 'react'
import ColorDot from './ColorDot'
import { Badge } from '@/components/ui/badge'

export default function PersonNode({ data }: any) {
  const bought = (data.ideas || []).filter((it: any) => it.status === 'purchased').length
  const borderStyle = data.__color ? { borderLeft: `4px solid ${data.__color}` } : undefined
  return (
    <div className="bg-white border rounded-2xl shadow p-3 w-64" style={borderStyle}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold truncate max-w-[11rem]" title={data.label}>
          <ColorDot color={data.__color} />
          {data.label}
        </div>
        {(data.ideas?.length ?? 0) > 0 && (
          <Badge variant={bought ? 'default' : 'secondary'}>
            {bought}/{(data.ideas || []).length} bought
          </Badge>
        )}
      </div>
      {data.interests && (
        <div className="text-xs text-muted-foreground mt-1 line-clamp-2" title={data.interests}>
          {data.interests}
        </div>
      )}
    </div>
  )
}

