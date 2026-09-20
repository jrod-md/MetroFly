export const SCENARIO = {
  id: 'the-6-pm-class',
  name: 'La clase de las 6',
  originName: 'Trabajo en Costa del Este',
  destinationName: 'Universidad Tecnológica de Panamá',
  departureHour: 17,
  departureMinute: 0,
  deadlineHour: 18,
  deadlineMinute: 0,
  neuronCount: 166_000,
} as const

export const SIMULATION_TIMING = {
  slow: { label: 'Lento', millisecondsPerMinute: 2000 },
  normal: { label: 'Normal', millisecondsPerMinute: 1000 },
  fast: { label: 'Rápido', millisecondsPerMinute: 500 },
} as const

export type PlaybackSpeed = keyof typeof SIMULATION_TIMING

export const SIMULATION_LIMITS = {
  minimumSegmentMinutes: 1,
  maximumEventDelayMinutes: 15,
  classDeadlineMinute: 60,
} as const
