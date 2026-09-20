import type { EventTone, EventType } from '../types/simulation'

export interface EventDefinition {
  type: EventType
  tone: EventTone
  messages: string[]
  delayRange?: readonly [number, number]
}

export const EVENT_DEFINITIONS: Record<EventType, EventDefinition> = {
  CONTINUATION_SELECTED: { type: 'CONTINUATION_SELECTED', tone: 'warning', messages: ['La continuación se resuelve sobre la marcha.'] },
  WAIT_STARTED: { type: 'WAIT_STARTED', tone: 'neutral', messages: ['En espera del próximo bus.'] },
  FINAL_STRETCH: { type: 'FINAL_STRETCH', tone: 'warning', messages: ['Ricardo J. Alfaro: empieza el tramo más lento e impredecible.'] },
  EXPERIMENT_STARTED: { type: 'EXPERIMENT_STARTED', tone: 'neutral', messages: ['Salimos del trabajo. Hay una hora para llegar a clase.'] },
  BUS_WRONG_ROUTE: { type: 'BUS_WRONG_ROUTE', tone: 'warning', messages: ['Pasó un bus. No era el nuestro.', 'Ese bus no sirve para este recorrido.'], delayRange: [1, 3] },
  BUS_ARRIVED: { type: 'BUS_ARRIVED', tone: 'positive', messages: ['Llegó el bus.', 'A bordo. Seguimos.'] },
  STILL_WAITING: { type: 'STILL_WAITING', tone: 'warning', messages: ['Still waiting.', 'El bus todavía no pasa.'], delayRange: [3, 8] },
  HEAVY_TRAFFIC: { type: 'HEAVY_TRAFFIC', tone: 'critical', messages: ['Tranque. The connectome cannot make the bus arrive faster.', 'El tráfico apenas avanza. El reloj sí.'], delayRange: [5, 15] },
  TRANSFER_STARTED: { type: 'TRANSFER_STARTED', tone: 'neutral', messages: ['Hora de hacer la conexión.'] },
  TRANSFER_MISSED: { type: 'TRANSFER_MISSED', tone: 'critical', messages: ['Se perdió la conexión. Toca esperar el siguiente.'], delayRange: [4, 9] },
  METRO_ARRIVED: { type: 'METRO_ARRIVED', tone: 'positive', messages: ['Llegó el Metro.'] },
  WALKING: { type: 'WALKING', tone: 'neutral', messages: ['A pie.'] },
  ARRIVED_CINCUENTENARIO: { type: 'ARRIVED_CINCUENTENARIO', tone: 'neutral', messages: ['Llegamos a Cincuentenario. Falta cruzar y conectar.'] },
  ARRIVED_5_DE_MAYO: { type: 'ARRIVED_5_DE_MAYO', tone: 'neutral', messages: ['Llegamos a 5 de Mayo. Hasta aquí, sin mayor complicación.'] },
  CLASS_STARTED: { type: 'CLASS_STARTED', tone: 'critical', messages: ['Class has started.', 'Son las 18:00. La clase ya empezó.'] },
  ARRIVED_UTP: { type: 'ARRIVED_UTP', tone: 'positive', messages: ['Llegamos a la UTP. MF-01: still operational.'] },
}
