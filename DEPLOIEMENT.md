# Notice de déploiement — GESTION SCOLAIRE

Le projet est une application **Next.js (App Router)** branchée sur **Supabase**.
Le déploiement se fait sur **Vercel** (il est déjà configuré pour ça dans le
code : middleware, `next.config.mjs`…). Vous n'avez **rien à installer sur
votre machine** : tout se fait dans votre navigateur, sur le site Vercel.

Temps total : **5 à 10 minutes**.

---

## 1. Avant de commencer

- Un compte [Vercel](https://vercel.com) (gratuit).
- Le code déjà poussé sur GitHub : dépôt
  `Broustein2021/GESTIONGLOBALESCOLAIRE` (branche `main`).
- L'application Supabase est déjà créée et remplie — on ne touche à rien dessus.
- Les 2 clés Supabase à reporter sont dans le fichier **`.env.local`** du
  projet, sur votre ordinateur (ouvrez-le avec le Bloc-notes). Vous y
  trouverez :

  | Variable | Valeur à copier |
  |---|---|
  | `NEXT_PUBLIC_SUPABASE_URL` | l'URL du projet, ex. `https://xxxx.supabase.co` |
  | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la clé `sb_publishable_…` |

---

## 2. Créer le projet sur Vercel

1. Connectez-vous sur **vercel.com** → **Add New… → Project**.
2. Importez le dépôt GitHub `GESTIONGLOBALESCOLAIRE` (l'autoriser si Vercel
   le demande). Sélectionnez la branche `main`.
3. **Framework Preset** : laissez **Next.js** (Vercel le détecte tout seul).
   Ne changez ni *Root Directory*, ni *Build Command*. Le réglage Node doit
   être **22** ou *latest* (l'app est développée en Node 22).

   > ⚠️ **Nom du projet** : le champ *Project Name* est pré-rempli avec le nom
   > du dépôt (ex. `GESTIONGLOBALESCOLAIRE`). Vercel refuse les majuscules :
   > remplacez-le par un nom **en minuscules** (lettres, chiffres, `.`, `_`,
   > `-`, max 100 caractères), ex. **`gestion-scolaire`**. C'est ce nom qui
   > apparaîtra dans l'adresse du site.

### Variables d'environnement (étape OBLIGATOIRE)

4. Au panneau **Environment Variables**, ajoutez les **2 variables suivantes**
   (section « Production » et « Preview » si proposé — pas seulement
   Development) :

   - Variable : `NEXT_PUBLIC_SUPABASE_URL`
   - Variable : `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

   avec leurs valeurs copiées depuis votre `.env.local`.

   > ⚠️ Sans ces 2 variables, **le build Vercel échoue** avec l'erreur
   > `Your project's URL and API key are required to create a Supabase client!`
   > (dans `components/school-provider.tsx`). Aucune autre variable n'est
   > nécessaire : il n'y a ni clé secrète serveur, ni base Postgres
   > supplémentaire dans ce projet.

5. Cliquez sur **Deploy**. Vercel construit le site (~20-30 s) puis vous
   donne une adresse : `https://gestion-globale-scolaire.vercel.app` (ou
   proche). Ce nom peut être changé ensuite dans **Settings → Domains**.

---

## 3. Vérifier le déploiement

1. Ouvrez l'URL de votre projet.
2. Connectez-vous avec le **même compte** que sur votre version locale.
3. Vérifiez les pages : **Tableau de bord**, **Élèves**, **Finances**,
   **Notes**… et faites un test d'écriture (ex. ouvrir « Matières » →
   « Créer une matière » → Enregistrer, puis recharger : la matière doit
   apparaître). Si une action affiche « non autorisée pour votre rôle »,
   c'est normal : les enregistrements sont réservés à la direction
   (org_admin / directeur / secrétaire) — c'est la sécurité RLS de Supabase.

Note : sur Vercel, la base est la **même** que celle de votre ordinateur.
Les données que vous créez en local apparaîtront en ligne et inversement.

---

## 4. Quand vous modifiez le code (mises à jour)

- Chaque `git push` sur `main` redéploie automatiquement le site (si vous
  avez importé le dépôt depuis GitHub).
- Création de la notice : à tout moment sur vercel.com, **Deployments →
  Redploy**.

---

## 5. Problèmes fréquents

| Symptôme | Cause / solution |
|---|---|
| Page blanche à la maison | Variables d'env absentes sur Vercel → les ajouter (étape 2.4) puis **Redploy**. |
| `Failed to load module script … MIME type "text/html"` dans la console | Build incohérent → **Redploy** depuis Vercel (il recompile proprement). |
| « error fetching policy » / 500 sur les pages | La clé est mauvaise ou mal copiée → recopier depuis `.env.local`. |
| « action non autorisée » en créant | Votre compte n'a pas le rôle direction sur cette école → connectez-vous avec le compte `org_admin` / `directeur`. |
| Le site marche mais vitesse lente au 1er chargement | Normal en cold start sur le plan gratuit, il se chauffe au fil des visites. |

---

## 6. Fabriquer un nom d'adresse propre (optionnel)

Vercel → votre projet → **Settings → Domains** : soit vous utilisez un nom
`.vercel.app` personnalisé prévu par Vercel, soit vous branchez un **nom de
domaine** que vous possédez (ex. `ecoleexcellence.ci`), en suivant les
indications de DNS affichées par Vercel.

---

## Résumé express (la checklist)

- [ ] Repo poussé sur GitHub (`main`)
- [ ] `vercel.com` → Nouveau projet → importer `GESTIONGLOBALESCOLAIRE`
- [ ] Framework **Next.js**, Node **22**
- [ ] Ajouter les 2 variables `NEXT_PUBLIC_SUPABASE_URL` et
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (copiées depuis `.env.local`)
- [ ] **Deploy**
- [ ] Vérifier : connexion + une création (ex. matière) + rechargement