import type { SkeletonNeuron } from '../types/skeleton'

export const SKELETON_COLORS: Record<SkeletonNeuron['role'], readonly [number, number, number]> = {
  visual: [243, 107, 33],
  central: [215, 197, 139],
  descending: [105, 198, 217],
  motor: [105, 198, 217],
}

// Rotation is only a camera cue for the optional report, never a change to morphology.
export const shouldAutoRotate = (compact: boolean, paused: boolean, reducedMotion: boolean) => !compact && !paused && !reducedMotion
