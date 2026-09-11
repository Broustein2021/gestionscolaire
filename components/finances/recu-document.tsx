import { GraduationCap } from 'lucide-react'

import { formatDateFR, formatFCFA } from '@/lib/data'
import type { EtablissementInfo } from '@/lib/queries/finances'

export type RecuData = {
  numeroRecu: string
  eleveNom: string
  matricule: string
  classeNom: string | null
  montant: number
  date: string
  mode: string
  motif: string | null
  reference: string | null
  enregistrePar: string | null
  soldeRestant: number
  anneeScolaire: string
  etablissement: EtablissementInfo
}

export function RecuDocument({ data }: { data: RecuData }) {
  return (
    <div
      data-print-area
      className="flex flex-col gap-5 rounded-lg border bg-card p-5 text-card-foreground"
    >
      <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold uppercase tracking-wide">
              {data.etablissement.organisation || 'Établissement scolaire'}
            </p>
            <p className="text-sm text-muted-foreground">{data.etablissement.nom}</p>
            <p className="text-xs text-muted-foreground">
              {[data.etablissement.commune, data.etablissement.ville]
                .filter(Boolean)
                .join(', ') || '—'}{' '}
              {data.etablissement.telephone
                ? `· ${data.etablissement.telephone}`
                : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 sm:text-right">
          <p className="font-serif text-lg font-semibold">Reçu de paiement</p>
          <p className="font-mono text-sm">{data.numeroRecu}</p>
          <p className="text-xs text-muted-foreground">
            Année scolaire {data.anneeScolaire}
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">Élève</dt>
          <dd className="font-medium">{data.eleveNom || '—'}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">Matricule</dt>
          <dd className="font-mono">{data.matricule || '—'}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">Classe</dt>
          <dd className="font-medium">{data.classeNom ?? '—'}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">Date</dt>
          <dd className="tabular-nums">{formatDateFR(data.date)}</dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                Motif
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Mode de paiement
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Référence
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Montant
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">{data.motif ?? '—'}</td>
              <td className="px-3 py-2">{data.mode}</td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                {data.reference || '—'}
              </td>
              <td className="px-3 py-2 text-right font-medium tabular-nums">
                {formatFCFA(data.montant)}
              </td>
            </tr>
          </tbody>
          <tfoot className="border-t bg-muted/40">
            <tr>
              <td className="px-3 py-2 font-medium" colSpan={3}>
                Total encaissé
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {formatFCFA(data.montant)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-0.5 rounded-lg border p-3">
          <span className="text-xs text-muted-foreground">Solde restant dû</span>
          <span className="text-xl font-semibold tabular-nums">
            {formatFCFA(Math.max(0, data.soldeRestant))}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-lg border p-3">
          <span className="text-xs text-muted-foreground">Enregistré par</span>
          <span className="text-sm font-medium">{data.enregistrePar ?? '—'}</span>
        </div>
      </div>

      <footer className="flex flex-col gap-8 border-t pt-4 text-sm sm:flex-row sm:justify-between">
        <p className="max-w-xs text-pretty text-xs text-muted-foreground">
          Ce reçu doit être conservé. Toute réclamation devra être accompagnée du
          présent document.
        </p>
        <div className="flex flex-col gap-6">
          <span className="text-muted-foreground">Cachet et signature</span>
          <span className="w-40 border-b border-dashed" />
        </div>
      </footer>
    </div>
  )
}