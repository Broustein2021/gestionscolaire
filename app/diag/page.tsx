import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchoolContext } from '@/lib/queries/school-context'
import { getEvaluationOptions } from '@/lib/queries/grades'

export const dynamic = 'force-dynamic'

export default async function DiagPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  const authMessage = authError?.message ?? null

  if (!user) notFound()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, is_platform_admin')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError || !profile?.is_platform_admin) notFound()

  const stages: Record<string, unknown> = {
    authError: authMessage,
    user: user ? { id: user.id, email: user.email } : null,
  }

  stages.profileError = null
  stages.profile = profile

  const { data: membership, error: membershipError } = await supabase
    .from('school_members')
    .select('id, school_id, role, status')
    .eq('profile_id', profile.id)
    .maybeSingle()

  stages.membershipError = membershipError?.message ?? null
  stages.membership = membership

  const ctx = await getCurrentSchoolContext()
  stages.contexte = ctx

  if (ctx) {
    const { data: schoolRow } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', ctx.schoolId)
      .maybeSingle()

    const { count: nbClasses } = await supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', ctx.schoolId)

    const { count: nbMatieres } = await supabase
      .from('subjects')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', ctx.schoolId)
      .eq('is_active', true)

    stages.ecole = schoolRow
    stages.nbClasses = nbClasses
    stages.nbMatieres = nbMatieres
  }

  const options = await getEvaluationOptions()
  stages.optionsNonNul = options !== null
  stages.options = options
    ? {
        schoolId: options.schoolId,
        anneeLabel: options.anneeLabel,
        classes: options.classes.length,
        matieres: options.matieres.length,
        enseignants: options.enseignants.length,
        termes: options.termes.length,
        etablissement: options.etablissement,
      }
    : null

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-lg font-semibold">Diagnostic serveur</h1>
      <pre className="overflow-auto rounded-lg border border-slate-300 bg-slate-50 p-4 text-xs">
        {JSON.stringify(stages, null, 2)}
      </pre>
    </div>
  )
}