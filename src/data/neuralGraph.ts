import { DEMO_NEURAL_GRAPH } from './neural'
import { chooseGraph } from '../neural/graph'

// Only this one static artifact can enter the bundle. No credentials or API calls.
const files = import.meta.glob('./generated/malecns_visual_motor.json', { eager: true, query: '?raw', import: 'default' })
export const NEURAL_DATA = chooseGraph(files['./generated/malecns_visual_motor.json'] as string | undefined, DEMO_NEURAL_GRAPH)
