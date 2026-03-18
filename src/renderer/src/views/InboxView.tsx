import { useState, useEffect, useCallback } from 'react'
import { Inbox, FolderOpen, CheckCircle2, XCircle, Loader2, Clock, RefreshCw, UserPlus, PauseCircle } from 'lucide-react'
import { useRouter } from '../router'
import type { QueueItem } from '../types/ipc'

export function InboxView() {
  const { navigate }            = useRouter()
  const [queue, setQueue]       = useState<QueueItem[]>([])
  const [isDragging, setDragging] = useState(false)
  const [workspacePath, setWorkspacePath] = useState<string>('')

  useEffect(() => {
    window.api.settings.load().then((s) => setWorkspacePath(s.workspacePath))
  }, [])

  const refreshQueue = useCallback(async () => {
    const q = await window.api.ingestion.getQueue()
    setQueue(q)
  }, [])

  useEffect(() => {
    refreshQueue()

    // Listen to ingestion events to refresh queue
    window.api.ingestion.onStarted(() => refreshQueue())
    window.api.ingestion.onCompleted(() => refreshQueue())
    window.api.ingestion.onFailed(() => refreshQueue())

    // Polling fallback: refresh every 3s while view is open
    const interval = setInterval(refreshQueue, 3_000)

    return () => {
      window.api.ingestion.removeListeners()
      clearInterval(interval)
    }
  }, [refreshQueue])

  function handleOpenInbox() {
    if (!workspacePath) return
    window.api.shell.open(workspacePath + '/inbox')
  }

  // Use native DOM events — React synthetic events don't reliably expose
  // the Electron-specific `file.path` property for files dragged from Finder.
  useEffect(() => {
    const zone = document.getElementById('inbox-drop-zone')
    if (!zone) return

    function onDragOver(e: DragEvent) {
      e.preventDefault()
      e.stopPropagation()
      setDragging(true)
    }
    function onDragLeave(e: DragEvent) {
      // Only set dragging=false when truly leaving the drop zone (not entering a child element)
      if (zone.contains(e.relatedTarget as Node)) return
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)
    }
    async function onDrop(e: DragEvent) {
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)

      const files = Array.from(e.dataTransfer?.files ?? [])
      console.log('[InboxView] drop event, files:', files.length)
      for (const file of files) {
        const filePath = window.api.getFilePath(file)
        console.log('[InboxView] file:', file.name, '| path:', filePath)
        const supported = /\.(md|txt|pdf)$/i.test(file.name)
        if (filePath && supported) {
          await window.api.ingestion.enqueue(filePath)
        }
      }
      await refreshQueue()
    }

    zone.addEventListener('dragover',  onDragOver)
    zone.addEventListener('dragleave', onDragLeave)
    zone.addEventListener('drop',      onDrop)

    return () => {
      zone.removeEventListener('dragover',  onDragOver)
      zone.removeEventListener('dragleave', onDragLeave)
      zone.removeEventListener('drop',      onDrop)
    }
  }, [refreshQueue])

  const processing = queue.filter((i) => i.status === 'queued' || i.status === 'processing')
  const pending    = queue.filter((i) => i.status === 'pending')
  const done       = queue.filter((i) => i.status === 'done')
  const errors     = queue.filter((i) => i.status === 'error')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '28px 40px 22px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <div style={styles.eyebrow}>Ingestão</div>
          <h1 style={styles.pageTitle}>Inbox</h1>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            Arraste artefatos ou coloque arquivos na pasta inbox para processar
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={refreshQueue} style={styles.btnSecondary}>
            <RefreshCw size={12} /> Atualizar
          </button>
          <button onClick={handleOpenInbox} style={styles.btnSecondary} disabled={!workspacePath}>
            <FolderOpen size={12} /> Abrir pasta inbox
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 40px' }}>
        <div style={{ maxWidth: 680 }}>

          {/* Drop zone */}
          <div
            id="inbox-drop-zone"
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: '36px 24px',
              textAlign: 'center',
              background: isDragging ? 'rgba(192, 135, 58, 0.05)' : 'var(--surface)',
              transition: 'all 0.18s ease',
              marginBottom: 28,
            }}
          >
            <div style={{ color: isDragging ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <Inbox size={28} />
            </div>
            <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', fontSize: 14, fontWeight: 500, color: isDragging ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: 4 }}>
              {isDragging ? 'Solte para processar' : 'Arraste arquivos aqui'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              .md · .txt · .pdf · Notas de 1:1, reuniões, dailies, planning, retro
            </div>
          </div>

          {/* Processing */}
          {processing.length > 0 && (
            <QueueSection title="Processando" count={processing.length}>
              {processing.map((item) => <QueueRow key={item.id} item={item} onRegister={(slug, nome) => navigate('person-form', { prefillSlug: slug, prefillNome: nome })} />)}
            </QueueSection>
          )}

          {/* Pending — waiting for person to be registered */}
          {pending.length > 0 && (
            <QueueSection title="Aguardando cadastro" count={pending.length}>
              {pending.map((item) => <QueueRow key={item.id} item={item} onRegister={(slug, nome) => navigate('person-form', { prefillSlug: slug, prefillNome: nome })} />)}
            </QueueSection>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <QueueSection title="Erros" count={errors.length}>
              {errors.map((item) => <QueueRow key={item.id} item={item} onRegister={(slug, nome) => navigate('person-form', { prefillSlug: slug, prefillNome: nome })} />)}
            </QueueSection>
          )}

          {/* Done */}
          {done.length > 0 && (
            <QueueSection title="Processados" count={done.length}>
              {done.map((item) => <QueueRow key={item.id} item={item} onRegister={(slug, nome) => navigate('person-form', { prefillSlug: slug, prefillNome: nome })} />)}
            </QueueSection>
          )}

          {queue.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Nenhum artefato processado ainda nesta sessão
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function QueueSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: 'var(--text-muted)', marginBottom: 10,
      }}>
        {title} <span style={{ opacity: 0.6 }}>({count})</span>
      </div>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 6, overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

function QueueRow({ item, onRegister }: { item: QueueItem; onRegister: (slug: string, nome: string) => void }) {
  const icon = {
    queued:     <Clock size={13} style={{ color: 'var(--text-muted)' }} />,
    processing: <Loader2 size={13} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />,
    done:       <CheckCircle2 size={13} style={{ color: 'var(--green)' }} />,
    pending:    <PauseCircle size={13} style={{ color: 'var(--yellow, #d4a843)' }} />,
    error:      <XCircle size={13} style={{ color: 'var(--red)' }} />,
  }[item.status]

  return (
    <div style={{
      padding: '11px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{ marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: item.summary || item.error ? 3 : 0 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.fileName}
          </span>
          {item.tipo && (
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              padding: '2px 6px', borderRadius: 20,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', whiteSpace: 'nowrap',
            }}>
              {item.tipo}
            </span>
          )}
          {item.personSlug && (
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
              → {item.personSlug}
            </span>
          )}
        </div>
        {item.summary && (
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {item.summary}
          </div>
        )}
        {item.error && (
          <div style={{ fontSize: 11.5, color: 'var(--red)', lineHeight: 1.5 }}>
            {item.error}
          </div>
        )}
        {/* People suggestions */}
        {item.naoCadastradas && item.naoCadastradas.length > 0 && (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Detectado, não cadastrado:</span>
            {item.naoCadastradas.map((slug) => {
              const nome = item.novasNomes?.[slug] || slug
              return (
                <button
                  key={slug}
                  onClick={() => onRegister(slug, nome)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: 'rgba(192,135,58,0.1)', border: '1px solid rgba(192,135,58,0.3)',
                    color: 'var(--accent)', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  <UserPlus size={9} /> {nome}
                </button>
              )
            })}
          </div>
        )}
        {/* Registered people */}
        {item.pessoasIdentificadas && item.pessoasIdentificadas.length > 0 &&
         item.naoCadastradas && item.naoCadastradas.length < item.pessoasIdentificadas.length && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pessoas:</span>
            {item.pessoasIdentificadas
              .filter((s) => !item.naoCadastradas?.includes(s))
              .map((slug) => (
                <span key={slug} style={{
                  fontSize: 11, padding: '2px 7px', borderRadius: 20,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {slug}
                </span>
              ))}
          </div>
        )}
      </div>
      {item.finishedAt && item.startedAt && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: 2 }}>
          {((item.finishedAt - item.startedAt) / 1000).toFixed(0)}s
        </span>
      )}
    </div>
  )
}

const styles = {
  eyebrow: {
    fontSize: 10, fontWeight: 600,
    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    color: 'var(--text-muted)', marginBottom: 4,
  },
  pageTitle: {
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontSize: 24, fontWeight: 700,
    color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.1,
  } as React.CSSProperties,
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 12px', borderRadius: 6,
    background: 'var(--surface-2)', color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    fontSize: 12, fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 500, cursor: 'pointer',
  } as React.CSSProperties,
}
