import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolContext } from '@/lib/queries/school-context'
import type { StatutPaiement } from '@/lib/data'

export type EtablissementInfo = {
  organisation: string
  nom: string
  commune: string
  ville: string
  telephone: string
  email: string
}

export type EleveOption = {
  id: string
  matricule: string
  nom: string
  prenoms: string
  classeNom: string | null
  montantDu: number
  montantPaye: number
  statutPaiement: StatutPaiement
}

export type CategorieFrais = {
  id: string
  nom: string
  montant: number
}

export type FinancesOptions = {
  schoolId: string
  academicYearId: string
  anneePrefixe: string
  anneeLabel: string
  eleves: EleveOption[]
  categories: CategorieFrais[]
  etablissement: EtablissementInfo
}

export type LignePaiement = {
  id: string
  recu: string | null
  eleveId: string | null
  eleveNom: string | null
  matricule: string | null
  classeNom: string | null
  date: string
  motif: string | null
  mode: string
  montant: number
  reference: string | null
  enregistrePar: string | null
  soldeRestant: number
  statut: StatutPaiement
}

export type FinancesData = {
  kpis: {
    montantAttendu: number
    montantEncaisse: number
    resteRecouvrer: number
    tauxRecouvrement: number
    elevesAJour: number
    elevesEnRetard: number
    nbPaiements: number
  }
  paiements: LignePaiement[]
}

type LigneEnrollment = {
  student_id: string
  amount_due: number
  amount_paid: number
  payment_status: StatutPaiement
  classes: { name: string } | { name: string }[] | null
}

/** Élèves inscrits (année courante) + leur situation financière réelle. */
async function getElevesSituation() {
  const ctx = await getCurrentSchoolContext()
  if (!ctx) return null

  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('enrollments')
    .select(
      `
      student_id, amount_due, amount_paid, payment_status,
      classes:class_id ( name ),
      students:student_id ( id, first_name, last_name, matricule )
    `,
    )
    .eq('school_id', ctx.schoolId)
    .eq('academic_year_id', ctx.academicYearId)
    .eq('status', 'validee')
    .order('students.last_name', { ascending: true })

  const eleves: EleveOption[] = (rows ?? []).map((r) => {
    const s = Array.isArray(r.students) ? r.students[0] : r.students
    const c = Array.isArray(r.classes) ? r.classes[0] : r.classes
    return {
      id: s?.id ?? '',
      matricule: s?.matricule ?? '',
      nom: s?.last_name ?? '',
      prenoms: s?.first_name ?? '',
      classeNom: c?.name ?? null,
      montantDu: Number(r.amount_due) || 0,
      montantPaye: Number(r.amount_paid) || 0,
      statutPaiement: r.payment_status ?? 'a_jour',
    }
  }).filter((e) => e.id !== '')

  const parEleve = new Map<string, LigneEnrollment>()
  for (const r of rows ?? []) {
    const s = Array.isArray(r.students) ? r.students[0] : r.students
    if (s?.id) parEleve.set(s.id, r as unknown as LigneEnrollment)
  }

  return { ctx, eleves, parEleve }
}

/**
 * Options du formulaire d'encaissement : élèves inscrits, catégories de
 * frais, infos d'établissement et année en vigueur — données réelles.
 */
export async function getFinancesOptions(): Promise<FinancesOptions | null> {
  const base = await getElevesSituation()
  if (!base) return null

  const supabase = await createClient()
  const { ctx, eleves } = base

  const [{ data: feeRows }, { data: schoolRow }, { data: orgRow }, { data: yearRow }] =
    await Promise.all([
      supabase
        .from('fee_categories')
        .select('id, name, default_amount')
        .eq('school_id', ctx.schoolId)
        .eq('is_active', true)
        .order('name', { ascending: true }),
      supabase.from('schools').select('name, address, city, commune, phone, email').eq('id', ctx.schoolId).maybeSingle(),
      supabase
        .from('schools')
        .select('organizations:organization_id ( name, email, phone )')
        .eq('id', ctx.schoolId)
        .maybeSingle(),
      supabase
        .from('academic_years')
        .select('label')
        .eq('school_id', ctx.schoolId)
        .eq('id', ctx.academicYearId)
        .maybeSingle(),
    ])

  const organisation = (() => {
    const o = Array.isArray(orgRow?.organizations) ? orgRow?.organizations[0] : orgRow?.organizations
    return o?.name ?? ''
  })()

  return {
    schoolId: ctx.schoolId,
    academicYearId: ctx.academicYearId,
    anneePrefixe: (yearRow?.label ?? String(new Date().getFullYear())).slice(0, 4),
    anneeLabel: yearRow?.label ?? '',
    eleves,
    categories: (feeRows ?? []).map((f) => ({
      id: f.id,
      nom: f.name,
      montant: Number(f.default_amount) || 0,
    })),
    etablissement: {
      organisation,
      nom: schoolRow?.name ?? '',
      commune: schoolRow?.commune ?? '',
      ville: schoolRow?.city ?? '',
      telephone: schoolRow?.phone ?? '',
      email: schoolRow?.email ?? '',
    },
  }
}

/**
 * Vraies données de la page Finances : KPIs de recouvrement + journal des
 * paiements de l'année (élève, reçu, solde, statut, enregistré par).
 */
export async function getFinances(): Promise<FinancesData | null> {
  const base = await getElevesSituation()
  if (!base) return null

  const supabase = await createClient()
  const { ctx, eleves, parEleve } = base

  const [{ data: paymentRows }] = await Promise.all([
    supabase
      .from('payments')
      .select(
        `
        id, amount, paid_on, method, motif, reference,
        receipts ( receipt_number ),
        students:student_id ( id, first_name, last_name, matricule ),
        profiles:recorded_by ( full_name )
      `,
      )
      .eq('school_id', ctx.schoolId)
      .eq('academic_year_id', ctx.academicYearId)
      .order('paid_on', { ascending: false }),
  ])

  const paiements: LignePaiement[] = (paymentRows ?? []).map((p) => {
    const student = Array.isArray(p.students) ? p.students[0] : p.students
    const receipt = Array.isArray(p.receipts) ? p.receipts[0] : p.receipts
    const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
    const enr = parEleve.get(student?.id)

    return {
      id: p.id,
      recu: receipt?.receipt_number ?? null,
      eleveId: student?.id ?? null,
      eleveNom: student ? `${student.last_name} ${student.first_name}` : null,
      matricule: student?.matricule ?? null,
      classeNom: enr?.classes ? (Array.isArray(enr.classes) ? enr.classes[0]?.name : enr.classes.name) ?? null : null,
      date: p.paid_on,
      motif: p.motif,
      mode: p.method,
      montant: Number(p.amount) || 0,
      reference: p.reference,
      enregistrePar: prof?.full_name ?? null,
      soldeRestant: enr ? Math.max(0, Number(enr.amount_due) - Number(enr.amount_paid)) : 0,
      statut: enr?.payment_status ?? 'a_jour',
    }
  })

  const montantAttendu = eleves.reduce((s, e) => s + e.montantDu, 0)
  const montantEncaisse = eleves.reduce((s, e) => s + e.montantPaye, 0)

  return {
    kpis: {
      montantAttendu,
      montantEncaisse,
      resteRecouvrer: Math.max(0, montantAttendu - montantEncaisse),
      tauxRecouvrement: montantAttendu > 0 ? Math.round((montantEncaisse / montantAttendu) * 100) : 0,
      elevesAJour: eleves.filter((e) => e.statutPaiement === 'a_jour').length,
      elevesEnRetard: eleves.filter((e) => e.statutPaiement === 'retard').length,
      nbPaiements: paiements.length,
    },
    paiements,
  }
}