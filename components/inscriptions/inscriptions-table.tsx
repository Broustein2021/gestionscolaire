'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, UserPlus } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PaymentBadge } from '@/components/payment-badge'
import { EmptyState } from '@/components/empty-state'
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
import { formatFCFA } from '@/lib/data'
import type { ClasseOption, Inscription } from '@/lib/queries/enrollments'

type Props = {
  inscriptions: Inscription[]
  classes: ClasseOption[]
}

export function InscriptionsTable({ inscriptions, classes }: Props) {
  const [q, setQ] = useState('')
  const [classeId, setClasseId] = useState('toutes')
  const [statut, setStatut] = useState('tous')

  const filtrees = useMemo(() => {
    const term = q.trim().toLowerCase()
    return inscriptions.filter((i) => {
      const matchTerm =
        !term ||
        `${i.prenoms} ${i.nom}`.toLowerCase().includes(term) ||
        i.matricule.toLowerCase().includes(term)
      const matchClasse = classeId === 'toutes' || i.classeId === classeId
      const matchStatut =
        statut === 'tous' ||
        (statut === 'nouveau' ? i.isNouveau : !i.isNouveau)
      return matchTerm && matchClasse && matchStatut
    })
  }, [q, classeId, statut, inscriptions])

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un dossier (nom, matricule)..."
              className="pl-8"
              aria-label="Rechercher une inscription"
            />
          </div>
          <Select value={classeId} onValueChange={(value) => setClasseId(value ?? '')}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes les classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statut} onValueChange={(value) => setStatut(value ?? '')}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les dossiers</SelectItem>
              <SelectItem value="nouveau">Nouveaux élèves</SelectItem>
              <SelectItem value="inscrit">Anciens élèves</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {filtrees.length} dossier{filtrees.length > 1 ? 's' : ''} d&apos;inscription
        </div>

        {filtrees.length === 0 ? (
          <div className="rounded-lg border border-dashed">
            <EmptyState
              icon={UserPlus}
              title="Aucune inscription trouvée"
              description="Aucun dossier ne correspond à votre recherche. Modifiez les filtres ou créez une nouvelle inscription."
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Dossier</TableHead>
                  <TableHead className="text-right">Reste à payer</TableHead>
                  <TableHead>Paiement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrees.map((i) => (
                  <TableRow key={i.studentId}>
                    <TableCell>
                      <Link
                        href={`/eleves/${i.studentId}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {i.prenoms} {i.nom}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {i.matricule}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{i.classeNom ?? '—'}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {i.dateInscription
                        ? new Date(i.dateInscription).toLocaleDateString('fr-FR')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {i.isNouveau ? (
                        <Badge
                          variant="secondary"
                          className="border-transparent bg-primary/10 text-primary"
                        >
                          Nouveau
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Réinscription</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatFCFA(i.montantDu - i.montantPaye)}
                    </TableCell>
                    <TableCell>
                      <PaymentBadge statut={i.statutPaiement} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}