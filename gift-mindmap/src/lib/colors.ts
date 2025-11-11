const PROFILE_COLORS = [
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#6b7280', // gray-500
] as const

export function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function colorForProfile(id?: string): string | undefined {
  if (!id) return undefined
  const idx = hashString(id) % PROFILE_COLORS.length
  return PROFILE_COLORS[idx]
}

export { PROFILE_COLORS }

