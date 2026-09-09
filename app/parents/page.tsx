import { Contact, Plus, Users, UserCheck } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { ParentsList, ParentFormDialog } from '@/components/parents/parents-list'
import { getParents } from '@/lib/queries/parents'
import { getEleves } from '@/lib/queries/eleves'
import { getCurrentSchoolContext } from '@/lib/queries/school-context'

export const metadata = { title: 'Parents & Responsables — GESTION-SCOLAIRE' }

export default async function ParentsPage() {
  const [parents, eleves, ctx] = await Promise.all([
    getParents(),
    getEleves(),
    getCurrentSchoolContext(),
  ])
  const schoolId = ctx?.schoolId ?? null

  const elevesAvecResponsableIds = new Set(parents.flatMap((p) => p.enfants.map((e) => e.id)))
  const principaux = parents.filter((p) => p.principal).length
  const elevesAvecResponsable = eleves.filter((e) => elevesAvecResponsableIds.has(e.id)).length
  const elevesSansResponsable = eleves.filter((e) => !elevesAvecResponsableIds.has(e.id)).length

  return (
    <>
      <PageHeader
        title="Parents & Responsables"
        description="Responsables légaux, contacts et rattachement des enfants"
      >
        <ParentFormDialog
          schoolId={schoolId}
          trigger={
            <Button>
              <Plus className="size-4" data-icon="inline-start" />
              Ajouter un responsable
            </Button>
          }
        />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Responsables" value={parents.length} icon={Contact} />
        <StatCard
          label="Responsables principaux"
          value={principaux}
          icon={UserCheck}
          accent="sky"
        />
        <StatCard
          label="Élèves rattachés"
          value={elevesAvecResponsable}
          hint="Au moins un responsable"
          icon={Users}
          accent="amber"
        />
        <StatCard
          label="Dossiers à compléter"
          value={elevesSansResponsable}
          hint="Aucun responsable enregistré"
          icon={Users}
          accent="rose"
        />
      </div>

      <ParentsList parents={parents} schoolId={schoolId} />
    </>
  )
}
