export interface CompressionPromptParams {
  slug:          string
  totalArtefatos: number
  resumoEvolutivo: string
  pontosAtencao:   string   // raw block content (may contain resolved ~~items~~)
  conquistas:      string   // raw block content
  temas:           string   // raw block content
}

export interface CompressionAIResult {
  resumo_evolutivo:  string
  pontos_ativos:     string[]  // only non-resolved attention points
  conquistas:        string[]  // summarized milestones
  temas:             string[]  // deduplicated themes
}

export function buildCompressionPrompt(params: CompressionPromptParams): string {
  const { slug, totalArtefatos, resumoEvolutivo, pontosAtencao, conquistas, temas } = params

  return `Você é um assistente de compressão de contexto para um sistema de gestão de pessoas.

O perfil de "${slug}" acumulou ${totalArtefatos} artefatos e precisa de compressão para evitar overflow de contexto.

## Seções a comprimir

### Resumo Evolutivo atual
${resumoEvolutivo}

### Pontos de Atenção atuais
${pontosAtencao}

### Conquistas e Elogios atuais
${conquistas}

### Temas Recorrentes atuais
${temas}

## Sua tarefa

Comprima as seções acima preservando todas as informações relevantes para decisões de gestão futuras. Retorne APENAS um JSON válido (sem texto antes ou depois):

{
  "resumo_evolutivo": "string",
  "pontos_ativos": ["string"],
  "conquistas": ["string"],
  "temas": ["string"]
}

Regras obrigatórias:
- "resumo_evolutivo": parágrafo condensado de 4–6 frases cobrindo o arco da pessoa. Preserve o estado mais recente, marcos de carreira e padrões de comportamento duradouros. Descarte eventos pontuais já superados.
- "pontos_ativos": PRESERVE todos os itens NÃO resolvidos dos Pontos de Atenção (linhas SEM ~~strikethrough~~). REMOVA apenas itens já riscados (~~texto~~) que claramente não têm mais relevância. Nunca remova pontos ativos.
- "conquistas": consolide itens mais antigos em marcos concisos ("Liderou migração X em mar/26"). Preserve os últimos 60 dias verbatim. Cada item deve ser uma frase autônoma citável.
- "temas": deduplique e consolide temas similares. Máximo 8 temas. Ordene por relevância.

NUNCA invente informações. NUNCA remova pontos de atenção ativos. Em caso de dúvida, preserve.`
}
