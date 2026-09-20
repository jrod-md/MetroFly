import type { EventTone, EventType } from '../types/simulation'

export interface EventDefinition {
  type: EventType
  tone: EventTone
  messageKey: EventType
  delayRange?: readonly [number, number]
}

export const EVENT_DEFINITIONS: Record<EventType, EventDefinition> = {
  CONTINUATION_SELECTED: { type: 'CONTINUATION_SELECTED', tone: 'warning', messageKey: 'CONTINUATION_SELECTED' }, WAIT_STARTED: { type: 'WAIT_STARTED', tone: 'neutral', messageKey: 'WAIT_STARTED' }, FINAL_STRETCH: { type: 'FINAL_STRETCH', tone: 'warning', messageKey: 'FINAL_STRETCH' }, EXPERIMENT_STARTED: { type: 'EXPERIMENT_STARTED', tone: 'neutral', messageKey: 'EXPERIMENT_STARTED' }, BUS_WRONG_ROUTE: { type: 'BUS_WRONG_ROUTE', tone: 'warning', messageKey: 'BUS_WRONG_ROUTE', delayRange: [1, 3] }, BUS_ARRIVED: { type: 'BUS_ARRIVED', tone: 'positive', messageKey: 'BUS_ARRIVED' }, STILL_WAITING: { type: 'STILL_WAITING', tone: 'warning', messageKey: 'STILL_WAITING', delayRange: [3, 8] }, HEAVY_TRAFFIC: { type: 'HEAVY_TRAFFIC', tone: 'critical', messageKey: 'HEAVY_TRAFFIC', delayRange: [5, 15] }, TRANSFER_STARTED: { type: 'TRANSFER_STARTED', tone: 'neutral', messageKey: 'TRANSFER_STARTED' }, TRANSFER_MISSED: { type: 'TRANSFER_MISSED', tone: 'critical', messageKey: 'TRANSFER_MISSED', delayRange: [4, 9] }, METRO_ARRIVED: { type: 'METRO_ARRIVED', tone: 'positive', messageKey: 'METRO_ARRIVED' }, WALKING: { type: 'WALKING', tone: 'neutral', messageKey: 'WALKING' }, ARRIVED_CINCUENTENARIO: { type: 'ARRIVED_CINCUENTENARIO', tone: 'neutral', messageKey: 'ARRIVED_CINCUENTENARIO' }, ARRIVED_5_DE_MAYO: { type: 'ARRIVED_5_DE_MAYO', tone: 'neutral', messageKey: 'ARRIVED_5_DE_MAYO' }, CLASS_STARTED: { type: 'CLASS_STARTED', tone: 'critical', messageKey: 'CLASS_STARTED' }, ARRIVED_UTP: { type: 'ARRIVED_UTP', tone: 'positive', messageKey: 'ARRIVED_UTP' },
}
