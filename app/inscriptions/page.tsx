import { UserPlus, Users, Wallet, CalendarCheck } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { InscriptionWizard } from '@/components/inscriptions/inscription-wizard'
import { InscriptionsTable } from '@/components/inscriptions/inscriptions-table'
import { formatFCFA } from '@/lib/data'
import { getInscriptionOptions, getInscriptions } from '@/lib/queries/enrollments'

export const metadata = {
  title: 'Inscriptions — GESTION-SCOLAIRE',
}

export default async function InscriptionsPage() {
  const options = await getInscriptionOptions()
  const inscriptions = options ? await getInscriptions() : []

  const nouveaux = inscriptions.filter((i) => i.isNouveau).length
  const reinscriptions = inscriptions.length - nouveaux
  const attenduInscriptions = inscriptions.reduce((total, i) => total + i.montantDu, 0)

  const anneeLibelle = options?.anneeCourante?.libelle ?? ''

  return (
    <>
      <PageHeader
        title="Inscriptions"
        description={
          anneeLibelle
            ? `Dossiers d'inscription — année scolaire ${anneeLibelle}`
            : "Dossiers d'inscription"
        }
      >
        {options ? <InscriptionWizard options={options} /> : null}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Dossiers validés"
          value={inscriptions.length}
          hint="Élèves inscrits cette année"
          icon={Users}
        />

        <StatCard
          label="Nouveaux élèves"
          value={nouveaux}
          hint="Première inscription"
          icon={UserPlus}
          accent="sky"
        />

        <StatCard
          label="Réinscriptions"
          value={reinscriptions}
          hint="Anciens élèves"
          icon={CalendarCheck}
          accent="amber"
        />

        <StatCard
          label="Frais engagés"
          value={formatFCFA(attenduInscriptions)}
          hint="Inscriptions + scolarité"
          icon={Wallet}
          accent="rose"
        />
      </div>

      <InscriptionsTable
        inscriptions={inscriptions}
        classes={options?.classes ?? []}
      />
    </>
  )
}