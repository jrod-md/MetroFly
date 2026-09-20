import type { SkeletonData, SkeletonNeuron, SkeletonPoint } from '../types/skeleton'

const roles = new Set(['visual', 'central', 'descending', 'motor'])
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

export function validateSkeletonData(input: unknown): SkeletonData {
  const data = input as SkeletonData
  const meta = data?.metadata
  if (!meta || meta.dataset !== 'male-cns:v1.0' || meta.source !== 'HHMI Janelia FlyEM' || meta.license !== 'CC-BY-4.0' ||
    !Array.isArray(data.neurons) || !Array.isArray(data.failures) || !Number.isSafeInteger(meta.requestedNeuronCount) ||
    !Number.isSafeInteger(meta.availableNeuronCount) || data.neurons.length !== meta.availableNeuronCount ||
    meta.availableNeuronCount < 1 || meta.availableNeuronCount > meta.requestedNeuronCount || !finite(meta.originalPointCount) ||
    !finite(meta.simplifiedPointCount) || !finite(meta.compressionRatio) || !finite(meta.normalization?.scale) || meta.normalization.scale <= 0 ||
    !Array.isArray(meta.normalization.center) || meta.normalization.center.length !== 3 || meta.normalization.center.some(value => !finite(value))) throw new Error('Skeleton metadata is invalid')
  const bodies = new Set<number>()
  let points = 0
  for (const neuron of data.neurons) validateNeuron(neuron, bodies), points += neuron.simplifiedPointCount
  if (points !== meta.simplifiedPointCount || data.failures.some(item => !Number.isSafeInteger(item.bodyId) || item.bodyId <= 0)) throw new Error('Skeleton point count is invalid')
  return data
}

function validateNeuron(neuron: SkeletonNeuron, bodies: Set<number>) {
  if (!Number.isSafeInteger(neuron.bodyId) || neuron.bodyId <= 0 || bodies.has(neuron.bodyId) || !roles.has(neuron.role) ||
    typeof neuron.activityKey !== 'string' || !Number.isSafeInteger(neuron.originalPointCount) || !Number.isSafeInteger(neuron.simplifiedPointCount) ||
    neuron.originalPointCount < neuron.simplifiedPointCount || neuron.simplifiedPointCount !== neuron.points.length || !Array.isArray(neuron.points)) throw new Error('Skeleton neuron is invalid')
  bodies.add(neuron.bodyId)
  const ids = new Set<number>()
  for (const point of neuron.points) validatePoint(point, ids)
  if (neuron.points.some(point => point.parent !== -1 && !ids.has(point.parent))) throw new Error('Skeleton parent is missing')
}

function validatePoint(point: SkeletonPoint, ids: Set<number>) {
  if (!Number.isSafeInteger(point.id) || point.id <= 0 || ids.has(point.id) || !Number.isSafeInteger(point.parent) ||
    !finite(point.x) || !finite(point.y) || !finite(point.z) || (point.radius !== undefined && !finite(point.radius))) throw new Error('Skeleton point is invalid')
  ids.add(point.id)
}
