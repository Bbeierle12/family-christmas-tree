import { describe, it, expect, beforeEach } from 'vitest'
import { useGiftStore } from '@/store/giftStore'

function resetStore() {
  const s = useGiftStore.getState()
  useGiftStore.setState({
    nodes: [{ id: 'root', type: 'root', position: { x: 0, y: 0 }, data: { label: 'Root' } } as any],
    edges: [],
    profiles: [{ id: 'me', name: 'Me', color: '#000', shareWith: [] }],
    currentProfileId: 'me',
    treeMode: false,
    treeProfiles: ['me'],
    selectedId: undefined,
    messages: [],
    past: [],
    future: [],
  } as any)
}

describe('gift store actions', () => {
  beforeEach(() => resetStore())

  it('adds profile and switches to it', () => {
    const id = useGiftStore.getState().addProfile('Test')
    useGiftStore.getState().setCurrentProfile(id)
    expect(useGiftStore.getState().currentProfileId).toBe(id)
  })

  it('adds person and idea with edges', () => {
    const owner = useGiftStore.getState().currentProfileId
    const personId = useGiftStore.getState().addPerson(owner, 'Alice')
    const ideaId = useGiftStore.getState().addIdea(owner, personId, 'Idea 1', 'Notes')
    const { nodes, edges } = useGiftStore.getState()
    expect(nodes.find(n => n.id === personId)).toBeTruthy()
    expect(nodes.find(n => n.id === ideaId)).toBeTruthy()
    expect(edges.find(e => e.source === 'root' && e.target === personId)).toBeTruthy()
    expect(edges.find(e => e.source === personId && e.target === ideaId)).toBeTruthy()
  })

  it('toggles purchased and supports undo/redo', () => {
    const owner = useGiftStore.getState().currentProfileId
    const personId = useGiftStore.getState().addPerson(owner, 'Bob')
    const ideaId = useGiftStore.getState().addIdea(owner, personId, 'Socks', '')
    useGiftStore.getState().togglePurchased(ideaId)
    let idea = useGiftStore.getState().nodes.find(n => n.id === ideaId) as any
    expect(idea.data.status).toBe('purchased')
    useGiftStore.getState().undo()
    idea = useGiftStore.getState().nodes.find(n => n.id === ideaId) as any
    expect(idea.data.status).toBe('pending')
    useGiftStore.getState().redo()
    idea = useGiftStore.getState().nodes.find(n => n.id === ideaId) as any
    expect(idea.data.status).toBe('purchased')
  })
})

