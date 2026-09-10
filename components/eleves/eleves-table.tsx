'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ChevronRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PaymentBadge } from '@/components/payment-badge'
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
import type { Eleve } from '@/lib/queries/eleves'

function initials(prenoms: string, nom: string) {
  return `${prenoms[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}

export function ElevesTable({ eleves, niveaux }: { eleves: Eleve[]; niveaux: string[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [niveau, setNiveau] = useState('tous')
  const [statutPaiement, setStatutPaiement] = useState('tous')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return eleves.filter((e) => {
      const matchTerm =
        !term ||
        `${e.prenoms} ${e.nom}`.toLowerCase().includes(term) ||
        e.matricule.toLowerCase().includes(term)
      const matchNiveau = niveau === 'tous' || e.niveau === niveau
      const matchPaiement = statutPaiement === 'tous' || e.statutPaiement === statutPaiement
      return matchTerm && matchNiveau && matchPaiement
    })
  }, [eleves, q, niveau, statutPaiement])

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par nom ou matricule..."
              className="pl-8"
            />
          </div>
          <Select value={niveau} onValueChange={(value) => setNiveau(value ?? '')}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les niveaux</SelectItem>
              {niveaux.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statutPaiement} onValueChange={(value) => setStatutPaiement(value ?? '')}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Paiement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tout paiement</SelectItem>
              <SelectItem value="a_jour">À jour</SelectItem>
              <SelectItem value="partiel">Partiel</SelectItem>
              <SelectItem value="retard">En retard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {filtered.length} élève{filtered.length > 1 ? 's' : ''}
        </div>

        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Moyenne</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/eleves/${e.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                            {initials(e.prenoms, e.nom)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium leading-tight">
                            {e.prenoms} {e.nom}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {e.sexe === 'F' ? 'Fille' : 'Garçon'} — {e.nationalite}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.matricule}</TableCell>
                    <TableCell>
                      {e.classeId ? (
                        <Link
                          href={`/classes/${e.classeId}`}
                          onClick={(ev) => ev.stopPropagation()}
                          className="inline-flex"
                        >
                          <Badge
                            variant="outline"
                            className="cursor-pointer transition-colors hover:border-primary hover:text-primary"
                          >
                            {e.classeNom ?? '—'}
                          </Badge>
                        </Link>
                      ) : (
                        <Badge variant="outline">{e.classeNom ?? '—'}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {e.moyenne > 0 ? `${e.moyenne.toFixed(2)}/20` : '—'}
                    </TableCell>
                    <TableCell>
                      <PaymentBadge statut={e.statutPaiement} />
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
