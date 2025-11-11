import { colorForProfile } from '@/lib/colors'
import type { GiftEdge, GiftNode, Profile, ProfileId } from '@/types/gift'

export function buildProfileColorMap(profiles: Profile[]): Record<ProfileId, string> {
  const map: Record<string, string> = {}
  for (const p of profiles) {
    map[p.id] = p.color ?? colorForProfile(p.id) ?? '#6b7280'
  }
  return map
}

export function filterByProfiles(nodes: GiftNode[], edges: GiftEdge[], allowed: ProfileId[] | undefined) {
  if (!allowed || allowed.length === 0) return { nodes, edges }
  const allowedSet = new Set(allowed)
  const visibleNodes = nodes.filter((n) => n.type === 'root' || !('owner' in n.data) || !n.data.owner || allowedSet.has(n.data.owner))
  const visibleIds = new Set(visibleNodes.map((n) => n.id))
  const visibleEdges = edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
  return { nodes: visibleNodes, edges: visibleEdges }
}

