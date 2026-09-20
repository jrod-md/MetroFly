import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { DEMO_NEURAL_GRAPH } from '../src/data/neural'
import { chooseGraph, layoutGraph, validateRealGraph } from '../src/neural/graph'
import { buildNeuralHistory, NEURAL_PARAMETERS, transitStimulus } from '../src/neural/activity'
import { validateSkeletonData } from '../src/neural/skeletonValidation'
import { SKELETON_COLORS, shouldAutoRotate } from '../src/neural/skeletonVisual'
import { inspectSelectedNeuron, nextReportRotation } from '../src/neural/reportInspection'
import { createSimulationPlan } from '../src/simulation/engine'
import { getRoute } from '../src/data/routes'
import { buildMoodHistory } from '../src/simulation/mood'
import type { SimulationEvent, EventType } from '../src/types/simulation'
import type { NeuralGraphData } from '../src/types/neural'

const event = (type: EventType, atMinute: number): SimulationEvent => ({ id: `${type}-${atMinute}`, type, atMinute, tone: 'neutral', message: 'Test fixture, not biological data' })

test('Committed MaleCNS artifact retains 95 real identities and 253 directed connections', () => {
  const raw = readFileSync('src/data/generated/malecns_visual_motor.json', 'utf8')
  const { graph, notice } = chooseGraph(raw, DEMO_NEURAL_GRAPH)
  assert.equal(notice, null)
  assert.equal(graph.metadata.realConnectivity, true)
  assert.equal(graph.metadata.dataset, 'male-cns:v1.0')
  assert.equal(graph.nodes.length, 95)
  assert.equal(graph.edges.length, 253)
  for (const id of ['cinco-de-mayo', 'e665', 'pirata'] as const) {
    const plan = createSimulationPlan(getRoute(id), 42)
    const history = buildNeuralHistory(graph, plan.events, plan.totalMinutes)
    assert.equal(history.length, plan.totalMinutes + 1)
    assert.ok(history.every(frame => Object.values(frame.values).every(value => Number.isFinite(value) && value >= 0 && value <= 1)))
    assert.ok(history.some(frame => Object.values(frame.values).some(value => value >= 0.1)))
  }
})

test('Real skeleton loader validates the static official morphology asset and has a safe missing-parent rejection', () => {
  const raw = JSON.parse(readFileSync('src/data/generated/malecns_skeletons.json', 'utf8'))
  const skeletons = validateSkeletonData(raw)
  assert.equal(skeletons.metadata.dataset, 'male-cns:v1.0')
  assert.equal(skeletons.metadata.requestedNeuronCount, 95)
  assert.equal(skeletons.metadata.availableNeuronCount, 95)
  assert.ok(skeletons.metadata.originalPointCount > skeletons.metadata.simplifiedPointCount)
  assert.ok(skeletons.neurons.every(neuron => neuron.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z))))
  const malformed = structuredClone(raw)
  malformed.neurons[0].points.find((point: { parent: number }) => point.parent !== -1).parent = 999999999
  assert.throws(() => validateSkeletonData(malformed), /parent/i)
})

test('Skeleton color semantics and rotation respect simulated pause and reduced motion', () => {
  assert.deepEqual(SKELETON_COLORS.visual, [243, 107, 33])
  assert.deepEqual(SKELETON_COLORS.descending, [105, 198, 217])
  assert.equal(shouldAutoRotate(false, false, false), true)
  assert.equal(shouldAutoRotate(true, false, false), false)
  assert.equal(shouldAutoRotate(false, true, false), false)
  assert.equal(shouldAutoRotate(false, false, true), false)
})

test('Report inspector starts quiet, maps verified selected metadata, clears, and pauses view rotation', () => {
  const skeletons = validateSkeletonData(JSON.parse(readFileSync('src/data/generated/malecns_skeletons.json', 'utf8')))
  const graph = chooseGraph(readFileSync('src/data/generated/malecns_visual_motor.json', 'utf8'), DEMO_NEURAL_GRAPH).graph
  assert.equal(inspectSelectedNeuron(skeletons, graph, null), null)
  const neuron = skeletons.neurons.find(item => item.bodyId === 10005) ?? skeletons.neurons[0]
  const inspected = inspectSelectedNeuron(skeletons, graph, neuron.bodyId)
  assert.ok(inspected)
  assert.equal(inspected.bodyId, neuron.bodyId)
  assert.equal(inspected.type, neuron.type)
  assert.equal(inspected.instance, neuron.instance)
  assert.equal(inspected.originalPointCount, neuron.originalPointCount)
  assert.equal(inspected.simplifiedPointCount, neuron.simplifiedPointCount)
  assert.equal(nextReportRotation(true, 'select'), false)
  assert.equal(nextReportRotation(false, 'select'), false)
  assert.equal(nextReportRotation(false, 'toggle'), true)
  assert.equal(nextReportRotation(true, 'toggle'), false)
  assert.equal(nextReportRotation(false, 'clear'), false)
  assert.equal(inspectSelectedNeuron(skeletons, graph, null), null)
  const reportSource = readFileSync('src/components/BrainReport.tsx', 'utf8')
  assert.doesNotMatch(reportSource, /Selected morphology/)
})
// Synthetic schema fixture ONLY. Never bundled or written as a MaleCNS extract.
function schemaFixture(): NeuralGraphData {
  return {
    metadata: { dataset: 'male-cns:v1.0', source: 'HHMI Janelia FlyEM', license: 'CC-BY-4.0', realConnectivity: true, extractedAt: '2026-09-19T00:00:00Z', description: 'Synthetic schema test only', nodeCount: 2, edgeCount: 1, methodology: { fixture: true }, verification: { bodyIds: true, edges: true, weights: true } },
    nodes: [1, 2].map(bodyId => ({ id: String(bodyId), bodyId, type: null, instance: null, side: null, annotations: {}, category: bodyId === 1 ? 'visual' : 'descending', categoryBasis: 'path-role' })),
    edges: [{ source: '1', target: '2', weight: 10 }],
  }
}

test('Static loader: missing/invalid extracts clearly fall back; valid schema loads', () => {
  assert.equal(chooseGraph(undefined, DEMO_NEURAL_GRAPH).graph.metadata.realConnectivity, false)
  for (const raw of ['null', '{}', '{invalid', JSON.stringify(DEMO_NEURAL_GRAPH)]) {
    const result = chooseGraph(raw, DEMO_NEURAL_GRAPH)
    assert.equal(result.graph, DEMO_NEURAL_GRAPH)
    assert.match(result.notice!, /validación/)
  }
  const valid = chooseGraph(JSON.stringify(schemaFixture()), DEMO_NEURAL_GRAPH)
  assert.equal(valid.notice, null)
  assert.equal(valid.graph.nodes[0].bodyId, 1)
})

test('Real graph guard rejects duplicates, missing nodes, weights, metadata and oversized extracts', () => {
  const mutations: ((graph: NeuralGraphData) => void)[] = [
    graph => { graph.nodes[1] = graph.nodes[0] },
    graph => { graph.edges[0].target = 'absent' },
    graph => { graph.edges[0].weight = -1 },
    graph => { graph.edges[0].weight = 1.2 },
    graph => { graph.metadata.dataset = 'different' },
    graph => { graph.metadata.verification!.weights = false },
    graph => { graph.metadata.nodeCount = 80 },
    graph => { graph.nodes[0].bodyId = Number.MAX_SAFE_INTEGER + 1 },
    graph => { graph.edges.push(graph.edges[0]); graph.metadata.edgeCount++ },
    graph => { graph.nodes = Array(201).fill(graph.nodes[0]); graph.metadata.nodeCount = 201 },
  ]
  for (const mutate of mutations) { const graph = schemaFixture(); mutate(graph); assert.throws(() => validateRealGraph(graph)) }
})

test('Directed propagation arrives later downstream, stays bounded and decays to baseline', () => {
  const graph = schemaFixture()
  const frames = buildNeuralHistory(graph, [event('BUS_ARRIVED', 1)], 80)
  assert.ok(frames[1].values['1'] > 0.5)
  assert.ok(Math.abs(frames[1].values['2'] - NEURAL_PARAMETERS.baseline) < 1e-10)
  assert.ok(frames[2].values['2'] > frames[1].values['2'])
  assert.ok(frames[80].values['2'] < 0.021)
  for (const frame of frames) for (const value of Object.values(frame.values)) assert.ok(value >= 0 && value <= 1)
  const scaled = structuredClone(graph); scaled.edges[0].weight *= 10000
  assert.deepEqual(buildNeuralHistory(scaled, [event('BUS_ARRIVED', 1)], 80), frames)
})

test('Only transit stimuli drive activity; waiting and narrative events do not inject emotion', () => {
  assert.ok(transitStimulus([event('BUS_WRONG_ROUTE', 1)], 1).visual > 0)
  assert.ok(transitStimulus([event('WALKING', 1)], 1).motor > 0)
  const transfer = transitStimulus([event('TRANSFER_STARTED', 1)], 1)
  assert.ok(transfer.motor > 0 && transfer.visual > 0)
  const traffic = [event('HEAVY_TRAFFIC', 2)]
  assert.ok(transitStimulus(traffic, 2).visual > 0)
  assert.equal(transitStimulus(traffic, 3).visual, 0)
  assert.ok(transitStimulus(traffic, 4).visual > 0)
  assert.equal(transitStimulus(traffic, 8).visual, 0)
  for (const type of ['STILL_WAITING', 'CLASS_STARTED', 'TRANSFER_MISSED'] as const) {
    assert.equal(transitStimulus([event(type, 1)], 1).visual, 0)
    assert.equal(transitStimulus([event(type, 1)], 1).motor, 0)
  }
})

test('Neural history is replayable, mutation-free, and independent of Fly Mood on actual transit plans', () => {
  const plan = createSimulationPlan(getRoute('cinco-de-mayo'), 4242)
  const before = JSON.stringify({ plan, graph: DEMO_NEURAL_GRAPH })
  const moods = buildMoodHistory(plan)
  const frames = buildNeuralHistory(DEMO_NEURAL_GRAPH, plan.events, plan.totalMinutes)
  assert.deepEqual(buildNeuralHistory(DEMO_NEURAL_GRAPH, plan.events, plan.totalMinutes), frames)
  assert.deepEqual(buildMoodHistory(plan), moods)
  assert.equal(JSON.stringify({ plan, graph: DEMO_NEURAL_GRAPH }), before)
  assert.ok(frames.some(frame => frame.categories.visual > 30))
  assert.ok(frames.some(frame => frame.categories.central > 5))
  // Selecting a recorded minute is all pause/restart does: no neural timer to drift.
  assert.deepEqual(frames[10], buildNeuralHistory(DEMO_NEURAL_GRAPH, plan.events, 10)[10])
})

test('A 200-node synthetic stress fixture stays within layout and numerical bounds', () => {
  const graph = schemaFixture()
  graph.nodes = Array.from({ length: 200 }, (_, index) => ({ ...graph.nodes[0], id: String(index + 1), bodyId: index + 1, category: index === 0 ? 'visual' : 'central' }))
  graph.edges = Array.from({ length: 199 }, (_, index) => ({ source: String(index + 1), target: String(index + 2), weight: 100 }))
  const layout = layoutGraph(graph)
  for (const point of layout.values()) { assert.ok(point.x > 0 && point.x < 800); assert.ok(point.y > 35 && point.y < 315) }
  const frames = buildNeuralHistory(graph, [event('BUS_ARRIVED', 0)], 240)
  assert.equal(frames.length, 241)
  assert.ok(frames.every(frame => Object.values(frame.values).every(value => Number.isFinite(value) && value >= 0 && value <= 1)))
})
