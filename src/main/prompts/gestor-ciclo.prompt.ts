export interface GestorCicloPromptParams {
  managerName:     string
  managerRole:     string
  artifactContent: string
  today:           string        // YYYY-MM-DD
}

export interface GestorCicloAIResult {
  tipo:          string
  data_artefato: string          // YYYY-MM-DD
  titulo:        string
  resumo:        string
  contribuicoes: string[]        // entregas e resultados concretos do gestor
  decisoes:      string[]        // decisões tomadas ou direcionamentos dados
  aprendizados:  string[]        // observações e aprendizados
  acoes_minhas:  Array<{ descricao: string; prazo_iso: string | null }>
}

export function buildGestorCicloPrompt(params: GestorCicloPromptParams): string {
  const { managerName, managerRole, artifactContent, today } = params
  const role = managerRole ? ` (${managerRole})` : ''

  return `Você é o assistente de ${managerName}${role}, que quer registrar suas próprias contribuições a partir de um artefato que ele/ela produziu ou participou.

Data atual: ${today}

## Artefato
<artefato>
${artifactContent}
</artefato>

## Sua tarefa

Analise o artefato do ponto de vista de ${managerName} como PROTAGONISTA — o que ELE(A) fez, decidiu, contribuiu ou aprendeu neste evento. Retorne APENAS um JSON válido (sem texto antes ou depois):

{
  "tipo": "1on1|reuniao|daily|planning|retro|feedback|outro",
  "data_artefato": "YYYY-MM-DD",
  "titulo": "string (máx 80 chars — título descritivo do evento)",
  "resumo": "string (2-3 frases sobre o evento e o papel do gestor nele)",
  "contribuicoes": ["string — cada item descreve uma entrega, ação ou resultado concreto do gestor"],
  "decisoes": ["string — decisões tomadas, direcionamentos dados, posicionamentos assumidos"],
  "aprendizados": ["string — o que o gestor observou, aprendeu ou pode melhorar"],
  "acoes_minhas": [{"descricao": "string", "prazo_iso": "YYYY-MM-DD ou null"}]
}

Regras:
- contribuicoes: mínimo 1 item. Foco no que ${managerName} FEZ (não o time). Use verbos de ação no passado.
- decisoes: pode ser array vazio [] se não houve decisão clara do gestor.
- aprendizados: pode ser array vazio [].
- acoes_minhas: apenas ações que o GESTOR assumiu para si mesmo (não ações do time).
- data_artefato: extrair do conteúdo do artefato; se não encontrar, usar ${today}.
- Escreva em português brasileiro claro e profissional.
- Nunca copie texto corrompido, caracteres estranhos ou frases incompletas.
- Infira nomes de sistemas e termos técnicos a partir do contexto quando necessário.`
}

export function renderGestorCicloMarkdown(
  managerName: string,
  result: GestorCicloAIResult,
  originalContent: string,
): string {
  const lines: string[] = [
    `---`,
    `tipo: ${result.tipo}`,
    `data: ${result.data_artefato}`,
    `autor: ${managerName}`,
    `titulo: "${result.titulo.replace(/"/g, "'")}"`,
    `---`,
    ``,
    `# ${result.titulo}`,
    ``,
    `${result.resumo}`,
    ``,
  ]

  if (result.contribuicoes.length > 0) {
    lines.push(`## Minhas Contribuições`, ``)
    result.contribuicoes.forEach((c) => lines.push(`- ${c}`))
    lines.push(``)
  }

  if (result.decisoes.length > 0) {
    lines.push(`## Decisões que Tomei`, ``)
    result.decisoes.forEach((d) => lines.push(`- ${d}`))
    lines.push(``)
  }

  if (result.aprendizados.length > 0) {
    lines.push(`## Aprendizados`, ``)
    result.aprendizados.forEach((a) => lines.push(`- ${a}`))
    lines.push(``)
  }

  if (result.acoes_minhas.length > 0) {
    lines.push(`## Ações Assumidas`, ``)
    result.acoes_minhas.forEach((a) => {
      const prazo = a.prazo_iso ? ` — até ${a.prazo_iso}` : ''
      lines.push(`- [ ] ${a.descricao}${prazo}`)
    })
    lines.push(``)
  }

  lines.push(
    `## Conteúdo Original`,
    ``,
    `<details>`,
    `<summary>Ver transcrição original</summary>`,
    ``,
    originalContent.slice(0, 8000),
    ``,
    `</details>`,
  )

  return lines.join('\n')
}
