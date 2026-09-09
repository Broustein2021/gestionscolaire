import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolContext } from '@/lib/queries/school-context'
import type { StatutPaiement } from '@/lib/data'

export type AnneeOption = {
  id: string
  libelle: string
  statut: string
}

export type ClasseOption = {
  id: string
  nom: string
  niveau: string
  cycle: string
  effectif: number
  capacite: number
  salle: string
  level_label: string | null
}

export type ResponsableOption = {
  id: string
  prenoms: string
  nom: string
  telephone: string | null
  email: string | null
  lien: string
}

export type FraisOption = {
  id: string
  code: string | null
  nom: string
  montant: number
  isActive: boolean
}

export type InscriptionOptions = {
  schoolId: string
  academicYearId: string
  anneeCourante: AnneeOption | null
  annees: AnneeOption[]
  classes: ClasseOption[]
  responsables: ResponsableOption[]
  frais: FraisOption[]
}

export type Inscription = {
  studentId: string
  nom: string
  prenoms: string
  matricule: string
  classeId: string | null
  classeNom: string | null
  dateInscription: string
  isNouveau: boolean
  montantDu: number
  montantPaye: number
  statutPaiement: StatutPaiement
}

/**
 * Options du formulaire d'inscription (année en cours, classes,
 * responsables, frais) pour l'école et l'année scolaire courantes.
 * Retourne null si l'utilisateur n'a pas d'établissement actif.
 */
export async function getInscriptionOptions(): Promise<InscriptionOptions | null> {
  const ctx = await getCurrentSchoolContext()
  if (!ctx) return null

  const supabase = await createClient()

  const [{ data: yearRows }, { data: classRows }, { data: guardianRows }, { data: feeRows }] =
    await Promise.all([
      supabase
        .from('academic_years')
        .select('id, label, status')
        .eq('school_id', ctx.schoolId)
        .order('starts_on', { ascending: false }),
      supabase
        .from('classes')
        .select(
          `
          id, name, level_label, cycle, capacity, room,
          levels ( sequence_no )
        `,
        )
        .eq('school_id', ctx.schoolId)
        .eq('academic_year_id', ctx.academicYearId),
      supabase
        .from('guardians')
        .select('id, first_name, last_name, phone, email')
        .eq('school_id', ctx.schoolId)
        .order('last_name', { ascending: true }),
      supabase
        .from('fee_categories')
        .select('id, name, code, default_amount, is_active')
        .eq('school_id', ctx.schoolId),
    ])

  if (errorAux(yearRows, classRows, guardianRows, feeRows)) {
    console.error('[getInscriptionOptions] données incomplètes pour le formulaire')
  }

  // Effectif réel par classe (année courante)
  const { data: enrollmentRows } = await supabase
    .from('enrollments')
    .select('class_id')
    .eq('school_id', ctx.schoolId)
    .eq('academic_year_id', ctx.academicYearId)
    .eq('status', 'validee')

  const effectifParClasse = new Map<string, number>()
  for (const e of enrollmentRows ?? []) {
    if (!e.class_id) continue
    effectifParClasse.set(e.class_id, (effectifParClasse.get(e.class_id) ?? 0) + 1)
  }

  const seqParClasse = new Map<string, number>()
  for (const row of classRows ?? []) {
    const level = Array.isArray(row.levels) ? row.levels[0] : row.levels
    seqParClasse.set(row.id, level?.sequence_no ?? 999)
  }

  const annees: AnneeOption[] = (yearRows ?? []).map((y) => ({
    id: y.id,
    libelle: y.label,
    statut: y.status,
  }))

  const classes: ClasseOption[] = (classRows ?? [])
    .map((c) => ({
      id: c.id,
      nom: c.name,
      niveau: c.level_label,
      cycle: c.cycle,
      effectif: effectifParClasse.get(c.id) ?? 0,
      capacite: c.capacity,
      salle: c.room ?? '—',
      level_label: c.level_label,
    }))
    .sort((a, b) => (seqParClasse.get(a.id) ?? 999) - (seqParClasse.get(b.id) ?? 999))

  // Lien de parenté le plus fréquent par responsable
  const { data: linkRows } = await supabase
    .from('student_guardians')
    .select('guardian_id, relation')
    .eq('school_id', ctx.schoolId)

  const compteurs = new Map<string, Map<string, number>>()
  for (const l of linkRows ?? []) {
    if (!compteurs.has(l.guardian_id)) compteurs.set(l.guardian_id, new Map<string, number>())
    const m = compteurs.get(l.guardian_id)!
    m.set(l.relation, (m.get(l.relation) ?? 0) + 1)
  }
  const lienPrincipal = new Map<string, string>()
  for (const [guardianId, m] of compteurs) {
    let meilleur = '—'
    let meilleurCompte = 0
    for (const [relation, c] of m) {
      if (c > meilleurCompte) {
        meilleur = relation
        meilleurCompte = c
      }
    }
    lienPrincipal.set(guardianId, meilleur)
  }

  const responsables: ResponsableOption[] = (guardianRows ?? []).map((g) => ({
    id: g.id,
    prenoms: g.first_name,
    nom: g.last_name,
    telephone: g.phone,
    email: g.email,
    lien: lienPrincipal.get(g.id) ?? '—',
  }))

  const frais: FraisOption[] = (feeRows ?? []).map((f) => ({
    id: f.id,
    code: f.code ?? null,
    nom: f.name,
    montant: Number(f.default_amount) || 0,
    isActive: f.is_active,
  }))

  return {
    schoolId: ctx.schoolId,
    academicYearId: ctx.academicYearId,
    anneeCourante: annees.find((a) => a.id === ctx.academicYearId) ?? annees[0] ?? null,
    annees,
    classes,
    responsables,
    frais,
  }
}

/**
 * Liste des inscriptions (enrollments validées) de l'école pour l'année
 * scolaire courante, avec l'élève et sa classe — alimente /inscriptions.
 */
export async function getInscriptions(): Promise<Inscription[]> {
  const ctx = await getCurrentSchoolContext()
  if (!ctx) return []

  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('enrollments')
    .select(
      `
      enrolled_on,
      is_new_student,
      amount_due,
      amount_paid,
      payment_status,
      students:student_id ( id, first_name, last_name, matricule, status ),
      classes:class_id ( id, name )
    `,
    )
    .eq('school_id', ctx.schoolId)
    .eq('academic_year_id', ctx.academicYearId)
    .eq('status', 'validee')
    .order('enrolled_on', { ascending: false })

  if (error || !rows) {
    console.error('[getInscriptions] erreur Supabase :', error)
    return []
  }

  return rows
    .map((r): Inscription | null => {
      const s = Array.isArray(r.students) ? r.students[0] : r.students
      const c = Array.isArray(r.classes) ? r.classes[0] : r.classes
      if (!s || s.status === 'archive') return null
      return {
        studentId: s.id,
        nom: s.last_name,
        prenoms: s.first_name,
        matricule: s.matricule,
        classeId: c?.id ?? null,
        classeNom: c?.name ?? null,
        dateInscription: r.enrolled_on,
        isNouveau: r.is_new_student,
        montantDu: Number(r.amount_due) || 0,
        montantPaye: Number(r.amount_paid) || 0,
        statutPaiement: r.payment_status,
      }
    })
    .filter((i): i is Inscription => i !== null)
}

function errorAux(...data: Array<unknown>): boolean {
  return data.some((d) => d == null)
}