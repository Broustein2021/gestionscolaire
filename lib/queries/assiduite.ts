import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolContext } from '@/lib/queries/school-context'

export type ClassePresence = {
  id: string
  nom: string
  niveau: string
  cycle: 'Primaire' | 'Collège' | 'Lycée'
  effectif: number
}

export type ContexteAssiduite = {
  schoolId: string
  academicYearId: string
  classes: ClassePresence[]
}

/**
 * Contexte du module Assiduité : école active, année scolaire courante et
 * liste des classes avec leur effectif réel (inscriptions validées).
 * Retourne null si l'utilisateur n'a pas d'établissement actif.
 */
export async function getAssiduiteContext(): Promise<ContexteAssiduite | null> {
  const ctx = await getCurrentSchoolContext()
  if (!ctx) return null

  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('classes')
    .select('id, name, level_label, cycle')
    .eq('school_id', ctx.schoolId)
    .eq('academic_year_id', ctx.academicYearId)

  if (error) {
    console.error('[getAssiduiteContext] erreur classes :', error)
    return { ...ctx, classes: [] }
  }

  const { data: enrollmentRows } = await supabase
    .from('enrollments')
    .select('class_id')
    .eq('school_id', ctx.schoolId)
    .eq('academic_year_id', ctx.academicYearId)
    .eq('status', 'validee')

  const effectifParClasse = new Map<string, number>()
  for (const e of enrollmentRows ?? []) {
    if (!e.class_id) continue
    effectifParClasse.set(e.class_id, (effectifParClasse.get(e.class_id) ?? 0) + 1)
  }

  const classes: ClassePresence[] = (rows ?? []).map((row) => ({
    id: row.id,
    nom: row.name,
    niveau: row.level_label,
    cycle: row.cycle,
    effectif: effectifParClasse.get(row.id) ?? 0,
  }))

  return { ...ctx, classes }
}