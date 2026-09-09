'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/empty-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { cn } from '@/lib/utils'
import {
  classes,
  enseignants,
  evaluations,
  getClasse,
  getEnseignant,
  getMatiere,
  matieres,
  statutEvaluationLabel,
  trimestres,
  typesEvaluation,
  type Evaluation,
} from '@/lib/data'

const statutStyles: Record<Evaluation['statut'], string> = {
  planifiee: 'bg-chart-2/15 text-chart-2',
  saisie: 'bg-chart-3/15 text-chart-3',
  validee: 'bg-primary/10 text-primary',
}

export function StatutEvaluationBadge({
  statut,
}: {
  statut: Evaluation['statut']
}) {
  return (
    <Badge
      variant="secondary"
      className={cn('border-transparent', statutStyles[statut])}
    >
      {statutEvaluationLabel[statut]}
    </Badge>
  )
}

export function EvaluationDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSaved(false)
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouvelle évaluation</DialogTitle>
          <DialogDescription>
            {saved
              ? 'Évaluation créée en mode maquette — les données ne sont pas encore persistées.'
              : 'Planifiez un devoir, une interrogation ou une composition.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="ev-libelle">Libellé</Label>
            <Input
              id="ev-libelle"
              placeholder="Composition N°1 — Mathématiques"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-type">Type</Label>
            <Select defaultValue={typesEvaluation[2]}>
              <SelectTrigger id="ev-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typesEvaluation.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-periode">Période</Label>
            <Select defaultValue={trimestres[0]}>
              <SelectTrigger id="ev-periode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trimestres.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-classe">Classe</Label>
            <Select defaultValue={classes[3].id}>
              <SelectTrigger id="ev-classe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-matiere">Matière</Label>
            <Select defaultValue={matieres[0].id}>
              <SelectTrigger id="ev-matiere">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {matieres.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-ens">Enseignant</Label>
            <Select defaultValue={enseignants[0].id}>
              <SelectTrigger id="ev-ens">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {enseignants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.prenoms} {t.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-date">Date</Label>
            <Input
              id="ev-date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-bareme">Barème</Label>
            <Input id="ev-bareme" type="number" min={1} defaultValue={20} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-coef">Coefficient</Label>
            <Input
              id="ev-coef"
              type="number"
              min={1}
              max={10}
              defaultValue={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={() => setSaved(true)} disabled={saved}>
            {saved ? 'Créée' : 'Créer l’évaluation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EvaluationsTable() {
  const [q, setQ] = useState('')
  const [classeId, setClasseId] = useState('toutes')
  const [statut, setStatut] = useState('tous')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return evaluations
      .filter((ev) => {
        const matiere = getMatiere(ev.matiereId)
        const matchTerm =
          !term ||
          ev.libelle.toLowerCase().includes(term) ||
          (matiere?.nom.toLowerCase().includes(term) ?? false)
        const matchClasse = classeId === 'toutes' || ev.classeId === classeId
        const matchStatut = statut === 'tous' || ev.statut === statut
        return matchTerm && matchClasse && matchStatut
      })
      .sort((a, b) => b.date.localeCompare(a.date))
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
              placeholder="Rechercher une évaluation..."
              className="pl-8"
              aria-label="Rechercher une évaluation"
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
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="planifiee">Planifiée</SelectItem>
              <SelectItem value="saisie">Saisie</SelectItem>
              <SelectItem value="validee">Validée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed">
            <EmptyState
              icon={ClipboardList}
              title="Aucune évaluation trouvée"
              description="Planifiez une première évaluation pour cette période."
            >
              <EvaluationDialog
                trigger={
                  <Button>
                    <Plus className="size-4" data-icon="inline-start" />
                    Créer une évaluation
                  </Button>
                }
              />
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Évaluation</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Barème</TableHead>
                  <TableHead className="text-center">Coef.</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ev) => {
                  const enseignant = getEnseignant(ev.enseignantId)
                  return (
                    <TableRow key={ev.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium leading-tight">
                            {ev.libelle}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {ev.type} — {ev.periode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/classes/${ev.classeId}`}>
                          <Badge
                            variant="outline"
                            className="transition-colors hover:bg-accent"
                          >
                            {getClasse(ev.classeId)?.nom}
                          </Badge>
                        </Link>
                      </TableCell>
                      <TableCell>{getMatiere(ev.matiereId)?.nom}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {enseignant
                          ? `${enseignant.prenoms} ${enseignant.nom}`
                          : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(ev.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        /{ev.bareme}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {ev.coefficient}
                      </TableCell>
                      <TableCell>
                        <StatutEvaluationBadge statut={ev.statut} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`/notes?evaluation=${ev.id}`} />}
                        >
                          Notes
                        </Button>
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

