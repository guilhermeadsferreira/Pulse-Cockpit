#!/usr/bin/env bash
set -euo pipefail

# ─── Pulse Cockpit — Release Script ───────────────────────────────────────────
# Uso: npm run release -- patch|minor|major [--force]
# Exemplo: npm run release -- patch          → bump + commit + tag + build + release
#          npm run release -- minor --force  → pula check de working tree limpo

FORCE=false
BUMP=""

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    patch|minor|major) BUMP="$arg" ;;
    *) echo "Argumento inválido: '$arg'. Use patch|minor|major [--force]."; exit 1 ;;
  esac
done

if [[ -z "$BUMP" ]]; then
  echo "Uso: npm run release -- patch|minor|major [--force]"
  exit 1
fi

# ── 1. Garantir working tree limpo (skip com --force) ────────────────────────
if [[ "$FORCE" == false ]] && [[ -n "$(git status --porcelain)" ]]; then
  echo "Erro: há mudanças não commitadas. Faça commit antes ou use --force."
  git status --short
  exit 1
fi

# ── 2. Bump de versão ─────────────────────────────────────────────────────────
CURRENT=$(node -p "require('./package.json').version")
NEW=$(npx --yes semver -i "$BUMP" "$CURRENT")

echo "Versão: $CURRENT → $NEW"

# Atualiza package.json
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  pkg.version = '$NEW';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# ── 3. Commit + tag ───────────────────────────────────────────────────────────
git add package.json
git commit -m "chore(release): v$NEW"
git tag "v$NEW"

echo "Commit e tag v$NEW criados."

# ── 4. Limpar dist/ para não incluir artefatos de versões anteriores ──────────
if [[ -d dist ]]; then
  echo "Limpando dist/..."
  rm -rf dist
fi

# ── 5. Build ──────────────────────────────────────────────────────────────────
echo "Buildando..."
npm run package

# ── 6. Push (antes da release, para a tag existir no remote) ──────────────────
git push && git push --tags

# ── 7. GitHub Release ─────────────────────────────────────────────────────────
echo "Criando release v$NEW no GitHub..."

ASSETS=()
while IFS= read -r f; do
  ASSETS+=("$f")
done < <(find dist -maxdepth 1 \( -name "*-${NEW}*.dmg" -o -name "*-${NEW}*-mac.zip" -o -name "*-${NEW}*.blockmap" -o -name "latest-mac.yml" \))

gh release create "v$NEW" \
  --title "v$NEW" \
  --notes "Release v$NEW" \
  "${ASSETS[@]}"

echo ""
echo "✓ Release v$NEW publicada com sucesso."
echo "  https://github.com/guilhermeadsferreira/Pulse-Cockpit/releases/tag/v$NEW"
