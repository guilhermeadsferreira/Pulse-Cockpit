import { useState } from 'react'
import { MyDemandsView } from './MyDemandsView'
import { MyCycleView }   from './MyCycleView'

type Tab = 'demandas' | 'ciclo'

export function EuView() {
  const [tab, setTab] = useState<Tab>('demandas')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page header */}
      <div style={{
        padding: '28px 40px 0',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4,
        }}>
          Módulo Eu
        </div>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: 'var(--text-primary)',
          margin: 0, letterSpacing: '-0.02em',
        }}>
          Eu
        </h1>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, marginTop: 20 }}>
          <TabBtn label="Minhas Demandas" active={tab === 'demandas'} onClick={() => setTab('demandas')} />
          <TabBtn label="Meu Ciclo"       active={tab === 'ciclo'}    onClick={() => setTab('ciclo')} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 40px' }}>
        {tab === 'demandas' ? <MyDemandsView /> : <MyCycleView />}
      </div>
    </div>
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        cursor: 'pointer', fontFamily: 'var(--font)',
        transition: 'color 0.12s, border-color 0.12s',
        marginBottom: -1,
      }}
    >
      {label}
    </button>
  )
}
