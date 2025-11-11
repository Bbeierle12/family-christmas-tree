import React from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RefreshCcw, Download, Upload, ChevronDown, Undo2, Redo2 } from 'lucide-react'

export interface TopBarProps {
  legend: Array<{ id: string; name: string; color: string }>
  onReset: () => void
  onExport: () => void
  onImport: (file: File) => void
  onHideCanvas: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
}

export default function TopBar({ legend, onReset, onExport, onImport, onHideCanvas, onUndo, onRedo, canUndo, canRedo }: TopBarProps) {
  return (
    <div className="flex items-center justify-between p-2 border-b bg-white/70">
      <div className="text-sm text-muted-foreground">Infinity canvas</div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2">
          {legend.map((p) => (
            <span key={p.id} className="inline-flex items-center text-xs px-2 py-1 rounded-full border bg-white/80" style={{ borderColor: p.color }}>
              <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
          ))}
        </div>
        {onUndo && (
          <TooltipProvider>
            <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" disabled={!canUndo} onClick={onUndo}><Undo2 className="w-4 h-4 mr-1" /> Undo</Button></TooltipTrigger><TooltipContent>Undo (Ctrl/Cmd+Z)</TooltipContent></Tooltip>
          </TooltipProvider>
        )}
        {onRedo && (
          <TooltipProvider>
            <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" disabled={!canRedo} onClick={onRedo}><Redo2 className="w-4 h-4 mr-1" /> Redo</Button></TooltipTrigger><TooltipContent>Redo (Ctrl/Cmd+Shift+Z)</TooltipContent></Tooltip>
          </TooltipProvider>
        )}
        <TooltipProvider>
          <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={onReset}><RefreshCcw className="w-4 h-4 mr-1" /> Reset</Button></TooltipTrigger><TooltipContent>Rebuild the default layout</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={onExport}><Download className="w-4 h-4 mr-1" /> Export</Button></TooltipTrigger><TooltipContent>Export JSON</TooltipContent></Tooltip>
        </TooltipProvider>
        <label className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 cursor-pointer text-sm">
          <Upload className="w-4 h-4 mr-1" /> Import
          <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && onImport(e.target.files[0])} />
        </label>
        <Button size="sm" variant="secondary" onClick={onHideCanvas}><ChevronDown className="w-4 h-4 mr-1" /> Hide</Button>
      </div>
    </div>
  )
}
