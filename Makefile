SHELL := /bin/sh

-include .deploy.env

PROJECT_DEV ?= crmkahierdev
PROJECT_PROD ?= crmkahierprod
COMPOSE_DEV := docker compose -p $(PROJECT_DEV) -f docker-compose.dev.yml
COMPOSE_PROD := docker compose -p $(PROJECT_PROD) -f docker-compose.yml

DEPLOY_PORT ?= 22
DEPLOY_PATH ?= /var/www/crm-kahier
DEPLOY_SSH_KEY ?=
SSH_KEY_OPT := $(if $(DEPLOY_SSH_KEY),-i $(DEPLOY_SSH_KEY),)
SSH := ssh $(SSH_KEY_OPT) -p $(DEPLOY_PORT) $(DEPLOY_USER)@$(DEPLOY_HOST)
RSYNC_SSH := ssh $(SSH_KEY_OPT) -p $(DEPLOY_PORT)
RSYNC_EXCLUDES := \
	--exclude .git \
	--exclude node_modules \
	--exclude .pnpm-store \
	--exclude .next \
	--exclude dist \
	--exclude coverage \
	--exclude .turbo \
	--exclude .deploy.env \
	--exclude secrets

.PHONY: help
help:
	@printf '%s\n' \
		'Targets disponibles:' \
		'  make test-client        Lance Vitest dans le conteneur client dev' \
		'  make lint-client        Lance ESLint dans le conteneur client dev' \
		'  make typecheck-client   Lance le typecheck client dans Docker' \
		'  make check              Lance test + typecheck client' \
		'  make check-strict       Lance test + lint + typecheck client' \
		'  make ps-dev            Liste les conteneurs dev' \
		'  make logs-dev          Suit les logs dev' \
		'  make restart-dev       Redemarre la stack dev' \
		'  make release-dev       Build et relance la stack dev sur ce serveur' \
		'  make release-prod      Build et relance la stack prod sur ce serveur' \
		'  make deploy-dev        Check local, rsync SSH, release dev distant' \
		'  make deploy-prod       Check local, rsync SSH, release prod distant'

.PHONY: test test-client
test: test-client
test-client:
	$(COMPOSE_DEV) exec -T client sh -lc 'cd /app/apps/client && pnpm test'

.PHONY: lint lint-client
lint: lint-client
lint-client:
	$(COMPOSE_DEV) exec -T client sh -lc 'cd /app/apps/client && pnpm lint'

.PHONY: typecheck typecheck-client
typecheck: typecheck-client
typecheck-client:
	$(COMPOSE_DEV) exec -T client sh -lc 'cd /app/apps/client && pnpm check-types'

.PHONY: check
check: test-client typecheck-client

.PHONY: check-strict
check-strict: test-client lint-client typecheck-client

.PHONY: ps-dev ps-prod
ps-dev:
	$(COMPOSE_DEV) ps
ps-prod:
	$(COMPOSE_PROD) ps

.PHONY: logs-dev logs-prod
logs-dev:
	$(COMPOSE_DEV) logs -f --tail=120
logs-prod:
	$(COMPOSE_PROD) logs -f --tail=120

.PHONY: up-dev up-prod
up-dev:
	$(COMPOSE_DEV) up -d --remove-orphans
up-prod:
	$(COMPOSE_PROD) up -d --remove-orphans

.PHONY: restart-dev restart-prod
restart-dev:
	$(COMPOSE_DEV) restart
restart-prod:
	$(COMPOSE_PROD) restart

.PHONY: build-dev build-prod
build-dev:
	$(COMPOSE_DEV) build
build-prod:
	$(COMPOSE_PROD) build

.PHONY: release-dev release-prod
release-dev:
	$(COMPOSE_DEV) up -d --build --remove-orphans
	$(COMPOSE_DEV) ps
release-prod:
	$(COMPOSE_PROD) up -d --build --remove-orphans
	$(COMPOSE_PROD) ps

.PHONY: require-deploy-env
require-deploy-env:
	@test -n "$(DEPLOY_HOST)" || (echo "DEPLOY_HOST manquant dans .deploy.env"; exit 1)
	@test -n "$(DEPLOY_USER)" || (echo "DEPLOY_USER manquant dans .deploy.env"; exit 1)
	@test -n "$(DEPLOY_PATH)" || (echo "DEPLOY_PATH manquant dans .deploy.env"; exit 1)

.PHONY: sync-remote
sync-remote: require-deploy-env
	rsync -az --delete $(RSYNC_EXCLUDES) -e "$(RSYNC_SSH)" ./ $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_PATH)/

.PHONY: deploy-dev deploy-prod
deploy-dev: check sync-remote
	$(SSH) 'cd $(DEPLOY_PATH) && make release-dev'
deploy-prod: check sync-remote
	$(SSH) 'cd $(DEPLOY_PATH) && make release-prod'
