import { useEffect, useMemo, useRef, useState } from 'react'
import { loadSkeletonData } from '../neural/skeletons'
import { SKELETON_COLORS, shouldAutoRotate } from '../neural/skeletonVisual'
import type { SkeletonData } from '../types/skeleton'

type Activity = Record<string, number>
interface FlyBrainSkeletonProps {
  activity: Activity
  paused?: boolean
  compact?: boolean
  selectedId?: number | null
  onSelect?: (bodyId: number) => void
  onData?: (data: SkeletonData | null) => void
}

const clamp = (value: number) => Math.max(0, Math.min(1, value))

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

export function FlyBrainSkeleton({ activity, paused = false, compact = false, selectedId = null, onSelect, onData }: FlyBrainSkeletonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [data, setData] = useState<SkeletonData | null>(null)
  const [failed, setFailed] = useState(false)
  const reducedMotion = useReducedMotion()
  const activityRef = useRef(activity)
  const hitPoints = useRef<{ bodyId: number; x: number; y: number }[]>([])
  activityRef.current = activity

  useEffect(() => {
    let alive = true
    loadSkeletonData().then(value => { if (alive) { setData(value); onData?.(value) } }).catch(() => { if (alive) { setFailed(true); onData?.(null) } })
    return () => { alive = false }
  }, [onData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data) return
    const context = canvas.getContext('2d')
    if (!context) return
    let frame = 0, last = 0, rotation = 0
    const pitch = -0.42
    const rotate = shouldAutoRotate(compact, paused, reducedMotion)
    const draw = (time: number) => {
      if (document.hidden) { frame = requestAnimationFrame(draw); return }
      if (time - last < (rotate ? 66 : 250)) { frame = requestAnimationFrame(draw); return }
      const elapsed = last ? time - last : 0
      last = time
      if (rotate) rotation = (rotation + elapsed / 45000 * Math.PI * 2) % (Math.PI * 2)
      const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) { canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr) }
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)
      const cosine = Math.cos(rotation), sine = Math.sin(rotation), cp = Math.cos(pitch), sp = Math.sin(pitch)
      const project = (point: { x: number; y: number; z: number }) => {
        const x = (point.x - data.metadata.normalization.center[0]) / data.metadata.normalization.scale
        const y = (point.y - data.metadata.normalization.center[1]) / data.metadata.normalization.scale
        const z = (point.z - data.metadata.normalization.center[2]) / data.metadata.normalization.scale
        const horizontal = cosine * x - sine * z
        const depth = sine * x + cosine * z
        return [horizontal, cp * y - sp * depth] as const
      }
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const neuron of data.neurons) for (const point of neuron.points) { const [x, y] = project(point); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y) }
      const padding = compact ? .1 : .09, scale = Math.min(width * (1 - padding * 2) / (maxX - minX || 1), height * (1 - padding * 2) / (maxY - minY || 1))
      const offsetX = (width - (minX + maxX) * scale) / 2, offsetY = (height - (minY + maxY) * scale) / 2
      const nextHitPoints: { bodyId: number; x: number; y: number }[] = []
      for (const neuron of data.neurons) {
        const value = clamp(activityRef.current[neuron.activityKey] ?? .02)
        const selected = selectedId === neuron.bodyId
        const [r, g, b] = SKELETON_COLORS[neuron.role]
        const alpha = selected ? 1 : .11 + value * (compact ? .6 : .72)
        context.beginPath()
        const parent = new Map(neuron.points.map(point => [point.id, point]))
        for (let index = 0; index < neuron.points.length; index++) {
          const point = neuron.points[index]
          const ancestor = parent.get(point.parent)
          if (!ancestor) continue
          const [x1, y1] = project(ancestor), [x2, y2] = project(point)
          context.moveTo(offsetX + x1 * scale, offsetY - y1 * scale)
          context.lineTo(offsetX + x2 * scale, offsetY - y2 * scale)
          if (!compact && index % 12 === 0) nextHitPoints.push({ bodyId: neuron.bodyId, x: offsetX + x2 * scale, y: offsetY - y2 * scale })
        }
        context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        context.lineWidth = selected ? 1.55 + value : .45 + value * .9
        context.shadowBlur = value > .72 ? 5 + value * 5 : 0
        context.shadowColor = `rgb(${r}, ${g}, ${b})`
        context.stroke()
      }
      hitPoints.current = nextHitPoints
      context.shadowBlur = 0
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [compact, data, paused, reducedMotion, selectedId])

  const label = useMemo(() => data ? `${data.metadata.availableNeuronCount}/${data.metadata.requestedNeuronCount} centerline skeletons` : 'Loading real morphology', [data])
  if (failed) return <div className="brain-fallback">Real morphology unavailable. The commute continues without it.</div>
  return <div className={`brain-canvas${compact ? ' brain-canvas--compact' : ''}`}><canvas ref={canvasRef} onClick={event => {
    if (!onSelect) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - bounds.left, y = event.clientY - bounds.top
    const nearest = hitPoints.current.reduce<{ bodyId: number; distance: number } | null>((best, point) => {
      const distance = Math.hypot(point.x - x, point.y - y)
      return !best || distance < best.distance ? { bodyId: point.bodyId, distance } : best
    }, null)
    if (nearest && nearest.distance < 18) onSelect(nearest.bodyId)
  }} aria-label={`${label}. Real MaleCNS morphology projected in Canvas 2D.`} role="img" /><span>{label}</span></div>
}
