import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ROUTES, getRoute } from '../src/data/routes'
import { getLocation } from '../src/data/geo'
import { createSimulationPlan, getSimulationState, createSimulationResult } from '../src/simulation/engine'
import { buildMoodHistory } from '../src/simulation/mood'
import { getSegmentGeometry, getRouteGeometry } from '../src/data/geo'
import { resolveContinuation } from '../src/data/continuations'
import { playbackReducer, type PlaybackState } from '../src/simulation/playback'
import { SIMULATION_TIMING } from '../src/data/scenarios'
import { positionOnPath } from '../src/utils/routeGeometry'

const route = getRoute('cinco-de-mayo')
const samples = Array.from({ length: 1000 }, (_, index) => createSimulationPlan(route, index * 7919 + 42))
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

test('5 de Mayo: short first wait, 20–30 minute bus, <=15 minute Metro connection; delays only in final bus', () => {
  for (const plan of samples) {
    const [walk, wait, bus, transfer, metro, shortWalk, lastWait, lastBus] = plan.segmentRuns
    assert.ok(wait.durationMinutes >= 0 && wait.durationMinutes <= 7)
    assert.ok(bus.durationMinutes >= 20 && bus.durationMinutes <= 30)
    assert.ok(transfer.durationMinutes + metro.durationMinutes <= 15)
    assert.ok(shortWalk.durationMinutes <= 5 && lastWait.durationMinutes <= 10)
    assert.ok(lastBus.durationMinutes >= 42 && lastBus.durationMinutes <= 93)
    assert.ok(lastBus.durationMinutes > Math.max(...plan.segmentRuns.filter(run => run !== lastBus).map((run) => run.durationMinutes)))
    assert.equal(plan.events.filter((event) => event.type === 'ARRIVED_5_DE_MAYO').length, 1)
    assert.ok(plan.events.filter((event) => ['HEAVY_TRAFFIC', 'STILL_WAITING', 'BUS_WRONG_ROUTE', 'TRANSFER_MISSED'].includes(event.type)).every((event) => event.atMinute >= lastBus.startMinute))
    assert.equal(getSimulationState(plan, plan.totalMinutes).transfers, route.transfers)
    assert.ok(walk.durationMinutes > 0)
  }
  const firstWait = samples.map((plan) => plan.segmentRuns[1].durationMinutes)
  assert.ok(firstWait.includes(0), 'Zero wait is reachable')
  assert.ok(mean(firstWait) < 3, 'Low-biased wait must remain low on average')
  const totalMean = mean(samples.map((plan) => plan.totalMinutes))
  assert.ok(totalMean >= 110 && totalMean <= 130, 'Two-hour reference is approximate, not fixed')
  console.log(JSON.stringify({ sampleSize: samples.length, meanFirstWait: mean(firstWait), meanTotal: totalMean, minTotal: Math.min(...samples.map(p => p.totalMinutes)), maxTotal: Math.max(...samples.map(p => p.totalMinutes)), meanFinalBus: mean(samples.map(p => p.segmentRuns[7].durationMinutes)) }))
})

test('Seed replay, zero-wait transitions, time accounting and preserved routes', () => {
  assert.equal(ROUTES.length, 3)
  for (const candidate of ROUTES) {
    const plan = createSimulationPlan(candidate, 4242)
    const replay = createSimulationPlan(candidate, 4242)
    assert.deepEqual(plan.segmentRuns, replay.segmentRuns)
    assert.deepEqual(plan.events, replay.events)
    for (const run of plan.segmentRuns) { assert.ok(getLocation(run.segment.from)); assert.ok(getLocation(run.segment.to)) }
    for (let minute = 0; minute <= plan.totalMinutes; minute++) {
      const state = getSimulationState(plan, minute)
      assert.equal(state.waitingMinutes + state.travelMinutes + state.walkingMinutes, minute)
      assert.ok(Number.isFinite(state.progress))
      assert.equal(state.finished, minute === plan.totalMinutes)
    }
    const result = createSimulationResult(plan, buildMoodHistory(plan))
    assert.equal(result.totalMinutes, result.waitingMinutes + result.travelMinutes + result.walkingMinutes)
  }
  const zeroWaitPlan = samples.find(p => p.segmentRuns[1].durationMinutes === 0)!
  assert.equal(getSimulationState(zeroWaitPlan, zeroWaitPlan.segmentRuns[1].startMinute).currentSegment?.segment.type, 'bus')
})

test('Narrative state is deterministic, independent of MaleCNS, persistent and bounded', () => {
  for (const seed of [42, 4242, 12345, 99999]) {
    const plan = createSimulationPlan(route, seed)
    const history = buildMoodHistory(plan)
    const lastBus = plan.segmentRuns.find(run => run.segment.bottleneck)!
    assert.ok(history[lastBus.startMinute].anxiety < 45, 'Early legs should retain optimism')
    assert.ok(history[plan.totalMinutes - 1].anxiety > history[lastBus.startMinute].anxiety + 12, 'Prolonged final conditions should raise narrative suffering')
    const firstBusStart = plan.segmentRuns[2].startMinute
    assert.ok(history[firstBusStart + 10].hope > 40, 'Successful early progress should retain feasible hope')
    assert.ok(history[60].resignation > history[59].resignation)
    for (const mood of history) for (const key of ['hope', 'anxiety', 'confusion', 'regret', 'relief', 'resignation'] as const) assert.ok(mood[key] >= 0 && mood[key] <= 100)
    for (const mood of history) for (const key of ['arousal', 'negativeValence', 'persistence', 'deadlinePressure'] as const) assert.ok(mood[key] >= 0 && mood[key] <= 1)
    assert.ok(history[60].deadlinePressure >= history[59].deadlinePressure)
    assert.ok(history[lastBus.startMinute + 1].persistence >= history[lastBus.startMinute].persistence - .02)
    assert.deepEqual(buildMoodHistory(plan), history, 'Narrative history is derived only from the deterministic commute plan')
  }
})

test('Pirata stays around ninety minutes; E665 has no claimed measured duration', () => {
  const durations = Array.from({ length: 1000 }, (_, i) => createSimulationPlan(getRoute('pirata'), i * 7919 + 42).totalMinutes)
  assert.ok(mean(durations) > 85 && mean(durations) < 105)
  assert.equal(getRoute('pirata').segments[1].from, 'informal-pickup')
  assert.equal(getRoute('e665').referenceDurationMinutes, null)
  assert.equal(getRoute('e665').uncertainty, 'unknown')
  console.log(JSON.stringify({ pirataMean: mean(durations) }))
})

test('Pirata: ~40 minute first bus and three real, deterministic continuations', () => {
  const labels = new Set<string>()
  const arrivalMinutes: number[] = []
  for (let seed = 1; seed <= 300; seed++) {
    const plan = createSimulationPlan(getRoute('pirata'), seed)
    const bus = plan.segmentRuns.find(run => run.segment.id === 'c-bus-1')!
    assert.ok(bus.durationMinutes >= 35 && bus.durationMinutes <= 45)
    arrivalMinutes.push(bus.endMinute)
    labels.add(plan.route.continuation!)
    assert.equal(plan.events.filter(event => event.type === 'CONTINUATION_SELECTED').length, 1)
    const replay = createSimulationPlan(getRoute('pirata'), seed)
    assert.deepEqual(plan.segmentRuns, replay.segmentRuns)
    assert.equal(plan.segmentRuns.at(-1)?.segment.to, 'utp')
    assert.equal(getSimulationState(plan, plan.totalMinutes).transfers, plan.route.transfers)
  }
  assert.equal(labels.size, 3)
  assert.ok(Math.max(...arrivalMinutes) >= 60, 'A near-six arrival in Cincuentenario must be possible')
  const options = [0.1, 0.6, 0.9].map(draw => resolveContinuation(getRoute('pirata'), draw))
  assert.ok(options[1].segments.some(segment => segment.id === 'c-interchange-wait'))
  assert.ok(options[2].segments.some(segment => segment.id === 'c-milan-walk'))
  assert.notDeepEqual(getRouteGeometry(options[0]), getRouteGeometry(options[1]))
  assert.notDeepEqual(getRouteGeometry(options[1]), getRouteGeometry(options[2]))
})

test('Playback: pause is inert, speeds are explicit, restart and final are stable', () => {
  let state: PlaybackState = { minute: 0, total: 3, speed: 'normal', mode: 'running' }
  state = playbackReducer(state, { type: 'tick' })
  assert.equal(state.minute, 1)
  state = playbackReducer(state, { type: 'toggle' })
  assert.equal(state.mode, 'paused')
  assert.deepEqual(playbackReducer(state, { type: 'tick' }), state)
  state = playbackReducer(state, { type: 'speed', speed: 'slow' })
  assert.equal(state.minute, 1)
  assert.equal(state.mode, 'paused')
  state = playbackReducer(state, { type: 'toggle' })
  state = playbackReducer(state, { type: 'tick' })
  state = playbackReducer(state, { type: 'tick' })
  assert.equal(state.mode, 'finished')
  assert.equal(state.minute, 3)
  assert.deepEqual(playbackReducer(state, { type: 'tick' }), state)
  assert.deepEqual(playbackReducer(state, { type: 'toggle' }), state)
  state = playbackReducer(state, { type: 'restart' })
  assert.equal(state.minute, 0)
  assert.equal(state.mode, 'running')
  assert.equal(state.speed, 'slow')
  assert.deepEqual(Object.values(SIMULATION_TIMING).map(speed => speed.millisecondsPerMinute), [2000, 1000, 500])
})

test('Geography: inland origin, separate terminal/Metro, connected legs and stable interpolation', () => {
  assert.ok(getLocation('work-costa-del-este').coordinates[0] < -79.46)
  assert.notDeepEqual(getLocation('zona-paga-5m').coordinates, getLocation('cinco-de-mayo').coordinates)
  for (const route of ROUTES) {
    for (const draw of [0.1, 0.6, 0.9]) {
      const resolved = resolveContinuation(route, draw)
      resolved.segments.forEach((segment, index) => {
        const path = getSegmentGeometry(segment)
        assert.deepEqual(path[0], getLocation(segment.from).coordinates)
        assert.deepEqual(path.at(-1), getLocation(segment.to).coordinates)
        if (index > 0) assert.equal(segment.from, resolved.segments[index - 1].to)
        if (segment.type === 'bus') assert.ok(path.length > 4)
        for (const coordinate of path) {
          assert.ok(coordinate[0] > -79.56 && coordinate[0] < -79.45)
          assert.ok(coordinate[1] > 8.95 && coordinate[1] < 9.05)
        }
        assert.deepEqual(positionOnPath(path, 0).coordinate, path[0])
        const end = positionOnPath(path, 1).coordinate
        assert.ok(Math.hypot(end[0] - path.at(-1)![0], end[1] - path.at(-1)![1]) < 1e-8)
      })
    }
  }
})
