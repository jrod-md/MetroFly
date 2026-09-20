import type { GeoLocation, LocationId, RouteSegment, TransitRoute } from '../types/transit'

export type Coordinate = [number, number] // longitude, latitude

// EDITING GUIDE: 1. correct LOCATIONS; 2. adjust the named intermediate vertices below.
// Endpoints are injected from LOCATIONS, so changing an anchor updates every connected leg.
// OSM / Metro de Panamá anchors, consulted 2026-09-19. See README for sources and limits.
// Happy Copy, the interchange, the Metro entrance and campus access remain approximations.
export const LOCATIONS: GeoLocation[] = [
  { id: 'work-costa-del-este', name: 'Trabajo · P.H. Dream Plaza', coordinates: [-79.470428, 9.01658], kind: 'origin' },
  { id: 'costa-del-este-stop', name: 'Happy Copy CE-I · zona aproximada', coordinates: [-79.47129, 9.016125], kind: 'waypoint' },
  { id: 'informal-pickup', name: 'Abordaje informal · sin parada fija', coordinates: [-79.472104, 9.015998], kind: 'waypoint' },
  { id: 'zona-paga-5m', name: 'Zona Paga 5 de Mayo · Puerta 02', coordinates: [-79.539089, 8.961879], kind: 'waypoint' },
  { id: 'cinco-de-mayo', name: 'Metro 5 de Mayo', coordinates: [-79.5390, 8.9631], kind: 'waypoint' },
  { id: 'iglesia-del-carmen', name: 'Metro Iglesia del Carmen', coordinates: [-79.527229, 8.982314], kind: 'waypoint' },
  { id: 'hotel-stop', name: 'Crowne Plaza-R', coordinates: [-79.528945, 8.982622], kind: 'waypoint' },
  { id: 'cinquentenario', name: 'Metro Cincuentenario', coordinates: [-79.491392, 9.030203], kind: 'waypoint' },
  { id: 'cinquentenario-connection', name: 'Parada tras el cruce del Metro', coordinates: [-79.491524, 9.030391], kind: 'waypoint' },
  { id: 'rja-interchange', name: 'Intercambio R. J. Alfaro · aproximado', coordinates: [-79.520151, 9.027177], kind: 'waypoint' },
  { id: 'torres-milan', name: 'Torres de Milan-I · junto al Va y Ven', coordinates: [-79.528532, 9.025644], kind: 'waypoint' },
  { id: 'utp-stop', name: 'Universidad Tecnológica-R', coordinates: [-79.531776, 9.019758], kind: 'waypoint' },
  { id: 'utp', name: 'UTP · acceso hacia Secretaría General', coordinates: [-79.53155, 9.0216], kind: 'destination' },
]

export const getLocation = (id: LocationId): GeoLocation => {
  const location = LOCATIONS.find((candidate) => candidate.id === id)
  if (!location) throw new Error(`Unknown location: ${id}`)
  return location
}

// S662-inspired shared corridor, not a claim that all four lines stop identically.
// OpenStreetMap road reference via OSRM; car travel times are intentionally unused.
export const CORRIDORS: Record<string, Coordinate[]> = {
  'coast-to-5m': [
    [-79.47394, 9.01572], // Hiedra y Bambu / La Cancha area
    [-79.47843, 9.01496], [-79.47793, 9.01086], [-79.48037, 9.00656],
    [-79.49028, 8.99849], [-79.49594, 8.99102], [-79.49991, 8.98708],
    [-79.50400, 8.98332], [-79.50980, 8.97935], // Corredor Sur
    [-79.51223, 8.97902], [-79.51614, 8.98071], // Megapolis Outlets area
    [-79.51720, 8.97972], [-79.51685, 8.97845], [-79.51640, 8.97660],
    [-79.51716, 8.97546], [-79.52188, 8.97585], // Aquilino de la Guardia
    [-79.52474, 8.97587], [-79.52780, 8.97486], // Parque Urracá
    [-79.53034, 8.97106], [-79.53210, 8.96851], // Calle 39 / Hospital del Niño
    [-79.53491, 8.96469], [-79.53634, 8.96202], // Boulevard
    [-79.53732, 8.96257], [-79.53928, 8.96121],
  ],
  'metro-line-1': [
    [-79.5374, 8.9661], [-79.5347, 8.9712], // Lotería
    [-79.5326, 8.9765], // Santo Tomás
    [-79.5308, 8.9790], [-79.5285, 8.9813],
  ],
  'm675': [
    [-79.5298, 8.9834], [-79.5310, 8.9851], // Manuel Espinoza Batista
    [-79.533366, 8.989856], // Cervecería Nacional-R
    [-79.533802, 8.993980], // La Locería-R
    [-79.533198, 8.998623], // Los Ángeles-R
    [-79.533079, 9.005003], // Plaza Mirage-R
    [-79.534107, 9.009606], // CC El Dorado-R
    [-79.535036, 9.015493], // Villa Las Fuentes-R
    [-79.5343, 9.0179], [-79.5335, 9.0190],
  ],
  'cincuentenario': [
    [-79.47843, 9.01496], // boulevard / Centenario, salida de Costa del Este
    [-79.48419, 9.01403], [-79.48520, 9.01488], [-79.48529, 9.01515],
    [-79.48453, 9.01654], [-79.48453, 9.01750], // puente y Vía Cincuentenario
    [-79.48664, 9.02171], [-79.48743, 9.02400], [-79.48784, 9.02661],
    [-79.48817, 9.02732], [-79.48921, 9.02870],
    [-79.49019, 9.03145], [-79.49039, 9.03164], // entorno de Roosevelt
    [-79.49077, 9.03139], [-79.4912, 9.0308], // conexión Domingo Díaz
  ],
  'domingo-diaz-rja': [
    [-79.49364, 9.02923], [-79.49479, 9.02886], [-79.49611, 9.02910],
    [-79.49929, 9.03038], [-79.50039, 9.03068], // Domingo Díaz / Vía Tocumen
    [-79.50630, 9.03082], // San Miguelito
    [-79.51296, 9.03224], [-79.51421, 9.03205], // Ricardo J. Alfaro
    [-79.51780, 9.03087], [-79.51843, 9.03048], [-79.51900, 9.02986],
  ],
  'interchange-to-utp': [
    [-79.52075, 9.02643], [-79.52645, 9.02354], [-79.52987, 9.02086],
    [-79.5308, 9.0203],
  ],
  'interchange-to-milan': [
    [-79.5212, 9.0268], [-79.5234, 9.0272], [-79.5254, 9.0269], [-79.5274, 9.0261],
  ],
  'milan-footbridge': [
    [-79.5288, 9.0257], [-79.5290, 9.0253], // elevated pedestrian crossing, approximate
    [-79.5298, 9.0245], [-79.5305, 9.0235], [-79.5312, 9.0228],
  ],
}

// Intermediate vertices only. Every leg always begins/ends at its named anchor.
// Informal boarding and pedestrian connections are sketches, not navigation directions.
export const SEGMENT_VIA: Record<string, Coordinate[]> = {
  'a-walk-1': [[-79.47035, 9.01627]],
  'b-walk-1': [[-79.47035, 9.01627]],
  'c-walk-1': [[-79.47035, 9.01627], [-79.47129, 9.016125]],
  'a-bus-1': CORRIDORS['coast-to-5m'],
  'a-transfer-1': [[-79.5389, 8.9623]],
  'a-metro': CORRIDORS['metro-line-1'],
  'a-walk-2': [[-79.52755, 8.9827], [-79.5282, 8.9829]],
  'a-bus-2': CORRIDORS.m675,
  'b-bus-1': CORRIDORS.cincuentenario,
  'c-bus-1': CORRIDORS.cincuentenario,
  'b-bus-2': [...CORRIDORS['domingo-diaz-rja'], getLocation('rja-interchange').coordinates, ...CORRIDORS['interchange-to-utp']],
  'c-bus-2': [...CORRIDORS['domingo-diaz-rja'], getLocation('rja-interchange').coordinates, ...CORRIDORS['interchange-to-utp']],
  'c-interchange-bus': CORRIDORS['interchange-to-utp'],
  'c-milan-walk': CORRIDORS['milan-footbridge'],
  'campus-walk': [[-79.5314, 9.0201], [-79.5312, 9.0208]],
}

export const getSegmentGeometry = (segment: RouteSegment): Coordinate[] => {
  const via = segment.id === 'c-c978'
    ? [...CORRIDORS['domingo-diaz-rja'], ...(segment.to === 'torres-milan' ? [getLocation('rja-interchange').coordinates, ...CORRIDORS['interchange-to-milan']] : [])]
    : SEGMENT_VIA[segment.id] ?? []
  return [getLocation(segment.from).coordinates, ...via, getLocation(segment.to).coordinates]
}

export const getRouteGeometry = (route: TransitRoute): { coordinates: Coordinate[] } => ({
  coordinates: route.segments.flatMap(getSegmentGeometry),
})
