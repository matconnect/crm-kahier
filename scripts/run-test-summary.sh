#!/bin/sh

set -eu

PROJECT_DEV="${PROJECT_DEV:-crmkahierdev}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"

TOTAL_PASSED=0
TOTAL_FAILED=0
OVERALL_STATUS=0
ROWS_FILE="$(mktemp)"

compose_exec() {
    service="$1"
    shift
    docker compose -p "$PROJECT_DEV" -f "$COMPOSE_FILE" exec -T "$service" sh -lc "$*"
}

extract_test_counts() {
    awk '
        /^[[:space:]]*Tests[[:space:]]+/ {
            for (i = 1; i <= NF; i++) {
                if ($i == "passed") passed = $(i - 1);
                if ($i == "failed") failed = $(i - 1);
            }
        }
        END {
            if (passed == "") passed = 0;
            if (failed == "") failed = 0;
            print passed, failed;
        }
    ' "$1"
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

    cat "$tmp_file"

    set -- $(extract_test_counts "$tmp_file")
    passed="$1"
    failed="$2"
    TOTAL_PASSED=$((TOTAL_PASSED + passed))
    TOTAL_FAILED=$((TOTAL_FAILED + failed))

    printf '%-20s | %6s | %6s | %s\n' "$label" "$passed" "$failed" "$status" >>"$ROWS_FILE"

    rm -f "$tmp_file"
}

run_target "client" "client" "cd /app/apps/client && pnpm test"
run_target "billing-service" "billing" "cd /app/apps/api/billing && VITEST_BIN=\"\$(find /app/node_modules/.pnpm -path \"*/node_modules/vitest/vitest.mjs\" | head -n 1)\" && test -n \"\$VITEST_BIN\" && node \"\$VITEST_BIN\" run"
run_target "company-service" "company" "cd /app/apps/api/company && pnpm test"
run_target "crm-service" "crm" "cd /app/apps/api/crm && pnpm test"
run_target "api-gateway" "gateway" "cd /app/apps/api/gateway && pnpm test"
run_target "kahier-service" "kahier" "cd /app/apps/api/kahier && pnpm test"

printf '\n'
printf '%-20s | %6s | %6s | %s\n' "Test target" "Passed" "Failed" "Status"
printf '%s\n' '---------------------+--------+--------+--------'
cat "$ROWS_FILE"
printf '\nPassed tests: %s | Failed tests: %s\n' "$TOTAL_PASSED" "$TOTAL_FAILED"

rm -f "$ROWS_FILE"

exit "$OVERALL_STATUS"
