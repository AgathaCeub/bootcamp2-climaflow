#!/usr/bin/env bash
set -euo pipefail
# Executar depois da primeira rodada do CI, com gh autenticado como administrador.
repo="AgathaCeub/bootcamp2-climaflow"
command -v gh >/dev/null || { echo 'Instale a GitHub CLI e execute gh auth login.'; exit 1; }
arquivo=$(mktemp)
trap 'rm -f "$arquivo"' EXIT
cat > "$arquivo" <<'JSON'
{
  "required_status_checks": {"strict": true, "contexts": ["Testes", "Container"]},
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
gh api --method PUT "repos/$repo/branches/main/protection" --input "$arquivo" >/dev/null
echo 'main protegida: uma aprovação e checks Testes e Container obrigatórios.'
