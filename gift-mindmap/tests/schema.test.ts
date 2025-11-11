import { describe, it, expect } from 'vitest'
import { parseExportJSON, validateExport } from '@/lib/schema'

describe('schema parsing', () => {
  it('parses a valid export', () => {
    const input = JSON.stringify({
      version: 1,
      nodes: [
        { id: 'root', type: 'root', position: { x: 0, y: 0 }, data: { label: 'Root' } },
      ],
      edges: [],
      profiles: [{ id: 'me', name: 'Me', shareWith: [] }],
      currentProfileId: 'me',
    })
    const res = parseExportJSON(input)
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.data.nodes.length).toBe(1)
      expect(validateExport(res.data)).toBe(true)
    }
  })

  it('rejects invalid export', () => {
    const res = parseExportJSON('{"bad":true}')
    expect(res.ok).toBe(false)
  })
})

