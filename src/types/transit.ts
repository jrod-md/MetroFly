export type SegmentType = 'walk' | 'wait' | 'bus' | 'metro' | 'transfer'

export type LocationId =
  | 'work-costa-del-este'
  | 'costa-del-este-stop'
  | 'informal-pickup'
  | 'cinquentenario'
  | 'cinquentenario-connection'
  | 'cinco-de-mayo'
  | 'zona-paga-5m'
  | 'iglesia-del-carmen'
  | 'hotel-stop'
  | 'utp-stop'
  | 'rja-interchange'
  | 'torres-milan'
  | 'utp'

export interface RouteSegment {
  id: string
  type: SegmentType
  name: string
  from: LocationId
  to: LocationId
  baseMinutes: number
  variabilityMinutes: number
  narrative: string
  durationRange?: readonly [number, number]
  lowBiased?: boolean
  delay?: { probability: number; event: 'HEAVY_TRAFFIC' | 'STILL_WAITING' | 'TRANSFER_MISSED'; range: readonly [number, number] }
  bottleneck?: boolean
  completesTransfer?: boolean
  continuationNotice?: string
}

export type UncertaintyLevel = 'moderate' | 'high' | 'unknown'

export interface TransitRoute {
  id: 'cinco-de-mayo' | 'e665' | 'pirata'
  name: string
  shortCode: string
  presentationKey: 'cinco-de-mayo' | 'e665' | 'pirata'
  segments: RouteSegment[]
  referenceDurationMinutes: number | null
  uncertainty: UncertaintyLevel
  transfers: number
  observationalBasisKey: 'cinco-de-mayo' | 'e665' | 'pirata'
  accent: string
  continuation?: string
}

export interface GeoLocation {
  id: LocationId
  name: string
  coordinates: [number, number]
  kind: 'origin' | 'waypoint' | 'destination'
}

export interface RouteGeometry {
  routeId: TransitRoute['id']
  coordinates: [number, number][]
}
