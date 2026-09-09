import { Suspense } from 'react'
import { FileText } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { LinkButton } from '@/components/link-button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { SaisieNotes } from '@/components/notes/saisie-notes'
import { getEvaluations, getEvaluationOptions } from '@/lib/queries/grades'

export const metadata = { title: 'Saisie des notes — GESTION-SCOLAIRE' }

function SaisieSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <Skeleton className="h-5 w-56" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  )
}

export default async function NotesPage() {
  const options = await getEvaluationOptions()
  const evaluations = options ? await getEvaluations() : []

  return (
    <>
      <PageHeader
        title="Saisie des notes"
        description={
          options
            ? `Notation par évaluation — ${options.termes[0]?.label ?? ''}, ${options.anneeLabel}`
            : 'Notation par évaluation'
        }
      >
        <LinkButton href="/bulletins" variant="outline" disabled={!options}>
          <FileText className="size-4" data-icon="inline-start" />
          Voir les bulletins
        </LinkButton>
      </PageHeader>

      <Suspense fallback={<SaisieSkeleton />}>
        <SaisieNotes options={options} evaluations={evaluations} />
      </Suspense>
    </>
  )
}