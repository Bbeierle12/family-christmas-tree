import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Users, Eye, EyeOff, Lock, Pencil, Trash2, Plus, CheckCircle2, UserPlus, Upload, Download, RefreshCcw } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type AnyFn = (...args: any[]) => any

export interface SideTabsProps {
  profiles: any[]
  currentProfileId?: string | null
  newProfileName: string
  setNewProfileName: (v: string) => void
  createProfile: AnyFn
  shareWithToggle: (id: string) => void
  treeMode: boolean
  setTreeMode: (v: boolean) => void
  treeProfiles: string[]
  setTreeProfiles: (ids: string[]) => void

  selectedNode: any
  selectedId?: string | null
  editPersonName: string
  setEditPersonName: (v: string) => void
  editPersonInterests: string
  setEditPersonInterests: (v: string) => void
  editIdeaTitle: string
  setEditIdeaTitle: (v: string) => void
  editIdeaNotes: string
  setEditIdeaNotes: (v: string) => void
  saveEdits: AnyFn
  deleteNode: (id: string) => void
  togglePurchased: AnyFn

  ideaTitle: string
  setIdeaTitle: (v: string) => void
  ideaNotes: string
  setIdeaNotes: (v: string) => void
  addIdeaFromForm: AnyFn

  newMemberName: string
  setNewMemberName: (v: string) => void
  newMemberInterests: string
  setNewMemberInterests: (v: string) => void
  handleAddMember: AnyFn

  exportJSON: AnyFn
  importJSON: (file: File) => void
  resetLayout: AnyFn
}

export default function SideTabs(props: SideTabsProps) {
  const {
    profiles, currentProfileId, newProfileName, setNewProfileName, createProfile, shareWithToggle,
    treeMode, setTreeMode, treeProfiles, setTreeProfiles,
    selectedNode, selectedId,
    editPersonName, setEditPersonName, editPersonInterests, setEditPersonInterests,
    editIdeaTitle, setEditIdeaTitle, editIdeaNotes, setEditIdeaNotes,
    saveEdits, deleteNode, togglePurchased,
    ideaTitle, setIdeaTitle, ideaNotes, setIdeaNotes, addIdeaFromForm,
    newMemberName, setNewMemberName, newMemberInterests, setNewMemberInterests, handleAddMember,
    exportJSON, importJSON, resetLayout,
  } = props

  return (
    <>
      <Tabs defaultValue="edit">
        <TabsList className="grid grid-cols-7 gap-1">
          <TabsTrigger value="profiles"><Users className="w-4 h-4 mr-1" />Profiles</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="ideas">Add Idea</TabsTrigger>
          <TabsTrigger value="person">Person</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-3 mt-3">
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Profiles & Permissions</div>
            <div className="flex gap-2">
              <Input placeholder="New profile name" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} />
              <Button onClick={createProfile}>Create</Button>
            </div>
            <div className="text-xs text-muted-foreground">Each profile is isolated. Only the owner sees their planning unless sharing is enabled. Sharing is <strong>view-only</strong>.</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Current profile</div>
            <div className="flex flex-wrap gap-2">
              {profiles.map((p) => (
                <Button key={p.id} size="sm" variant={p.id === currentProfileId ? 'default' : 'outline'} onClick={() => props['setCurrentProfile']?.(p.id)}>
                  {p.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-2"><Lock className="w-4 h-4" /> Share current profile with. (view-only)</div>
            <div className="flex flex-wrap gap-2">
              {profiles.filter((p) => p.id !== currentProfileId).map((p) => {
                const shared = profiles.find((x) => x.id === currentProfileId)?.shareWith.includes(p.id)
                return (
                  <Button key={p.id} size="sm" variant={shared ? 'default' : 'outline'} onClick={() => shareWithToggle(p.id)}>
                    {p.name} {shared ? <Eye className="w-3 h-3 ml-1" /> : <EyeOff className="w-3 h-3 ml-1" />}
                  </Button>
                )
              })}
            </div>
            <div className="text-xs text-muted-foreground">People you allow here can include your profile in their family tree view.</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">Family Tree on Canvas</div>
            <div className="flex items-center gap-2">
              <input id="treeToggle" type="checkbox" className="scale-110" checked={treeMode} onChange={(e) => setTreeMode(e.target.checked)} />
              <label htmlFor="treeToggle" className="text-sm">Enable family tree view</label>
            </div>
            {treeMode && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Select profiles to include (only those that shared with you are selectable).</div>
                <div className="flex flex-wrap gap-2">
                  {profiles.map((p) => {
                    const canInclude = p.id === currentProfileId || p.shareWith.includes(currentProfileId || '')
                    const active = treeProfiles.includes(p.id)
                    return (
                      <Button key={p.id} size="sm" disabled={!canInclude} variant={active ? 'default' : 'outline'} onClick={() => {
                        const next = active ? treeProfiles.filter((x) => x !== p.id) : treeProfiles.concat(p.id)
                        setTreeProfiles(next)
                      }}>
                        {p.name} {!canInclude && <Lock className="w-3 h-3 ml-1" />}
                      </Button>
                    )
                  })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Canvas now shows the union of selected profiles' people and ideas.</div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="edit" className="space-y-3 mt-3">
          {!selectedNode && (
            <div className="text-sm text-muted-foreground">Click any node on the map to edit.</div>
          )}
          {selectedNode?.type === 'person' && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Edit Person</div>
              <Input placeholder="Name" value={editPersonName} onChange={(e) => setEditPersonName(e.target.value)} />
              <Textarea placeholder="Interests / notes" value={editPersonInterests} onChange={(e) => setEditPersonInterests(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={saveEdits}><Pencil className="w-4 h-4 mr-1" /> Save</Button>
                <Button variant="destructive" onClick={() => deleteNode(selectedNode.id)}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
              </div>
            </div>
          )}
          {selectedNode?.type === 'idea' && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Edit Idea</div>
              <Input placeholder="Title" value={editIdeaTitle} onChange={(e) => setEditIdeaTitle(e.target.value)} />
              <Textarea placeholder="Notes" value={editIdeaNotes} onChange={(e) => setEditIdeaNotes(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveEdits}><Pencil className="w-4 h-4 mr-1" /> Save</Button>
                <Button variant="secondary" onClick={togglePurchased}><CheckCircle2 className="w-4 h-4 mr-1" /> {selectedNode?.data?.status === 'purchased' ? 'Mark unbought' : 'Mark purchased'}</Button>
                <Button variant="destructive" onClick={() => deleteNode(selectedNode.id)}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ideas" className="space-y-3 mt-3">
          <div className="text-sm text-muted-foreground">Select a person (or an idea) on the map, then add a new idea below.</div>
          <Input placeholder="Idea title" value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} />
          <Textarea placeholder="Notes / details" value={ideaNotes} onChange={(e) => setIdeaNotes(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={addIdeaFromForm}><Plus className="w-4 h-4 mr-1" /> Add Idea</Button>
            {selectedNode?.type === 'idea' && (
              <Button variant="secondary" onClick={togglePurchased}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {selectedNode?.data?.status === 'purchased' ? 'Mark unbought' : 'Mark purchased'}
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="family" className="space-y-3 mt-3">
          <div className="text-sm text-muted-foreground">Add a new family member node connected to the center.</div>
          <Input placeholder="Full name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
          <Textarea placeholder="Interests / notes (optional)" value={newMemberInterests} onChange={(e) => setNewMemberInterests(e.target.value)} />
          <Button onClick={handleAddMember}><UserPlus className="w-4 h-4 mr-1" /> Add family member</Button>
          <div className="text-xs text-muted-foreground">After adding, click their node to start adding ideas.</div>
        </TabsContent>

        <TabsContent value="map" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={exportJSON}><Download className="w-4 h-4 mr-1" /> Export JSON</Button>
                </TooltipTrigger>
                <TooltipContent>Save the whole map to a file.</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <label className="inline-flex items-center justify-center rounded-md border px-3 py-2 cursor-pointer hover:bg-secondary">
              <Upload className="w-4 h-4 mr-1" /> Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && importJSON(e.target.files[0])} />
            </label>
            <Button variant="secondary" onClick={resetLayout}><RefreshCcw className="w-4 h-4 mr-1" /> Reset</Button>
            {selectedNode && <Button variant="destructive" onClick={() => selectedId && deleteNode(selectedId)}><Trash2 className="w-4 h-4 mr-1" /> Delete selected</Button>}
          </div>
          <div>
            <div className="text-xs mb-1">Background density</div>
            <Slider defaultValue={[18]} min={8} max={36} step={1} onValueChange={(v) => {
              const style = document.documentElement.style
              style.setProperty('--rfbg-gap', String(v[0]))
            }} />
            <div className="text-xs text-muted-foreground mt-1">Drag & drop a saved JSON file onto the canvas to import.</div>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-4">
        <CardContent className="p-4 space-y-2">
          <div className="text-sm font-medium">Quick tips</div>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Profiles are isolated. Use the Profiles tab to switch or share.</li>
            <li>Enable Family Tree view to see selected, permitted profiles on the canvas.</li>
            <li>Export includes profiles and current selection.</li>
          </ul>
        </CardContent>
      </Card>
    </>
  )
}

