# Service Databases Split

This project now supports a dedicated database per backend service:

- `company-service` (and `client` auth/register): `crm-kahier-company`
- `crm-service`: `crm-kahier-crm`

Prisma is now split by service:

- `apps/company-service/prisma/schema.prisma` -> `packages/db-company/generated/client`
- `apps/crm-service/prisma/schema.prisma` -> `packages/db-crm/generated/client`

## Required env vars

- `apps/company-service/.env`
  - `DATABASE_URL`
  - `INTERNAL_SERVICE_TOKEN`
- `apps/crm-service/.env`
  - `DATABASE_URL`
  - `COMPANY_SERVICE_URL`
  - `INTERNAL_SERVICE_TOKEN`
- `apps/client/.env`
  - `DATABASE_URL` (must point to company DB)

`INTERNAL_SERVICE_TOKEN` must be the same in `company-service` and `crm-service`.

## Internal sync

`crm-service` now syncs `Company` and `User` snapshots from `company-service` through internal endpoints:

- `GET /internal/context/:userId`
- `GET /internal/company/:companyId/users`

These endpoints require `x-internal-token`.

## Data transfer from old shared DB

1. Initialize schemas on the two target databases (run Prisma migrations on both DBs).
   - `DATABASE_URL=mysql://.../crm-kahier-company pnpm --dir apps/company-service exec prisma generate`
   - `DATABASE_URL=mysql://.../crm-kahier-crm pnpm --dir apps/crm-service exec prisma generate`
2. Run:

```bash
SOURCE_DATABASE_URL="mysql://.../crm-kahier" \
COMPANY_DATABASE_URL="mysql://.../crm-kahier-company" \
CRM_DATABASE_URL="mysql://.../crm-kahier-crm" \
pnpm db:split-services
```

The script copies:

- company DB: `Company`, `User`
- crm DB: `Company`, `User`, `Client`, `ClientOwner`, `ClientContact`, `ClientInteraction`, `ClientDocument`, `_ClientInteractionCollaborators`
