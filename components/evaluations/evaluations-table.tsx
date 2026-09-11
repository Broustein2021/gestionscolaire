'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ClipboardList, Loader2, Plus, Search } from 'lucide-react'

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
import { statutEvaluationLabel, typesEvaluation } from '@/lib/grades-meta'
import type { StatutEvaluation } from '@/lib/grades-meta'
import { creerEvaluation } from '@/lib/grades-write'
import type { Evaluation, EvaluationOptions } from '@/lib/queries/grades'

const statutStyles: Record<StatutEvaluation, string> = {
  planifiee: 'bg-chart-2/15 text-chart-2',
  saisie: 'bg-chart-3/15 text-chart-3',
  validee: 'bg-primary/10 text-primary',
  annulee: 'bg-muted text-muted-foreground',
}

export function StatutEvaluationBadge({ statut }: { statut: StatutEvaluation }) {
  return (
    <Badge variant="secondary" className={cn('border-transparent', statutStyles[statut])}>
      {statutEvaluationLabel[statut]}
    </Badge>
  )
}

export function EvaluationDialog({
  trigger,
  options,
}: {
  trigger: React.ReactNode
  options: EvaluationOptions | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [saved, setSaved] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const [libelle, setLibelle] = useState('')
  const [type, setType] = useState<string>(typesEvaluation[2])
  const [termId, setTermId] = useState<string>('')
  const [classeId, setClasseId] = useState<string>('')
  const [matiereId, setMatiereId] = useState<string>('')
  const [enseignantId, setEnseignantId] = useState<string>('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bareme, setBareme] = useState('20')
  const [coef, setCoef] = useState('2')

  const types = [...typesEvaluation]
  const classes = options?.classes ?? []
  const matieres = options?.matieres ?? []
  const enseignants = options?.enseignants ?? []
  const termes = options?.termes ?? []

  function reinitialiser() {
    setLibelle('')
    setType(typesEvaluation[2])
    setTermId(termes[0]?.id ?? '')
    setClasseId(classes[0]?.id ?? '')
    setMatiereId(matieres[0]?.id ?? '')
    setEnseignantId(enseignants[0]?.id ?? '')
    setDate(new Date().toISOString().slice(0, 10))
    setBareme('20')
    setCoef('2')
    setErreur(null)
    setSaved(false)
  }

  async function creer() {
    if (!options) return
    setEnvoi(true)
    setErreur(null)
    const resultat = await creerEvaluation({
      schoolId: options.schoolId,
      academicYearId: options.academicYearId,
      termId,
      classId: classeId,
      subjectId: matiereId,
      teacherId: enseignantId || null,
      title: libelle,
      type,
      date,
      bareme: Number(bareme) || 20,
      coefficient: Number(coef) || 1,
    })
    if (resultat.ok) {
      setSaved(true)
      router.refresh()
    } else {
      setErreur(resultat.message)
    }
    setEnvoi(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next && options && !termId) {
          setTermId(termes[0]?.id ?? '')
          setClasseId(classes[0]?.id ?? '')
          setMatiereId(matieres[0]?.id ?? '')
          setEnseignantId(enseignants[0]?.id ?? '')
        }
        if (!next) reinitialiser()
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouvelle évaluation</DialogTitle>
          <DialogDescription>
            {saved
              ? 'Évaluation planifiée et enregistrée.'
              : 'Planifiez un devoir, une interrogation ou une composition.'}
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="text-sm text-muted-foreground">
              {libelle || 'L’évaluation'} a été créée avec le statut « Planifiée ».
              Vous pouvez saisir les notes depuis le module Notes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="ev-libelle">Libellé</Label>
              <Input
                id="ev-libelle"
                placeholder="Composition N°1 — Mathématiques"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType((v as string) ?? types[0])}>
                <SelectTrigger id="ev-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-periode">Période</Label>
              <Select value={termId} onValueChange={(v) => setTermId((v as string) ?? '')}>
                <SelectTrigger id="ev-periode">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {termes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                      {t.estCourant ? ' (en cours)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-classe">Classe</Label>
              <Select value={classeId} onValueChange={(v) => setClasseId((v as string) ?? '')}>
                <SelectTrigger id="ev-classe">
                  <SelectValue placeholder="Choisir" />
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
              <Select value={matiereId} onValueChange={(v) => setMatiereId((v as string) ?? '')}>
                <SelectTrigger id="ev-matiere">
                  <SelectValue placeholder="Choisir" />
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
              <Select value={enseignantId} onValueChange={(v) => setEnseignantId((v as string) ?? '')}>
                <SelectTrigger id="ev-ens">
                  <SelectValue placeholder="Choisir" />
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
              <Input id="ev-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-bareme">Barème (sur 20 par défaut)</Label>
              <Input
                id="ev-bareme"
                type="number"
                min={1}
                value={bareme}
                onChange={(e) => setBareme(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-coef">Coefficient</Label>
              <Input
                id="ev-coef"
                type="number"
                min={1}
                max={10}
                value={coef}
                onChange={(e) => setCoef(e.target.value)}
              />
            </div>
          </div>
        )}

        {erreur ? (
          <p className="rounded-lg border border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {erreur}
          </p>
        ) : null}

        <DialogFooter>
          {saved ? (
            <Button onClick={() => setOpen(false)}>Fermer</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={creer}
                disabled={envoi || !options || !libelle.trim() || !termId || !classeId || !matiereId}
              >
                {envoi ? <Loader2 className="size-4 animate-spin" data-icon="inline-start" /> : null}
                {envoi ? 'Création…' : 'Créer l’évaluation'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EvaluationsTable({
  evaluations,
  options,
}: {
  evaluations: Evaluation[]
  options: EvaluationOptions | null
}) {
  const [q, setQ] = useState('')
  const [classeId, setClasseId] = useState('toutes')
  const [statut, setStatut] = useState('tous')

  const classes = options?.classes ?? []

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return evaluations
      .filter((ev) => {
        const matchTerm =
          !term ||
          ev.libelle.toLowerCase().includes(term) ||
          (ev.matiereNom?.toLowerCase().includes(term) ?? false)
        const matchClasse = classeId === 'toutes' || ev.classeId === classeId
        const matchStatut = statut === 'tous' || ev.statut === statut
        return matchTerm && matchClasse && matchStatut
      })
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  }, [q, classeId, statut, evaluations])

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
              {(['planifiee', 'saisie', 'validee', 'annulee'] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {statutEvaluationLabel[s]}
                </SelectItem>
              ))}
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
                options={options}
                trigger={
                  <Button disabled={!options}>
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
                {filtered.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium leading-tight">{ev.libelle}</span>
                        <span className="text-xs text-muted-foreground">
                          {ev.type} — {ev.periode ?? 'Période non définie'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ev.classeId ? (
                        <Link href={`/classes/${ev.classeId}`}>
                          <Badge variant="outline" className="transition-colors hover:bg-accent">
                            {ev.classeNom}
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{ev.matiereNom ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {ev.enseignantNom ?? '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {ev.date ? new Date(ev.date).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">/{ev.bareme}</TableCell>
                    <TableCell className="text-center tabular-nums">{ev.coefficient}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}