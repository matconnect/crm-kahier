#!/bin/sh

set -eu

PROJECT_DEV="${PROJECT_DEV:-crmkahierdev}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"

TOTAL_ERRORS=0
OVERALL_STATUS=0

compose_exec() {
    service="$1"
    shift
    docker compose -p "$PROJECT_DEV" -f "$COMPOSE_FILE" exec -T "$service" sh -lc "$*"
}

count_ts_errors() {
    grep -Eo 'error TS[0-9]+:' "$1" | wc -l | tr -d ' '
}

run_target() {
    label="$1"
    service="$2"
    command="$3"
    tmp_file="$(mktemp)"
    status="PASS"

    if ! compose_exec "$service" "$command" >"$tmp_file" 2>&1; then
        status="FAIL"
        OVERALL_STATUS=1
    fi

    errors="$(count_ts_errors "$tmp_file")"
    TOTAL_ERRORS=$((TOTAL_ERRORS + errors))

    cat "$tmp_file"
    printf '%-20s | %6s | %s\n' "$label" "$errors" "$status"

    rm -f "$tmp_file"
}

printf '%-20s | %6s | %s\n' "Typecheck target" "Errors" "Status"
printf '%s\n' '---------------------+--------+--------'

run_target "client" "client" "cd /app/apps/client && pnpm check-types"
run_target "ui" "client" "cd /app/packages/ui && pnpm exec tsc --noEmit"
run_target "billing-service" "billing" "cd /app/apps/api/billing && VITEST_DIR=\"\$(find /app/node_modules/.pnpm -path \"*/node_modules/vitest\" | head -n 1)\" && test -n \"\$VITEST_DIR\" && ln -snf \"\$VITEST_DIR\" node_modules/vitest && pnpm exec tsc --noEmit"
run_target "company-service" "company" "cd /app/apps/api/company && pnpm exec tsc --noEmit"
run_target "crm-service" "crm" "cd /app/apps/api/crm && pnpm exec tsc --noEmit"
run_target "api-gateway" "gateway" "cd /app/apps/api/gateway && pnpm exec tsc --noEmit"
run_target "kahier-service" "kahier" "cd /app/apps/api/kahier && pnpm exec tsc --noEmit"

printf '\nTypeScript errors: %s\n' "$TOTAL_ERRORS"

exit "$OVERALL_STATUS"
