import { UserPlus, Download, Users, GraduationCap, AlertTriangle } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { LinkButton } from '@/components/link-button'
import { StatCard } from '@/components/stat-card'
import { CsvExportButton } from '@/components/csv-export-button'
import { ElevesTable } from '@/components/eleves/eleves-table'
import { getEleves } from '@/lib/queries/eleves'

export const metadata = { title: 'Élèves — GESTION-SCOLAIRE' }

const libellesPaiement = {
  a_jour: 'À jour',
  partiel: 'Partiel',
  retard: 'En retard',
} as const

export default async function ElevesPage() {
  const eleves = await getEleves()

  const nouveaux = eleves.filter((e) => e.statut === 'nouveau').length
  const enRetard = eleves.filter((e) => e.statutPaiement === 'retard').length
  const niveaux = Array.from(new Set(eleves.map((e) => e.niveau).filter((n): n is string => Boolean(n))))

  const lignesExport = eleves.map((e) => ({
    nom: e.nom,
    prenoms: e.prenoms,
    matricule: e.matricule,
    sexe: e.sexe === 'F' ? 'Féminin' : 'Masculin',
    nationalite: e.nationalite,
    classe: e.classeNom ?? '',
    niveau: e.niveau ?? '',
    moyenne: e.moyenne > 0 ? e.moyenne.toFixed(2).replace('.', ',') : '',
    paiement: libellesPaiement[e.statutPaiement] ?? e.statutPaiement,
  }))

  return (
    <>
      <PageHeader
        title="Élèves"
        description="Liste, recherche et gestion des dossiers élèves"
      >
        <CsvExportButton
          nomFichier="eleves.csv"
          colonnes={[
            { cle: 'nom', libelle: 'Nom' },
            { cle: 'prenoms', libelle: 'Prénoms' },
            { cle: 'matricule', libelle: 'Matricule' },
            { cle: 'sexe', libelle: 'Sexe' },
            { cle: 'nationalite', libelle: 'Nationalité' },
            { cle: 'classe', libelle: 'Classe' },
            { cle: 'niveau', libelle: 'Niveau' },
            { cle: 'moyenne', libelle: 'Moyenne /20' },
            { cle: 'paiement', libelle: 'Paiement' },
          ]}
          lignes={lignesExport}
        >
          <Download className="size-4" data-icon="inline-start" />
          Exporter
        </CsvExportButton>
        <LinkButton href="/inscriptions">
          <UserPlus className="size-4" data-icon="inline-start" />
          Inscrire un élève
        </LinkButton>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Élèves inscrits" value={eleves.length} icon={Users} />
        <StatCard
          label="Niveaux représentés"
          value={niveaux.length}
          icon={GraduationCap}
          accent="sky"
        />
        <StatCard label="Nouveaux élèves" value={nouveaux} icon={UserPlus} accent="amber" />
        <StatCard
          label="Paiements en retard"
          value={enRetard}
          icon={AlertTriangle}
          accent="rose"
        />
      </div>

      <ElevesTable eleves={eleves} niveaux={niveaux} />
    </>
  )
}
