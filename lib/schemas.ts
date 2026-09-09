import { z } from 'zod'

export const sexes = ['M', 'F'] as const
export const statutsEleve = ['inscrit', 'nouveau', 'archive', 'radie', 'transfere'] as const
export const statutsPaiement = ['a_jour', 'partiel', 'retard'] as const
export const modesPaiement = ['Espèces', 'Mobile Money', 'Virement', 'Chèque', 'Carte'] as const
export const liensParente = ['Père', 'Mère', 'Tuteur', 'Tutrice', 'Autre'] as const
export const cycles = ['Primaire', 'Collège', 'Lycée'] as const
export const typesEvaluation = [
  'Interrogation',
  'Devoir',
  'Composition',
  'Contrôle continu',
] as const
export const statutsEvaluation = ['planifiee', 'saisie', 'validee'] as const

export const dateIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date au format AAAA-MM-JJ attendue')

const texteRequis = z.string().trim().min(1, 'Champ requis')

export const telephoneCoteIvoire = z
  .string()
  .trim()
  .regex(/^\+225\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}(\s?\d{2})?$/, 'Numéro +225 invalide')

export const montantFCFA = z.coerce
  .number()
  .nonnegative('Le montant ne peut pas être négatif')
  .max(100_000_000, 'Montant invalide')

export const eleveSchema = z.object({
  id: texteRequis,
  matricule: z.string().trim().regex(/^[A-Z]{3}-\d{2}-\d{4}$/, 'Matricule invalide'),
  nom: texteRequis,
  prenoms: texteRequis,
  sexe: z.enum(sexes),
  dateNaissance: dateIso,
  lieuNaissance: texteRequis,
  nationalite: texteRequis,
  niveau: texteRequis,
  classeId: texteRequis,
  statut: z.enum(statutsEleve),
  dateInscription: dateIso,
  moyenne: z.number().min(0).max(20),
  statutPaiement: z.enum(statutsPaiement),
  montantDu: montantFCFA,
  montantPaye: montantFCFA,
  telephone: telephoneCoteIvoire,
  adresse: texteRequis,
  parentIds: z.array(texteRequis),
})

export type EleveSchema = z.infer<typeof eleveSchema>

export const paiementSchema = z.object({
  id: texteRequis,
  recu: z.string().trim(),
  eleveId: texteRequis,
  montant: montantFCFA,
  date: dateIso,
  mode: z.enum(modesPaiement),
})

export type PaiementSchema = z.infer<typeof paiementSchema>

export const inscriptionSchema = z.object({
  nom: texteRequis,
  prenoms: texteRequis,
  sexe: z.enum(sexes),
  dateNaissance: dateIso,
  lieuNaissance: texteRequis,
  nationalite: texteRequis,
  telephone: telephoneCoteIvoire,
  adresse: texteRequis,
  parentId: texteRequis,
  lien: z.enum(liensParente),
  parentTelephone: telephoneCoteIvoire,
  parentEmail: z.string().trim().email('Email invalide').optional().or(z.literal('')),
  anneeId: texteRequis,
  classeId: texteRequis,
  dateInscription: dateIso,
  statut: z.enum(['nouveau', 'inscrit']),
  fraisInscription: montantFCFA,
  scolarite: montantFCFA,
  reduction: montantFCFA,
})

export type InscriptionSchema = z.infer<typeof inscriptionSchema>

export function validerPartiel<S extends z.ZodType>(
  schema: S,
  donnees: unknown,
): Record<string, string> {
  const resultat = schema.safeParse(donnees)
  if (resultat.success) return {}
  const champs = resultat.error.flatten().fieldErrors as Record<string, string[] | undefined>
  return Object.fromEntries(
    Object.entries(champs).map(([nom, msgs]) => [
      nom,
      msgs?.[0] ?? 'Valeur invalide',
    ]),
  )
}