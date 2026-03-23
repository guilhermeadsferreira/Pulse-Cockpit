import { describe, expect, it } from 'vitest'
import { shouldRunPass2 } from './IngestionPipeline'

describe('shouldRunPass2', () => {
  const validFrontmatter = { total_artefatos: 5 }

  it('retorna true quando pessoa tem histórico suficiente e artefato longo', () => {
    expect(shouldRunPass2(validFrontmatter, 400, 'maria-silva')).toBe(true)
  })

  it('retorna false para _coletivo independente do histórico', () => {
    expect(shouldRunPass2(validFrontmatter, 400, '_coletivo')).toBe(false)
    expect(shouldRunPass2({ total_artefatos: 0 }, 400, '_coletivo')).toBe(false)
  })

  it('retorna false quando total_artefatos < 2 (pessoa nova)', () => {
    expect(shouldRunPass2({ total_artefatos: 0 }, 400, 'joao-novo')).toBe(false)
    expect(shouldRunPass2({ total_artefatos: 1 }, 400, 'joao-novo')).toBe(false)
    expect(shouldRunPass2({ total_artefatos: 2 }, 400, 'joao-novo')).toBe(true)
  })

  it('retorna false quando artefato é curto (<= 300 chars)', () => {
    expect(shouldRunPass2(validFrontmatter, 300, 'maria-silva')).toBe(false)
    expect(shouldRunPass2(validFrontmatter, 299, 'maria-silva')).toBe(false)
    expect(shouldRunPass2(validFrontmatter, 301, 'maria-silva')).toBe(true)
  })

  it('trata frontmatter sem total_artefatos como 0', () => {
    expect(shouldRunPass2({}, 400, 'maria-silva')).toBe(false)
    expect(shouldRunPass2({ total_artefatos: 'nao-numero' }, 400, 'maria-silva')).toBe(false)
  })
})
