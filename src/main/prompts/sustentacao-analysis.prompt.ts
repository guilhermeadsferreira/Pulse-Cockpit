/**
 * Prompt para análise com IA do Board de Sustentação.
 * Recebe um snapshot do board e gera insights acionáveis para o gestor.
 */

import type { SupportBoardSnapshot } from '../../renderer/src/types/ipc'

export function buildSustentacaoPrompt(snapshot: SupportBoardSnapshot): string {
  const ticketsStr = snapshot.ticketsEmBreach.map((t) => {
    const comments =
      t.recentComments.length > 0
        ? t.recentComments.map((c) => `    - [${c.author}]: ${c.body.slice(0, 200)}`).join('\n')
        : '    (sem comentários)'

    return `- ${t.key}: ${t.summary}
  Tipo: ${t.type} | Assignee: ${t.assignee ?? 'sem assignee'} | Idade: ${t.ageDias}d
  Comentários recentes:
${comments}`
  }).join('\n\n')

  const tiposStr = snapshot.topTipos.map((t) => `${t.tipo}: ${t.count}`).join(', ')

  return `Você é um analista de engenharia de software. Analise os tickets de sustentação abaixo e gere insights acionáveis para o gestor.

## Contexto do Board de Sustentação

- Tickets abertos: ${snapshot.ticketsAbertos}
- Fechados nos últimos 30 dias: ${snapshot.ticketsFechadosUltimos30d}
- Distribuição por tipo: ${tiposStr}
- Tickets em breach de SLA (${snapshot.ticketsEmBreach.length} total):

${ticketsStr || '(nenhum ticket em breach)'}

## Instruções

Gere uma análise estruturada com as seguintes seções:

### Padrões Recorrentes
Liste os 2-4 tipos de problema mais frequentes nos tickets. Para cada um: tipo de problema + frequência + impacto.

### Oportunidades de Automação
Liste 2-3 categorias de tickets que poderiam ser resolvidas sem intervenção humana, com sugestão concreta de automação (ex: "tickets de reset de senha → self-service portal").

### Causa Raiz Provável
Para os tipos de problema mais frequentes, identifique a causa raiz técnica ou de processo mais provável com base nos títulos e comentários.

### Sugestões de Redução de SLA
Liste 2-3 mudanças concretas de processo ou triagem que poderiam reduzir o tempo de resolução.

Seja direto e específico. Evite generalidades. Baseie-se apenas nos dados fornecidos.`
}
