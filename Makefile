SHELL := /bin/sh
.DEFAULT_GOAL := help

-include .deploy.env

ENV ?= dev
PROJECT_DEV ?= crmkahierdev
PROJECT_PROD ?= crmkahierprod
COMPOSE_DEV := docker compose -p $(PROJECT_DEV) -f docker-compose.dev.yml

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

ifeq ($(ENV),prod)
PROJECT := $(PROJECT_PROD)
COMPOSE_FILE := docker-compose.yml
else ifeq ($(ENV),dev)
PROJECT := $(PROJECT_DEV)
COMPOSE_FILE := docker-compose.dev.yml
else
$(error ENV must be dev or prod)
endif

COMPOSE := docker compose -p $(PROJECT) -f $(COMPOSE_FILE)

.PHONY: help test release deploy

help:
	@printf '%s\n' \
		'Commandes disponibles:' \
		'  make test                 Lance les tests avec un récapitulatif final' \
		'  make release ENV=dev      Rebuild et relance la stack dev' \
		'  make release ENV=prod     Rebuild et relance la stack prod' \
		'  make deploy ENV=dev       Vérifie, synchronise et déploie en dev' \
		'  make deploy ENV=prod      Vérifie, synchronise et déploie en prod'

test:
	./scripts/run-test-summary.sh

release:
	$(COMPOSE) up -d --build --remove-orphans
	$(COMPOSE) ps

deploy: test
	@test -n "$(DEPLOY_HOST)" || (echo "DEPLOY_HOST manquant dans .deploy.env"; exit 1)
	@test -n "$(DEPLOY_USER)" || (echo "DEPLOY_USER manquant dans .deploy.env"; exit 1)
	@test -n "$(DEPLOY_PATH)" || (echo "DEPLOY_PATH manquant dans .deploy.env"; exit 1)
	rsync -az --delete $(RSYNC_EXCLUDES) -e "$(RSYNC_SSH)" ./ $(DEPLOY_USER)@$(DEPLOY_HOST):$(DEPLOY_PATH)/
	$(SSH) 'cd $(DEPLOY_PATH) && make release ENV=$(ENV)'
