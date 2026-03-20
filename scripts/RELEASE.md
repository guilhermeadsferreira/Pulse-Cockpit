# Release — Pulse Cockpit

## Invocação

```bash
npm run release -- patch|minor|major
```

| Tipo | Exemplo |
|------|---------|
| `patch` | `0.1.0` → `0.1.1` — bugfix |
| `minor` | `0.1.0` → `0.2.0` — feature nova |
| `major` | `0.1.0` → `1.0.0` — breaking change |

---

## O que o script faz

### 1. Guarda de segurança
Verifica se o working tree está limpo. Se houver arquivos modificados ou não commitados, aborta imediatamente. O release sempre parte de um estado conhecido.

### 2. Bump semântico
Lê a versão atual do `package.json` e usa o `semver` (via npx) para calcular a próxima versão conforme o tipo informado. Atualiza o `package.json` via Node inline.

### 3. Commit + tag git
Cria um commit `chore(release): vX.Y.Z` e uma tag git `vX.Y.Z` apontando para ele. O push fica para a etapa final.

### 4. Build
Roda `npm run package` e gera os artefatos de distribuição em `dist/`:
- `*.dmg` — instalador macOS
- `*.blockmap` — diff incremental para o auto-updater
- `latest-mac.yml` — manifesto lido pelo auto-updater do Electron

### 5. GitHub Release
Usa o `gh` CLI para criar a release no GitHub com todos os artefatos encontrados em `dist/`. O `latest-mac.yml` é o arquivo que sinaliza ao Electron que existe uma versão nova disponível.

### 6. Push
Faz push do commit e das tags para o remote. Executado por último — só acontece se o build e a criação da release no GitHub tiverem sido bem-sucedidos.

---

## Pré-requisitos

- `gh` CLI instalado e autenticado (`gh auth login`)
- `git` com remote configurado
- Working tree limpo antes de rodar

---

## Fluxo resumido

```
git status limpo?
  └─ sim → bump package.json → commit + tag → npm run package → gh release create → git push
  └─ não → abort
```
