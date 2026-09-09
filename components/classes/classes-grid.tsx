'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, DoorOpen, Pencil, School, Search, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClasseDialog } from '@/components/classes/classe-dialog'
import type { Classe } from '@/lib/queries/classes'
import type { ClasseOptions } from '@/lib/queries/class-options'

type ClassesGridProps = {
  classes: Classe[]
  cycles: readonly string[]
  niveaux: string[]
  options: ClasseOptions | null
}

export function ClassesGrid({ classes, cycles, niveaux, options }: ClassesGridProps) {
  const [q, setQ] = useState('')
  const [cycle, setCycle] = useState('tous')
  const [niveau, setNiveau] = useState('tous')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return classes.filter((c) => {
      const matchTerm =
        !term ||
        c.nom.toLowerCase().includes(term) ||
        c.salle.toLowerCase().includes(term)
      const matchCycle = cycle === 'tous' || c.cycle === cycle
      const matchNiveau = niveau === 'tous' || c.niveau === niveau
      return matchTerm && matchCycle && matchNiveau
    })
  }, [classes, q, cycle, niveau])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center md:p-5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une classe ou une salle..."
              className="pl-8"
              aria-label="Rechercher une classe"
            />
          </div>
          <Select value={cycle} onValueChange={(value) => setCycle(value ?? '')}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les cycles</SelectItem>
              {cycles.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={School}
              title="Aucune classe trouvée"
              description="Aucune classe ne correspond aux filtres sélectionnés."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const taux = c.capacite > 0 ? Math.round((c.effectif / c.capacite) * 100) : 0
            return (
              <div key={c.id} className="relative rounded-xl">
                <Link
                  href={`/classes/${c.id}`}
                  className="absolute inset-0 z-0 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label={`Voir la fiche ${c.nom}`}
                />
                <Card className="h-full transition-colors hover:bg-accent/40">
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-semibold tracking-tight">
                          {c.nom}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{c.cycle}</Badge>
                          <Badge variant="outline">{c.niveau}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClasseDialog
                          options={options}
                          classe={c}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="relative z-10 -mr-1 -mt-0.5 size-7 text-muted-foreground"
                              aria-label={`Modifier ${c.nom}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          }
                        />
                        <ChevronRight className="mt-1 size-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Effectif</span>
                        <span className="font-medium tabular-nums">
                          {c.effectif} / {c.capacite}
                        </span>
                      </div>
                      <Progress value={taux} />
                      <span className="text-xs text-muted-foreground">
                        Taux d&apos;occupation {taux}%
                      </span>
                    </div>

                    <div className="mt-auto flex flex-col gap-2 border-t pt-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {c.profPrincipalNom ?? 'Non affecté'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DoorOpen className="size-4 shrink-0 text-muted-foreground" />
                        <span>Salle {c.salle}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
