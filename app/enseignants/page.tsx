import { BookOpen, GraduationCap, Plus, School } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import {
  EnseignantsTable,
  EnseignantDialog,
} from '@/components/enseignants/enseignants-table'
import { getEnseignantsData } from '@/lib/queries/enseignants'
import { getEvaluationOptions } from '@/lib/queries/grades'

export const metadata = { title: 'Enseignants — GESTION-SCOLAIRE' }

export default async function EnseignantsPage() {
  const [{ enseignants, matieres }, options] = await Promise.all([
    getEnseignantsData(),
    getEvaluationOptions(),
  ])

  const actifs = enseignants.filter((t) => t.statut === 'actif')
  const affectations = enseignants.reduce((s, t) => s + t.classes.length, 0)
  const matiereIdsCouvertes = new Set(enseignants.flatMap((t) => t.matiereIds))
  const matieresCouvertes = matieres.filter((m) => matiereIdsCouvertes.has(m.id)).length

  return (
    <>
      <PageHeader
        title="Enseignants"
        description="Corps enseignant, matières et affectations par classe"
      >
        <EnseignantDialog
          options={options}
          trigger={
            <Button>
              <Plus className="size-4" data-icon="inline-start" />
              Ajouter un enseignant
            </Button>
          }
        />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enseignants actifs" value={actifs.length} icon={GraduationCap} />
        <StatCard
          label="Affectations"
          value={affectations}
          hint="Couples enseignant / classe"
          icon={School}
          accent="sky"
        />
        <StatCard
          label="Matières couvertes"
          value={`${matieresCouvertes} / ${matieres.length}`}
          icon={BookOpen}
          accent="amber"
        />
        <StatCard
          label="Matières sans enseignant"
          value={matieres.length - matieresCouvertes}
          hint="Affectation à prévoir"
          icon={BookOpen}
          accent="rose"
        />
      </div>

      <EnseignantsTable enseignants={enseignants} matieres={matieres} options={options} />
    </>
  )
}
