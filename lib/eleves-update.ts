'use client'

import { z } from 'zod'

import { createClient } from '@/lib/supabase/client'

export const eleveUpdateSchema = z.object({
  schoolId: z.string().min(1, 'Contexte établissement manquant.'),
  prenoms: z.string().trim().min(1, 'Le prénom est obligatoire.'),
  nom: z.string().trim().min(1, 'Le nom est obligatoire.'),
  sexe: z.enum(['M', 'F'], { message: 'Le sexe doit être Masculin ou Féminin.' }),
  nationalite: z
    .string()
    .trim()
    .max(80)
    .default('—')
    .transform((v) => v || '—'),
  telephone: z
    .string()
    .trim()
    .max(40, 'Le téléphone est trop long.')
    .nullable()
    .transform((v) => v || null),
  adresse: z
    .string()
    .trim()
    .max(160, "L'adresse est trop longue.")
    .nullable()
    .transform((v) => v || null),
  dateNaissance: z
    .string()
    .nullable()
    .transform((v) => v || null),
  lieuNaissance: z
    .string()
    .trim()
    .max(80, 'Le lieu de naissance est trop long.')
    .nullable()
    .transform((v) => v || null),
  statut: z.enum(['inscrit', 'nouveau', 'archive', 'radie', 'transfere'], {
    message: "Le statut de l'élève est invalide.",
  }),
})

export type EleveUpdateInput = z.infer<typeof eleveUpdateSchema>

export type ResultatEleveUpdate =
  | { ok: true; nom: string; prenoms: string }
  | { ok: false; message: string }

const RLS =
  /row-level security|violates row level security|permission denied|new row violates/i

function messageErreur(erreur: unknown): string {
  const msg = (erreur as { message?: string } | null)?.message ?? ''
  if (RLS.test(msg)) {
    return 'Modification refusée : réservé à la direction de l’établissement.'
  }
  return msg ? `Modification de l’élève : ${msg}` : 'Échec de la modification de l’élève.'
}

/**
 * Met à jour les informations d'un élève (identité + statut).
 * RLS : réservé à la direction (super_admin, org_admin, directeur).
 */
export async function modifierEleve(
  eleveId: string,
  input: EleveUpdateInput,
): Promise<ResultatEleveUpdate> {
  const supabase = createClient()

  const parse = eleveUpdateSchema.safeParse(input)
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? 'Formulaire invalide.' }
  }
  const v = parse.data

  const { data, error } = await supabase
    .from('students')
    .update({
      first_name: v.prenoms,
      last_name: v.nom,
      gender: v.sexe,
      nationality: v.nationalite,
      phone: v.telephone,
      address: v.adresse,
      birth_date: v.dateNaissance,
      birth_place: v.lieuNaissance,
      status: v.statut,
    })
    .eq('id', eleveId)
    .eq('school_id', v.schoolId)
    .select('id, first_name, last_name')
    .single()

  if (error) {
    return { ok: false, message: messageErreur(error) }
  }
  if (!data) {
    return { ok: false, message: 'Élève introuvable dans cet établissement.' }
  }

  return { ok: true, nom: data.last_name, prenoms: data.first_name }
}