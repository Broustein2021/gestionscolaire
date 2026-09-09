# GESTION-GLOBALE-SCOLAIRE

Application web de gestion scolaire (élèves, inscriptions, classes, enseignants,
finances) pour établissements privés — construite avec **Next.js (App Router)**,
**Supabase** (PostgreSQL + Auth) et **shadcn/ui**.

> Démo de démonstration pour présentation aux prospects : UI complète + données
> réelles en base Supabase, sécurisées par la RLS selon le rôle connecté
> (directeur, secrétariat, comptable, enseignant).

---

## Fonctionnalités

| Section                  | Contenu                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| **Tableau de bord**      | KPIs de l'établissement, graphiques, activité récente                     |
| **Élèves**               | Liste, recherche, fiche détaillée (responsables, inscriptions, paiements) |
| **Inscriptions**         | Assistant 5 étapes branché sur Supabase, tableau de bord des dossiers     |
| **Classes / Niveaux**    | Liste, fiches par classe, effectifs réels de l'année                      |
| **Enseignants**          | Annuaire des enseignants                                                  |
| **Matières**             | Catalogue des matières                                                    |
| **Parents**              | Annuaire des responsables avec liens vers leurs enfants                   |
| **Finances / Paiements** | Frais, encaissements, reçus                                               |
| **Notes & Bulletins**    | Saisie des notes, évaluations, bulletins                                  |
| **Configuration**        | Paramètres de l'établissement                                             |
| **Authentification**     | Connexion par rôle (BetterAuth/Supabase), contexte école par utilisateur  |

---

## Pile technique

- **Next.js 16.3** (App Router, React 19, Turbopack) · TypeScript strict
- **Supabase** (`@supabase/ssr`) : PostgreSQL + Auth + Row Level Security (RLS)
- **shadcn/ui** + Tailwind CSS v4 (composants : dialog, select, table, badge…)
- **lucide-react** (icônes), **recharts** (graphiques), **zod@4** (validation)
- Gestion de paquets : `pnpm`
- Déploiement cible : **Vercel**

---

## Démarrage rapide

Prérequis : Node.js ≥ 20, pnpm.

```bash
pnpm install
cp .env.example .env.local   # puis renseigner les deux clés Supabase
pnpm dev
```

Variables requises dans `.env.local` :

| Variable                               | Description                          |
| -------------------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL du projet Supabase (ex. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique (publishable/anon)      |

> Sur Vercel, ces deux variables doivent être déclarées dans Settings → Environment
> Variables avant chaque redéploiement.

**Ports** : le front se lance sur `http://localhost:3000` par défaut. Si le port
3000 est occupé par un autre projet sur le poste, le lancer explicitement sur un
autre port :

```bash
pnpm dev -- -p 3100   # → http://localhost:3100
```

---

## Architecture

### Sécurité (RLS — Row Level Security)

Toutes les tables métier sont protégées par la RLS. Chaque compte est rattaché à
**un seul établissement** (`profiles.school_id`) ; le contexte de l'école courante
est résolu côté serveur via `lib/queries/school-context.ts`. Les rôles autorisés
par action (extraits du dump restauré) :

| Action                          | Rôles autorisés                                   |
| ------------------------------- | ------------------------------------------------ |
| Lire la scolarité de l'école    | tous les membres de l'école (org)                |
| Écrire élèves / inscriptions    | `org_admin`, `directeur`, `secretaire`           |
| Écrire paiements / reçus        | `org_admin`, `directeur`, `comptable`            |
| Écrire notes / évaluations      | `org_admin`, `directeur`, `enseignant`           |

**Conséquence produit** : un acompte saisi par le secrétariat est enregistré en
*best-effort* — le dossier est créé même si l'encaissement est refusé par la RLS,
avec un avertissement affiché à l'utilisateur.

### Flux de lecture / écriture

- **Lectures** : requêtes serveur (`lib/queries/*.ts`) via le client
  `@supabase/ssr` (`lib/supabase/server.ts`), le contexte école étant résolu par
  le middleware/`school-context.ts`.
- **Écritures** : côté client (composants `'use client'`) via
  `lib/supabase/client.ts` — les contraintes et déclencheurs PostgreSQL restent
  la source de vérité (rôles, unicité, périmètre école/année).

### Règles métier (base de données)

- **Matricule élève** : `ELV-{année}-{seq}` (ex. `ELV-2025-001`), unique par
  école — généré côté app avec nouvelle tentative en cas de conflit (`23505`).
- **Reçu de paiement** : `REC-{année}-{seq}` (ex. `REC-2025-00001`).
- **Trigger `refresh_enrollment_payment_status`** : recalcule automatiquement
  `amount_paid` et `payment_status` d'une inscription après chaque paiement.
- **Trigger `validate_enrollment_scope`** : une inscription ne peut cibler
  qu'une classe de la même école et de la même année académique.
- **`payments.recorded_by`** référence `profiles(id)` (pas `auth.users.id`).

---

## Sauvegarde & restauration (outillage)

Le projet Supabase (données, schéma, RLS, fonctions, triggers) est restauré à
partir d'un dump de production via un script de génération :

```
scripts/build-restore-sql.mjs
```

Ce script relit le dump (`*.backup` / SQL exporté) et produit :

- `restaurer-donnees.sql` — schéma + RLS + fonctions/triggers + **données**
  (comptes `auth.users`/`auth.identities` fusionnés en tête avec
  `ON CONFLICT DO NOTHING`, lignes triées parents-avant-enfants, sans
  `ALTER DEFAULT PRIVILEGES`) ;
- `restaurer-comptes.sql` — comptes d'authentification.

**Procédure** : exécuter `restaurer-donnees.sql` dans l'éditeur SQL Supabase
(sans erreur attendue), puis vérifier l'état via l'API (toutes les tables
répondent, la RLS bloque l'`anon`). Les règles de génération (ordres, filtres,
numérotation, échappement des apostrophes) sont documentées dans le script.

---

## Journal des travaux

Historique des mises en œuvre (du plus récent au plus ancien) :

### Phase 2 — Inscriptions branchées sur les vraies données (`21367d1`)

- `lib/queries/enrollments.ts` — **lectures** serveur : options d'inscription
  (année courante, classes avec effectifs réels, responsables disponibles, frais)
  et inscriptions validées de l'année.
- `lib/enroll-create.ts` — **écriture** client : enregistrement complet d'une
  inscription en séquence — élève (matricule auto + retry `23505`) → responsable
  (existant ou nouveau) → lien `student_guardians` → inscription (validee,
  `is_new_student`, montants) → acompte (paiement + reçu, *best-effort* selon la
  RLS). Messages d'erreur en français.
- `app/inscriptions/page.tsx` — page serveur avec vraies données + 4 statistiques
  (dossiers validés, nouveaux, réinscriptions, frais engagés).
- `components/inscriptions/inscriptions-table.tsx` — filtre/recherche sur les
  inscriptions réelles.
- `components/inscriptions/inscription-wizard.tsx` — assistant 5 étapes
  (Élève → Responsable → Scolarité → Finances → Confirmation) branché sur
  Supabase : états « Enregistrement… », écran de succès (matricule, acompte,
  solde), avertissements d'encaissement, gestion d'erreurs RLS.
- Vérifications : `tsc --noEmit` OK, `next build` OK, `/inscriptions` répond 200.

### Phase 1 — Build sain + restauration Supabase (`aa49af8`)

- Correction du codage UTF-8 des sources, schémas `zod` stricts,
  nettoyage de `next.config.mjs`.
- Création de `scripts/build-restore-sql.mjs` + génération et exécution de
  `restaurer-donnees.sql` **sans erreur** ; vérification REST des 12 tables.
- Ajout `AGENTS.md` (règles Next.js 16) et `CLAUDE.md`.
- Synchronisation Git (`origin/main`).

### Migrations des sections vers les vraies données

- **`/enseignants`** (`a2ed766`) · **`/classes` + `/classes/[id]`** (`e6c1604`)
- **`/matieres`** (`89a68e3`) · **`/eleves`** (`6da12de`) · **`/parents`**
  (`4e175ff`) + isolation du composant client (`3140a28`)

### Authentification & structure (`feature/authentication`)

- Connexion rôle + contexte école, fournisseur d'école, corrections UI
  (`3778cf1`, `04437e3`, PRs #1 et #2).

### Prototype initial (`1c02e7a`)

- UI Next.js complète avec données **mockées** (`lib/data.ts`), sans backend.

---

## Scripts npm

| Commande        | Rôle                                  |
| --------------- | ------------------------------------- |
| `pnpm dev`      | Serveur de développement (Next.js)    |
| `pnpm build`    | Build de production (Turbopack)       |
| `pnpm start`    | Serveur du build (`next start`)       |
| `pnpm lint`     | ESLint                               |