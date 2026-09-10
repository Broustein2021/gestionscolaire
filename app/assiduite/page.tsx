import { CalendarCheck, School, Users, UserCheck } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { AssiduitePanel } from '@/components/assiduite/assiduite-panel'
import { getAssiduiteContext } from '@/lib/queries/assiduite'

export const metadata = { title: 'Présences & Absences — GESTION-SCOLAIRE' }

function dateDuJour(): string {
  return new Date().toISOString().slice(0, 10)
}

export default async function AssiduitePage() {
  const ctx = await getAssiduiteContext()

  if (!ctx) {
    return null
  }

  const effectifTotal = ctx.classes.reduce((s, c) => s + c.effectif, 0)
  const classesAvecEleves = ctx.classes.filter((c) => c.effectif > 0).length

  return (
    <>
      <PageHeader
        title="Présences & Absences"
        description="Feuille de pointage quotidienne par classe, avec justificatifs"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Classes" value={ctx.classes.length} icon={School} />
        <StatCard
          label="Élèves à pointer"
          value={effectifTotal}
          hint="Inscrits cette année"
          icon={Users}
          accent="sky"
        />
        <StatCard
          label="Classes actives"
          value={classesAvecEleves}
          hint="Au moins un élève"
          icon={UserCheck}
          accent="amber"
        />
        <StatCard
          label="Aujourd'hui"
          value={dateDuJour().slice(8, 10) + '/' + dateDuJour().slice(5, 7) + '/' + dateDuJour().slice(0, 4)}
          icon={CalendarCheck}
          accent="rose"
        />
      </div>

      <AssiduitePanel
        classes={ctx.classes}
        schoolId={ctx.schoolId}
        academicYearId={ctx.academicYearId}
        dateInitiale={dateDuJour()}
      />
    </>
  )
}