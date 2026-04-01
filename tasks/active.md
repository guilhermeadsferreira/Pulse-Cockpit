# Active — Pulse Cockpit

> Última atualização: 2026-04-01
> Auditoria: 31/38 tasks movidas para done.md — sobraram 7 items reais.
> DAILY-AUDIT: 10/10 tasks implementadas (2026-04-01)

---

## Pendentes

### T-R6.19 — Evidências nunca triviais
**Prompts afetados:** todos que geram evidências (ingestion, 1on1-deep, cerimonia-sinal, cycle)
**O que falta:** guard explícito rejeitando evidências triviais como "participou da reunião" ou "disse algo"
**Esforço:** baixo (adicionar instrução em 3-4 prompts)

### T6.3 — Cycle time por pessoa (média) no Sprint Report
**Arquivo:** `src/main/reports/SprintReportGenerator.ts`
**O que falta:** dados existem em `JiraMetrics.tempoMedioCicloDias` mas não são expostos na tabela por pessoa do sprint report
**Esforço:** baixo (puxar campo existente para o template)

### T6.4 — Lead time do time no Weekly Report
**Arquivo:** `src/main/reports/WeeklyReportGenerator.ts`
**O que falta:** métrica de lead time não existe no sistema — precisa definir cálculo (ex: tempo entre issue created → done) e agregar por time
**Esforço:** médio (definir métrica + implementar + expor no report)

### T6.5 — Velocity trend no Monthly Report
**Arquivo:** `src/main/reports/MonthlyReportGenerator.ts`
**O que falta:** comparação de velocity entre sprints/meses — story points entregues já existem por pessoa/sprint mas não são trendados
**Esforço:** médio (agregar histórico + calcular trend + expor no report)

---

## Parciais

### T6.2 — PR sem reviewer (alerta específico)
**Arquivo:** `src/main/external/CrossAnalyzer.ts`
**Estado:** alerta de PR acumulado existe (`prsAbertos >= 2 && tempoMedioAbertoDias >= 3`), mas não distingue "PR sem nenhum reviewer atribuído" vs "PR aguardando review"
**O que falta:** checar se PR tem 0 reviewers no GitHub e alertar especificamente
**Esforço:** baixo-médio (precisa de campo adicional do GitHub API)

### T-R10.4 — Schema validation no retorno de dados externos
**Arquivo:** `src/main/external/ExternalDataPass.ts`
**Estado:** validação existe no ingestion (SchemaValidator), mas dados externos retornam com graceful degradation sem validação explícita
**O que falta:** validação Zod/manual no retorno dos IPCs de dados externos
**Esforço:** baixo

### T-R5.2 — Sync bidirecional ações ↔ Jira
**Arquivo:** `src/main/external/ExternalDataPass.ts`
**Estado:** sync unidirecional implementado (fecha ações quando Jira→Done)
**O que falta:** direção inversa — criar ações a partir de issues Jira atribuídas
**Esforço:** médio-alto (design de quais issues viram ações + dedup + UX)
