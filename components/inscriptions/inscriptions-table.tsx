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
import { classes, eleves, formatFCFA, getClasse } from '@/lib/data'

export function InscriptionsTable() {
  const [q, setQ] = useState('')
  const [classeId, setClasseId] = useState('toutes')
  const [statut, setStatut] = useState('tous')

  const inscriptions = useMemo(() => {
    const term = q.trim().toLowerCase()
    return eleves
      .filter((e) => e.statut !== 'archive')
      .filter((e) => {
        const matchTerm =
          !term ||
          `${e.prenoms} ${e.nom}`.toLowerCase().includes(term) ||
          e.matricule.toLowerCase().includes(term)
        const matchClasse = classeId === 'toutes' || e.classeId === classeId
        const matchStatut = statut === 'tous' || e.statut === statut
        return matchTerm && matchClasse && matchStatut
      })
      .sort((a, b) => b.dateInscription.localeCompare(a.dateInscription))
  }, [q, classeId, statut])

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
          {inscriptions.length} dossier{inscriptions.length > 1 ? 's' : ''} d&apos;inscription
        </div>

        {inscriptions.length === 0 ? (
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
                {inscriptions.map((e) => {
                  const classe = getClasse(e.classeId)
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Link
                          href={`/eleves/${e.id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {e.prenoms} {e.nom}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {e.matricule}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{classe?.nom ?? '—'}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(e.dateInscription).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {e.statut === 'nouveau' ? (
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
                        {formatFCFA(e.montantDu - e.montantPaye)}
                      </TableCell>
                      <TableCell>
                        <PaymentBadge statut={e.statutPaiement} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

