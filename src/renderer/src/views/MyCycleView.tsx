import { useState, useEffect } from 'react'
import { FileText, Loader2, Trash2, ExternalLink, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import type { CicloEntry, AutoavaliacaoResult } from '../types/ipc'

export function MyCycleView() {
  const [entries, setEntries]           = useState<CicloEntry[]>([])
  const [quickText, setQuickText]       = useState('')
  const [savingText, setSavingText]     = useState(false)
  const [isDragging, setDragging]       = useState(false)
  const [ingesting, setIngesting]       = useState(false)
  const [ingestError, setIngestError]   = useState<string | null>(null)
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [generating, setGenerating]     = useState(false)
  const [avalResult, setAvalResult]     = useState<AutoavaliacaoResult | null>(null)
  const [showAval, setShowAval]         = useState(false)

  useEffect(() => {
    // Default date range: start of current year to today
    const now = new Date()
    setDateFrom(`${now.getFullYear()}-01-01`)
    setDateTo(now.toISOString().slice(0, 10))
    load()
  }, [])

  async function load() {
    const list = await window.api.eu.listCiclo() as CicloEntry[]
    setEntries(list)
  }

  async function handleQuickSubmit() {
    if (!quickText.trim()) return
    setSavingText(true)
    await window.api.eu.addManualEntry(quickText.trim())
    setQuickText('')
    await load()
    setSavingText(false)
  }

  async function handleDelete(id: string) {
    await window.api.eu.deleteCicloEntry(id)
    await load()
  }

  async function handleAutoavaliacao() {
    if (!dateFrom || !dateTo) return
    setGenerating(true)
    setAvalResult(null)
    const result = await window.api.eu.gerarAutoavaliacao({ periodoInicio: dateFrom, periodoFim: dateTo }) as AutoavaliacaoResult
    setAvalResult(result)
    setGenerating(false)
    if (result.success) setShowAval(true)
  }

  // Drop zone
  useEffect(() => {
    const zone = document.getElementById('ciclo-drop-zone')
    if (!zone) return

    function onDragOver(e: DragEvent) { e.preventDefault(); e.stopPropagation(); setDragging(true) }
    function onDragLeave(e: DragEvent) {
      if (zone.contains(e.relatedTarget as Node)) return
      e.preventDefault(); e.stopPropagation(); setDragging(false)
    }
    async function onDrop(e: DragEvent) {
      e.preventDefault(); e.stopPropagation(); setDragging(false)
      const files = Array.from(e.dataTransfer?.files ?? [])
      const file = files.find((f) => /\.(md|txt|pdf)$/i.test(f.name))
      if (!file) return
      const filePath = window.api.getFilePath(file)
      if (!filePath) return
      setIngesting(true)
      setIngestError(null)
      const result = await window.api.eu.ingestArtifact(filePath) as { success: boolean; error?: string }
      if (!result.success) setIngestError(result.error ?? 'Erro desconhecido.')
      await load()
      setIngesting(false)
    }

    zone.addEventListener('dragover', onDragOver)
    zone.addEventListener('dragleave', onDragLeave)
    zone.addEventListener('drop', onDrop)
    return () => {
      zone.removeEventListener('dragover', onDragOver)
      zone.removeEventListener('dragleave', onDragLeave)
      zone.removeEventListener('drop', onDrop)
    }
  }, [])

  function formatDate(d: string): string {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Quick Entry */}
      <div style={{
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: 16,
      }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Registrar contribuição
        </div>
        <textarea
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleQuickSubmit() }}
          placeholder="O que você fez, decidiu ou aprendeu? (⌘↵ para salvar)"
          rows={2}
          style={{
            width: '100%', resize: 'vertical', padding: '8px 10px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
            fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={handleQuickSubmit}
            disabled={!quickText.trim() || savingText}
            style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
              background: 'var(--accent-dim)', border: '1px solid rgba(192,135,58,0.3)',
              color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font)',
              opacity: !quickText.trim() || savingText ? 0.5 : 1,
            }}
          >
            {savingText ? 'Salvando…' : 'Registrar'}
          </button>
        </div>
      </div>

      {/* Artifact Drop Zone */}
      <div
        id="ciclo-drop-zone"
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 8, padding: '24px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          background: isDragging ? 'var(--accent-dim)' : 'var(--surface)',
          transition: 'border-color 0.15s, background 0.15s',
          cursor: 'default',
        }}
      >
        {ingesting ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Processando artefato…
          </div>
        ) : (
          <>
            <FileText size={22} style={{ color: isDragging ? 'var(--accent)' : 'var(--text-muted)', opacity: 0.7 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Arraste um artefato para registrar no seu ciclo
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
                .md · .txt · .pdf — a IA extrai suas contribuições automaticamente
              </div>
            </div>
            {ingestError && (
              <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>
                Erro: {ingestError}
              </div>
            )}
          </>
        )}
      </div>

      {/* Autoavaliação Panel */}
      <div style={{
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 8, overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: showAval ? '1px solid var(--border-subtle)' : 'none' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Gerar autoavaliação
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>De</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={dateInputStyle}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Até</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={dateInputStyle}
              />
            </div>
            <button
              onClick={handleAutoavaliacao}
              disabled={generating || !dateFrom || !dateTo}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                background: 'var(--accent-dim)', border: '1px solid rgba(192,135,58,0.3)',
                color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font)',
                opacity: generating || !dateFrom || !dateTo ? 0.5 : 1,
              }}
            >
              {generating
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Gerando…</>
                : <><Sparkles size={13} /> Gerar autoavaliação</>
              }
            </button>
            {avalResult?.success && (
              <button
                onClick={() => setShowAval((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'transparent', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font)',
                }}
              >
                {showAval ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showAval ? 'Ocultar' : 'Ver resultado'}
              </button>
            )}
          </div>
          {avalResult && !avalResult.success && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--red)' }}>
              Erro: {avalResult.error}
            </div>
          )}
        </div>

        {showAval && avalResult?.success && avalResult.result && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <AvalSection title="O que fiz e entreguei" items={avalResult.result.o_que_fiz_e_entreguei} />
            <AvalSection title="Como demonstrei valores" items={avalResult.result.como_demonstrei_valores} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Como me vejo no futuro
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                {avalResult.result.como_me_vejo_no_futuro}
              </p>
            </div>
            {avalResult.path && (
              <button
                onClick={() => window.api.shell.open(avalResult.path!)}
                style={{
                  alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 6, fontSize: 12,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font)',
                }}
              >
                <ExternalLink size={12} /> Abrir arquivo exportado
              </button>
            )}
          </div>
        )}
      </div>

      {/* Entry List */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Histórico ({entries.length})
        </div>
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Nenhuma contribuição registrada ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entries.map((e) => (
              <div
                key={e.id}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {e.titulo && e.tipo === 'artifact' && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>
                      {e.titulo}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                    {e.texto}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 5, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10, fontFamily: 'var(--font-mono)',
                      color: e.tipo === 'artifact' ? 'var(--accent)' : 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${e.tipo === 'artifact' ? 'rgba(192,135,58,0.2)' : 'var(--border-subtle)'}`,
                      borderRadius: 4, padding: '1px 5px',
                    }}>
                      {e.tipo === 'artifact' ? 'artefato' : 'manual'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(e.criadoEm)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {e.filePath && (
                    <IconBtn title="Abrir artefato" onClick={() => window.api.shell.open(e.filePath!)}>
                      <ExternalLink size={12} />
                    </IconBtn>
                  )}
                  <IconBtn title="Remover do histórico" onClick={() => handleDelete(e.id)}>
                    <Trash2 size={12} />
                  </IconBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function AvalSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, borderRadius: 6,
        background: 'transparent', border: '1px solid transparent',
        color: 'var(--text-muted)', cursor: 'pointer',
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-2)'
        e.currentTarget.style.color = 'var(--text-primary)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-muted)'
        e.currentTarget.style.borderColor = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

const dateInputStyle: React.CSSProperties = {
  padding: '4px 8px', borderRadius: 6, fontSize: 12,
  background: 'var(--surface)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', fontFamily: 'var(--font)',
  colorScheme: 'dark',
}
