import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import yaml from 'js-yaml'
import type { Demanda, DemandaStatus } from '../../renderer/src/types/ipc'

export class DemandaRegistry {
  private gestorDir: string

  constructor(workspacePath: string) {
    this.gestorDir = join(workspacePath, 'gestor')
  }

  list(): Demanda[] {
    const filePath = this.demandasPath()
    if (!existsSync(filePath)) return []
    try {
      const raw = readFileSync(filePath, 'utf-8')
      const data = yaml.load(raw) as { demandas?: Demanda[] }
      return data?.demandas ?? []
    } catch {
      return []
    }
  }

  save(demanda: Demanda): void {
    const demandas = this.list()
    const idx = demandas.findIndex((d) => d.id === demanda.id)
    if (idx >= 0) {
      demandas[idx] = demanda
    } else {
      demandas.unshift(demanda)
    }
    this.write(demandas)
  }

  delete(id: string): void {
    const demandas = this.list().filter((d) => d.id !== id)
    this.write(demandas)
  }

  updateStatus(id: string, status: DemandaStatus): Demanda | null {
    const demandas = this.list()
    const demanda = demandas.find((d) => d.id === id)
    if (!demanda) return null
    demanda.status = status
    demanda.atualizadoEm = new Date().toISOString().slice(0, 10)
    if (status === 'done') {
      demanda.concluidoEm = demanda.atualizadoEm
    }
    this.write(demandas)
    return demanda
  }

  private demandasPath(): string {
    return join(this.gestorDir, 'demandas.yaml')
  }

  private write(demandas: Demanda[]): void {
    mkdirSync(this.gestorDir, { recursive: true })
    writeFileSync(this.demandasPath(), yaml.dump({ demandas }), 'utf-8')
  }
}
