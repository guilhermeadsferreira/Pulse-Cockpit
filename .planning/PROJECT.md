# Pulse Cockpit — V2.1

## What This Is

Pulse Cockpit é um app desktop para gestores de tecnologia que transforma transcrições e anotações de cerimônias (1:1s, dailies, plannings, retros) num sistema vivo de inteligência sobre pessoas. O gestor arrasta artefatos para uma inbox; a IA analisa, extrai o que importa e acumula progressivamente num Perfil Vivo de cada liderado — alimentando pautas de 1:1, alertas proativos e relatórios de ciclo prontos para fórum de calibração. V2.1 completa a camada de exibição e prompts da V2, tornando visíveis na UI os dados de inteligência já produzidos pelo pipeline.

## Core Value

O contexto acumulado ao longo do ciclo — insights de 1:1, sinais de cerimônias, tendência emocional — deve estar acessível para o gestor na hora que importa: na tela do perfil, na pauta do próximo 1:1 e no relatório de calibração.

## Requirements

### Validated

<!-- V1 — Núcleo (estável em produção) -->
- ✓ People Registry: CRUD com config.yaml por pessoa — v1
- ✓ Inbox + Pipeline de ingestão two-pass (Pass 1 sem perfil, Pass 2 com perfil) — v1
- ✓ Perfil Vivo: escrita, atualização e migração automática de schema — v1
- ✓ Action Loop: actions.yaml estruturado com rastreamento de ações comprometidas — v1
- ✓ Pauta de 1:1 sob demanda com contexto acumulado — v1
- ✓ Pauta com o gestor (roll-up do time com saúde dos liderados) — v1
- ✓ Relatório de Ciclo com flag de promovibilidade e evidências — v1
- ✓ Dashboard + Painel de Riscos do Time (TeamRiskPanel) — v1
- ✓ Feed de Reuniões (visão transversal de artefatos) — v1
- ✓ Módulo "Eu": demandas do gestor, ciclo pessoal, autoavaliação — v1
- ✓ Suporte a reuniões coletivas (_coletivo) com roteamento de ações — v1
- ✓ Detecção de pessoas não cadastradas (DetectedRegistry + syncPending) — v1
- ✓ Processamento paralelo (max 3, per-person lock) — v1
- ✓ Schema migration automática com versionamento (ProfileMigration) — v1
- ✓ Pass de Cerimônia individual por participante em reuniões coletivas — v1
- ✓ Framing narrativo por tipo de relação (liderado/gestor/par/stakeholder) — v1

<!-- V2 — Qualidade de ingestão + inteligência de 1:1 (concluído 2026-03-26) -->
- ✓ Prompt genérico refinado: ações, resumo, pontos de atenção com maior qualidade — v2
- ✓ Pass de Cerimônia refinado: skills com evidência, cruzamento com perfil — v2
- ✓ Pass de 1:1 profundo: follow-ups, compromissos tácitos, insights, correlações, resumo QR — v2
- ✓ Schema migration v4→v5: tendência emocional, insights de 1:1, sinais de terceiros — v2
- ✓ ActionRegistry: follow-up batch, campos estendidos (tipo, origem, contexto, ciclos_sem_mencao) — v2
- ✓ Conexão ações_gestor → DemandaRegistry (módulo Eu) — v2
- ✓ Reingestão em batch (IPC handlers: list-processados, reset-data, batch-reingest) — v2
- ✓ Pauta enriquecida: insights, sinais de terceiros, PDI, ações por risco — v2
- ✓ Relatório de ciclo enriquecido: insights, correlações, tendência, PDI — v2
- ✓ TeamRiskPanel: novos gatilhos (abandono, tendência deteriorando, promessa gestor 14d+) — v2

### Active

<!-- V2.1 — Completar camada de exibição e prompts da V2 -->
- [ ] UI: Exibir seção "Insights de 1:1" no PersonView (dados do Pass de 1:1 já existem no perfil.md)
- [ ] UI: Exibir seção "Sinais de Terceiros" no PersonView (dados do Pass de Cerimônia já existem)
- [ ] UI: Botão "Copiar para QR" no artefato de 1:1 (copiar resumo executivo para clipboard)
- [ ] UI: Reingestão na SettingsView com modal de confirmação e progress bar
- [ ] Pauta roll-up enriquecida com gestor: tendências do time, correlações, riscos compostos
- [ ] Autoavaliação com dados V2: consumir insights de feedback_dado, tendências emocionais, accountability do gestor

### Out of Scope

- Entidade Projeto (projetos/{slug}/status.md) — V3; pipeline V2.1 não identifica projetos
- View "Hoje / Esta Semana" — V3; requer nova view de leitura sobre estado atual
- Integração MCP com Jira/Slack — V3; requer novos adapters de ingestão
- PDI com coleta automática de evidências via projetos — V3
- Insights cruzados do time (padrões entre múltiplas pessoas) — V3
- Caso de promoção gerado por IA com base em projetos — V3
- API Anthropic ou SDK direto — decisão arquitetural: usar sempre Claude Code CLI

## Context

**Estado atual (2026-03-26):** Branch `feat/v2-ingestion-quality`. V2 foi implementada e commitada. Os dados de inteligência (insights de 1:1, sinais de terceiros, tendência emocional, resumo QR) já são produzidos pelo pipeline e persistidos no `perfil.md` — mas ainda não exibidos na UI. A gap é de superfície, não de backend.

**Arquitetura:** Electron (Main Process + Renderer React). IA via `child_process.spawn('claude', ['-p', prompt])` — nunca via SDK. Workspace em `~/Pulse Cockpit/` (ou path configurável), sincronizado com iCloud Drive.

**Dados reais em produção:** O workspace do usuário contém perfis de liderados com histórico acumulado. Qualquer mudança em ArtifactWriter, PersonRegistry ou classes que escrevem em disco deve ser feita com cuidado redobrado — uma regressão pode corromper perfis existentes.

**Cobertura de testes:** Nenhuma (zero testes automatizados). Qualidade garantida por revisão manual e uso real. Abordagem defensiva: mudanças cirúrgicas, não refatorações amplas.

**Schema atual:** perfil.md v5 (tendência emocional, insights de 1:1, sinais de terceiros). Migrations são idempotentes e aditivas.

## Constraints

- **Tech stack**: Electron + React + TypeScript — não mudar stack sem PDR
- **IA**: Exclusivamente Claude Code CLI (`claude -p`) — nunca `@anthropic-ai/sdk`, nunca API keys
- **Dados**: Workspace em disco (Markdown + YAML) — sem banco de dados, sem servidor
- **Compatibilidade**: Mudanças em schema do perfil.md devem sempre ser aditivas; nunca remover campos sem migration
- **Produção**: App em uso real com dados irreversíveis — nenhuma operação destrutiva no workspace sem confirmação explícita
- **Sem testes**: Zero test coverage — validar via uso real; priorizar mudanças cirúrgicas sobre refatorações

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Claude Code CLI em vez de API direta | Usuário-alvo já tem CLI instalado e autenticado; zero custo adicional, zero API key | ✓ Good |
| Markdown + YAML em disco (sem DB) | Portável, editável, versionável com git, sincroniza com iCloud/Google Drive sem configuração | ✓ Good |
| Two-pass ingestion (Pass 1 sem perfil, Pass 2 com perfil) | Pass 2 só corre quando há histórico suficiente (≥2 artefatos, >300 chars); evita latência em primeiros artefatos | ✓ Good |
| Schema versionado com migration automática | Permite evoluir o perfil sem quebrar dados existentes | ✓ Good |
| V2.1: UI-first, sem mudanças de backend | Dados já existem no perfil.md; gap é só de exibição — escopo menor, risco menor | — Pending |

## Evolution

Este documento evolui a cada transição de fase e milestone.

**Após cada fase** (via `/gsd:transition`):
1. Requirements validados? → Mover para Validated com referência de fase
2. Requirements invalidados? → Mover para Out of Scope com motivo
3. Novos requirements emergiram? → Adicionar em Active
4. Decisões a registrar? → Adicionar em Key Decisions
5. "What This Is" ainda preciso? → Atualizar se houve drift

**Após o milestone V2.1** (via `/gsd:complete-milestone`):
1. Revisão completa de todas as seções
2. Core Value ainda correto? Atualizar se mudou
3. Out of Scope ainda válido? Revisar antes de iniciar V3

---
*Last updated: 2026-03-26 after initialization (V2.1 scope)*
