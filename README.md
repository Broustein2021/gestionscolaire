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

### Phase 6 — Formulaires Enseignants / Matières / Parents réellement fonctionnels

Suppression des trois derniers formulaires « maquette » (bouton « Enregistrer »
inerte, données jamais persistées) signalés par l'utilisateur.

- `lib/enseignants-create.ts` — création d'enseignant (client) : matricule auto
  `ENS-{seq}`, nouvelle tentative en cas de conflit (contrainte unique), et
  affectation pédagogique optionnelle matière × classe écrite dans
  `teacher_assignments` pour l'année scolaire courante (best-effort).
- `lib/matieres-create.ts` — création et modification de matière
  (`subjects.code` unique par école), coefficient et cycle.
- `lib/parents-create.ts` — création et modification d'un responsable
  (`guardians` : nom, prénoms, téléphone, email, profession, adresse ; RLS
  org_admin / directeur / secretaire).
- `components/enseignants/enseignants-table.tsx` — `EnseignantDialog` réel :
  identité, sexe, contact, date d'embauche, affectation optionnelle ; mode
  « Consulter » en lecture. Options propagées depuis
  `getEvaluationOptions()` (école, année, matières, classes).
- `components/matieres/matieres-table.tsx` — `MatiereDialog` réel (créer +
  Modifier), bouton fantôme « Archiver » supprimé.
- `components/parents/parents-list.tsx` — `ParentFormDialog` réel (créer +
  Modifier) ; champ « Lien de parenté » déplacé hors formulaire car il dépend
  du rattachement élève (`student_guardians`), pas du responsable.
- `lib/queries/parents.ts` — remonte aussi `guardians.address`.
- `lib/classes-create.ts` + `components/classes/classe-dialog.tsx` — **Classes** :
  l'ancien bouton « Nouvelle classe » était inerte ; création et modification
  réelles (nom, cycle, niveau via `levels` avec repli « autre niveau »,
  capacité, salle, professeur principal). Édition par carte sur la grille
  (bouton crayon).
- `lib/csv.ts` + `components/csv-export-button.tsx` — **exports CSV** réels
  remplaçant les boutons « Exporter » inertes : liste des élèves (Élèves) et
  journal des paiements (Finances), format compatible Excel (séparateur `;`,
  BOM UTF-8).
- États envoi / succès / erreur dans chaque dialogue, erreurs RLS traduites en
  français, `router.refresh()` après écriture.
- Vérifications : `tsc --noEmit` OK, `next build` OK, `/classes`, `/eleves`,
  `/finances`, `/enseignants`, `/matieres`, `/parents` répondent 200.

### Phase 5 — Notes / Évaluations / Bulletins branchés sur les vraies données

- `lib/queries/grades.ts` — **lectures** serveur : options réelles (classes,
  matières, enseignants, trimestres `terms`, établissement), évaluations de
  l'année (`assessments` avec classe/matière/enseignant/période/barème/statut),
  élèves + notes déjà saisies d'une évaluation (`getSaisieData`), et **bulletins
  réels** (`getBulletins`) : moyennes pondérées par matière et générale, notes
  ramenées sur 20, rangs, effectif, situation financière.
- `lib/grades-write.ts` — **écritures** client : création d'évaluation
  (`assessments`, statut `planifiee`), chargement de la feuille de notes et
  sauvegarde (`grades` en upsert par élève, gestion des absences, suppression
  des notes vidées) avec mise à jour du statut (brouillon → `saisie`,
  validation → `validee` verrouillée). Erreurs RLS traduites en français.
- `/evaluations` — page serveur + tableau avec recherche/filtres et boîte de
  dialogue de création réelle (options Supabase, états « Création… » / succès).
- `/notes` — saisie réelle par évaluation : sélecteurs période/classe/matière,
  pré-remplissage des notes déjà en base, boutons « Enregistrer le brouillon »
  / « Valider les notes » (verrouillage quand `validee`).
- `/bulletins` — page serveur avec sélection classe/période via query params
  (`?classe=&periode=`), bulletin imprimable calculé à partir des notes
  validées et saisies de la période.
- Vérifications : `tsc --noEmit` OK, `next build` OK, `/evaluations`, `/notes`,
  `/bulletins` répondent 200.

### Phase 4 — Finances branchées sur les vraies données

- `lib/queries/finances.ts` — agrégats réels : élèves avec situation
  (montant dû / payé / statut), catégories de frais, lignes de paiement
  (reçu, élève, mode, solde, enregistré par) et infos d'établissement.
- `lib/payments-create.ts` — enregistrement d'un encaissement + reçu
  (`REC-{année}-#####`), `recorded_by` → profil connecté, solde après paiement.
- `components/finances/*` — formulaire (élèves/catégories réels, situation
  affichée, envoi/erreurs RLS), document de reçu (infos établissement réelles),
  panneau avec filtres et aperçu/impression du reçu.
- `/finances` — page serveur ; vérifications tsc + build OK, `/finances` 200.

### Phase 3 — Tableau de bord branché sur les vraies données

- `lib/queries/dashboard.ts` — **agrégats réels** scopés école + année courante :
  KPIs scolaires (élèves, inscriptions, classes, enseignants actifs, matières),
  situation financière (attendu / encaissé / reste à recouvrer, taux de
  recouvrement, élèves à jour / en retard / partiel), encaissements mensuels
  (6 derniers mois, réels), répartition des effectifs par cycle, et
  **alertes calculées** (paiements en retard, paiements de la semaine,
  classes à capacité atteinte, évaluations sans notes saisies).
- `components/dashboard/charts.tsx` — graphiques alimentés par props
  (`FinanceChart`, `CycleChart`), avec états « aucune donnée ».
- `app/page.tsx` — page serveur : tout l&apos;ancien mock (`kpis`, `alertes`,
  `encaissementsMensuels`, `repartitionCycle`, `paiements`, `getEleve`) est
  remplacé par `getDashboard()`. En-tête avec l&apos;année et le nom de l&apos;école
  réels, « Derniers paiements » connectés à la base (n° de reçu, élève, motif,
  mode, statut de paiement).
- Vérifications : `tsc --noEmit` OK, `next build` OK, `/` répond 200.

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