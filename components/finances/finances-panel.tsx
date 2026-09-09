'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  CircleDollarSign,
  Printer,
  Receipt,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/empty-state'
import { PaymentBadge } from '@/components/payment-badge'
import { StatCard } from '@/components/stat-card'
import { PaiementForm } from '@/components/finances/paiement-form'
import { RecuDocument, type RecuData } from '@/components/finances/recu-document'
import { formatFCFA, modesPaiement } from '@/lib/data'
import type { PaiementEnregistre } from '@/lib/payments-create'
import type { FinancesData, FinancesOptions } from '@/lib/queries/finances'

/** Montant sans suffixe — le libellé de la carte porte déjà « FCFA ». */
function montantCourt(valeur: number) {
  return new Intl.NumberFormat('fr-FR').format(valeur)
}

const FILTRES_STATUT: Record<string, 'a_jour' | 'partiel' | 'retard' | 'tous'> = {
  'Tout statut': 'tous',
  'À jour': 'a_jour',
  Partiel: 'partiel',
  'En retard': 'retard',
}

const FILTRES_PERIODE: Record<string, number> = {
  'Toute période': Number.POSITIVE_INFINITY,
  '7 derniers jours': 7,
  '30 derniers jours': 30,
}

function joursDepuis(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  return diff / 86_400_000
}

type Props = {
  data: FinancesData | null
  options: FinancesOptions | null
}

export function FinancesPanel({ data, options }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [recuData, setRecuData] = useState<RecuData | null>(null)

  const [q, setQ] = useState('')
  const [statut, setStatut] = useState('Tout statut')
  const [mode, setMode] = useState('Tout mode')
  const [periode, setPeriode] = useState('Toute période')

  const kpis = data?.kpis
  const paiements = data?.paiements ?? []

  const lignes = useMemo(() => {
    const term = q.trim().toLowerCase()
    return paiements
      .filter((l) => {
        const nom = `${l.eleveNom ?? ''} ${l.matricule ?? ''}`.toLowerCase()
        const matchTerm =
          !term ||
          nom.includes(term) ||
          (l.recu ?? '').toLowerCase().includes(term)
        const statutCible = FILTRES_STATUT[statut] ?? 'tous'
        const matchStatut = statutCible === 'tous' || l.statut === statutCible
        const matchMode = mode === 'Tout mode' || l.mode === mode
        const matchPeriode =
          joursDepuis(l.date) <=
          (FILTRES_PERIODE[periode] ?? Number.POSITIVE_INFINITY)
        return matchTerm && matchStatut && matchMode && matchPeriode
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [paiements, q, statut, mode, periode])

  function versRecu(...argument: Parameters<typeof construireRecuData>) {
    setRecuData(construireRecuData(...argument))
  }

  function construireRecuData(
    p: {
      numeroRecu: string
      eleveNom: string | null
      matricule: string | null
      classeNom: string | null
      montant: number
      date: string
      mode: string
      motif: string | null
      reference: string | null
      enregistrePar: string | null
      soldeRestant: number
    },
  ): RecuData {
    return {
      ...p,
      numeroRecu: p.numeroRecu,
      eleveNom: p.eleveNom ?? '',
      matricule: p.matricule ?? '',
      anneeScolaire: options?.anneeLabel ?? '',
      etablissement: options?.etablissement ?? {
        organisation: '',
        nom: '',
        commune: '',
        ville: '',
        telephone: '',
        email: '',
      },
    }
  }

  function apresEnregistrement(p: PaiementEnregistre) {
    setFormOpen(false)
    versRecu(p)
    router.refresh()
  }

  return (
    <>
      {kpis ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Montant attendu (FCFA)"
            value={montantCourt(kpis.montantAttendu)}
            hint="Année scolaire en cours"
            icon={Wallet}
            accent="sky"
          />
          <StatCard
            label="Montant encaissé (FCFA)"
            value={montantCourt(kpis.montantEncaisse)}
            hint={`${kpis.elevesAJour} élève(s) soldé(s)`}
            icon={CircleDollarSign}
            accent="primary"
          />
          <StatCard
            label="Reste à recouvrer (FCFA)"
            value={montantCourt(kpis.resteRecouvrer)}
            hint={`${kpis.elevesEnRetard} élève(s) en retard`}
            icon={Receipt}
            accent="rose"
          />
          <StatCard
            label="Taux de recouvrement"
            value={`${kpis.tauxRecouvrement}%`}
            hint={`${kpis.nbPaiements} paiement(s) au total`}
            icon={TrendingUp}
            accent="amber"
          />
        </section>
      ) : null}

      {kpis ? (
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progression du recouvrement
              </span>
              <span className="font-semibold tabular-nums">
                {formatFCFA(kpis.montantEncaisse)} / {formatFCFA(kpis.montantAttendu)}
              </span>
            </div>
            <Progress value={kpis.tauxRecouvrement} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un élève, un matricule ou un n° de reçu..."
                className="pl-8"
                aria-label="Rechercher un paiement"
              />
            </div>
            <Select value={statut} onValueChange={(v) => setStatut(v as string)}>
              <SelectTrigger className="w-full lg:w-36" aria-label="Statut">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(FILTRES_STATUT).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mode} onValueChange={(v) => setMode(v as string)}>
              <SelectTrigger className="w-full lg:w-36" aria-label="Mode">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tout mode">Tout mode</SelectItem>
                {modesPaiement.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periode} onValueChange={(v) => setPeriode(v as string)}>
              <SelectTrigger className="w-full lg:w-44" aria-label="Période">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(FILTRES_PERIODE).map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setFormOpen(true)} disabled={!options}>
              <CircleDollarSign className="size-4" data-icon="inline-start" />
              Enregistrer un paiement
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {lignes.length} paiement{lignes.length > 1 ? 's' : ''} —{' '}
            {formatFCFA(lignes.reduce((s, l) => s + l.montant, 0))} encaissé(s)
          </div>

          {lignes.length === 0 ? (
            <div className="rounded-lg border border-dashed">
              <EmptyState
                icon={Receipt}
                title="Aucun paiement pour cette sélection"
                description="Ajustez vos filtres ou enregistrez un nouveau paiement pour le voir apparaître ici."
              >
                <Button
                  variant="outline"
                  onClick={() => setFormOpen(true)}
                  disabled={!options}
                >
                  <CircleDollarSign className="size-4" data-icon="inline-start" />
                  Enregistrer un paiement
                </Button>
              </EmptyState>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reçu</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">
                      Solde
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Enregistré par
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.recu ?? '—'}</TableCell>
                      <TableCell>
                        {l.eleveId ? (
                          <Link
                            href={`/eleves/${l.eleveId}`}
                            className="flex flex-col underline-offset-4 hover:underline"
                          >
                            <span className="font-medium leading-tight">
                              {l.eleveNom}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {l.classeNom ?? '—'} · {l.matricule ?? '—'}
                            </span>
                          </Link>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">{l.date}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {l.motif ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{l.mode}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatFCFA(l.montant)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums text-muted-foreground lg:table-cell">
                        {formatFCFA(l.soldeRestant)}
                      </TableCell>
                      <TableCell>
                        <PaymentBadge statut={l.statut} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">
                        {l.enregistrePar ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Voir le reçu ${l.recu}`}
                          onClick={() =>
                            versRecu({
                              numeroRecu: l.recu ?? '—',
                              eleveNom: l.eleveNom,
                              matricule: l.matricule,
                              classeNom: l.classeNom,
                              montant: l.montant,
                              date: l.date,
                              mode: l.mode,
                              motif: l.motif,
                              reference: l.reference,
                              enregistrePar: l.enregistrePar,
                              soldeRestant: l.soldeRestant,
                            })
                          }
                        >
                          <Receipt className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {options ? (
        <PaiementForm
          open={formOpen}
          onOpenChange={setFormOpen}
          options={options}
          onSuccess={apresEnregistrement}
        />
      ) : null}

      <Dialog
        open={recuData !== null}
        onOpenChange={(next) => {
          if (!next) setRecuData(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader data-print-hidden>
            <DialogTitle>Reçu de paiement</DialogTitle>
            <DialogDescription>
              Reçu généré à partir de l&apos;encaissement enregistré.
            </DialogDescription>
          </DialogHeader>
          {recuData ? <RecuDocument data={recuData} /> : null}
          <DialogFooter data-print-hidden>
            <Button variant="outline" onClick={() => setRecuData(null)}>
              Fermer
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="size-4" data-icon="inline-start" />
              Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}