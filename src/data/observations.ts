/**
 * Future field observations belong here. Keep measured observations separate
 * from configurable simulation assumptions in routes.ts.
 */
export interface CommuteObservation {
  date: string
  departureTime: string
  route: string
  firstBusWait: number | null
  firstArrivalTime: string | null
  secondWait: number | null
  arrivalUTP: string | null
  totalMinutes: number | null
  weather: string | null
  notes: string
}

// Intentionally empty: no fabricated observations are shipped with the MVP.
export const OBSERVATIONS: CommuteObservation[] = []
