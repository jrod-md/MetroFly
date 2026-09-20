import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'

// Reuse Vite's existing esbuild dependency; no test framework or browser dependency.
const output = await build({ entryPoints: ['tests/index.ts'], bundle: true, platform: 'node', format: 'cjs', write: false })
const result = spawnSync(process.execPath, ['--input-type=commonjs'], { input: output.outputFiles[0].text, encoding: 'utf8' })
process.stdout.write(result.stdout ?? '')
process.stderr.write(result.stderr ?? '')
if (result.error) throw result.error
process.exitCode = result.status ?? 1
