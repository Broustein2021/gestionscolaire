'use client'

import { createClient } from '@/lib/supabase/client'

export type CreerEnseignantInput = {
  schoolId: string
  academicYearId: string
  nom: string
  prenoms: string
  sexe: 'M' | 'F' | ''
  telephone: string
  email: string
  hiredOn: string
  matiereId: string | null
  classeId: string | null
}

export type ResultatEnseignant =
  | { ok: true; enseignantId: string; matricule: string; attention?: string | null }
  | { ok: false; message: string }

const RLS =
  /row-level security|violates row level security|permission denied|new row violates/i

function messageErreur(erreur: unknown, contexte: string): string {
  const msg = (erreur as { message?: string } | null)?.message ?? ''
  if (RLS.test(msg)) {
    return `${contexte} : action non autorisée pour votre rôle (réservé à la direction).`
  }
  return msg ? `${contexte} : ${msg}` : `Échec de l'enregistrement (${contexte.toLowerCase()}).`
}

/**
 * Crée un enseignant + son affectation éventuelle (matière × classe), côté
 * client. Matricule auto `ENS-{seq}` (unique école), RLS : direction
 * (org_admin / directeur / secretaire) ; l'affection est best-effort.
 */
export async function creerEnseignant(
  input: CreerEnseignantInput,
): Promise<ResultatEnseignant> {
  const supabase = createClient()

  const nom = input.nom.trim()
  const prenoms = input.prenoms.trim()
  if (!nom || !prenoms) {
    return { ok: false, message: 'Le nom et les prénoms sont obligatoires.' }
  }

  const inserer = async (seq: number) => {
    const matricule = `ENS-${String(seq).padStart(3, '0')}`
    const { data, error } = await supabase
      .from('teachers')
      .insert({
        school_id: input.schoolId,
        matricule,
        last_name: nom,
        first_name: prenoms,
        gender: input.sexe || null,
        phone: input.telephone.trim() || null,
        email: input.email.trim() || null,
        hired_on: input.hiredOn?.trim() || null,
        status: 'actif',
      })
      .select('id, matricule')
      .single()
    return { matricule, data, error }
  }

  // {count} + 1 → séquence ; nouvelle tentative en cas de conflit de matricule
  const { count } = await supabase
    .from('teachers')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', input.schoolId)

  let first = await inserer((count ?? 0) + 1)
  if (first.error && /23505/.test(first.error.message)) {
    first = await inserer((count ?? 0) + 2)
  }
  if (first.error || !first.data) {
    return { ok: false, message: messageErreur(first.error, 'Création de l’enseignant') }
  }

  let attention: string | null = null
  if (input.matiereId && input.classeId) {
    const { error: errAffectation } = await supabase.from('teacher_assignments').insert({
      school_id: input.schoolId,
      academic_year_id: input.academicYearId,
      teacher_id: first.data.id,
      subject_id: input.matiereId,
      class_id: input.classeId,
    })
    if (errAffectation) {
      attention = 'Enseignant créé, mais l’affectation matière/classe n’a pas pu être enregistrée.'
    }
  }

  return { ok: true, enseignantId: first.data.id, matricule: first.data.matricule, attention }
}