import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, statSync } from 'fs'
import { join, extname, basename } from 'path'
import yaml from 'js-yaml'

export interface PersonConfig {
  schema_version: number
  nome: string
  slug: string
  cargo: string
  nivel: string
  area?: string
  squad?: string
  relacao: string
  inicio_na_funcao?: string
  inicio_na_empresa?: string
  frequencia_1on1_dias: number
  em_processo_promocao: boolean
  objetivo_cargo_alvo?: string
  pdi: Array<{ objetivo: string; status: string; prazo?: string }>
  notas_manuais?: string
  alerta_ativo: boolean
  motivo_alerta?: string
  criado_em: string
  atualizado_em: string
}

const PERSON_SUBDIRS = ['historico', 'pautas']

export class PersonRegistry {
  private pessoasDir: string

  constructor(workspacePath: string) {
    this.pessoasDir = join(workspacePath, 'pessoas')
  }

  list(): PersonConfig[] {
    if (!existsSync(this.pessoasDir)) return []
    try {
      return readdirSync(this.pessoasDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => this.get(d.name))
        .filter((p): p is PersonConfig => p !== null)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    } catch {
      return []
    }
  }

  get(slug: string): PersonConfig | null {
    const configPath = join(this.pessoasDir, slug, 'config.yaml')
    if (!existsSync(configPath)) return null
    try {
      const parsed = yaml.load(readFileSync(configPath, 'utf-8'))
      if (!parsed || typeof parsed !== 'object') return null
      return parsed as PersonConfig
    } catch {
      return null
    }
  }

  save(config: PersonConfig): void {
    const dir = join(this.pessoasDir, config.slug)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
      for (const sub of PERSON_SUBDIRS) {
        mkdirSync(join(dir, sub), { recursive: true })
      }
    }
    const now = new Date().toISOString()
    const toSave: PersonConfig = {
      schema_version: 1,
      pdi: [],
      alerta_ativo: false,
      em_processo_promocao: false,
      frequencia_1on1_dias: 14,
      ...config,
      criado_em: config.criado_em || now,
      atualizado_em: now,
    }
    writeFileSync(
      join(dir, 'config.yaml'),
      yaml.dump(toSave, { lineWidth: 120, quotingType: '"' }),
      'utf-8',
    )
  }

  delete(slug: string): void {
    const dir = join(this.pessoasDir, slug)
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  }

  getPerfil(slug: string): { raw: string; frontmatter: Record<string, unknown> } | null {
    const perfilPath = join(this.pessoasDir, slug, 'perfil.md')
    if (!existsSync(perfilPath)) return null
    const raw = readFileSync(perfilPath, 'utf-8')
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) return { raw, frontmatter: {} }
    try {
      const frontmatter = yaml.load(fmMatch[1]) as Record<string, unknown>
      return { raw, frontmatter }
    } catch {
      return { raw, frontmatter: {} }
    }
  }

  listArtifacts(slug: string): Array<{ fileName: string; tipo: string; date: string; path: string }> {
    const historicoDir = join(this.pessoasDir, slug, 'historico')
    if (!existsSync(historicoDir)) return []
    try {
      return readdirSync(historicoDir)
        .filter((f) => extname(f) === '.md')
        .map((fileName) => {
          const filePath = join(historicoDir, fileName)
          const content = readFileSync(filePath, 'utf-8')
          const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
          let tipo = 'outro'
          let date = ''
          if (fmMatch) {
            try {
              const fm = yaml.load(fmMatch[1]) as Record<string, unknown>
              tipo = (fm.tipo as string) || 'outro'
              date = (fm.data as string) || ''
            } catch { /* skip */ }
          }
          const stat = statSync(filePath)
          if (!date) date = stat.mtime.toISOString().slice(0, 10)
          return { fileName, tipo, date, path: filePath }
        })
        .sort((a, b) => b.date.localeCompare(a.date)) // newest first
    } catch {
      return []
    }
  }

  serializeForPrompt(): string {
    const people = this.list()
    if (people.length === 0) return 'Nenhuma pessoa cadastrada no time.'
    return people
      .map((p) => `- ${p.nome} | ${p.cargo} | ${p.nivel} | ${p.relacao} | slug: ${p.slug}`)
      .join('\n')
  }
}
