import { EVENT_DEFINITIONS } from '../data/events'
import { resolveContinuation } from '../data/continuations'
import { SIMULATION_LIMITS } from '../data/scenarios'
import type { MoodSnapshot, SegmentRun, SimulationEvent, SimulationPlan, SimulationResult, SimulationState } from '../types/simulation'
import type { RouteSegment, TransitRoute } from '../types/transit'
import { addMinutes, getDepartureTime } from '../utils/time'
import { calculateNarrativeSuffering } from './mood'
import { createRandom, normalizeSeed, pick, randomInteger } from './random'

const makeEvent = (type: SimulationEvent['type'], atMinute: number, random: () => number, suffix = ''): SimulationEvent => {
  const definition = EVENT_DEFINITIONS[type]
  return {
    id: `${type}-${atMinute}-${Math.floor(random() * 10_000)}`,
    type,
    atMinute,
    message: `${pick(random, definition.messages)}${suffix}`,
    tone: definition.tone,
  }
}

const getVariance = (segment: RouteSegment, random: () => number): number =>
  randomInteger(random, -Math.floor(segment.variabilityMinutes * 0.35), segment.variabilityMinutes)

const getIncidentalDelay = (segment: RouteSegment, random: () => number): { minutes: number; type: SimulationEvent['type'] | null } => {
  if (segment.delay && random() < segment.delay.probability) {
    return { minutes: randomInteger(random, ...segment.delay.range), type: segment.delay.event }
  }
  return { minutes: 0, type: null }
}

const getSegmentStartEvent = (segment: RouteSegment): SimulationEvent['type'] => {
  if (segment.type === 'walk') return 'WALKING'
  if (segment.type === 'transfer') return 'TRANSFER_STARTED'
  if (segment.type === 'metro') return 'METRO_ARRIVED'
  return segment.type === 'bus' ? 'BUS_ARRIVED' : 'WAIT_STARTED'
}

export const createSimulationPlan = (route: TransitRoute, seed: number): SimulationPlan => {
  seed = normalizeSeed(seed)
  const random = createRandom(seed)
  let cursor = 0
  const events: SimulationEvent[] = [makeEvent('EXPERIMENT_STARTED', 0, random)]
  // Sample after event initialization: the LCG's first draw correlates with small seeds.
  route = resolveContinuation(route, route.id === 'pirata' ? random() : 0)
  const segmentRuns: SegmentRun[] = route.segments.map((segment) => {
    const startMinute = cursor
    const incidental = getIncidentalDelay(segment, random)
    const range = segment.durationRange
    const sampledMinutes = range
      ? Math.round(range[0] + (random() ** (segment.lowBiased ? 2 : 1)) * (range[1] - range[0]))
      : segment.baseMinutes + getVariance(segment, random)
    const durationMinutes = Math.max(segment.type === 'wait' ? 0 : SIMULATION_LIMITS.minimumSegmentMinutes, sampledMinutes + incidental.minutes)
    if (durationMinutes > 0) events.push(makeEvent(getSegmentStartEvent(segment), startMinute, random, ` ${segment.narrative}`))
    if (segment.bottleneck) events.push(makeEvent('FINAL_STRETCH', startMinute, random))
    if (segment.continuationNotice) events.push(makeEvent('CONTINUATION_SELECTED', startMinute, random, ` ${segment.continuationNotice}`))
    if (segment.type === 'wait' && durationMinutes >= 15 && random() < 0.52) {
      events.push(makeEvent('BUS_WRONG_ROUTE', startMinute + Math.min(6, Math.floor(durationMinutes / 2)), random))
    }
    if (incidental.type) {
      events.push(makeEvent(incidental.type, startMinute + Math.max(1, Math.floor(durationMinutes * 0.44)), random))
    }
    cursor += durationMinutes
    if (segment.from !== segment.to && segment.to === 'zona-paga-5m') events.push(makeEvent('ARRIVED_5_DE_MAYO', cursor, random))
    if (segment.from !== segment.to && segment.to === 'cinquentenario') events.push(makeEvent('ARRIVED_CINCUENTENARIO', cursor, random))
    return { segment, startMinute, durationMinutes, endMinute: cursor }
  })

  if (cursor > SIMULATION_LIMITS.classDeadlineMinute) {
    events.push(makeEvent('CLASS_STARTED', SIMULATION_LIMITS.classDeadlineMinute, random))
  }
  events.push(makeEvent('ARRIVED_UTP', cursor, random))
  events.sort((a, b) => a.atMinute - b.atMinute)

  return {
    id: `${route.id}-${seed}-${Date.now()}`,
    route,
    seed,
    segmentRuns,
    events,
    totalMinutes: cursor,
  }
}

export const getSimulationState = (plan: SimulationPlan, requestedMinute: number): SimulationState => {
  const elapsedMinutes = Math.min(Math.max(0, requestedMinute), plan.totalMinutes)
  const activeRun = plan.segmentRuns.find((run) => elapsedMinutes >= run.startMinute && elapsedMinutes < run.endMinute) ?? null
  const completedRuns = plan.segmentRuns.filter((run) => run.endMinute <= elapsedMinutes)
  const partialMinutes = activeRun ? elapsedMinutes - activeRun.startMinute : 0
  const sumByType = (types: RouteSegment['type'][]): number =>
    completedRuns.filter((run) => types.includes(run.segment.type)).reduce((total, run) => total + run.durationMinutes, 0) +
    (activeRun && types.includes(activeRun.segment.type) ? partialMinutes : 0)
  const finished = elapsedMinutes >= plan.totalMinutes

  return {
    currentTime: addMinutes(getDepartureTime(), elapsedMinutes),
    elapsedMinutes,
    currentLocation: activeRun?.segment.from ?? plan.segmentRuns.at(-1)?.segment.to ?? 'utp',
    currentSegment: activeRun,
    currentSegmentType: activeRun?.segment.type ?? null,
    progress: activeRun ? partialMinutes / activeRun.durationMinutes : 1,
    waitingMinutes: sumByType(['wait']),
    travelMinutes: sumByType(['bus', 'metro']),
    walkingMinutes: sumByType(['walk', 'transfer']),
    transfers: completedRuns.filter((run) => run.segment.type === 'transfer' || run.segment.completesTransfer).length,
    events: plan.events.filter((event) => event.atMinute <= elapsedMinutes),
    finished,
    arrivalTime: finished ? addMinutes(getDepartureTime(), plan.totalMinutes) : null,
    lateMinutes: Math.max(0, elapsedMinutes - SIMULATION_LIMITS.classDeadlineMinute),
    classStarted: elapsedMinutes >= SIMULATION_LIMITS.classDeadlineMinute,
  }
}

export const createSimulationResult = (plan: SimulationPlan, moodHistory: MoodSnapshot[]): SimulationResult => {
  const finalState = getSimulationState(plan, plan.totalMinutes)
  const finalMood = moodHistory.at(-1)
  if (!finalState.arrivalTime || !finalMood) throw new Error('Simulation result requested before data was complete.')
  return {
    id: plan.id,
    routeId: plan.route.id,
    routeName: plan.route.name,
    continuation: plan.route.continuation,
    seed: plan.seed,
    totalMinutes: plan.totalMinutes,
    arrivalTime: finalState.arrivalTime,
    lateMinutes: Math.max(0, plan.totalMinutes - SIMULATION_LIMITS.classDeadlineMinute),
    waitingMinutes: finalState.waitingMinutes,
    travelMinutes: finalState.travelMinutes,
    walkingMinutes: finalState.walkingMinutes,
    transfers: finalState.transfers,
    peakAnxiety: Math.max(...moodHistory.map((snapshot) => snapshot.anxiety)),
    finalRegret: finalMood.regret,
    narrativeSuffering: calculateNarrativeSuffering(finalMood, finalState.lateMinutes),
  }
}
