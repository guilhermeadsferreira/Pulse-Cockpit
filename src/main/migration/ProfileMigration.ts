/**
 * Migrates perfil.md frontmatter between schema versions.
 * Apply whenever reading a perfil.md — always write CURRENT_SCHEMA_VERSION on new perfis.
 *
 * Versions:
 *   1 → 2: removed acoes_pendentes_count (now computed from ActionRegistry)
 *   2 → 3: unique open marker for conquistas block (was identical to atencao, breaking appendToBlock)
 */
export const CURRENT_SCHEMA_VERSION = 3

export function migrateProfileContent(content: string): string {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) return content

  let fm = fmMatch[1]
  let body = content

  const versionMatch = fm.match(/schema_version:\s*(\d+)/)
  const version = versionMatch ? parseInt(versionMatch[1]) : 1

  if (version >= CURRENT_SCHEMA_VERSION) return content

  // v1 → v2: drop acoes_pendentes_count — now computed from ActionRegistry
  if (version < 2) {
    fm = fm.replace(/acoes_pendentes_count:.*\n/, '')
  }

  // v2 → v3: give conquistas block a unique open marker so appendToBlock targets it correctly.
  // The old marker was identical to atencao's, causing all appended content to land in the
  // atencao block. We identify conquistas by its section header (## Conquistas e Elogios).
  if (version < 3) {
    body = body.replace(
      /(## Conquistas e Elogios\n)<!-- BLOCO GERENCIADO PELA IA — append apenas -->/,
      '$1<!-- BLOCO GERENCIADO PELA IA — append apenas (conquistas) -->',
    )
  }

  fm = fm.replace(/schema_version:\s*\d+/, `schema_version: ${CURRENT_SCHEMA_VERSION}`)
  return body.replace(/^---\n[\s\S]*?\n---/, `---\n${fm}\n---`)
}
