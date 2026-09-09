import { BookOpen, Plus, Sigma, Layers } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { MatieresTable, MatiereDialog } from '@/components/matieres/matieres-table'
import { getMatieres } from '@/lib/queries/matieres'
import { getCurrentSchoolContext } from '@/lib/queries/school-context'
import { cycles } from '@/lib/queries/classes'

export const metadata = { title: 'Matières — GESTION-SCOLAIRE' }

export default async function MatieresPage() {
  const [matieres, ctx] = await Promise.all([getMatieres(), getCurrentSchoolContext()])
  const schoolId = ctx?.schoolId ?? null

  const totalCoef = matieres.reduce((s, m) => s + m.coefficient, 0)
  const college = matieres.filter((m) => m.cycle === 'Collège').length
  const primaire = matieres.filter((m) => m.cycle === 'Primaire').length

  return (
    <>
      <PageHeader
        title="Matières"
        description="Programme, coefficients et enseignants responsables"
      >
        <MatiereDialog
          schoolId={schoolId}
          trigger={
            <Button>
              <Plus className="size-4" data-icon="inline-start" />
              Créer une matière
            </Button>
          }
        />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Matières" value={matieres.length} icon={BookOpen} />
        <StatCard
          label="Somme des coefficients"
          value={totalCoef}
          hint="Base de calcul des moyennes"
          icon={Sigma}
          accent="sky"
        />
        <StatCard label="Cycle Collège" value={college} icon={Layers} accent="amber" />
        <StatCard label="Cycle Primaire" value={primaire} icon={Layers} accent="rose" />
      </div>

      <MatieresTable matieres={matieres} cycles={cycles} schoolId={schoolId} />
    </>
  )
}
