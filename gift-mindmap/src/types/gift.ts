export type ProfileId = string

export type NodeKind = 'root' | 'person' | 'idea'

export interface XYPosition {
  x: number
  y: number
}

export interface Profile {
  id: ProfileId
  name: string
  color?: string
  shareWith: ProfileId[]
}

export interface UINodeMeta {
  __color?: string
}

export interface RootData {
  label: string
}

export type IdeaStatus = 'purchased' | 'pending'

export interface PersonData extends UINodeMeta {
  owner?: ProfileId
  label: string
  interests?: string
  // Optional denormalized ideas summary for display convenience
  ideas?: Array<{ status?: IdeaStatus } | string>
}

export interface IdeaData extends UINodeMeta {
  owner?: ProfileId
  title: string
  notes?: string
  status?: IdeaStatus
}

export interface RootNode {
  id: string
  type: 'root'
  position: XYPosition
  data: RootData
}

export interface PersonNode {
  id: string
  type: 'person'
  position: XYPosition
  data: PersonData
}

export interface IdeaNode {
  id: string
  type: 'idea'
  position: XYPosition
  data: IdeaData
}

export type GiftNode = RootNode | PersonNode | IdeaNode

export interface GiftEdge {
  id: string
  source: string
  target: string
  label?: string
  data?: { owner?: ProfileId }
}

export interface ExportedStateV1 {
  version: 1
  nodes: GiftNode[]
  edges: GiftEdge[]
  profiles: Profile[]
  currentProfileId?: ProfileId
}

export type ExportedState = ExportedStateV1

export type ImportResult =
  | { ok: true; data: ExportedState }
  | { ok: false; error: string }

