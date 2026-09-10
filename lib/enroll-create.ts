'use client'

import { createClient } from '@/lib/supabase/client'

export type NouveauResponsableInput = {
  nom: string
  prenoms: string
  telephone: string
  email: string
}

export type CreerInscriptionInput = {
  schoolId: string
  academicYearId: string
  classe: { id: string; levelLabel: string | null }
  eleve: {
    nom: string
    prenoms: string
    sexe: 'M' | 'F'
    dateNaissance: string
    lieuNaissance: string
    nationalite: string
    telephone: string
    adresse: string
    statut: 'nouveau' | 'inscrit'
  }
  dateInscription: string
  responsable: {
    mode: 'existant' | 'nouveau'
    gardienId: string | null
    nouveau?: NouveauResponsableInput
    lien: string
  }
  montants: {
    fraisInscription: number
    scolarite: number
    reduction: number
    acompte: number
  }
  categorieInscriptionId: string | null
}

export type ResultatInscription =
  | { ok: true; matricule: string; avertissement?: string }
  | { ok: false; message: string }

const RLS =
  /row-level security|violates row level security|permission denied|new row violates/i

function messageErreur(erreur: unknown, contexte: string): string {
  const msg = (erreur as { message?: string } | null)?.message ?? ''
  if (RLS.test(msg)) {
    return `${contexte} : action non autorisée pour votre rôle (contactez l'administrateur).`
  }
  return msg ? `${contexte} : ${msg}` : `Échec lors de l'enregistrement (${contexte.toLowerCase()}).`
}

/**
 * Enregistre une inscription complète côté client (pattern onboarding) :
 * élève -> responsable (création/reprise) -> lien -> inscription -> paiement.
 * La sécurité réelle (rôles, école, année) est garantie par la RLS et les
 * triggers PostgreSQL ; chaque écriture échoue si elle sort du périmètre.
 *
 * Un acompte versé est encaissé en dernier (best-effort) : les rôles
 * comptable/directeur peuvent le saisir, le secrétariat sans droit de
 * paiement reçoit quand même un dossier créé avec un avertissement.
 */
export async function enregistrerInscription(
  input: CreerInscriptionInput,
): Promise<ResultatInscription> {
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

  const montantAPayer = Math.max(
    0,
    input.montants.fraisInscription + input.montants.scolarite - input.montants.reduction,
  )

  // --- 1. Élève (matricule auto, unique par école, assigné par la base) ---
  const builderEleve = {
    school_id: input.schoolId,
    last_name: input.eleve.nom.trim().toUpperCase(),
    first_name: input.eleve.prenoms.trim(),
    gender: input.eleve.sexe,
    birth_date: input.eleve.dateNaissance?.trim() || null,
    birth_place: input.eleve.lieuNaissance?.trim() || null,
    nationality: input.eleve.nationalite?.trim() || 'Ivoirienne',
    phone: input.eleve.telephone?.trim() || null,
    address: input.eleve.adresse?.trim() || null,
    status: input.eleve.statut,
  }

  const { data: student, error: errEleve } = await supabase
    .from('students')
    .insert(builderEleve)
    .select('id, matricule')
    .single()

  if (errEleve || !student) {
    return { ok: false, message: messageErreur(errEleve, "Création de l'élève") }
  }

  // --- 2. Responsable ---
  let guardianId = ''
  if (input.responsable.mode === 'nouveau') {
    const { nom, prenoms } = input.responsable.nouveau ?? { nom: '', prenoms: '' }
    if (!nom.trim() || !prenoms.trim()) {
      return { ok: false, message: 'Nom et prénoms du nouveau responsable sont obligatoires.' }
    }
    const { data: guardian, error: errGuardian } = await supabase
      .from('guardians')
      .insert({
        school_id: input.schoolId,
        last_name: nom.trim().toUpperCase(),
        first_name: prenoms.trim(),
        phone: input.responsable.nouveau?.telephone?.trim() || null,
        email: input.responsable.nouveau?.email?.trim() || null,
      })
      .select('id')
      .single()

    if (errGuardian || !guardian) {
      return { ok: false, message: messageErreur(errGuardian, "Création du responsable") }
    }
    guardianId = guardian.id
  } else {
    const gardienId = input.responsable.gardienId
    if (!gardienId) {
      return { ok: false, message: 'Sélectionnez un responsable existant.' }
    }
    guardianId = gardienId
  }

  // --- 3. Lien élève <-> responsable ---
  const { error: errLien } = await supabase.from('student_guardians').insert({
    school_id: input.schoolId,
    student_id: student.id,
    guardian_id: guardianId,
    relation: input.responsable.lien,
    is_primary: true,
  })
  if (errLien) {
    return { ok: false, message: messageErreur(errLien, 'Lien élève / responsable') }
  }

  // --- 4. Inscription (inscrit dans la classe de l'année courante) ---
  const { data: enrollment, error: errEnrollment } = await supabase
    .from('enrollments')
    .insert({
      school_id: input.schoolId,
      academic_year_id: input.academicYearId,
      student_id: student.id,
      class_id: input.classe.id,
      level_label: input.classe.levelLabel,
      enrolled_on: input.dateInscription?.trim() || undefined,
      status: 'validee',
      is_new_student: input.eleve.statut === 'nouveau',
      amount_due: montantAPayer,
      amount_paid: 0,
      payment_status: montantAPayer > 0 ? 'retard' : 'a_jour',
    })
    .select('id')
    .single()

  if (errEnrollment || !enrollment) {
    return { ok: false, message: messageErreur(errEnrollment, "Enregistrement de l'inscription") }
  }

  // --- 5. Acompte (best-effort, dernier) ---
  const avertissements: string[] = []
  if (input.montants.acompte > 0) {
    const { data: payment, error: errPayment } = await supabase
      .from('payments')
      .insert({
        school_id: input.schoolId,
        academic_year_id: input.academicYearId,
        student_id: student.id,
        enrollment_id: enrollment.id,
        fee_category_id: input.categorieInscriptionId,
        amount: input.montants.acompte,
        paid_on: input.dateInscription?.trim() || undefined,
        method: 'Espèces',
        motif: `Acompte inscription — ${input.eleve.prenoms.trim()} ${input.eleve.nom.trim()}`.trim(),
        recorded_by: profile?.id ?? null,
      })
      .select('id')
      .single()

    if (errPayment || !payment) {
      avertissements.push(
        "Le dossier est créé, mais l'acompte n'a pas pu être encaissé (rôle sans droit de paiement).",
      )
    } else {
      const { error: errRecu } = await supabase.from('receipts').insert({
        school_id: input.schoolId,
        payment_id: payment.id,
        balance_after: Math.max(0, montantAPayer - input.montants.acompte),
      })

      if (errRecu) {
        console.error('[enregistrerInscription] reçu non émis :', errRecu)
        avertissements.push("Le reçu n'a pas pu être émis automatiquement.")
      }
    }
  }

  return {
    ok: true,
    matricule: student.matricule,
    avertissement: avertissements.length > 0 ? avertissements.join(' ') : undefined,
  }
}