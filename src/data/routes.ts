import type { TransitRoute } from '../types/transit'

// Bounded ranges are assumptions informed by the author's account, not fitted observations.
// Explicit delays are added only where declared. No global traffic/wait penalty is applied.
export const ROUTES: TransitRoute[] = [
  {
    id: 'cinco-de-mayo', name: '5 de Mayo', shortCode: 'A / 5M',
    presentationKey: 'cinco-de-mayo',
    referenceDurationMinutes: 120, uncertainty: 'high', transfers: 2,
    observationalBasisKey: 'cinco-de-mayo',
    accent: '#68b9ff',
    segments: [
      { id: 'a-walk-1', type: 'walk', name: 'Salida del trabajo', from: 'work-costa-del-este', to: 'costa-del-este-stop', baseMinutes: 3, variabilityMinutes: 1, durationRange: [2, 4], narrative: 'Del trabajo a la parada en Costa del Este.' },
      { id: 'a-wait-1', type: 'wait', name: 'S447 / S487 / S662 / S669', from: 'costa-del-este-stop', to: 'costa-del-este-stop', baseMinutes: 2, variabilityMinutes: 5, durationRange: [0, 7], lowBiased: true, narrative: 'Estos buses pasan con frecuencia. La espera suele ser corta.' },
      { id: 'a-bus-1', type: 'bus', name: 'Bus hacia 5 de Mayo', from: 'costa-del-este-stop', to: 'zona-paga-5m', baseMinutes: 25, variabilityMinutes: 5, durationRange: [20, 30], narrative: 'Hacia 5 de Mayo. El viaje avanza sin mayor drama.' },
      { id: 'a-transfer-1', type: 'transfer', name: 'Bajar al Metro', from: 'zona-paga-5m', to: 'cinco-de-mayo', baseMinutes: 4, variabilityMinutes: 2, durationRange: [2, 6], narrative: 'Bajar y hacer la conexión al Metro.' },
      { id: 'a-metro', type: 'metro', name: 'Metro → Iglesia del Carmen', from: 'cinco-de-mayo', to: 'iglesia-del-carmen', baseMinutes: 9, variabilityMinutes: 0, durationRange: [8, 9], narrative: 'Hasta Iglesia del Carmen: unos nueve minutos en el Metro. Este tramo sí se mueve.' },
      { id: 'a-walk-2', type: 'walk', name: 'Caminar a Crowne Plaza-R', from: 'iglesia-del-carmen', to: 'hotel-stop', baseMinutes: 4, variabilityMinutes: 1, durationRange: [3, 5], completesTransfer: true, narrative: 'Una caminata corta desde el Metro hasta Crowne Plaza-R.' },
      { id: 'a-wait-2', type: 'wait', name: 'Esperar M675', from: 'hotel-stop', to: 'hotel-stop', baseMinutes: 6, variabilityMinutes: 4, durationRange: [2, 10], narrative: 'Una espera moderada. Lo difícil viene después.' },
      { id: 'a-bus-2', type: 'bus', name: 'M675 · Ricardo J. Alfaro', from: 'hotel-stop', to: 'utp-stop', baseMinutes: 60, variabilityMinutes: 18, durationRange: [42, 78], bottleneck: true, delay: { probability: 0.9, event: 'HEAVY_TRAFFIC', range: [5, 15] }, narrative: 'M675 por Manuel Espinoza Batista, La Locería, El Dorado y Villa Las Fuentes. Aquí se concentra el tranque.' },
      { id: 'campus-walk', type: 'walk', name: 'Entrada a UTP', from: 'utp-stop', to: 'utp', baseMinutes: 3, variabilityMinutes: 1, durationRange: [2, 4], narrative: 'De Universidad Tecnológica-R al acceso del campus. Destino de referencia: zona de Secretaría General.' },
    ],
  },
  {
    id: 'e665', name: 'E665', shortCode: 'B / E665',
    presentationKey: 'e665',
    referenceDurationMinutes: null, uncertainty: 'unknown', transfers: 1,
    observationalBasisKey: 'e665',
    accent: '#e6cf76',
    segments: [
      { id: 'b-walk-1', type: 'walk', name: 'Salida del trabajo', from: 'work-costa-del-este', to: 'costa-del-este-stop', baseMinutes: 4, variabilityMinutes: 1, durationRange: [3, 5], narrative: 'A la parada de Costa del Este.' },
      { id: 'b-wait-1', type: 'wait', name: 'Esperar E665', from: 'costa-del-este-stop', to: 'costa-del-este-stop', baseMinutes: 24, variabilityMinutes: 14, delay: { probability: 0.42, event: 'STILL_WAITING', range: [3, 8] }, narrative: 'E665 allegedly exists. Esta espera es un supuesto, no un dato medido.' },
      { id: 'b-bus-1', type: 'bus', name: 'E665 → Cincuentenario', from: 'costa-del-este-stop', to: 'cinquentenario', baseMinutes: 27, variabilityMinutes: 10, narrative: 'El E665 apareció. Por Vía Cincuentenario, el puente, Roosevelt y Domingo Díaz.' },
      { id: 'b-transfer', type: 'transfer', name: 'Cruce en Cincuentenario', from: 'cinquentenario', to: 'cinquentenario-connection', baseMinutes: 9, variabilityMinutes: 4, delay: { probability: 0.2, event: 'TRANSFER_MISSED', range: [4, 9] }, narrative: 'Cruzar para conectar hacia Ricardo J. Alfaro.' },
      { id: 'b-wait-2', type: 'wait', name: 'Esperar bus hacia UTP', from: 'cinquentenario-connection', to: 'cinquentenario-connection', baseMinutes: 10, variabilityMinutes: 6, narrative: 'Falta un bus más.' },
      { id: 'b-bus-2', type: 'bus', name: 'Ricardo J. Alfaro → UTP', from: 'cinquentenario-connection', to: 'utp-stop', baseMinutes: 28, variabilityMinutes: 9, delay: { probability: 0.6, event: 'HEAVY_TRAFFIC', range: [5, 15] }, narrative: 'Tramo final hacia la universidad.' },
      { id: 'campus-walk', type: 'walk', name: 'Entrada a UTP', from: 'utp-stop', to: 'utp', baseMinutes: 3, variabilityMinutes: 1, durationRange: [2, 4], narrative: 'De Universidad Tecnológica-R al acceso del campus. Destino de referencia: zona de Secretaría General.' },
    ],
  },
  {
    id: 'pirata', name: 'Pirata / Diablo Rojo', shortCode: 'C / PIRATA',
    presentationKey: 'pirata',
    referenceDurationMinutes: 90, uncertainty: 'high', transfers: 1,
    observationalBasisKey: 'pirata',
    accent: '#60cce8',
    segments: [
      { id: 'c-walk-1', type: 'walk', name: 'Buscar dónde abordar', from: 'work-costa-del-este', to: 'informal-pickup', baseMinutes: 4, variabilityMinutes: 2, durationRange: [2, 6], narrative: 'Salir del trabajo y buscar una oportunidad de abordaje.' },
      { id: 'c-wait-1', type: 'wait', name: 'Recogida informal', from: 'informal-pickup', to: 'informal-pickup', baseMinutes: 7, variabilityMinutes: 5, durationRange: [2, 12], narrative: 'Sin parada fija. Toca estar pendiente.' },
      { id: 'c-bus-1', type: 'bus', name: 'Pirata → Cincuentenario', from: 'informal-pickup', to: 'cinquentenario', baseMinutes: 40, variabilityMinutes: 5, durationRange: [35, 45], narrative: 'Unos cuarenta minutos hasta Cincuentenario. Con la salida y el abordaje, podemos llegar casi a las seis.' },
      { id: 'c-transfer', type: 'transfer', name: 'Cruce en Cincuentenario', from: 'cinquentenario', to: 'cinquentenario-connection', baseMinutes: 6, variabilityMinutes: 2, durationRange: [4, 8], narrative: 'Cruzar por la estación de Metro hacia la parada de buses. La continuación depende de lo que pase.' },
      { id: 'c-wait-2', type: 'wait', name: 'Esperar M o C978', from: 'cinquentenario-connection', to: 'cinquentenario-connection', baseMinutes: 7, variabilityMinutes: 3, durationRange: [4, 10], narrative: 'Un M por Ricardo J. Alfaro o C978. La continuación depende del bus que llegue.' },
      { id: 'c-bus-2', type: 'bus', name: 'Bus M → Universidad Tecnológica-R', from: 'cinquentenario-connection', to: 'utp-stop', baseMinutes: 24, variabilityMinutes: 4, durationRange: [20, 28], delay: { probability: 0.65, event: 'HEAVY_TRAFFIC', range: [3, 10] }, continuationNotice: 'Pasó un M por Ricardo J. Alfaro. Nos sirve hasta Universidad Tecnológica-R.', narrative: 'La vuelta fue menor. El tranque sigue aquí.' },
      { id: 'campus-walk', type: 'walk', name: 'Entrada a UTP', from: 'utp-stop', to: 'utp', baseMinutes: 3, variabilityMinutes: 1, durationRange: [2, 4], narrative: 'De Universidad Tecnológica-R al acceso del campus. Destino de referencia: zona de Secretaría General.' },
    ],
  },
]

export const getRoute = (routeId: TransitRoute['id']): TransitRoute => {
  const route = ROUTES.find((candidate) => candidate.id === routeId)
  if (!route) throw new Error(`Unknown route: ${routeId}`)
  return route
}
