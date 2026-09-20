import type { SkeletonData, SkeletonNeuron } from '../types/skeleton'
import { validateSkeletonData } from './skeletonValidation'

export { validateSkeletonData } from './skeletonValidation'

const sourceUrl = new URL('../data/generated/malecns_skeletons.json', import.meta.url).href
let cached: Promise<SkeletonData> | undefined

export function loadSkeletonData(): Promise<SkeletonData> {
  cached ??= fetch(sourceUrl).then(response => {
    if (!response.ok) throw new Error('Skeleton asset is unavailable')
    return response.json()
  }).then(validateSkeletonData)
  return cached
}

export const roleLabel: Record<SkeletonNeuron['role'], string> = { visual: 'Visual input', central: 'Intermediate', descending: 'Descending output', motor: 'Motor' }
