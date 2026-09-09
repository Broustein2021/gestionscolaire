import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolContext } from '@/lib/queries/school-context'

export type ParentEnfant = {
  id: string
  nom: string
  prenoms: string
  classeNom: string | null
}

export type Parent = {
  id: string
  nom: string
  prenoms: string
  lien: string
  profession: string | null
  telephone: string | null
  email: string | null
  adresse: string | null
  principal: boolean
  enfants: ParentEnfant[]
}

/**
 * Remplace l'import `parents` de lib/data.ts. Liste les responsables
 * (guardians) de l'école, avec leurs enfants réellement rattachés
 * (student_guardians) et la classe en cours de chaque enfant.
 */
export async function getParents(): Promise<Parent[]> {
  const ctx = await getCurrentSchoolContext()
  if (!ctx) return []

  const supabase = await createClient()

  const { data: guardianRows, error } = await supabase
    .from('guardians')
    .select('id, first_name, last_name, phone, email, profession, address')
    .eq('school_id', ctx.schoolId)
    .order('last_name', { ascending: true })

  if (error || !guardianRows) {
    console.error('[getParents] erreur Supabase :', error)
    return []
  }

  const { data: linkRows } = await supabase
    .from('student_guardians')
    .select('guardian_id, relation, is_primary, students:student_id ( id, first_name, last_name )')
    .eq('school_id', ctx.schoolId)

  const studentIds = ((linkRows ?? []) as unknown as Array<{
      students: { id: string } | Array<{ id: string }> | null
    }>)
    .map((l) => (Array.isArray(l.students) ? l.students[0]?.id : l.students?.id))
    .filter((id): id is string => Boolean(id))

  const classeParEleve = new Map<string, string>()
  if (studentIds.length > 0) {
    const { data: enrollmentRows } = await supabase
      .from('enrollments')
      .select('student_id, classes:class_id ( name )')
      .eq('school_id', ctx.schoolId)
      .eq('academic_year_id', ctx.academicYearId)
      .eq('status', 'validee')
      .in('student_id', studentIds)

    for (const e of enrollmentRows ?? []) {
      const c = Array.isArray(e.classes) ? e.classes[0] : e.classes
      if (c?.name) classeParEleve.set(e.student_id, c.name)
    }
  }

  const enfantsParGuardian = new Map<string, ParentEnfant[]>()
  const lienParGuardian = new Map<string, string>()
  const principalParGuardian = new Map<string, boolean>()

  for (const l of linkRows ?? []) {
    const s = Array.isArray(l.students) ? l.students[0] : l.students
    if (!s) continue

    const enfants = enfantsParGuardian.get(l.guardian_id) ?? []
    enfants.push({
      id: s.id,
      nom: s.last_name,
      prenoms: s.first_name,
      classeNom: classeParEleve.get(s.id) ?? null,
    })
    enfantsParGuardian.set(l.guardian_id, enfants)

    if (!lienParGuardian.has(l.guardian_id)) {
      lienParGuardian.set(l.guardian_id, l.relation)
    }
    if (l.is_primary) principalParGuardian.set(l.guardian_id, true)
  }

  return guardianRows.map((g) => ({
    id: g.id,
    nom: g.last_name,
    prenoms: g.first_name,
    lien: lienParGuardian.get(g.id) ?? '—',
    profession: g.profession,
    telephone: g.phone,
    email: g.email,
    adresse: g.address,
    principal: principalParGuardian.get(g.id) ?? false,
    enfants: enfantsParGuardian.get(g.id) ?? [],
  }))
}

export const liensParente = ['Père', 'Mère', 'Tuteur', 'Tutrice', 'Autre'] as const
