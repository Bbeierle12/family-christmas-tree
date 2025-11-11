import type { ExportedState, ImportResult } from '@/types/gift'
import { parseExportJSON } from '@/lib/schema'

const STORAGE_KEY = 'gift-mindmap/state/v1'

export function saveState(state: ExportedState): void {
  try {
    const json = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, json)
  } catch (err) {
    console.warn('persist.saveState failed', err)
  }
}

export function loadState(): ImportResult {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (!json) return { ok: false, error: 'no_state' }
    return parseExportJSON(json)
  } catch (err) {
    return { ok: false, error: 'parse_error' }
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    // ignore
  }
}

