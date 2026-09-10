// Données de démonstration — Groupe Scolaire Excellence (Abidjan, Côte d'Ivoire)
// Toutes les valeurs monétaires sont en FCFA.

export const etablissement = {
  organisation: 'Groupe Scolaire Excellence',
  nom: 'Complexe Scolaire Excellence — Cocody',
  ville: 'Abidjan',
  commune: 'Cocody',
  telephone: '+225 27 22 44 55 66',
  email: 'contact@gs-excellence.ci',
  siteWeb: 'www.gs-excellence.ci',
  type: 'Primaire & Secondaire général',
  anneeScolaire: '2025-2026',
  periodeCourante: '1er Trimestre',
}

export const anneesScolaires = [
  { id: 'ay-2526', libelle: '2025-2026', statut: 'active' as const },
  { id: 'ay-2425', libelle: '2024-2025', statut: 'cloturee' as const },
  { id: 'ay-2324', libelle: '2023-2024', statut: 'cloturee' as const },
]

export const trimestres = ['1er Trimestre', '2e Trimestre', '3e Trimestre']

export type StatutPaiement = 'a_jour' | 'partiel' | 'retard'

export type Eleve = {
  id: string
  matricule: string
  nom: string
  prenoms: string
  sexe: 'M' | 'F'
  dateNaissance: string
  lieuNaissance: string
  nationalite: string
  niveau: string
  classeId: string
  statut: 'inscrit' | 'nouveau' | 'archive'
  dateInscription: string
  moyenne: number
  statutPaiement: StatutPaiement
  montantDu: number
  montantPaye: number
  telephone: string
  adresse: string
  parentIds: string[]
}

export type Classe = {
  id: string
  nom: string
  niveau: string
  cycle: 'Primaire' | 'Collège' | 'Lycée'
  effectif: number
  capacite: number
  profPrincipalId: string
  salle: string
}

export type Enseignant = {
  id: string
  matricule: string
  nom: string
  prenoms: string
  sexe: 'M' | 'F'
  telephone: string
  email: string
  matieres: string[]
  classes: string[]
  statut: 'actif' | 'archive'
  dateEmbauche: string
}

export type Matiere = {
  id: string
  code: string
  nom: string
  coefficient: number
  cycle: 'Primaire' | 'Collège' | 'Lycée'
  enseignantIds: string[]
}

export type Parent = {
  id: string
  nom: string
  prenoms: string
  lien: 'Père' | 'Mère' | 'Tuteur'
  telephone: string
  email: string
  profession: string
  principal: boolean
  enfantIds: string[]
}

export type Evaluation = {
  id: string
  libelle: string
  type: 'Interrogation' | 'Devoir' | 'Composition' | 'Contrôle continu'
  classeId: string
  matiereId: string
  enseignantId: string
  periode: string
  date: string
  bareme: number
  coefficient: number
  statut: 'planifiee' | 'saisie' | 'validee'
}

export type Paiement = {
  id: string
  recu: string
  eleveId: string
  montant: number
  date: string
  mode: 'Espèces' | 'Mobile Money' | 'Virement' | 'Chèque' | 'Carte'
  motif: string
  reference: string
  enregistrePar: string
}

export const classes: Classe[] = [
  { id: 'c-cp1', nom: 'CP1 A', niveau: 'CP1', cycle: 'Primaire', effectif: 32, capacite: 40, profPrincipalId: 't-04', salle: 'B12' },
  { id: 'c-ce2', nom: 'CE2 B', niveau: 'CE2', cycle: 'Primaire', effectif: 35, capacite: 40, profPrincipalId: 't-05', salle: 'B08' },
  { id: 'c-cm2', nom: 'CM2 A', niveau: 'CM2', cycle: 'Primaire', effectif: 38, capacite: 40, profPrincipalId: 't-06', salle: 'B03' },
  { id: 'c-6a', nom: '6e A', niveau: '6e', cycle: 'Collège', effectif: 42, capacite: 45, profPrincipalId: 't-01', salle: 'A21' },
  { id: 'c-6b', nom: '6e B', niveau: '6e', cycle: 'Collège', effectif: 40, capacite: 45, profPrincipalId: 't-02', salle: 'A22' },
  { id: 'c-5a', nom: '5e A', niveau: '5e', cycle: 'Collège', effectif: 39, capacite: 45, profPrincipalId: 't-03', salle: 'A18' },
  { id: 'c-3a', nom: '3e A', niveau: '3e', cycle: 'Collège', effectif: 37, capacite: 45, profPrincipalId: 't-01', salle: 'A11' },
  { id: 'c-2nde', nom: '2nde C', niveau: '2nde', cycle: 'Lycée', effectif: 34, capacite: 45, profPrincipalId: 't-03', salle: 'C05' },
  { id: 'c-tle', nom: 'Tle D', niveau: 'Terminale', cycle: 'Lycée', effectif: 29, capacite: 45, profPrincipalId: 't-02', salle: 'C01' },
]

export const enseignants: Enseignant[] = [
  { id: 't-01', matricule: 'ENS-001', nom: 'Kouassi', prenoms: 'Jean-Marc', sexe: 'M', telephone: '+225 07 08 11 22 33', email: 'jm.kouassi@gs-excellence.ci', matieres: ['m-math'], classes: ['c-6a', 'c-3a'], statut: 'actif', dateEmbauche: '2019-09-01' },
  { id: 't-02', matricule: 'ENS-002', nom: 'Aka', prenoms: 'Marie-Ange', sexe: 'F', telephone: '+225 05 44 55 66 77', email: 'ma.aka@gs-excellence.ci', matieres: ['m-fr'], classes: ['c-6b', 'c-tle'], statut: 'actif', dateEmbauche: '2020-09-01' },
  { id: 't-03', matricule: 'ENS-003', nom: 'Traoré', prenoms: 'Ibrahim', sexe: 'M', telephone: '+225 01 77 88 99 00', email: 'i.traore@gs-excellence.ci', matieres: ['m-pc', 'm-svt'], classes: ['c-5a', 'c-2nde'], statut: 'actif', dateEmbauche: '2018-09-01' },
  { id: 't-04', matricule: 'ENS-004', nom: 'Yao', prenoms: 'Affoué', sexe: 'F', telephone: '+225 07 12 34 56 78', email: 'a.yao@gs-excellence.ci', matieres: ['m-eveil'], classes: ['c-cp1'], statut: 'actif', dateEmbauche: '2021-09-01' },
  { id: 't-05', matricule: 'ENS-005', nom: 'Diomandé', prenoms: 'Sékou', sexe: 'M', telephone: '+225 05 23 45 67 89', email: 's.diomande@gs-excellence.ci', matieres: ['m-eveil'], classes: ['c-ce2'], statut: 'actif', dateEmbauche: '2017-09-01' },
  { id: 't-06', matricule: 'ENS-006', nom: 'Bamba', prenoms: 'Fatoumata', sexe: 'F', telephone: '+225 01 34 56 78 90', email: 'f.bamba@gs-excellence.ci', matieres: ['m-eveil', 'm-angl'], classes: ['c-cm2'], statut: 'actif', dateEmbauche: '2016-09-01' },
  { id: 't-07', matricule: 'ENS-007', nom: 'N’Guessan', prenoms: 'Patrice', sexe: 'M', telephone: '+225 07 45 67 89 01', email: 'p.nguessan@gs-excellence.ci', matieres: ['m-hg'], classes: ['c-6a', 'c-5a', 'c-3a'], statut: 'actif', dateEmbauche: '2015-09-01' },
  { id: 't-08', matricule: 'ENS-008', nom: 'Coulibaly', prenoms: 'Awa', sexe: 'F', telephone: '+225 05 56 78 90 12', email: 'a.coulibaly@gs-excellence.ci', matieres: ['m-angl'], classes: ['c-6a', 'c-6b', 'c-2nde'], statut: 'actif', dateEmbauche: '2019-09-01' },
]

export const matieres: Matiere[] = [
  { id: 'm-math', code: 'MATH', nom: 'Mathématiques', coefficient: 4, cycle: 'Collège', enseignantIds: ['t-01'] },
  { id: 'm-fr', code: 'FR', nom: 'Français', coefficient: 4, cycle: 'Collège', enseignantIds: ['t-02'] },
  { id: 'm-angl', code: 'ANG', nom: 'Anglais', coefficient: 2, cycle: 'Collège', enseignantIds: ['t-08', 't-06'] },
  { id: 'm-hg', code: 'HG', nom: 'Histoire-Géographie', coefficient: 3, cycle: 'Collège', enseignantIds: ['t-07'] },
  { id: 'm-svt', code: 'SVT', nom: 'SVT', coefficient: 2, cycle: 'Collège', enseignantIds: ['t-03'] },
  { id: 'm-pc', code: 'PC', nom: 'Physique-Chimie', coefficient: 3, cycle: 'Collège', enseignantIds: ['t-03'] },
  { id: 'm-eps', code: 'EPS', nom: 'EPS', coefficient: 1, cycle: 'Collège', enseignantIds: [] },
  { id: 'm-eveil', code: 'EVE', nom: 'Éveil / Français-Calcul', coefficient: 3, cycle: 'Primaire', enseignantIds: ['t-04', 't-05', 't-06'] },
]

export const parents: Parent[] = [
  { id: 'p-01', nom: 'Kouadio', prenoms: 'Émile', lien: 'Père', telephone: '+225 07 01 02 03 04', email: 'e.kouadio@gmail.com', profession: 'Ingénieur', principal: true, enfantIds: ['e-01', 'e-06'] },
  { id: 'p-02', nom: 'Kouadio', prenoms: 'Sylvie', lien: 'Mère', telephone: '+225 05 05 06 07 08', email: 's.kouadio@gmail.com', profession: 'Comptable', principal: false, enfantIds: ['e-01', 'e-06'] },
  { id: 'p-03', nom: 'Touré', prenoms: 'Abou', lien: 'Père', telephone: '+225 01 09 10 11 12', email: 'a.toure@yahoo.fr', profession: 'Commerçant', principal: true, enfantIds: ['e-02'] },
  { id: 'p-04', nom: 'Gbagbo', prenoms: 'Rachel', lien: 'Mère', telephone: '+225 07 13 14 15 16', email: 'r.gbagbo@gmail.com', profession: 'Infirmière', principal: true, enfantIds: ['e-03'] },
  { id: 'p-05', nom: 'Ouattara', prenoms: 'Lassina', lien: 'Tuteur', telephone: '+225 05 17 18 19 20', email: 'l.ouattara@gmail.com', profession: 'Fonctionnaire', principal: true, enfantIds: ['e-04', 'e-05'] },
]

export const eleves: Eleve[] = [
  { id: 'e-01', matricule: 'GSE-24-0125', nom: 'Kouadio', prenoms: 'Grâce Emmanuella', sexe: 'F', dateNaissance: '2012-03-14', lieuNaissance: 'Abidjan', nationalite: 'Ivoirienne', niveau: '6e', classeId: 'c-6a', statut: 'inscrit', dateInscription: '2025-09-05', moyenne: 15.4, statutPaiement: 'a_jour', montantDu: 350000, montantPaye: 350000, telephone: '+225 07 01 02 03 04', adresse: 'Cocody Angré, Abidjan', parentIds: ['p-01', 'p-02'] },
  { id: 'e-02', matricule: 'GSE-24-0126', nom: 'Touré', prenoms: 'Mohamed', sexe: 'M', dateNaissance: '2012-07-22', lieuNaissance: 'Bouaké', nationalite: 'Ivoirienne', niveau: '6e', classeId: 'c-6a', statut: 'inscrit', dateInscription: '2025-09-06', moyenne: 12.8, statutPaiement: 'partiel', montantDu: 350000, montantPaye: 200000, telephone: '+225 01 09 10 11 12', adresse: 'Cocody Riviera, Abidjan', parentIds: ['p-03'] },
  { id: 'e-03', matricule: 'GSE-25-0301', nom: 'Gbagbo', prenoms: 'Josué', sexe: 'M', dateNaissance: '2011-11-02', lieuNaissance: 'Abidjan', nationalite: 'Ivoirienne', niveau: '5e', classeId: 'c-5a', statut: 'nouveau', dateInscription: '2025-09-04', moyenne: 13.9, statutPaiement: 'retard', montantDu: 380000, montantPaye: 80000, telephone: '+225 07 13 14 15 16', adresse: 'Cocody Deux-Plateaux, Abidjan', parentIds: ['p-04'] },
  { id: 'e-04', matricule: 'GSE-23-0088', nom: 'Ouattara', prenoms: 'Aminata', sexe: 'F', dateNaissance: '2009-01-19', lieuNaissance: 'Korhogo', nationalite: 'Ivoirienne', niveau: '3e', classeId: 'c-3a', statut: 'inscrit', dateInscription: '2025-09-03', moyenne: 16.7, statutPaiement: 'a_jour', montantDu: 420000, montantPaye: 420000, telephone: '+225 05 17 18 19 20', adresse: 'Cocody Angré, Abidjan', parentIds: ['p-05'] },
  { id: 'e-05', matricule: 'GSE-23-0089', nom: 'Ouattara', prenoms: 'Ismaël', sexe: 'M', dateNaissance: '2007-05-30', lieuNaissance: 'Korhogo', nationalite: 'Ivoirienne', niveau: 'Terminale', classeId: 'c-tle', statut: 'inscrit', dateInscription: '2025-09-03', moyenne: 14.2, statutPaiement: 'partiel', montantDu: 520000, montantPaye: 300000, telephone: '+225 05 17 18 19 20', adresse: 'Cocody Angré, Abidjan', parentIds: ['p-05'] },
  { id: 'e-06', matricule: 'GSE-26-0410', nom: 'Kouadio', prenoms: 'Éliel', sexe: 'M', dateNaissance: '2018-08-11', lieuNaissance: 'Abidjan', nationalite: 'Ivoirienne', niveau: 'CP1', classeId: 'c-cp1', statut: 'nouveau', dateInscription: '2025-09-08', moyenne: 0, statutPaiement: 'a_jour', montantDu: 280000, montantPaye: 280000, telephone: '+225 07 01 02 03 04', adresse: 'Cocody Angré, Abidjan', parentIds: ['p-01'] },
  { id: 'e-07', matricule: 'GSE-25-0210', nom: 'Konan', prenoms: 'Adjoua', sexe: 'F', dateNaissance: '2014-02-28', lieuNaissance: 'Yamoussoukro', nationalite: 'Ivoirienne', niveau: 'CM2', classeId: 'c-cm2', statut: 'inscrit', dateInscription: '2025-09-05', moyenne: 14.6, statutPaiement: 'a_jour', montantDu: 300000, montantPaye: 300000, telephone: '+225 07 21 22 23 24', adresse: 'Abobo, Abidjan', parentIds: [] },
  { id: 'e-08', matricule: 'GSE-25-0211', nom: 'Bakayoko', prenoms: 'Souleymane', sexe: 'M', dateNaissance: '2013-06-17', lieuNaissance: 'Man', nationalite: 'Ivoirienne', niveau: 'CE2', classeId: 'c-ce2', statut: 'inscrit', dateInscription: '2025-09-07', moyenne: 11.3, statutPaiement: 'retard', montantDu: 290000, montantPaye: 50000, telephone: '+225 05 25 26 27 28', adresse: 'Yopougon, Abidjan', parentIds: [] },
  { id: 'e-09', matricule: 'GSE-24-0150', nom: 'Assamoi', prenoms: 'Prisca', sexe: 'F', dateNaissance: '2011-09-09', lieuNaissance: 'Abidjan', nationalite: 'Ivoirienne', niveau: '6e', classeId: 'c-6b', statut: 'inscrit', dateInscription: '2025-09-06', moyenne: 13.1, statutPaiement: 'a_jour', montantDu: 350000, montantPaye: 350000, telephone: '+225 07 29 30 31 32', adresse: 'Marcory, Abidjan', parentIds: [] },
  { id: 'e-10', matricule: 'GSE-24-0151', nom: 'Diarra', prenoms: 'Karim', sexe: 'M', dateNaissance: '2010-12-25', lieuNaissance: 'Abidjan', nationalite: 'Malienne', niveau: '2nde', classeId: 'c-2nde', statut: 'inscrit', dateInscription: '2025-09-04', moyenne: 12.0, statutPaiement: 'partiel', montantDu: 480000, montantPaye: 250000, telephone: '+225 01 33 34 35 36', adresse: 'Treichville, Abidjan', parentIds: [] },
  { id: 'e-11', matricule: 'GSE-25-0305', nom: 'Zadi', prenoms: 'Estelle', sexe: 'F', dateNaissance: '2011-04-03', lieuNaissance: 'Daloa', nationalite: 'Ivoirienne', niveau: '5e', classeId: 'c-5a', statut: 'inscrit', dateInscription: '2025-09-05', moyenne: 15.9, statutPaiement: 'a_jour', montantDu: 380000, montantPaye: 380000, telephone: '+225 07 37 38 39 40', adresse: 'Cocody, Abidjan', parentIds: [] },
  { id: 'e-12', matricule: 'GSE-23-0090', nom: 'Fofana', prenoms: 'Bakary', sexe: 'M', dateNaissance: '2009-10-12', lieuNaissance: 'Abidjan', nationalite: 'Ivoirienne', niveau: '3e', classeId: 'c-3a', statut: 'inscrit', dateInscription: '2025-09-03', moyenne: 10.4, statutPaiement: 'retard', montantDu: 420000, montantPaye: 120000, telephone: '+225 05 41 42 43 44', adresse: 'Koumassi, Abidjan', parentIds: [] },
]

export const evaluations: Evaluation[] = [
  { id: 'ev-01', libelle: 'Composition N°1 — Mathématiques', type: 'Composition', classeId: 'c-6a', matiereId: 'm-math', enseignantId: 't-01', periode: '1er Trimestre', date: '2025-11-18', bareme: 20, coefficient: 4, statut: 'validee' },
  { id: 'ev-02', libelle: 'Devoir surveillé — Français', type: 'Devoir', classeId: 'c-6a', matiereId: 'm-fr', enseignantId: 't-02', periode: '1er Trimestre', date: '2025-11-12', bareme: 20, coefficient: 2, statut: 'saisie' },
  { id: 'ev-03', libelle: 'Interrogation — Anglais', type: 'Interrogation', classeId: 'c-6a', matiereId: 'm-angl', enseignantId: 't-08', periode: '1er Trimestre', date: '2025-11-20', bareme: 20, coefficient: 1, statut: 'planifiee' },
  { id: 'ev-04', libelle: 'Composition N°1 — Physique-Chimie', type: 'Composition', classeId: 'c-5a', matiereId: 'm-pc', enseignantId: 't-03', periode: '1er Trimestre', date: '2025-11-19', bareme: 20, coefficient: 3, statut: 'saisie' },
  { id: 'ev-05', libelle: 'Devoir — Histoire-Géographie', type: 'Devoir', classeId: 'c-3a', matiereId: 'm-hg', enseignantId: 't-07', periode: '1er Trimestre', date: '2025-11-15', bareme: 20, coefficient: 3, statut: 'validee' },
  { id: 'ev-06', libelle: 'Contrôle continu — SVT', type: 'Contrôle continu', classeId: 'c-5a', matiereId: 'm-svt', enseignantId: 't-03', periode: '1er Trimestre', date: '2025-11-21', bareme: 20, coefficient: 2, statut: 'planifiee' },
]

export const paiements: Paiement[] = [
  { id: 'pay-01', recu: 'REC-2526-0421', eleveId: 'e-01', montant: 150000, date: '2026-08-04', mode: 'Mobile Money', motif: 'Scolarité — 2e échéance', reference: 'MM-88213', enregistrePar: 'Mme Koné (Caisse)' },
  { id: 'pay-02', recu: 'REC-2526-0420', eleveId: 'e-04', montant: 200000, date: '2026-08-04', mode: 'Virement', motif: 'Scolarité — solde', reference: 'VIR-45120', enregistrePar: 'Mme Koné (Caisse)' },
  { id: 'pay-03', recu: 'REC-2526-0419', eleveId: 'e-02', montant: 100000, date: '2026-08-03', mode: 'Espèces', motif: 'Scolarité — 1re échéance', reference: '—', enregistrePar: 'M. Yao (Caisse)' },
  { id: 'pay-04', recu: 'REC-2526-0418', eleveId: 'e-06', montant: 280000, date: '2026-08-02', mode: 'Mobile Money', motif: 'Inscription + scolarité', reference: 'MM-88011', enregistrePar: 'Mme Koné (Caisse)' },
  { id: 'pay-05', recu: 'REC-2526-0417', eleveId: 'e-05', montant: 300000, date: '2026-08-01', mode: 'Chèque', motif: 'Scolarité — 1re échéance', reference: 'CHQ-002145', enregistrePar: 'M. Yao (Caisse)' },
  { id: 'pay-06', recu: 'REC-2526-0416', eleveId: 'e-11', montant: 380000, date: '2026-07-31', mode: 'Virement', motif: 'Scolarité — année complète', reference: 'VIR-45001', enregistrePar: 'Mme Koné (Caisse)' },
]

export const categoriesFrais = [
  { id: 'f-insc', nom: 'Inscription', montant: 50000 },
  { id: 'f-scol', nom: 'Scolarité', montant: 300000 },
  { id: 'f-cantine', nom: 'Cantine', montant: 90000 },
  { id: 'f-transport', nom: 'Transport', montant: 120000 },
  { id: 'f-uniforme', nom: 'Uniforme', montant: 35000 },
]

// ----- Helpers -----

export function formatFCFA(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA'
}

export function getClasse(id: string) {
  return classes.find((c) => c.id === id)
}

export function getEnseignant(id: string) {
  return enseignants.find((t) => t.id === id)
}

export function getMatiere(id: string) {
  return matieres.find((m) => m.id === id)
}

export function getEleve(id: string) {
  return eleves.find((e) => e.id === id)
}

export function getParent(id: string) {
  return parents.find((p) => p.id === id)
}

export const statutPaiementLabel: Record<StatutPaiement, string> = {
  a_jour: 'À jour',
  partiel: 'Partiel',
  retard: 'En retard',
}

// ----- Indicateurs agrégés (Tableau de bord) -----

const montantAttendu = eleves.reduce((s, e) => s + e.montantDu, 0)
const montantEncaisse = eleves.reduce((s, e) => s + e.montantPaye, 0)

export const kpis = {
  totalEleves: eleves.filter((e) => e.statut !== 'archive').length,
  totalClasses: classes.length,
  totalEnseignants: enseignants.filter((t) => t.statut === 'actif').length,
  totalMatieres: matieres.length,
  totalInscriptions: eleves.filter((e) => e.statut === 'nouveau').length,
  montantAttendu,
  montantEncaisse,
  resteRecouvrer: montantAttendu - montantEncaisse,
  tauxRecouvrement: Math.round((montantEncaisse / montantAttendu) * 100),
  elevesAJour: eleves.filter((e) => e.statutPaiement === 'a_jour').length,
  elevesEnRetard: eleves.filter((e) => e.statutPaiement === 'retard').length,
}

export const alertes = [
  { id: 'a1', type: 'finance' as const, message: `${kpis.elevesEnRetard} élèves ont des paiements en retard`, severite: 'haute' as const },
  { id: 'a2', type: 'notes' as const, message: '8 notes ne sont pas encore saisies', severite: 'moyenne' as const },
  { id: 'a3', type: 'bulletin' as const, message: '2 bulletins attendent une validation', severite: 'moyenne' as const },
  { id: 'a4', type: 'vie_scolaire' as const, message: '3 absences doivent être justifiées', severite: 'basse' as const },
  { id: 'a5', type: 'finance' as const, message: '6 paiements ont été enregistrés cette semaine', severite: 'info' as const },
]

// Encaissements par mois (FCFA, en milliers) pour le graphique
export const encaissementsMensuels = [
  { mois: 'Sept', attendu: 3200, encaisse: 2600 },
  { mois: 'Oct', attendu: 2800, encaisse: 2400 },
  { mois: 'Nov', attendu: 2600, encaisse: 1900 },
  { mois: 'Déc', attendu: 2400, encaisse: 1500 },
  { mois: 'Jan', attendu: 2200, encaisse: 1700 },
  { mois: 'Fév', attendu: 2000, encaisse: 1200 },
]

// Répartition des élèves par cycle
export const repartitionCycle = [
  { cycle: 'Primaire', eleves: classes.filter((c) => c.cycle === 'Primaire').reduce((s, c) => s + c.effectif, 0) },
  { cycle: 'Collège', eleves: classes.filter((c) => c.cycle === 'Collège').reduce((s, c) => s + c.effectif, 0) },
  { cycle: 'Lycée', eleves: classes.filter((c) => c.cycle === 'Lycée').reduce((s, c) => s + c.effectif, 0) },
]

// Notes d'une évaluation (pour la saisie / consultation)
export const notesEvaluation: Record<string, { eleveId: string; note: number | null }[]> = {
  'ev-01': [
    { eleveId: 'e-01', note: 16.5 },
    { eleveId: 'e-02', note: 11 },
  ],
}

// ----- Helpers additionnels (modules Scolarité / Évaluation / Finances) -----

export const niveaux = Array.from(new Set(classes.map((c) => c.niveau)))
export const cycles = ['Primaire', 'Collège', 'Lycée'] as const

export const typesEvaluation = [
  'Interrogation',
  'Devoir',
  'Composition',
  'Contrôle continu',
] as const

export const modesPaiement = [
  'Espèces',
  'Mobile Money',
  'Virement',
  'Chèque',
  'Carte',
] as const

export const statutEvaluationLabel: Record<Evaluation['statut'], string> = {
  planifiee: 'Planifiée',
  saisie: 'Saisie',
  validee: 'Validée',
}

export function getElevesByClasse(classeId: string) {
  return eleves.filter((e) => e.classeId === classeId && e.statut !== 'archive')
}

export function getMatieresByCycle(cycle: Classe['cycle']) {
  return matieres.filter((m) => m.cycle === cycle)
}

export function getEnseignantsByMatiere(matiereId: string) {
  return enseignants.filter((t) => t.matieres.includes(matiereId))
}

export function getEvaluation(id: string) {
  return evaluations.find((ev) => ev.id === id)
}

/**
 * Note pseudo-aléatoire mais déterministe, dérivée de la moyenne de l'élève.
 * Uniquement destinée à la démonstration (mode maquette / données fictives).
 */
export function noteSimulee(eleveId: string, matiereId: string, bareme = 20) {
  const eleve = getEleve(eleveId)
  if (!eleve || eleve.moyenne <= 0) return null
  const seed = [...`${eleveId}${matiereId}`].reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0,
  )
  const ecart = ((seed % 7) - 3) * 0.7
  const note = Math.max(2, Math.min(20, eleve.moyenne + ecart))
  return Math.round((note * bareme) / 20 * 4) / 4
}

export function appreciation(moyenne: number): string {
  if (moyenne >= 16) return 'Excellent'
  if (moyenne >= 14) return 'Très bien'
  if (moyenne >= 12) return 'Bien'
  if (moyenne >= 10) return 'Assez bien'
  if (moyenne >= 8) return 'Insuffisant'
  return 'Faible'
}

/** Bulletin calculé pour un élève sur une période (données fictives). */
export function bulletinEleve(eleveId: string) {
  const eleve = getEleve(eleveId)
  if (!eleve) return null
  const classe = getClasse(eleve.classeId)
  const lignes = getMatieresByCycle(classe?.cycle ?? 'Collège').map((m) => {
    const note = noteSimulee(eleve.id, m.id) ?? 0
    return {
      matiereId: m.id,
      matiere: m.nom,
      coefficient: m.coefficient,
      note,
      points: note * m.coefficient,
      appreciation: appreciation(note),
      enseignant: m.enseignantIds[0] ? getEnseignant(m.enseignantIds[0]) : undefined,
    }
  })
  const totalCoef = lignes.reduce((s, l) => s + l.coefficient, 0)
  const totalPoints = lignes.reduce((s, l) => s + l.points, 0)
  const moyenneGenerale = totalCoef > 0 ? totalPoints / totalCoef : 0

  // Rang au sein de la classe
  const camarades = getElevesByClasse(eleve.classeId)
    .map((e) => ({ id: e.id, moyenne: e.moyenne }))
    .sort((a, b) => b.moyenne - a.moyenne)
  const rang = camarades.findIndex((c) => c.id === eleve.id) + 1

  return {
    eleve,
    classe,
    lignes,
    totalCoef,
    totalPoints,
    moyenneGenerale,
    rang,
    effectif: camarades.length,
    appreciationGenerale: appreciation(moyenneGenerale),
  }
}

export function nouveauNumeroRecu() {
  const dernier = paiements
    .map((p) => Number(p.recu.split('-').pop()))
    .sort((a, b) => b - a)[0]
  return `REC-2526-${String((dernier ?? 0) + 1).padStart(4, '0')}`
}

export const nav = [
  { group: 'Pilotage', items: [{ href: '/', label: 'Tableau de bord', icon: 'dashboard' }] },
  {
    group: 'Scolarité',
    items: [
      { href: '/eleves', label: 'Élèves', icon: 'students' },
      { href: '/inscriptions', label: 'Inscriptions', icon: 'enroll' },
      { href: '/parents', label: 'Parents / Responsables', icon: 'parents' },
      { href: '/classes', label: 'Classes & Niveaux', icon: 'classes' },
      { href: '/enseignants', label: 'Enseignants', icon: 'teachers' },
      { href: '/matieres', label: 'Matières', icon: 'subjects' },
    ],
  },
  {
    group: 'Évaluation',
    items: [
      { href: '/evaluations', label: 'Évaluations', icon: 'assess' },
      { href: '/notes', label: 'Notes', icon: 'grades' },
      { href: '/bulletins', label: 'Bulletins', icon: 'reports' },
    ],
  },
  {
    group: 'Vie scolaire',
    items: [
      { href: '/assiduite', label: 'Présences & Absences', icon: 'calendarCheck' },
    ],
  },
  {
    group: 'Finances',
    items: [{ href: '/finances', label: 'Frais & Paiements', icon: 'finance' }],
  },
  {
    group: 'Paramètres',
    items: [{ href: '/configuration', label: 'Configuration', icon: 'settings' }],
  },
] as const
