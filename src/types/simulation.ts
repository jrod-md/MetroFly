import type { LocationId, RouteSegment, SegmentType, TransitRoute } from './transit'

export type EventType =
  | 'EXPERIMENT_STARTED'
  | 'BUS_WRONG_ROUTE'
  | 'BUS_ARRIVED'
  | 'STILL_WAITING'
  | 'WAIT_STARTED'
  | 'FINAL_STRETCH'
  | 'CONTINUATION_SELECTED'
  | 'HEAVY_TRAFFIC'
  | 'TRANSFER_STARTED'
  | 'TRANSFER_MISSED'
  | 'METRO_ARRIVED'
  | 'WALKING'
  | 'ARRIVED_CINCUENTENARIO'
  | 'ARRIVED_5_DE_MAYO'
  | 'CLASS_STARTED'
  | 'ARRIVED_UTP'

export type EventTone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface SimulationEvent {
  id: string
  type: EventType
  atMinute: number
  message: string
  tone: EventTone
}

export interface SegmentRun {
  segment: RouteSegment
  startMinute: number
  durationMinutes: number
  endMinute: number
}

export interface SimulationPlan {
  id: string
  route: TransitRoute
  seed: number
  segmentRuns: SegmentRun[]
  events: SimulationEvent[]
  totalMinutes: number
}

export interface NarrativeInternalState {
  arousal: number
  negativeValence: number
  persistence: number
  deadlinePressure: number
}

export interface MoodState extends NarrativeInternalState {
  hope: number
  anxiety: number
  confusion: number
  regret: number
  relief: number
  resignation: number
}

export interface MoodSnapshot extends MoodState {
  minute: number
  label: string
}

export interface SimulationState {
  currentTime: Date
  elapsedMinutes: number
  currentLocation: LocationId
  currentSegment: SegmentRun | null
  currentSegmentType: SegmentType | null
  progress: number
  waitingMinutes: number
  travelMinutes: number
  walkingMinutes: number
  transfers: number
  events: SimulationEvent[]
  finished: boolean
  arrivalTime: Date | null
  lateMinutes: number
  classStarted: boolean
}

export interface SimulationResult {
  id: string
  routeId: TransitRoute['id']
  routeName: string
  continuation?: string
  seed: number
  totalMinutes: number
  arrivalTime: Date
  lateMinutes: number
  waitingMinutes: number
  travelMinutes: number
  walkingMinutes: number
  transfers: number
  peakAnxiety: number
  finalRegret: number
  narrativeSuffering: number
}
