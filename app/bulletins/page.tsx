import { FileText, GraduationCap, Layers } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { BulletinsPanel } from '@/components/bulletins/bulletins-panel'
import { getBulletins, getEvaluationOptions } from '@/lib/queries/grades'

export const metadata = { title: 'Bulletins — GESTION-SCOLAIRE' }

export default async function BulletinsPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; periode?: string; eleve?: string }>
}) {
  const { classe, periode, eleve } = await searchParams
  const options = await getEvaluationOptions()

  const classId =
    options && classe && options.classes.some((c) => c.id === classe)
      ? classe
      : options?.classes[0]?.id ?? null

  const termId =
    options && periode && options.termes.some((t) => t.id === periode)
      ? periode
      : options?.termes.find((t) => t.estCourant)?.id ?? options?.termes[0]?.id ?? null

  const bulletins =
    options && classId ? await getBulletins(classId, termId, options.etablissement) : null

  const rows = bulletins?.rows ?? []
  const moyenneClasse =
    rows.length > 0 ? rows.reduce((s, r) => s + r.moyenne, 0) / rows.length : 0

  return (
    <>
      <PageHeader
        title="Bulletins"
        description={
          options
            ? `Édition des bulletins — ${bulletins?.periodeLabel ?? ''}, ${options.anneeLabel}`
            : 'Édition et validation des bulletins'
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Bulletins à éditer"
          value={rows.length}
          hint="Classe sélectionnée"
          icon={FileText}
        />
        <StatCard
          label="Classes concernées"
          value={options?.classes.length ?? 0}
          icon={Layers}
          accent="sky"
        />
        <StatCard
          label="Moyenne de classe"
          value={rows.length > 0 ? `${moyenneClasse.toFixed(2)} / 20` : '—'}
          icon={GraduationCap}
          accent="amber"
        />
      </div>

      <BulletinsPanel
        options={options}
        rows={rows}
        periodeLabel={bulletins?.periodeLabel ?? null}
        selectedClasseId={classId}
        selectedTermId={termId}
        selectedStudentId={eleve ?? null}
      />
    </>
  )
}