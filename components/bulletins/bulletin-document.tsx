import { formatFCFA } from '@/lib/data'
import type { BulletinData } from '@/lib/queries/grades'

export function BulletinDocument({ bulletin }: { bulletin: BulletinData }) {
  const {
    eleve,
    classeNom,
    periodeLabel,
    lignes,
    totalCoef,
    totalPoints,
    moyenneGenerale,
    appreciationGenerale,
    rang,
    effectif,
    montantDu,
    montantPaye,
    etablissement,
  } = bulletin

  return (
    <div
      data-print-area
      className="flex flex-col gap-5 rounded-lg border bg-card p-5 text-card-foreground"
    >
      <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold uppercase tracking-wide">
            {etablissement.organisation}
          </p>
          <p className="text-sm text-muted-foreground">{etablissement.nom}</p>
          <p className="text-xs text-muted-foreground">
            {etablissement.commune}, {etablissement.ville} · {etablissement.telephone}
          </p>
        </div>
        <div className="flex flex-col gap-0.5 sm:text-right">
          <p className="font-serif text-lg font-semibold">Bulletin de notes</p>
          <p className="text-sm text-muted-foreground">
            {periodeLabel ?? 'Période'} — Année en cours
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">Élève</dt>
          <dd className="font-medium">
            {eleve.nom} {eleve.prenoms}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">Matricule</dt>
          <dd className="font-mono">{eleve.matricule}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">Classe</dt>
          <dd className="font-medium">{classeNom ?? '—'}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">Effectif</dt>
          <dd className="tabular-nums">{effectif} élèves</dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                Matière
              </th>
              <th scope="col" className="px-3 py-2 text-center font-medium">
                Note /20
              </th>
              <th scope="col" className="px-3 py-2 text-center font-medium">
                Coef.
              </th>
              <th scope="col" className="px-3 py-2 text-center font-medium">
                Points
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Appréciation
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Enseignant
              </th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={`${l.matiere}-${i}`} className="border-t">
                <td className="px-3 py-2 font-medium">{l.matiere}</td>
                <td className="px-3 py-2 text-center tabular-nums">
                  {l.note.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center tabular-nums">
                  {l.coefficient}
                </td>
                <td className="px-3 py-2 text-center tabular-nums">
                  {l.points.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{l.appreciation}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {l.enseignant ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-muted/40">
            <tr>
              <td className="px-3 py-2 font-medium">Total</td>
              <td />
              <td className="px-3 py-2 text-center font-medium tabular-nums">
                {totalCoef}
              </td>
              <td className="px-3 py-2 text-center font-medium tabular-nums">
                {totalPoints.toFixed(2)}
              </td>
              <td className="px-3 py-2" colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5 rounded-lg border p-3">
          <span className="text-xs text-muted-foreground">Moyenne générale</span>
          <span className="text-xl font-semibold tabular-nums">
            {moyenneGenerale > 0 ? `${moyenneGenerale.toFixed(2)} / 20` : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-lg border p-3">
          <span className="text-xs text-muted-foreground">Rang</span>
          <span className="text-xl font-semibold tabular-nums">
            {moyenneGenerale > 0 ? rang : '—'}
            {moyenneGenerale > 0 ? (
              <span className="text-sm font-normal text-muted-foreground">
                {' '}
                / {effectif}
              </span>
            ) : null}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-lg border p-3">
          <span className="text-xs text-muted-foreground">Appréciation</span>
          <span className="text-xl font-semibold">
            {moyenneGenerale > 0 ? appreciationGenerale : '—'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-lg border border-dashed p-3 text-sm">
        <span className="text-xs text-muted-foreground">
          Situation financière au moment de l&apos;édition
        </span>
        <span>
          Payé {formatFCFA(montantPaye)} sur {formatFCFA(montantDu)}
        </span>
      </div>

      <footer className="flex flex-col gap-8 border-t pt-4 text-sm sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-6">
          <span className="text-muted-foreground">Le professeur principal</span>
          <span className="w-40 border-b border-dashed" />
        </div>
        <div className="flex flex-col gap-6">
          <span className="text-muted-foreground">Le chef d&apos;établissement</span>
          <span className="w-40 border-b border-dashed" />
        </div>
      </footer>
    </div>
  )
}