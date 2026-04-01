---
phase: 01-prompt-refinements
plan: "04"
subsystem: gemini-preprocessing
tags: [prompt, gemini, mode-detection, speaker-confidence, emotional-content]
dependency_graph:
  requires: []
  provides: [PRMT-13, PRMT-14, PRMT-15]
  affects: [gemini-preprocessing.prompt.ts]
tech_stack:
  added: []
  patterns: [content-based-mode-detection, optional-section-in-prompt, speaker-confidence-metadata]
key_files:
  created: []
  modified:
    - src/main/prompts/gemini-preprocessing.prompt.ts
decisions:
  - "detectPreprocessingMode usa conteudo como sinal primario e filename como fallback — robusto para nomes de arquivo ambiguos como 'Sync com Ana'"
  - "speaker_confidence e optional na validacao (isValidResult nao exige) para backward-compat com respostas antigas"
  - "Observacoes de Tom e secao opcional — instrucao explicita para OMITIR quando nao ha sinais, evitando invencao"
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-31"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
requirements:
  - PRMT-13
  - PRMT-14
  - PRMT-15
---

# Phase 01 Plan 04: Gemini Preprocessing — Mode Detection, Emotional Content, Speaker Confidence

**One-liner:** detectPreprocessingMode por contagem de speakers no conteudo, speaker_confidence como metadata no resultado, e secao opcional Observacoes de Tom em full mode para capturar sinais emocionais coletivos.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | PRMT-13/15: Mode detection por conteudo e speaker_confidence | f1f4add | src/main/prompts/gemini-preprocessing.prompt.ts |
| 2 | PRMT-14: Emotional content em full mode | 3c77ae2 | src/main/prompts/gemini-preprocessing.prompt.ts |

## What Was Built

### PRMT-13 — Mode Detection por Conteudo
`detectPreprocessingMode` agora aceita `contentPreview?: string` como segundo parametro opcional. Quando disponivel, analisa as primeiras 500 chars contando speakers distintos via regex `^[A-ZÀ-Ú][a-zA-ZÀ-ú\s]{1,30}:`. Com 3+ speakers retorna `full`, com 1-2 speakers retorna `light`. Quando nao detecta speakers pelo padrao, cai para analise por filename (comportamento original preservado). Chamadas existentes sem segundo parametro continuam funcionando sem alteracao.

### PRMT-15 — Speaker Confidence
`GeminiPreprocessingResult.metadados` inclui `speaker_confidence: 'alta' | 'media' | 'baixa'`. O campo e instruido nos dois prompts (light e full) com criterio claro: `alta` = cada fala tem nome/label claro e consistente; `media` = maioria identificada, algumas ambiguidades; `baixa` = sem identificacao ou atribuicao inconsistente. `isValidResult` nao foi alterada — campo e optional para backward-compat.

### PRMT-14 — Emotional Content em Full Mode
`buildFullPrompt` recebeu duas mudancas:
1. Secao `### 2. PRESERVAR`: nova regra para preservar sinais emocionais coletivos relevantes (frustracao, excitacao, tensao, resistencia) com exemplos contextuais de gestao de times.
2. Formato `texto_limpo`: nova secao `## Observacoes de Tom` opcional, com instrucao explicita de OMITIR quando nao ha sinais — evita invencao. Exemplos concretos incluidos.
`buildLightPrompt` nao foi alterada (preservacao emocional ja existente na secao PRESERVAR INTEGRALMENTE).

## Verification Results

```
speaker_confidence count: 3   (interface + 2 prompts)
contentPreview count: 3       (parametro + 2 usos na funcao)
Observacoes de Tom count: 1   (apenas full mode)
sinais emocionais coletivos count: 2
```

Todos os criterios de aceitacao atendidos.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- [x] `src/main/prompts/gemini-preprocessing.prompt.ts` exists and was modified
- [x] Commit f1f4add exists (Task 1)
- [x] Commit 3c77ae2 exists (Task 2)
- [x] All grep counts >= 1 for required patterns
