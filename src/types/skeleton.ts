import type { NeuralCategory } from './neural'

export interface SkeletonPoint {
  id: number
  x: number
  y: number
  z: number
  parent: number
  radius?: number
}

export interface SkeletonNeuron {
  bodyId: number
  type: string | null
  instance: string | null
  role: NeuralCategory
  activityKey: string
  originalPointCount: number
  simplifiedPointCount: number
  points: SkeletonPoint[]
}

export interface SkeletonData {
  metadata: {
    dataset: string
    source: string
    license: string
    sourceUrl: string
    generatedAt: string
    requestedNeuronCount: number
    availableNeuronCount: number
    missingBodyIds: number[]
    originalPointCount: number
    simplifiedPointCount: number
    compressionRatio: number
    normalization: { sourceBounds: { min: number[]; max: number[] }; center: number[]; scale: number; formula: string }
    simplification: { algorithm: string; rdpTolerance: number; maxSourceSegmentLength: number }
    retrieval: { method: string; connectivityArtifact: string }
    limitations: string
  }
  neurons: SkeletonNeuron[]
  failures: { bodyId: number; reason: string }[]
}
