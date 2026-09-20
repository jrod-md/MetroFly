export const normalizeSeed = (seed: number): number => {
  if (!Number.isFinite(seed)) return 1
  const normalized = Math.trunc(Math.abs(seed)) % 2_147_483_647
  return normalized === 0 ? 1 : normalized
}

export const createRandom = (initialSeed: number): (() => number) => {
  let state = normalizeSeed(initialSeed)
  return () => {
    state = (state * 16_807) % 2_147_483_647
    return (state - 1) / 2_147_483_646
  }
}

export const randomInteger = (random: () => number, min: number, max: number): number =>
  Math.round(min + random() * (max - min))

export const pick = <T>(random: () => number, values: readonly T[]): T =>
  values[Math.floor(random() * values.length)] ?? values[0]
