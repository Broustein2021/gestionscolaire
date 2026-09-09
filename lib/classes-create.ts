'use client'

import { createClient } from '@/lib/supabase/client'

export type ClasseInput = {
  schoolId: string
  academicYearId: string
  nom: string
  cycle: 'Primaire' | 'Collège' | 'Lycée'
  niveauLabel: string
  levelId: string | null
  capacite: number
  salle: string
  headTeacherId: string | null
}

export type ResultatClasse =
  | { ok: true; classeId: string; nom: string }
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

function valeurs(input: ClasseInput) {
  return {
    school_id: input.schoolId,
    academic_year_id: input.academicYearId,
    name: input.nom.trim(),
    level_label: input.niveauLabel.trim(),
    level_id: input.levelId,
    cycle: input.cycle,
    capacity: input.capacite,
    room: input.salle.trim() || null,
    head_teacher_id: input.headTeacherId,
  }
}

/** Crée une classe (nom unique par année scolaire). RLS : direction. */
export async function creerClasse(input: ClasseInput): Promise<ResultatClasse> {
  const supabase = createClient()

  if (!input.nom.trim()) {
    return { ok: false, message: 'Le nom de la classe est obligatoire.' }
  }
  if (!input.niveauLabel.trim()) {
    return { ok: false, message: 'Le niveau de la classe est obligatoire.' }
  }
  if (input.capacite < 1) {
    return { ok: false, message: 'La capacité doit être d\u2019au moins 1 place.' }
  }

  const { data, error } = await supabase
    .from('classes')
    .insert(valeurs(input))
    .select('id, name')
    .single()

  if (error) {
    if (/23505/.test(error.message)) {
      return { ok: false, message: `Une classe porte déjà ce nom pour cette année scolaire.` }
    }
    return { ok: false, message: messageErreur(error, 'Création de la classe') }
  }
  if (!data) {
    return { ok: false, message: 'Création de la classe : aucune réponse de la base.' }
  }

  return { ok: true, classeId: data.id, nom: data.name }
}

/** Met à jour une classe existante (nom, niveau, cycle, capacité, salle, prof principal). */
export async function modifierClasse(
  classeId: string,
  input: ClasseInput,
): Promise<ResultatClasse> {
  const supabase = createClient()

  if (!input.nom.trim()) {
    return { ok: false, message: 'Le nom de la classe est obligatoire.' }
  }
  if (!input.niveauLabel.trim()) {
    return { ok: false, message: 'Le niveau de la classe est obligatoire.' }
  }
  if (input.capacite < 1) {
    return { ok: false, message: 'La capacité doit être d\u2019au moins 1 place.' }
  }

  const { data, error } = await supabase
    .from('classes')
    .update(valeurs(input))
    .eq('id', classeId)
    .select('id, name')
    .single()

  if (error) {
    if (/23505/.test(error.message)) {
      return { ok: false, message: `Une classe porte déjà ce nom pour cette année scolaire.` }
    }
    return { ok: false, message: messageErreur(error, 'Modification de la classe') }
  }

  return { ok: true, classeId, nom: data?.name ?? input.nom.trim() }
}