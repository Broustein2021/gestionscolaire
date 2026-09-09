export type StatutEvaluation = 'planifiee' | 'saisie' | 'validee' | 'annulee'

export const statutEvaluationLabel: Record<StatutEvaluation, string> = {
  planifiee: 'Planifiée',
  saisie: 'Saisie',
  validee: 'Validée',
  annulee: 'Annulée',
}

export const typesEvaluation = [
  'Interrogation',
  'Devoir',
  'Composition',
  'Contrôle continu',
  'Examen',
] as const

export function appreciationNote(moyenne: number): string {
  if (moyenne >= 16) return 'Excellent'
  if (moyenne >= 14) return 'Très bien'
  if (moyenne >= 12) return 'Bien'
  if (moyenne >= 10) return 'Assez bien'
  if (moyenne >= 8) return 'Insuffisant'
  return 'Faible'
}