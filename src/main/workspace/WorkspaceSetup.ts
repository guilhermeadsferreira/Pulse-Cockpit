import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const ARTIFACT_TYPES = ['1on1', 'reuniao', 'daily', 'planning', 'retro']

export async function setupWorkspace(workspacePath: string): Promise<void> {
  const dirs = [
    workspacePath,
    join(workspacePath, 'inbox'),
    join(workspacePath, 'inbox', 'processados'),
    join(workspacePath, 'pessoas'),
    join(workspacePath, 'exports'),
    ...ARTIFACT_TYPES.map((t) => join(workspacePath, 'artefatos', t)),
  ]

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }
}
