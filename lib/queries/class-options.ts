import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolContext } from '@/lib/queries/school-context'
import { getEnseignantsData } from '@/lib/queries/enseignants'

export type NiveauOption = { id: string; code: string; cycle: 'Primaire' | 'Collège' | 'Lycée' }
export type EnseignantOption = { id: string; nom: string; prenoms: string }

export type ClasseOptions = {
  schoolId: string
  academicYearId: string
  niveaux: NiveauOption[]
  enseignants: EnseignantOption[]
}

/** Options de création / modification de classe : niveaux et enseignants réels. */
export async function getClasseOptions(): Promise<ClasseOptions | null> {
  const ctx = await getCurrentSchoolContext()
  if (!ctx) return null

  const supabase = await createClient()

  const [{ data: levelRows }, { enseignants }] = await Promise.all([
    supabase
      .from('levels')
      .select('id, code, cycle')
      .eq('school_id', ctx.schoolId)
      .order('sequence_no', { ascending: true }),
    getEnseignantsData(),
  ])

  return {
    schoolId: ctx.schoolId,
    academicYearId: ctx.academicYearId,
    niveaux: (levelRows ?? []).map((l) => ({
      id: l.id,
      code: l.code,
      cycle: l.cycle,
    })),
    enseignants: enseignants.map((t) => ({
      id: t.id,
      nom: t.nom,
      prenoms: t.prenoms,
    })),
  }
}