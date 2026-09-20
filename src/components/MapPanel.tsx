import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, LngLatBoundsLike, Map as MapLibreMap, Marker, StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getLocation, getRouteGeometry, LOCATIONS } from '../data/geo'
import type { SimulationPlan, SimulationState } from '../types/simulation'
import { positionOnPath, segmentPath } from '../utils/routeGeometry'

interface MapPanelProps {
  plan: SimulationPlan
  state: SimulationState
}

const mapStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#103b66' } },
    { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.88, 'raster-contrast': 0.08, 'raster-brightness-max': 0.86 } },
  ],
}

export function MapPanel({ plan, state }: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const geometry = getRouteGeometry(plan.route)
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [-79.478, 9.003],
      zoom: 11.2,
      attributionControl: false,
    })
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: geometry.coordinates } },
      })
      map.addLayer({ id: 'route-shadow', type: 'line', source: 'route', paint: { 'line-color': '#13305b', 'line-width': 7, 'line-opacity': 0.9 } })
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': plan.route.accent, 'line-width': 3, 'line-dasharray': [1.2, 1.5] } })
      map.addSource('progress', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      })
      map.addLayer({ id: 'progress-line', type: 'line', source: 'progress', paint: { 'line-color': '#5ce1f5', 'line-width': 4 } })
      const routeLocations = new Set(plan.route.segments.flatMap((segment) => [segment.from, segment.to]))
      LOCATIONS.filter((location) => routeLocations.has(location.id)).forEach((location) => {
        const element = document.createElement('div')
        element.className = `map-point map-point--${location.kind}`
        element.title = location.name
        element.tabIndex = 0
        element.setAttribute('role', 'img')
        element.setAttribute('aria-label', location.name)
        if (location.kind !== 'waypoint' || ['cinco-de-mayo', 'iglesia-del-carmen', 'cinquentenario'].includes(location.id)) {
          element.dataset.label = location.kind === 'origin' ? 'Costa del Este' : location.name
        }
        new maplibregl.Marker({ element }).setLngLat(location.coordinates).addTo(map)
      })
      const flyElement = document.createElement('div')
      flyElement.className = 'map-fly'
      flyElement.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><g stroke="#082750" stroke-width="1.2"><path d="m18 18-9-8m10 12-13 1m13 2-8 12m11-19 9-8m-10 12 13 1m-13 2 8 12" fill="none" stroke="#e6b46d"/><ellipse cx="20" cy="26" rx="5" ry="9" fill="#c98d4d"/><path d="m16 26 8 0m-8 4h8"/><ellipse cx="12" cy="23" rx="5" ry="10" transform="rotate(35 12 23)" fill="#69c8ee" fill-opacity=".8"/><ellipse cx="28" cy="23" rx="5" ry="10" transform="rotate(-35 28 23)" fill="#69c8ee" fill-opacity=".8"/><ellipse cx="20" cy="18" rx="5" ry="7" fill="#c98d4d"/><circle cx="17" cy="10" r="4" fill="#e48860"/><circle cx="23" cy="10" r="4" fill="#e48860"/></g></svg>'
      markerRef.current = new maplibregl.Marker({ element: flyElement }).setLngLat(getLocation('work-costa-del-este').coordinates).addTo(map)
      const bounds = geometry.coordinates.reduce((current, coordinate) => current.extend(coordinate), new maplibregl.LngLatBounds(geometry.coordinates[0], geometry.coordinates[0]))
      map.fitBounds(bounds as LngLatBoundsLike, { padding: { top: 55, bottom: 75, left: 65, right: 135 }, duration: 0 })
      setReady(true)
    })
    mapRef.current = map
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)
    return () => {
      resizeObserver.disconnect()
      markerRef.current?.remove()
      map.remove()
      markerRef.current = null
      mapRef.current = null
    }
  }, [plan])

  useEffect(() => {
    const active = state.currentSegment
    if (!ready || !markerRef.current) return
    const { coordinate, traveled } = active
      ? positionOnPath(segmentPath(active.segment), state.progress)
      : { coordinate: getLocation('utp').coordinates, traveled: [] }
    markerRef.current.setLngLat(coordinate)
    const map = mapRef.current
    if (map?.isStyleLoaded()) {
      const completedCoordinates = plan.segmentRuns
        .filter((run) => run.endMinute <= state.elapsedMinutes)
        .flatMap((run) => segmentPath(run.segment))
      const origin = getLocation(plan.segmentRuns[0]?.segment.from ?? 'work-costa-del-este').coordinates
      const traveledCoordinates = [origin, ...completedCoordinates, ...traveled]
      const source = map.getSource('progress') as GeoJSONSource | undefined
      source?.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: traveledCoordinates } })
    }
  }, [plan, ready, state.currentSegment, state.elapsedMinutes, state.progress])

  return (
    <section className="map-panel instrument-panel" aria-label="Mapa del recorrido">
      <div className="panel-label"><span>01 / RECORRIDO</span><span>OPENSTREETMAP</span></div>
      <div ref={containerRef} className="map-panel__canvas" />
      <div className="map-panel__legend"><span><i className="legend-dot legend-dot--origin" />Costa del Este</span><span><i className="legend-dot legend-dot--destination" />UTP</span><small>Trazado aproximado · no es navegación</small></div>
    </section>
  )
}
