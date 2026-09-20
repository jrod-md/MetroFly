import type { SimulationResult } from '../types/simulation'
import { formatClock } from '../utils/time'

interface ComparisonScreenProps {
  results: SimulationResult[]
  onBack: () => void
  onNewRun: () => void
}

const COLUMNS: { key: keyof SimulationResult; label: string; render?: (result: SimulationResult) => string }[] = [
  { key: 'totalMinutes', label: 'Total', render: (result) => `${result.totalMinutes} min` },
  { key: 'arrivalTime', label: 'Llegada', render: (result) => formatClock(result.arrivalTime) },
  { key: 'lateMinutes', label: 'Retraso', render: (result) => `${result.lateMinutes} min` },
  { key: 'waitingMinutes', label: 'Espera', render: (result) => `${result.waitingMinutes} min` },
  { key: 'transfers', label: 'Conexiones' },
  { key: 'peakAnxiety', label: 'Ansiedad máx.' },
  { key: 'finalRegret', label: 'Arrepentimiento' },
  { key: 'narrativeSuffering', label: 'Sufrimiento' },
]

export function ComparisonScreen({ results, onBack, onNewRun }: ComparisonScreenProps) {
  return (
    <main className="comparison page-shell">
      <header className="topbar"><button type="button" className="text-button" onClick={onBack}>← ÚLTIMO RESULTADO</button><span>VIAJES DE ESTA SESIÓN</span></header>
      <section className="comparison__header reveal reveal--1">
        <p className="eyebrow">Simulaciones completadas</p>
        <h1>Viajes realizados,<br />uno al lado del otro.</h1>
        <p>Cada fila corresponde a una simulación completada. Solo aparecen los recorridos que ya probaste.</p>
      </section>
      {results.length === 0 ? (
        <div className="empty-state"><span>TODAVÍA NO HAY VIAJES</span><p>Completa un viaje para empezar a comparar.</p></div>
      ) : (
        <div className="comparison-table-wrap reveal reveal--2">
          <table className="comparison-table">
            <thead><tr><th>Viaje / ruta</th>{COLUMNS.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={result.id}>
                  <th><span>0{index + 1}</span>{result.routeName}<small>semilla {result.seed}{result.continuation ? ` · ${result.continuation}` : ''}</small></th>
                  {COLUMNS.map((column) => <td key={column.key}>{column.render ? column.render(result) : String(result[column.key])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="comparison__actions"><button className="button button--primary" type="button" onClick={onNewRun}>PROBAR OTRA RUTA</button></div>
    </main>
  )
}
