import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ExportedState, GiftEdge, GiftNode, IdeaData, IdeaStatus, PersonData, Profile, ProfileId } from '@/types/gift'
import { uid } from '@/lib/uid'
import { colorForProfile } from '@/lib/colors'
import { radialLayout } from '@/lib/layout'
import { applyNodeChanges, applyEdgeChanges, addEdge as rfAddEdge, type NodeChange, type EdgeChange, type Connection } from 'reactflow'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export interface GiftState {
  // graph
  nodes: GiftNode[]
  edges: GiftEdge[]
  // history
  past: Array<{ nodes: GiftNode[]; edges: GiftEdge[] }>
  future: Array<{ nodes: GiftNode[]; edges: GiftEdge[] }>
  // profiles
  profiles: Profile[]
  currentProfileId?: ProfileId
  // canvas modes
  treeMode: boolean
  treeProfiles: ProfileId[]
  // selection
  selectedId?: string
  // chat
  messages: ChatMessage[]

  // actions
  setCurrentProfile: (id: ProfileId) => void
  addProfile: (name: string) => ProfileId
  shareWithToggle: (targetId: ProfileId) => void

  addPerson: (owner: ProfileId | undefined, name: string, interests?: string) => string
  addIdea: (owner: ProfileId | undefined, personId: string, title: string, notes?: string) => string
  updatePerson: (id: string, patch: Partial<PersonData>) => void
  updateIdea: (id: string, patch: Partial<IdeaData>) => void
  togglePurchased: (id: string) => void
  deleteNode: (id: string) => void
  selectNode: (id?: string) => void

  setTreeMode: (enabled: boolean) => void
  setTreeProfiles: (ids: ProfileId[]) => void
  resetLayout: () => void

  importState: (state: ExportedState) => void
  exportState: () => ExportedState

  sendMessage: (text: string) => void

  // reactflow wiring
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  // history controls
  undo: () => void
  redo: () => void
}

const family = [
  'Daniel Beierle',
  'Crystal Beierle',
  'Alyssa Beierle',
  'Bella Beierle',
  'Aleah Beierle',
  'Mike McInnerney',
  'Mike Jr',
  'Maggy',
]

function seedGraph(currentProfileId?: ProfileId) {
  const nodes: GiftNode[] = [
    { id: 'root', type: 'root', position: { x: 0, y: 0 }, data: { label: '🎄 Christmas 2025 - Gift Map' } },
  ]
  let edges: GiftEdge[] = []

  const center = { x: 0, y: 0 }
  const radius = 260

  const seeded = family.map((name, idx) => {
    const angle = (idx / family.length) * Math.PI * 2
    const x = center.x + Math.cos(angle) * radius
    const y = center.y + Math.sin(angle) * radius
    const id = `p_${idx}`
    const color = colorForProfile(currentProfileId)
    const person = {
      id,
      type: 'person' as const,
      position: { x, y },
      data: { label: name, owner: currentProfileId, __color: color },
    }
    edges = edges.concat({ id: uid('e'), source: 'root', target: id })
    return person
  })

  return { nodes: nodes.concat(seeded), edges }
}

export const useGiftStore = create<GiftState>()(
  devtools((set, get) => ({
    // initial state
    nodes: seedGraph(undefined).nodes,
    edges: [],
    past: [],
    future: [],
    profiles: [
      { id: 'me', name: 'Me', color: colorForProfile('me'), shareWith: [] },
    ],
    currentProfileId: 'me',
    treeMode: false,
    treeProfiles: ['me'],
    selectedId: undefined,
    messages: [],

    // actions
    setCurrentProfile: (id) => set({ currentProfileId: id }),

    addProfile: (name) => {
      const id = uid('profile')
      const color = colorForProfile(id)
      set((s) => ({ profiles: s.profiles.concat({ id, name, color, shareWith: [] }) }))
      return id
    },

    shareWithToggle: (targetId) => set((s) => {
      const current = s.currentProfileId
      if (!current) return {}
      const profiles = s.profiles.map((p) => {
        if (p.id !== current) return p
        const has = p.shareWith.includes(targetId)
        const next = has ? p.shareWith.filter((x) => x !== targetId) : p.shareWith.concat(targetId)
        return { ...p, shareWith: next }
      })
      return { profiles }
    }),

    addPerson: (owner, name, interests) => {
      const id = uid('person')
      const color = colorForProfile(owner)
      set((s) => {
        const people = s.nodes.filter((n) => n.type === 'person')
        const index = people.length
        const angle = (index / Math.max(people.length + 1, 1)) * Math.PI * 2
        const pos = { x: Math.cos(angle) * 450, y: Math.sin(angle) * 280 }
        return {
          nodes: s.nodes.concat({ id, type: 'person', position: pos, data: { owner, label: name, interests, __color: color } }),
          edges: s.edges.concat({ id: uid('e'), source: 'root', target: id, animated: true } as any),
          past: s.past.concat([{ nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }]),
          future: [],
        }
      })
      return id
    },

    addIdea: (owner, personId, title, notes) => {
      const id = uid('idea')
      const color = colorForProfile(owner)
      set((s) => {
        const parent = s.nodes.find((n) => n.id === personId)
        const siblings = s.edges.filter((e) => e.source === personId).length
        const angle = (siblings / Math.max(siblings + 1, 1)) * Math.PI * 2
        const center = parent?.position ?? { x: 0, y: 0 }
        const pos = { x: center.x + Math.cos(angle) * 160, y: center.y + Math.sin(angle) * 120 }
        return {
          nodes: s.nodes.concat({ id, type: 'idea', position: pos, data: { owner, title, notes, status: 'pending', __color: color } }),
          edges: s.edges.concat({ id: uid('e'), source: personId, target: id }),
          past: s.past.concat([{ nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }]),
          future: [],
        }
      })
      return id
    },

    updatePerson: (id, patch) => set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id && n.type === 'person' ? { ...n, data: { ...n.data, ...patch } } : n)),
      past: s.past.concat([{ nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }]),
      future: [],
    })),

    updateIdea: (id, patch) => set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id && n.type === 'idea' ? { ...n, data: { ...n.data, ...patch } } : n)),
      past: s.past.concat([{ nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }]),
      future: [],
    })),

    togglePurchased: (id) => set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== id || n.type !== 'idea') return n
        const status: IdeaStatus = n.data.status === 'purchased' ? 'pending' : 'purchased'
        return { ...n, data: { ...n.data, status } }
      }),
      past: s.past.concat([{ nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }]),
      future: [],
    })),

    deleteNode: (id) => set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedId: s.selectedId === id ? undefined : s.selectedId,
      past: s.past.concat([{ nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }]),
      future: [],
    })),

    selectNode: (id) => set({ selectedId: id }),

    setTreeMode: (enabled) => set({ treeMode: enabled }),
    setTreeProfiles: (ids) => set({ treeProfiles: ids }),

    resetLayout: () => set((s) => ({
      nodes: radialLayout(s.nodes, { x: 0, y: 0 }, 240),
      past: s.past.concat([{ nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }]),
      future: [],
    })),

    importState: (state) => set((s) => ({
      nodes: state.nodes,
      edges: state.edges,
      profiles: state.profiles,
      currentProfileId: state.currentProfileId,
      past: s.past.concat([{ nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }]),
      future: [],
    })),

    exportState: () => ({
      version: 1,
      nodes: get().nodes,
      edges: get().edges,
      profiles: get().profiles,
      currentProfileId: get().currentProfileId,
    }),

    sendMessage: (text) => set((s) => ({
      messages: s.messages.concat({ id: uid('m'), role: 'user', text }),
    })),

    onNodesChange: (changes) => set((s) => ({
      nodes: applyNodeChanges(changes as any, s.nodes as any) as any,
      past: s.past.concat([{ nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }]),
      future: [],
    })),
    onEdgesChange: (changes) => set((s) => ({
      edges: applyEdgeChanges(changes as any, s.edges as any) as any,
      past: s.past.concat([{ nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }]),
      future: [],
    })),
    onConnect: (connection) => set((s) => ({
      edges: rfAddEdge({ ...connection, id: uid('e') } as any, s.edges as any) as any,
      past: s.past.concat([{ nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }]),
      future: [],
    })),

    undo: () => set((s) => {
      if (s.past.length === 0) return {}
      const prev = s.past[s.past.length - 1]
      const newPast = s.past.slice(0, -1)
      const snapshot = { nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }
      return { nodes: prev.nodes, edges: prev.edges, past: newPast, future: s.future.concat([snapshot]) }
    }),
    redo: () => set((s) => {
      if (s.future.length === 0) return {}
      const next = s.future[s.future.length - 1]
      const newFuture = s.future.slice(0, -1)
      const snapshot = { nodes: JSON.parse(JSON.stringify(s.nodes)), edges: JSON.parse(JSON.stringify(s.edges)) }
      return { nodes: next.nodes, edges: next.edges, future: newFuture, past: s.past.concat([snapshot]) }
    }),
  }))
)
