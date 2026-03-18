import { Grid2X2, Inbox, FileText, Settings } from 'lucide-react'
import { useRouter, type ViewName } from '../router'

interface NavItem {
  id: ViewName
  label: string
  icon: React.ReactNode
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Time',               icon: <Grid2X2 size={15} /> },
  { id: 'inbox',        label: 'Inbox',              icon: <Inbox size={15} /> },
]

const NAV_REPORTS: NavItem[] = [
  { id: 'cycle-report', label: 'Relatório de Ciclo', icon: <FileText size={15} /> },
]

const NAV_SYSTEM: NavItem[] = [
  { id: 'settings',     label: 'Settings',           icon: <Settings size={15} /> },
]

export function Sidebar() {
  const { view, navigate } = useRouter()

  return (
    <nav style={{
      width: 224,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'fixed',
      top: 0, left: 0,
      height: '100vh',
      zIndex: 100,
    }}>
      {/* Traffic light spacer — macOS window controls live here */}
      <div className="drag-region" style={{ height: 44, flexShrink: 0 }} />

      {/* Logo */}
      <div style={{
        padding: '0 20px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          MgrCockpit
        </span>
        <span style={{
          width: 5, height: 5,
          borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 8px var(--accent)',
          flexShrink: 0,
          marginBottom: 2,
        }} />
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => (
          <NavBtn key={item.id} item={item} active={view === item.id} onClick={() => navigate(item.id)} />
        ))}

        <SectionLabel>Relatórios</SectionLabel>
        {NAV_REPORTS.map((item) => (
          <NavBtn key={item.id} item={item} active={view === item.id} onClick={() => navigate(item.id)} />
        ))}

        <SectionLabel>Sistema</SectionLabel>
        {NAV_SYSTEM.map((item) => (
          <NavBtn key={item.id} item={item} active={view === item.id} onClick={() => navigate(item.id)} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 10px', borderRadius: 6, cursor: 'default',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--surface-3)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
          }}>
            GA
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Guilherme Augusto</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Gerente de Engenharia</div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavBtn({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 10px', borderRadius: 6,
        background: active ? 'var(--surface-3)' : 'transparent',
        border: active ? '1px solid var(--border)' : '1px solid transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: 13.5, fontWeight: active ? 500 : 400,
        fontFamily: 'Inter, -apple-system, sans-serif',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)' }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >
      <span style={{ opacity: active ? 1 : 0.65, display: 'flex', alignItems: 'center' }}>
        {item.icon}
      </span>
      {item.label}
      {item.badge !== undefined && (
        <span style={{
          marginLeft: 'auto',
          background: 'rgba(184,64,64,0.12)',
          border: '1px solid rgba(184,64,64,0.25)',
          color: 'var(--red)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10, padding: '1px 6px', borderRadius: 20,
        }}>
          {item.badge}
        </span>
      )}
    </button>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--text-muted)',
      padding: '10px 10px 4px', marginTop: 4,
    }}>
      {children}
    </div>
  )
}
