import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolContext } from '@/lib/queries/school-context'
import { getClasses } from '@/lib/queries/classes'
import { getEnseignantsData } from '@/lib/queries/enseignants'
import { getMatieres } from '@/lib/queries/matieres'
import type { StatutPaiement } from '@/lib/data'

export type Kpis = {
  totalEleves: number
  totalInscriptions: number
  totalClasses: number
  totalEnseignants: number
  totalMatieres: number
  montantAttendu: number
  montantEncaisse: number
  resteRecouvrer: number
  tauxRecouvrement: number
  elevesAJour: number
  elevesEnRetard: number
  elevesPartiel: number
}

export type EncaissementMensuel = {
  mois: string
  attendu: number
  encaisse: number
}

export type PaiementRecent = {
  id: string
  recu: string | null
  eleve: string | null
  motif: string | null
  mode: string
  montant: number
  statutPaiement: StatutPaiement
}

export type Alerte = {
  id: string
  type: 'finance' | 'notes' | 'vie_scolaire' | 'bulletin'
  message: string
  severite: 'haute' | 'moyenne' | 'basse' | 'info'
}

export type DashboardData = {
  etablissement: { nom: string; anneeScolaire: string }
  kpis: Kpis
  alertes: Alerte[]
  encaissementsMensuels: EncaissementMensuel[]
  repartitionCycle: { cycle: string; eleves: number }[]
  derniersPaiements: PaiementRecent[]
}

const MOIS_COURTS = [
  'Jan',
  'Fév',
  'Mars',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sept',
  'Oct',
  'Nov',
  'Déc',
]

function vide(): DashboardData {
  return {
    etablissement: { nom: '—', anneeScolaire: '—' },
    kpis: {
      totalEleves: 0,
      totalInscriptions: 0,
      totalClasses: 0,
      totalEnseignants: 0,
      totalMatieres: 0,
      montantAttendu: 0,
      montantEncaisse: 0,
      resteRecouvrer: 0,
      tauxRecouvrement: 0,
      elevesAJour: 0,
      elevesEnRetard: 0,
      elevesPartiel: 0,
    },
    alertes: [],
    encaissementsMensuels: [],
    repartitionCycle: [],
    derniersPaiements: [],
  }
}

/**
 * Agrégats du tableau de bord, calculés sur les données réelles Supabase,
 * scopées école + année scolaire courante de l'utilisateur connecté.
 * Remplace les `kpis`, `alertes`, `encaissementsMensuels`, `repartitionCycle`
 * et `paiements` mockés de lib/data.ts.
 */
export async function getDashboard(): Promise<DashboardData> {
  const ctx = await getCurrentSchoolContext()
  if (!ctx) return vide()

  const supabase = await createClient()

  const [{ data: yearRow }, { data: schoolRow }, { data: enrollmentRows }, { data: paiementRows }] =
    await Promise.all([
      supabase
        .from('academic_years')
        .select('label')
        .eq('school_id', ctx.schoolId)
        .eq('id', ctx.academicYearId)
        .maybeSingle(),
      supabase.from('schools').select('name').eq('id', ctx.schoolId).maybeSingle(),
      supabase
        .from('enrollments')
        .select('student_id, amount_due, amount_paid, payment_status, is_new_student, enrolled_on')
        .eq('school_id', ctx.schoolId)
        .eq('academic_year_id', ctx.academicYearId)
        .eq('status', 'validee'),
      supabase
        .from('payments')
        .select('amount, paid_on')
        .eq('school_id', ctx.schoolId)
        .eq('academic_year_id', ctx.academicYearId),
    ])

  const enrollements = enrollmentRows ?? []
  const paiements = paiementRows ?? []

  const montantAttendu = enrollements.reduce((s, e) => s + (Number(e.amount_due) || 0), 0)
  const montantEncaisse = enrollements.reduce((s, e) => s + (Number(e.amount_paid) || 0), 0)
  const elevesAJour = enrollements.filter((e) => e.payment_status === 'a_jour').length
  const elevesEnRetard = enrollements.filter((e) => e.payment_status === 'retard').length
  const elevesPartiel = enrollements.filter((e) => e.payment_status === 'partiel').length
  const tauxRecouvrement = montantAttendu > 0 ? Math.round((montantEncaisse / montantAttendu) * 100) : 0

  const [classes, { enseignants }, matieres] = await Promise.all([
    getClasses(),
    getEnseignantsData(),
    getMatieres(),
  ])

  const totalEleves = enrollements.length
  const totalInscriptions = enrollements.filter((e) => e.is_new_student).length

  // Répartition réelle des effectifs par cycle d'enseignement
  const repartitionCycle = Array.from(new Set(classes.map((c) => c.cycle))).map((cycle) => ({
    cycle,
    eleves: classes.filter((c) => c.cycle === cycle).reduce((s, c) => s + c.effectif, 0),
  }))

  // Encaissements réels (en milliers de FCFA) sur les 6 derniers mois.
  // "attendu" = montant dû par les élèves inscrits au plus tard au mois courant ;
  // "encaissé" = somme des paiements réellement passés dans le mois.
  const maintenant = new Date()
  const fenetre: { annee: number; mois: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1)
    fenetre.push({ annee: d.getFullYear(), mois: d.getMonth() })
  }

  const encaissementsMensuels: EncaissementMensuel[] = fenetre.map(({ annee, mois }) => {
    const debutMs = new Date(annee, mois, 1).getTime()
    const finMs = new Date(annee, mois + 1, 0, 23, 59, 59).getTime()

    const attendu = enrollements
      .filter((e) => {
        if (!e.enrolled_on) {
          return mois === maintenant.getMonth() && annee === maintenant.getFullYear()
        }
        return new Date(e.enrolled_on).getTime() <= finMs
      })
      .reduce((s, e) => s + (Number(e.amount_due) || 0), 0)

    const encaisse = paiements
      .filter((p) => {
        const t = new Date(p.paid_on).getTime()
        return t >= debutMs && t <= finMs
      })
      .reduce((s, p) => s + (Number(p.amount) || 0), 0)

    return {
      mois: MOIS_COURTS[mois],
      attendu: Math.round(attendu / 1000),
      encaisse: Math.round(encaisse / 1000),
    }
  })

  // --- Alertes réelles ---
  const alertes: Alerte[] = []

  if (elevesEnRetard > 0) {
    alertes.push({
      id: 'a1',
      type: 'finance',
      message: `${elevesEnRetard} élève${elevesEnRetard > 1 ? 's' : ''} a${elevesEnRetard > 1 ? '' : 's'} des paiements en retard`,
      severite: 'haute',
    })
  }

  const semaineMs = 7 * 24 * 60 * 60 * 1000
  const maintenantMs = Date.now()
  const paiementsSemaine = paiements.filter((p) => {
    const t = new Date(p.paid_on).getTime()
    return t <= maintenantMs && maintenantMs - t <= semaineMs
  }).length
  if (paiementsSemaine > 0) {
    alertes.push({
      id: 'a5',
      type: 'finance',
      message: `${paiementsSemaine} paiement${paiementsSemaine > 1 ? 's' : ''} enregistré${paiementsSemaine > 1 ? 's' : ''} cette semaine`,
      severite: 'info',
    })
  }

  const classesPleines = classes.filter((c) => c.capacite > 0 && c.effectif >= c.capacite)
  if (classesPleines.length > 0) {
    alertes.push({
      id: 'a6',
      type: 'vie_scolaire',
      message: `${classesPleines.length} classe${classesPleines.length > 1 ? 's' : ''} à capacité atteinte : ${classesPleines.map((c) => c.nom).join(', ')}`,
      severite: 'basse',
    })
  }

  const { data: assessmentRows } = await supabase
    .from('assessments')
    .select('id')
    .eq('school_id', ctx.schoolId)
    .eq('academic_year_id', ctx.academicYearId)
  const idsAssessments = (assessmentRows ?? []).map((a) => a.id)
  if (idsAssessments.length > 0) {
    const { data: gradeRows } = await supabase
      .from('grades')
      .select('assessment_id')
      .eq('school_id', ctx.schoolId)
      .in('assessment_id', idsAssessments)
    const avecNotes = new Set((gradeRows ?? []).map((g) => g.assessment_id))
    const nonSaisies = idsAssessments.length - avecNotes.size
    if (nonSaisies > 0) {
      alertes.push({
        id: 'a2',
        type: 'notes',
        message: `${nonSaisies} évaluation${nonSaisies > 1 ? 's' : ''} sans notes saisies`,
        severite: 'moyenne',
      })
    }
  }

  // --- Derniers paiements (5) ---
  const { data: derniersRows } = await supabase
    .from('payments')
    .select(
      `
      id, amount, paid_on, method, motif,
      receipts ( receipt_number ),
      students:student_id ( first_name, last_name ),
      enrollments:enrollment_id ( payment_status )
    `,
    )
    .eq('school_id', ctx.schoolId)
    .eq('academic_year_id', ctx.academicYearId)
    .order('paid_on', { ascending: false })
    .limit(5)

  const derniersPaiements: PaiementRecent[] = (derniersRows ?? []).map((p) => {
    const student = Array.isArray(p.students) ? p.students[0] : p.students
    const receipt = Array.isArray(p.receipts) ? p.receipts[0] : p.receipts
    const enrollment = Array.isArray(p.enrollments) ? p.enrollments[0] : p.enrollments
    return {
      id: p.id,
      recu: receipt?.receipt_number ?? null,
      eleve: student ? `${student.first_name} ${student.last_name}` : null,
      motif: p.motif,
      mode: p.method ?? '—',
      montant: Number(p.amount) || 0,
      statutPaiement: enrollment?.payment_status ?? 'a_jour',
    }
  })

  return {
    etablissement: {
      nom: schoolRow?.name ?? '',
      anneeScolaire: yearRow?.label ?? '',
    },
    kpis: {
      totalEleves,
      totalInscriptions,
      totalClasses: classes.length,
      totalEnseignants: enseignants.filter((t) => t.statut === 'actif').length,
      totalMatieres: matieres.length,
      montantAttendu,
      montantEncaisse,
      resteRecouvrer: montantAttendu - montantEncaisse,
      tauxRecouvrement,
      elevesAJour,
      elevesEnRetard,
      elevesPartiel,
    },
    alertes,
    encaissementsMensuels,
    repartitionCycle,
    derniersPaiements,
  }
}