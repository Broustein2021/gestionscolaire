'use client'

import { createClient } from '@/lib/supabase/client'

export type ResponsableInput = {
  schoolId: string
  nom: string
  prenoms: string
  telephone: string
  email: string
  profession: string
  adresse: string
}

export type ResultatResponsable =
  | { ok: true; responsableId: string }
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

function valeurs(input: ResponsableInput) {
  return {
    school_id: input.schoolId,
    last_name: input.nom.trim(),
    first_name: input.prenoms.trim(),
    phone: input.telephone.trim() || null,
    email: input.email.trim() || null,
    profession: input.profession.trim() || null,
    address: input.adresse.trim() || null,
  }
}

/** Crée un parent / tuteur légal. RLS : org_admin / directeur / secretaire. */
export async function creerResponsable(
  input: ResponsableInput,
): Promise<ResultatResponsable> {
  const supabase = createClient()

  if (!input.nom.trim() || !input.prenoms.trim()) {
    return { ok: false, message: 'Le nom et les prénoms sont obligatoires.' }
  }

  const { data, error } = await supabase
    .from('guardians')
    .insert(valeurs(input))
    .select('id')
    .single()

  if (error) {
    return { ok: false, message: messageErreur(error, 'Création du responsable') }
  }
  if (!data) {
    return { ok: false, message: 'Création du responsable : aucune réponse de la base.' }
  }

  return { ok: true, responsableId: data.id }
}

/** Met à jour un parent / tuteur légal existant. */
export async function modifierResponsable(
  responsableId: string,
  input: ResponsableInput,
): Promise<ResultatResponsable> {
  const supabase = createClient()

  if (!input.nom.trim() || !input.prenoms.trim()) {
    return { ok: false, message: 'Le nom et les prénoms sont obligatoires.' }
  }

  const { data, error } = await supabase
    .from('guardians')
    .update(valeurs(input))
    .eq('id', responsableId)
    .select('id')
    .single()

  if (error) {
    return { ok: false, message: messageErreur(error, 'Modification du responsable') }
  }

  return { ok: true, responsableId }
}