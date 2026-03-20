import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'
import yaml from 'js-yaml'
import type { CicloEntry } from '../../renderer/src/types/ipc'
import type { IngestionAIResult } from '../prompts/ingestion.prompt'

const TIPO_LABEL: Record<string, string> = {
  '1on1':    '1:1',
  'reuniao': 'Reunião',
  'daily':   'Daily',
  'planning':'Planning',
  'retro':   'Retro',
  'feedback':'Feedback',
  'outro':   'Evento',
}

export class CicloRegistry {
  private cicloDir: string

  constructor(workspacePath: string) {
    this.cicloDir = join(workspacePath, 'gestor', 'ciclo')
  }

  listEntries(): CicloEntry[] {
    const manual = this.readLog()
    const artifacts = this.listArtifactEntries()

    // Merge: artifacts not already in log (by filePath)
    const logFilePaths = new Set(manual.filter((e) => e.filePath).map((e) => e.filePath!))
    const newArtifacts = artifacts.filter((a) => a.filePath && !logFilePaths.has(a.filePath))

    return [...manual, ...newArtifacts].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  }

  /**
   * Cria automaticamente uma entrada no ciclo do gestor a partir de um artefato
   * já processado pelo pipeline de ingestão. Zero chamadas ao Claude.
   */
  addFromIngestion(aiResult: IngestionAIResult, personaNome: string | null): void {
    const tipoLabel = TIPO_LABEL[aiResult.tipo] ?? 'Evento'
    const titulo = personaNome
      ? `${tipoLabel} com ${personaNome}`
      : tipoLabel

    // Ações que o gestor assumiu pessoalmente
    const acoesGestor = (aiResult.acoes_comprometidas ?? [])
      .filter((a) => a.owner === 'gestor' || (!a.responsavel_slug && a.owner !== 'liderado'))
      .map((a) => `• ${a.descricao}${a.prazo_iso ? ` (até ${a.prazo_iso})` : ''}`)

    const texto = acoesGestor.length > 0
      ? `${aiResult.resumo}\n${acoesGestor.join('\n')}`
      : aiResult.resumo

    const entry: CicloEntry = {
      id:       `ciclo-${aiResult.data_artefato}-${Math.random().toString(36).slice(2, 7)}`,
      tipo:     'manual',
      texto,
      titulo,
      criadoEm: aiResult.data_artefato,
    }

    const entries = this.readLog()
    // Evitar duplicatas por título+data
    const duplicate = entries.some((e) => e.titulo === titulo && e.criadoEm === aiResult.data_artefato)
    if (duplicate) return

    entries.unshift(entry)
    this.writeLog(entries)
  }

  addManualEntry(texto: string): CicloEntry {
    const entry: CicloEntry = {
      id:       `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tipo:     'manual',
      texto,
      criadoEm: new Date().toISOString().slice(0, 10),
    }
    const entries = this.readLog()
    entries.unshift(entry)
    this.writeLog(entries)
    return entry
  }

  addArtifactEntryToLog(entry: CicloEntry): void {
    const entries = this.readLog()
    // Avoid duplicates by filePath
    if (entry.filePath && entries.some((e) => e.filePath === entry.filePath)) return
    entries.unshift(entry)
    this.writeLog(entries)
  }

  deleteEntry(id: string): void {
    const entries = this.readLog().filter((e) => e.id !== id)
    this.writeLog(entries)
  }

  writeArtifact(fileName: string, content: string): string {
    mkdirSync(this.cicloDir, { recursive: true })
    const filePath = join(this.cicloDir, fileName)
    writeFileSync(filePath, content, 'utf-8')
    return filePath
  }

  listArtifactsWithContent(from: string, to: string): Array<{ date: string; tipo: string; titulo: string; content: string }> {
    if (!existsSync(this.cicloDir)) return []
    try {
      return readdirSync(this.cicloDir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => {
          try {
            const content = readFileSync(join(this.cicloDir, f), 'utf-8')
            const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
            const fm = fmMatch ? (yaml.load(fmMatch[1]) as Record<string, string>) : {}
            const date = fm?.data ?? f.slice(0, 10)
            return { date, tipo: fm?.tipo ?? 'outro', titulo: fm?.titulo ?? f, content }
          } catch {
            return null
          }
        })
        .filter((item): item is NonNullable<typeof item> =>
          item !== null && item.date >= from && item.date <= to
        )
    } catch {
      return []
    }
  }

  private listArtifactEntries(): CicloEntry[] {
    if (!existsSync(this.cicloDir)) return []
    try {
      return readdirSync(this.cicloDir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => {
          try {
            const filePath = join(this.cicloDir, f)
            const content = readFileSync(filePath, 'utf-8')
            const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
            const fm = fmMatch ? (yaml.load(fmMatch[1]) as Record<string, string>) : {}
            const resumoMatch = content.match(/## Minhas Contribuições\n([\s\S]*?)(?:\n##|$)/)
            const resumo = resumoMatch?.[1]?.trim().slice(0, 200) ?? ''
            return {
              id:       `artifact-${f}`,
              tipo:     'artifact' as const,
              texto:    resumo || (fm?.titulo ?? f),
              titulo:   fm?.titulo ?? f,
              criadoEm: fm?.data ?? f.slice(0, 10),
              filePath,
            }
          } catch {
            return null
          }
        })
        .filter((e): e is NonNullable<typeof e> => e !== null)
    } catch {
      return []
    }
  }

  private readLog(): CicloEntry[] {
    const filePath = this.logPath()
    if (!existsSync(filePath)) return []
    try {
      const raw = readFileSync(filePath, 'utf-8')
      const data = yaml.load(raw) as { entries?: CicloEntry[] }
      return data?.entries ?? []
    } catch {
      return []
    }
  }

  private writeLog(entries: CicloEntry[]): void {
    mkdirSync(this.cicloDir, { recursive: true })
    writeFileSync(this.logPath(), yaml.dump({ entries }), 'utf-8')
  }

  private logPath(): string {
    return join(this.cicloDir, 'log.yaml')
  }
}
