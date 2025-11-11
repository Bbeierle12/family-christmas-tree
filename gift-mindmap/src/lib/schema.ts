import { z } from 'zod'
import type { ExportedState, GiftEdge, GiftNode, IdeaData, PersonData, Profile, RootData } from '@/types/gift'

const zXY = z.object({ x: z.number(), y: z.number() })

const zProfile: z.ZodType<Profile> = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  shareWith: z.array(z.string()),
})

const zRootData: z.ZodType<RootData> = z.object({ label: z.string() })

const zPersonData: z.ZodType<PersonData> = z.object({
  owner: z.string().optional(),
  label: z.string(),
  interests: z.string().optional(),
  ideas: z.array(z.union([z.string(), z.object({ status: z.enum(['purchased', 'pending']).optional() })])).optional(),
  __color: z.string().optional(),
})

const zIdeaData: z.ZodType<IdeaData> = z.object({
  owner: z.string().optional(),
  title: z.string(),
  notes: z.string().optional(),
  status: z.enum(['purchased', 'pending']).optional(),
  __color: z.string().optional(),
})

const zRootNode: z.ZodType<GiftNode> = z.object({
  id: z.string(),
  type: z.literal('root'),
  position: zXY,
  data: zRootData,
}) as any

const zPersonNode: z.ZodType<GiftNode> = z.object({
  id: z.string(),
  type: z.literal('person'),
  position: zXY,
  data: zPersonData,
}) as any

const zIdeaNode: z.ZodType<GiftNode> = z.object({
  id: z.string(),
  type: z.literal('idea'),
  position: zXY,
  data: zIdeaData,
}) as any

const zNode: z.ZodType<GiftNode> = z.discriminatedUnion('type', [
  zRootNode as any,
  zPersonNode as any,
  zIdeaNode as any,
]) as any

const zEdge: z.ZodType<GiftEdge> = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  data: z.object({ owner: z.string().optional() }).optional(),
})

export const zExportV1 = z.object({
  version: z.number().optional(),
  nodes: z.array(zNode),
  edges: z.array(zEdge),
  profiles: z.array(zProfile),
  currentProfileId: z.string().optional(),
})

export function validateExport(input: unknown): input is ExportedState {
  const parsed = zExportV1.safeParse(input)
  return parsed.success
}

export function parseExportJSON(json: string): { ok: true; data: ExportedState } | { ok: false; error: string } {
  try {
    const data = JSON.parse(json)
    const parsed = zExportV1.safeParse(data)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') }
    }
    const value = parsed.data
    const versioned: ExportedState = {
      version: 1,
      nodes: value.nodes,
      edges: value.edges,
      profiles: value.profiles,
      currentProfileId: value.currentProfileId,
    }
    return { ok: true, data: versioned }
  } catch (err) {
    return { ok: false, error: 'invalid_json' }
  }
}

