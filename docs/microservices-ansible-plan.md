# CRM Kahier - Analyse micro-services + Ansible Vault

## 1) Etat actuel (diagnostic)

Le repo est un **monorepo Turborepo** avec:
- `apps/client` (Next.js)
- `apps/api-gateway` (gateway HTTP)
- `apps/crm-service` (clients/contacts/interactions/documents)
- `apps/company-service` (company/users/profile)
- `apps/kahier-service` (intégration Kahier)
- `packages/db` (Prisma partagé)
- `prisma/` (schéma et migrations)

Points de couplage forts:
- Le front accède directement à la DB via `@kahier/db` dans l'auth (`apps/client/auth.ts`, `apps/client/app/api/auth/register/route.ts`).
- L'API est un modulith (routes `clients`, `profile`, `company`, `users`, `kahier`) derrière un seul service Express.
- Les secrets et endpoints dépendent d'un `.env` unique.

## 2) Découpage micro-services recommandé

Découper par domaines métiers (bounded contexts), en gardant une migration progressive:

1. `identity-service`
- Authentification, inscription, gestion user de base.
- Prend ce qui est aujourd'hui dans le front (`NextAuth` + route register) et le sort vers API dédiée.

2. `crm-service`
- Clients, contacts, interactions, documents, statistiques CRM.
- Base: `clients.controller.ts` + services associés.

3. `company-service`
- Gestion entreprise et rôles (admin/manager/user).
- Base: routes `company` et `users`.

4. `integration-kahier-service`
- Relais vers API Kahier (zone, plannings, tasks).
- Base: `kahier.controller.ts` + `kahier.service.ts`.

5. `gateway` (optionnel au début)
- Point d'entrée unique (authn/authz, routage, rate-limit).
- Traefik peut servir de gateway L7 initiale pour limiter la complexité.

## 3) Stratégie de migration (sans big-bang)

1. Extraire d'abord `integration-kahier-service` (faible dépendance DB).
2. Extraire ensuite `company-service` (surface fonctionnelle limitée).
3. Extraire `identity-service` et supprimer l'accès DB direct depuis `apps/client`.
4. Extraire `crm-service` en dernier (plus gros domaine).
5. Introduire des contrats d'API versionnés (`/v1`).

## 4) Données et base de données

Court terme:
- Garder une base MySQL partagée pour réduire le risque.

Moyen terme:
- Isoler par schéma ou par base selon service.
- Appliquer le principe "database per service" progressivement.

## 5) Ansible + Vault (implémenté dans ce repo)

Ajouts:
- `ansible/playbook.yml` : déploiement stack compose + rendu `.env`.
- `ansible/templates/crm-kahier.env.j2` : template env injecté depuis Vault.
- `ansible/group_vars/all/main.yml` : variables non sensibles.
- `ansible/group_vars/all/vault.example.yml` : exemple de secrets à chiffrer.
- `ansible/inventory/hosts.ini` : inventaire de base.
- `ansible/requirements.yml` : collections nécessaires.

Flux de secret:
1. Créer `ansible/group_vars/all/vault.yml` depuis l'exemple.
2. Chiffrer: `ansible-vault encrypt ansible/group_vars/all/vault.yml`
3. Déployer avec mot de passe Vault (ou fichier id).
4. Le playbook génère `/opt/crm-kahier/.env` côté cible (permissions `0600`).

## 6) Commandes de run

Depuis la racine:

```bash
ansible-galaxy collection install -r ansible/requirements.yml
cp ansible/group_vars/all/vault.example.yml ansible/group_vars/all/vault.yml
ansible-vault encrypt ansible/group_vars/all/vault.yml
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbook.yml --ask-vault-pass
```

## 7) Risques actuels à traiter avant extraction

- `KAHIER_API_KEY` a une valeur de fallback codée en dur dans `apps/kahier-service/app/src/services/kahier.service.ts`.
- Auth couplée au front (`apps/client/auth.ts`) empêche un vrai cloisonnement service.
- `README.md` racine ne documente pas l'architecture réelle ni l'exploitation.
