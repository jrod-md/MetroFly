import type { RouteSegment, TransitRoute } from '../types/transit'

// Scenario weights, NOT observed service frequencies. All branch details live here.
export const PIRATA_CONTINUATIONS = [
  { id: 'm-direct', label: 'Bus M directo', weight: 0.5 },
  { id: 'c978-interchange', label: 'C978 + M en el intercambio', weight: 0.25 },
  { id: 'c978-milan', label: 'C978 + puente en Torres de Milan-I', weight: 0.25 },
] as const

export function resolveContinuation(route: TransitRoute, draw: number): TransitRoute {
  if (route.id !== 'pirata') return route
  let cumulative = 0
  const choice = PIRATA_CONTINUATIONS.find((item) => { cumulative += item.weight; return draw < cumulative }) ?? PIRATA_CONTINUATIONS[2]
  if (choice.id === 'm-direct') return { ...route, continuation: choice.label }
  const prefix = route.segments.slice(0, 5)
  const campusWalk = route.segments.at(-1)!
  const viaInterchange = choice.id === 'c978-interchange'
  const next: RouteSegment[] = [
    { id: 'c-c978', type: 'bus', name: viaInterchange ? 'C978 → intercambio R. J. Alfaro' : 'C978 → Torres de Milan-I',
      from: 'cinquentenario-connection', to: viaInterchange ? 'rja-interchange' : 'torres-milan',
      baseMinutes: 23, variabilityMinutes: 4, durationRange: viaInterchange ? [16, 24] : [21, 29],
      delay: { probability: 0.5, event: 'HEAVY_TRAFFIC', range: [3, 8] },
      continuationNotice: viaInterchange ? 'Pasó C978. Bajaremos antes, en el intercambio, para buscar un M por Ricardo J. Alfaro.' : 'Pasó C978. Seguiremos hasta Torres de Milan-I, junto al Va y Ven, y cruzaremos por el puente.',
      narrative: 'La conexión disponible no nos deja en la parada de UTP. Hay que completar el recorrido.' },
  ]
  if (viaInterchange) next.push(
    { id: 'c-interchange-transfer', type: 'transfer', name: 'Conexión en el intercambio', from: 'rja-interchange', to: 'rja-interchange', baseMinutes: 2, variabilityMinutes: 1, durationRange: [1, 3], narrative: 'Bajarse antes para buscar un M que continúe por Ricardo J. Alfaro. Punto aproximado, no indicación peatonal.' },
    { id: 'c-interchange-wait', type: 'wait', name: 'Esperar un M', from: 'rja-interchange', to: 'rja-interchange', baseMinutes: 5, variabilityMinutes: 3, durationRange: [2, 8], narrative: 'Cambiar de bus puede ayudar. Primero tiene que llegar el otro.' },
    { id: 'c-interchange-bus', type: 'bus', name: 'M → Universidad Tecnológica-R', from: 'rja-interchange', to: 'utp-stop', baseMinutes: 6, variabilityMinutes: 2, durationRange: [4, 8], narrative: 'Por fin, un M hacia la parada de la universidad.' },
    campusWalk,
  )
  else next.push(
    { id: 'c-milan-walk', type: 'walk', name: 'Puente de Torres de Milan-I → UTP', from: 'torres-milan', to: 'utp', baseMinutes: 9, variabilityMinutes: 3, durationRange: [6, 12], narrative: 'Bajar junto al Va y Ven, usar el puente elevado y continuar a pie al campus. El bus terminó; la caminata, no.' },
  )
  return { ...route, continuation: choice.label, transfers: viaInterchange ? 2 : 1, segments: [...prefix, ...next] }
}
