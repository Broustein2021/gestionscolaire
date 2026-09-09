'use client'

import { createClient } from '@/lib/supabase/client'

export type CreerMatiereInput = {
  schoolId: string
  code: string
  nom: string
  coefficient: number
  cycle: 'Primaire' | 'Collège' | 'Lycée'
}

export type ResultatMatiere =
  | { ok: true; matiereId: string; code: string }
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
 * Crée une matière (code unique par école). RLS : direction
 * (org_admin / directeur / secretaire).
 */
export async function creerMatiere(
  input: CreerMatiereInput,
): Promise<ResultatMatiere> {
  const supabase = createClient()

  const code = input.code.trim().toUpperCase()
  const nom = input.nom.trim()
  if (!code || !nom) {
    return { ok: false, message: 'Le code et l’intitulé sont obligatoires.' }
  }
  if (input.coefficient < 0) {
    return { ok: false, message: 'Le coefficient doit être positif.' }
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      school_id: input.schoolId,
      code,
      name: nom,
      coefficient: input.coefficient,
      cycle: input.cycle,
      is_active: true,
    })
    .select('id, code')
    .single()

  if (error) {
    if (/23505/.test(error.message)) {
      return { ok: false, message: `Un code existe déjà pour cette matière (${code}).` }
    }
    return { ok: false, message: messageErreur(error, 'Création de la matière') }
  }
  if (!data) {
    return { ok: false, message: 'Création de la matière : aucune réponse de la base.' }
  }

  return { ok: true, matiereId: data.id, code: data.code }
}

/** Met à jour une matière existante (code, libellé, coefficient, cycle). */
export async function modifierMatiere(
  matiereId: string,
  input: Omit<CreerMatiereInput, 'schoolId'>,
): Promise<ResultatMatiere> {
  const supabase = createClient()

  const code = input.code.trim().toUpperCase()
  const nom = input.nom.trim()
  if (!code || !nom) {
    return { ok: false, message: 'Le code et l’intitulé sont obligatoires.' }
  }
  if (input.coefficient < 0) {
    return { ok: false, message: 'Le coefficient doit être positif.' }
  }

  const { data, error } = await supabase
    .from('subjects')
    .update({
      code,
      name: nom,
      coefficient: input.coefficient,
      cycle: input.cycle,
    })
    .eq('id', matiereId)
    .select('id, code')
    .single()

  if (error) {
    if (/23505/.test(error.message)) {
      return { ok: false, message: `Un code existe déjà pour cette matière (${code}).` }
    }
    return { ok: false, message: messageErreur(error, 'Modification de la matière') }
  }

  return { ok: true, matiereId, code }
}