'use client'

import { createClient } from '@/lib/supabase/client'

export type CreerPaiementInput = {
  schoolId: string
  academicYearId: string
  studentId: string
  feeCategoryId: string | null
  amount: number
  date: string
  method: string
  reference?: string
  motif?: string
}

export type PaiementEnregistre = {
  paymentId: string
  numeroRecu: string
  studentId: string
  eleveNom: string
  matricule: string
  classeNom: string | null
  montant: number
  date: string
  mode: string
  motif: string | null
  reference: string | null
  enregistrePar: string | null
  soldeRestant: number
}

export type ResultatPaiement =
  | { ok: true; paiement: PaiementEnregistre }
  | { ok: false; message: string }

const RLS =
  /row-level security|violates row level security|permission denied|new row violates/i

function messageErreur(erreur: unknown, contexte: string): string {
  const msg = (erreur as { message?: string } | null)?.message ?? ''
  if (RLS.test(msg)) {
    return `${contexte} : action non autorisée pour votre rôle (les paiements sont réservés à la caisse / direction).`
  }
  return msg ? `${contexte} : ${msg}` : `Échec de l'enregistrement (${contexte.toLowerCase()}).`
}

/**
 * Enregistre un encaissement + émet reçu, côté client.
 * `recorded_by` référence le profil connecté ; la RLS autorise
 * org_admin / directeur / comptable et refuse le simple secrétariat.
 */
export async function enregistrerPaiement(
  input: CreerPaiementInput,
): Promise<ResultatPaiement> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: 'Votre session a expiré. Reconnectez-vous.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Situation réelle de l'élève (montant dû / déjà payé) avant l'encaissement
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(
      'id, amount_due, amount_paid, students:student_id ( id, first_name, last_name, matricule ), classes:class_id ( name )',
    )
    .eq('school_id', input.schoolId)
    .eq('academic_year_id', input.academicYearId)
    .eq('student_id', input.studentId)
    .eq('status', 'validee')
    .maybeSingle()

  if (!enrollment) {
    return { ok: false, message: 'Élève introuvable dans l’année scolaire courante.' }
  }

  const student = Array.isArray(enrollment.students) ? enrollment.students[0] : enrollment.students
  const classe = Array.isArray(enrollment.classes) ? enrollment.classes[0] : enrollment.classes
  const du = Number(enrollment.amount_due) || 0
  const payeAvant = Number(enrollment.amount_paid) || 0

  // --- 1. Paiement ---
  const { data: payment, error: errPayment } = await supabase
    .from('payments')
    .insert({
      school_id: input.schoolId,
      academic_year_id: input.academicYearId,
      student_id: input.studentId,
      enrollment_id: enrollment.id,
      fee_category_id: input.feeCategoryId,
      amount: input.amount,
      paid_on: input.date?.trim() || undefined,
      method: input.method,
      reference: input.reference?.trim() || null,
      motif: input.motif?.trim() || null,
      recorded_by: profile?.id ?? null,
    })
    .select('id')
    .single()

  if (errPayment || !payment) {
    return { ok: false, message: messageErreur(errPayment, 'Enregistrement du paiement') }
  }

  // --- 2. Reçu (numérotation séquentiale atomique par la base) ---
  const soldeRestant = Math.max(0, du - (payeAvant + input.amount))

  const { data: reçu, error: errRecu } = await supabase
    .from('receipts')
    .insert({
      school_id: input.schoolId,
      payment_id: payment.id,
      balance_after: soldeRestant,
    })
    .select('receipt_number')
    .single()

  if (errRecu || !reçu?.receipt_number) {
    console.error('[enregistrerPaiement] reçu non émis :', errRecu)
  }
  const numeroRecu = reçu?.receipt_number ?? '—'

  return {
    ok: true,
    paiement: {
      paymentId: payment.id,
      numeroRecu,
      studentId: input.studentId,
      eleveNom: `${student?.last_name ?? ''} ${student?.first_name ?? ''}`.trim(),
      matricule: student?.matricule ?? '',
      classeNom: classe?.name ?? null,
      montant: input.amount,
      date: input.date,
      mode: input.method,
      motif: input.motif?.trim() || null,
      reference: input.reference?.trim() || null,
      enregistrePar: profile ? 'Vous' : null,
      soldeRestant,
    },
  }
}