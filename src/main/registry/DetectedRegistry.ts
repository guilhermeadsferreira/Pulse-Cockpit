import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface DetectedPerson {
  slug:         string
  nome:         string
  firstSeen:    string   // ISO date
  lastSeen:     string   // ISO date
  mentionCount: number
  sourceFiles:  string[] // original file names that mentioned this person
}

export class DetectedRegistry {
  private filePath: string

  constructor(workspacePath: string) {
    this.filePath = join(workspacePath, 'detected-people.json')
  }

  list(): DetectedPerson[] {
    if (!existsSync(this.filePath)) return []
    try {
      return JSON.parse(readFileSync(this.filePath, 'utf-8'))
    } catch {
      return []
    }
  }

  upsert(slug: string, nome: string, sourceFile: string): void {
    const all   = this.list()
    const today = new Date().toISOString().slice(0, 10)
    const existing = all.find((p) => p.slug === slug)

    if (existing) {
      existing.lastSeen = today
      existing.mentionCount++
      if (!existing.sourceFiles.includes(sourceFile)) {
        existing.sourceFiles.push(sourceFile)
      }
      // Update nome if a better name is provided (not a slug-like kebab-case)
      if (nome && nome !== existing.nome && nome.includes(' ')) existing.nome = nome
    } else {
      all.push({ slug, nome, firstSeen: today, lastSeen: today, mentionCount: 1, sourceFiles: [sourceFile] })
    }

    writeFileSync(this.filePath, JSON.stringify(all, null, 2))
  }

  dismiss(slug: string): void {
    const all = this.list().filter((p) => p.slug !== slug)
    writeFileSync(this.filePath, JSON.stringify(all, null, 2))
  }
}
