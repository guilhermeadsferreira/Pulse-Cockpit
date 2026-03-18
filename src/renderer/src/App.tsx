import { useEffect } from 'react'
import { RouterProvider, useRouter } from './router'
import { Layout } from './components/Layout'
import { DashboardView }  from './views/DashboardView'
import { PersonView }     from './views/PersonView'
import { PersonFormView } from './views/PersonFormView'
import { SettingsView }   from './views/SettingsView'
import { InboxView }      from './views/InboxView'

function AppContent() {
  const { view } = useRouter()

  const content = {
    'dashboard':    <DashboardView />,
    'person':       <PersonView />,
    'person-form':  <PersonFormView />,
    'settings':     <SettingsView />,
    'inbox':        <InboxView />,
    'cycle-report': <PlaceholderView title="Relatório de Ciclo" fase="Fase 3" />,
  }[view] ?? <DashboardView />

  return <Layout>{content}</Layout>
}

function PlaceholderView({ title, fase }: { title: string; fase: string }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: 26, fontWeight: 400,
        color: 'var(--text-secondary)', marginBottom: 8,
      }}>
        {title}
      </div>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        padding: '3px 8px', borderRadius: 20,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}>
        {fase}
      </span>
    </div>
  )
}

export function App() {
  // Prevent Electron from navigating when a file is dropped outside the drop zone
  useEffect(() => {
    function prevent(e: DragEvent) { e.preventDefault() }
    document.addEventListener('dragover', prevent)
    document.addEventListener('drop', prevent)
    return () => {
      document.removeEventListener('dragover', prevent)
      document.removeEventListener('drop', prevent)
    }
  }, [])

  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  )
}
