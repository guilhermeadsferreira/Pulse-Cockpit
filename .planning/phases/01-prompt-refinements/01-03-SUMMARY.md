---
phase: 01-prompt-refinements
plan: "03"
subsystem: autoavaliacao-prompt
tags: [prompt, autoavaliacao, role-calibration, coaching]
dependency_graph:
  requires: []
  provides: [autoavaliacao-calibracao-role, autoavaliacao-desafios-observados]
  affects: [autoavaliacao.prompt.ts, AutoavaliacaoAIResult]
tech_stack:
  added: []
  patterns: [role-calibrated-prompt, conditional-markdown-section]
key_files:
  created: []
  modified:
    - src/main/prompts/autoavaliacao.prompt.ts
decisions:
  - desafios_observados como array condicional no render (omitido se vazio) para nao poluir o markdown de usuarios sem desafios registrados
  - Calibracao por role embutida diretamente na instrucao do campo (sem logica TypeScript) para manter simplicidade — o LLM interpreta o managerRole passado via params
metrics:
  duration: "1m"
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_modified: 1
---

# Phase 01 Plan 03: Autoavaliacao — Calibracao por Role e Desafios Observados

**One-liner:** Calibracao de como_demonstrei_valores por tipo de papel (manager vs IC) e campo desafios_observados obrigatorio com exemplos comportamentais especificos.

## What Was Built

Dois refinamentos no `autoavaliacao.prompt.ts` (PRMT-11 e PRMT-12):

**PRMT-11 — Calibracao por tipo de role:**
A instrucao do campo `como_demonstrei_valores` agora distingue explicitamente dois cenarios:
- **GESTAO** (Engineering Manager, Tech Lead, Head of, Director): comportamentos de lideranca organizacional — crescimento do time, decisoes sob incerteza, alinhamento com stakeholders, seguranca psicologica, direcao tecnica de produto.
- **IC** (Software Engineer, Senior Engineer, Staff Engineer, Principal, Arquiteto): comportamentos de impacto tecnico e colaboracao — qualidade tecnica, compartilhamento de conhecimento, code reviews, ownership de problemas complexos, decisoes de arquitetura.

A instrucao proibe explicitamente usar eixos genericos identicos para ambos os casos.

**PRMT-12 — Campo desafios_observados:**
- Adicionado a interface `AutoavaliacaoAIResult` como `desafios_observados: string[]`
- Adicionado ao JSON template do prompt (entre como_demonstrei_valores e como_me_vejo_no_futuro)
- Marcado como OBRIGATORIO quando ha evidencia de dificuldades — com estrutura `[AREA] + [EVIDENCIA] + [IMPACTO]`
- Dois exemplos concretos: gestao de prioridades sob pressao e comunicacao ascendente
- Proibe frases genericas sem evidencia comportamental observada
- Render markdown condicional: secao "Desafios Observados" aparece apenas se o array nao estiver vazio

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Calibrar como_demonstrei_valores por tipo de role (PRMT-11) | e90aeda |
| 2 | Adicionar campo desafios_observados a autoavaliacao (PRMT-12) | fe697a4 |

## Verification Results

```
desafios_observados count: 5 (>= 1 required)
GESTAO|Engineering Manager count: 1 (>= 1 required)
OBRIGATORIO quando ha evidencia count: 1 (>= 1 required)
```

Todos os criterios de aceite atendidos.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - ambas as implementacoes sao funcionais e wired na interface e no render.
