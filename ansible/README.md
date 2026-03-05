# Déploiement Ansible + Vault

## Pré-requis

- Ansible >= 2.15
- Docker et Docker Compose v2 sur la machine cible
- Accès SSH depuis ta machine de contrôle

## 1. Installer les collections

```bash
ansible-galaxy collection install -r requirements.yml
```

## 2. Configurer l'inventaire

Édite `inventory/hosts.ini` avec ton host réel.

## 3. Préparer les secrets Vault

```bash
cp group_vars/all/vault.example.yml group_vars/all/vault.yml
ansible-vault encrypt group_vars/all/vault.yml
```

## 4. Déployer

```bash
ansible-playbook -i inventory/hosts.ini playbook.yml --ask-vault-pass
```

## 5. Mettre à jour les secrets

```bash
ansible-vault edit group_vars/all/vault.yml
ansible-playbook -i inventory/hosts.ini playbook.yml --ask-vault-pass
```

## Notes

- Le playbook rend `{{ project_root }}/.env` depuis le template Jinja2.
- Les réseaux Docker externes `traefik-net` et `app-net` sont créés si absents.
- Le code source est synchronisé vers `{{ project_root }}` avec exclusion de `.git`, `node_modules`, `.turbo`.
