import { Download } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { CsvExportButton } from '@/components/csv-export-button'
import { FinancesPanel } from '@/components/finances/finances-panel'
import { getFinances, getFinancesOptions } from '@/lib/queries/finances'

export const metadata = { title: 'Frais & Paiements — GESTION-SCOLAIRE' }

const libellesPaiement = {
  a_jour: 'À jour',
  partiel: 'Partiel',
  retard: 'En retard',
} as const

export default async function FinancesPage() {
  const options = await getFinancesOptions()
  const data = options ? await getFinances() : null

  const lignesExport = (data?.paiements ?? []).map((p) => ({
    recu: p.recu ?? '',
    date: p.date ? new Date(p.date).toLocaleDateString('fr-FR') : '',
    eleve: p.eleveNom ?? '',
    matricule: p.matricule ?? '',
    classe: p.classeNom ?? '',
    motif: p.motif ?? '',
    mode: p.mode,
    montant: p.montant.toFixed(2).replace('.', ','),
    solde: p.soldeRestant > 0 ? p.soldeRestant.toFixed(2).replace('.', ',') : '',
    statut: libellesPaiement[p.statut] ?? p.statut,
  }))

  return (
    <>
      <PageHeader
        title="Frais & Paiements"
        description={
          options
            ? `Encaissements, soldes et reçus — ${options.anneeLabel}, ${options.etablissement.nom}`
            : 'Encaissements, soldes et reçus'
        }
      >
        <CsvExportButton
          nomFichier="paiements.csv"
          colonnes={[
            { cle: 'recu', libelle: 'N° reçu' },
            { cle: 'date', libelle: 'Date' },
            { cle: 'eleve', libelle: 'Élève' },
            { cle: 'matricule', libelle: 'Matricule' },
            { cle: 'classe', libelle: 'Classe' },
            { cle: 'motif', libelle: 'Motif' },
            { cle: 'mode', libelle: 'Mode' },
            { cle: 'montant', libelle: 'Montant (FCFA)' },
            { cle: 'solde', libelle: 'Solde restant (FCFA)' },
            { cle: 'statut', libelle: 'Statut' },
          ]}
          lignes={lignesExport}
        >
          <Download className="size-4" data-icon="inline-start" />
          Exporter
        </CsvExportButton>
      </PageHeader>
      <FinancesPanel data={data} options={options} />
    </>
  )
}