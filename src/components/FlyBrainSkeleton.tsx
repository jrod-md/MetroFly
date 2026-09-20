import { useEffect, useMemo, useRef, useState } from 'react'
import { loadSkeletonData } from '../neural/skeletons'
import { SKELETON_COLORS, shouldAutoRotate } from '../neural/skeletonVisual'
import type { SkeletonData } from '../types/skeleton'
import { auditCopy, useTranslation } from '../i18n'

type Activity = Record<string, number>
interface FlyBrainSkeletonProps {
  activity: Activity
  paused?: boolean
  compact?: boolean
  rotationEnabled?: boolean
  resetViewToken?: number
  onViewInteraction?: () => void
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

export function FlyBrainSkeleton({ activity, paused = false, compact = false, rotationEnabled = true, resetViewToken = 0, selectedId = null, onSelect, onData, onViewInteraction }: FlyBrainSkeletonProps) {
  const { language } = useTranslation(); const copy = auditCopy[language]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [data, setData] = useState<SkeletonData | null>(null)
  const [failed, setFailed] = useState(false)
  const reducedMotion = useReducedMotion()
  const activityRef = useRef(activity)
  const hitPoints = useRef<{ bodyId: number; x: number; y: number }[]>([])
  const camera = useRef({ yaw: 0, pitch: -.42, zoom: 1 })
  const pointer = useRef<{ id: number; x: number; y: number; dragging: boolean } | null>(null)
  const dirty = useRef(true)
  const [dragging, setDragging] = useState(false)
  activityRef.current = activity

  useEffect(() => {
    let alive = true
    loadSkeletonData().then(value => { if (alive) { setData(value); onData?.(value) } }).catch(() => { if (alive) { setFailed(true); onData?.(null) } })
    return () => { alive = false }
  }, [onData])

  useEffect(() => { camera.current = { yaw: 0, pitch: -.42, zoom: 1 }; dirty.current = true }, [resetViewToken])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data) return
    const context = canvas.getContext('2d')
    if (!context) return
    let frame = 0, last = 0
    const rotate = shouldAutoRotate(compact, paused || !rotationEnabled, reducedMotion)
    const draw = (time: number) => {
      if (document.hidden) { frame = requestAnimationFrame(draw); return }
      if (!dirty.current && time - last < (rotate ? 66 : 250)) { frame = requestAnimationFrame(draw); return }
      const elapsed = last ? time - last : 0
      last = time
      if (rotate) camera.current.yaw = (camera.current.yaw + elapsed / 45000 * Math.PI * 2) % (Math.PI * 2)
      dirty.current = false
      const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) { canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr) }
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, width, height)
      const cosine = Math.cos(camera.current.yaw), sine = Math.sin(camera.current.yaw), cp = Math.cos(camera.current.pitch), sp = Math.sin(camera.current.pitch)
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
      const padding = compact ? .1 : .09, scale = Math.min(width * (1 - padding * 2) / (maxX - minX || 1), height * (1 - padding * 2) / (maxY - minY || 1)) * camera.current.zoom
      const offsetX = (width - (minX + maxX) * scale) / 2, offsetY = (height - (minY + maxY) * scale) / 2
      const nextHitPoints: { bodyId: number; x: number; y: number }[] = []
      for (const neuron of data.neurons) {
        const value = clamp(activityRef.current[neuron.activityKey] ?? .02)
        const selected = selectedId === neuron.bodyId
        const [r, g, b] = SKELETON_COLORS[neuron.role]
        const alpha = selected ? 1 : selectedId === null ? .11 + value * (compact ? .6 : .72) : .07 + value * .35
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
  }, [compact, data, paused, reducedMotion, rotationEnabled, selectedId])

  const label = useMemo(() => {
    if (!data) return copy.loadingMorphology
    const selected = data.neurons.find(neuron => neuron.bodyId === selectedId)
    return selected ? copy.selectedSkeleton.replace('{type}', selected.type ?? String(selected.bodyId)).replace('{bodyId}', String(selected.bodyId)).replace('{available}', String(data.metadata.availableNeuronCount)).replace('{requested}', String(data.metadata.requestedNeuronCount)) : copy.skeletonCount.replace('{available}', String(data.metadata.availableNeuronCount)).replace('{requested}', String(data.metadata.requestedNeuronCount))
  }, [copy, data, selectedId])
  if (failed) return <div className="brain-fallback">{copy.morphologyUnavailable}</div>
  const selectAt = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    if (!onSelect) return
    const bounds = canvas.getBoundingClientRect()
    const x = clientX - bounds.left, y = clientY - bounds.top
    const nearest = hitPoints.current.reduce<{ bodyId: number; distance: number } | null>((best, point) => {
      const distance = Math.hypot(point.x - x, point.y - y)
      return !best || distance < best.distance ? { bodyId: point.bodyId, distance } : best
    }, null)
    if (nearest && nearest.distance < 18) onSelect(nearest.bodyId)
  }
  return <div className={`brain-canvas${compact ? ' brain-canvas--compact' : ''}`}><canvas ref={canvasRef} onPointerDown={event => {
    if (compact) return
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }} onPointerMove={event => {
    const active = pointer.current
    if (!active || active.id !== event.pointerId) return
    const dx = event.clientX - active.x, dy = event.clientY - active.y
    if (!active.dragging && Math.hypot(dx, dy) > 5) { active.dragging = true; setDragging(true); onViewInteraction?.() }
    if (active.dragging) { camera.current.yaw += dx * .008; camera.current.pitch = Math.max(-1.48, Math.min(1.48, camera.current.pitch + dy * .006)); active.x = event.clientX; active.y = event.clientY; dirty.current = true }
  }} onPointerUp={event => {
    const active = pointer.current
    if (!active || active.id !== event.pointerId) return
    pointer.current = null; setDragging(false)
    if (!active.dragging) selectAt(event.currentTarget, event.clientX, event.clientY)
  }} onPointerCancel={() => { pointer.current = null; setDragging(false) }} onWheel={event => {
    if (compact) return
    event.preventDefault(); camera.current.zoom = Math.max(.6, Math.min(5, camera.current.zoom * Math.exp(-event.deltaY * .0015))); dirty.current = true; onViewInteraction?.()
  }} aria-label={copy.canvasAria.replace('{label}', label)} role="img" className={dragging ? 'is-dragging' : ''} /><span>{label}</span></div>
}
