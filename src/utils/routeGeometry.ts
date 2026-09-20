import { getSegmentGeometry } from '../data/geo'
import type { RouteSegment } from '../types/transit'

type Coordinate = [number, number]
export const segmentPath = (segment: RouteSegment): Coordinate[] => getSegmentGeometry(segment)

export const positionOnPath = (path: Coordinate[], progress: number): { coordinate: Coordinate; traveled: Coordinate[] } => {
  const lengths = path.slice(1).map((point, index) => Math.hypot(point[0] - path[index][0], point[1] - path[index][1]))
  let remaining = Math.max(0, Math.min(1, progress)) * lengths.reduce((sum, length) => sum + length, 0)
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const fraction = lengths[i] === 0 ? 0 : remaining / lengths[i]
      const coordinate: Coordinate = [path[i][0] + (path[i + 1][0] - path[i][0]) * fraction, path[i][1] + (path[i + 1][1] - path[i][1]) * fraction]
      return { coordinate, traveled: [...path.slice(0, i + 1), coordinate] }
    }
    remaining -= lengths[i]
  }
  return { coordinate: path[0], traveled: path }
}
