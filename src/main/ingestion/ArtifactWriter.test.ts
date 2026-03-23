import { describe, expect, it } from 'vitest'

// normalizePointText is not exported — test via the exported behaviour indirectly,
// but we can unit-test the logic by duplicating the pure function here.
function normalizePointText(text: string): string {
  return text
    .replace(/^\s*~~.*?~~\s*✓.*$/i, '')
    .replace(/^\s*-\s*/, '')
    .replace(/\*\*\d{4}-\d{2}-\d{2}:\*\*\s*/i, '')
    .replace(/\*\*/g, '')
    .toLowerCase()
    .trim()
}

describe('normalizePointText', () => {
  it('remove prefixo de data', () => {
    expect(normalizePointText('- **2026-03-10:** Dificuldade com comunicação'))
      .toBe('dificuldade com comunicação')
  })

  it('remove marcadores markdown bold', () => {
    expect(normalizePointText('**Texto importante**')).toBe('texto importante')
  })

  it('remove strikethrough já resolvido', () => {
    expect(normalizePointText('~~- **2026-03-10:** Ponto antigo~~ ✓ *(resolvido em 2026-03-20)*'))
      .toBe('')
  })

  it('normaliza texto simples sem prefixo', () => {
    expect(normalizePointText('  Dificuldade com comunicação no time A  '))
      .toBe('dificuldade com comunicação no time a')
  })
})

describe('match bidirecional de pontos resolvidos', () => {
  function isMatch(line: string, resolved: string): boolean {
    const nLine = normalizePointText(line)
    const nResolved = normalizePointText(resolved)
    if (nLine.length < 15 || nResolved.length < 15) return false
    return nLine.includes(nResolved) || nResolved.includes(nLine)
  }

  it('encontra match quando Claude omite o prefixo de data', () => {
    const lineInPerfil = '- **2026-03-10:** Dificuldade com comunicação no time de plataforma'
    const claudeRetornou = 'Dificuldade com comunicação no time de plataforma'
    expect(isMatch(lineInPerfil, claudeRetornou)).toBe(true)
  })

  it('não confunde pontos similares com início parecido', () => {
    const lineA = '- **2026-03-10:** Dificuldade com comunicação no time A'
    const lineB = '- **2026-03-10:** Dificuldade com comunicação no time B'
    const resolved = 'Dificuldade com comunicação no time A'
    expect(isMatch(lineA, resolved)).toBe(true)
    expect(isMatch(lineB, resolved)).toBe(false)
  })

  it('não faz match em textos muito curtos (< 15 chars)', () => {
    expect(isMatch('- **2026-03-10:** Curto', 'Curto')).toBe(false)
  })

  it('não faz match em linhas já com strikethrough', () => {
    const line = '~~- **2026-03-10:** Ponto antigo~~ ✓ *(resolvido em 2026-03-20)*'
    // normaliza para vazio — length < 15, não faz match
    expect(isMatch(line, 'Ponto antigo resolvido')).toBe(false)
  })
})
