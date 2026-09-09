'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, BookOpen, CheckCircle2, Loader2, Plus, Search } from 'lucide-react'

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
import { creerMatiere, modifierMatiere } from '@/lib/matieres-create'
import type { Matiere } from '@/lib/queries/matieres'

type EtatFormulaire = 'saisie' | 'envoi' | 'succes' | 'erreur'

const CYCLES = ['Primaire', 'Collège', 'Lycée'] as const
type Cycle = (typeof CYCLES)[number]

export function MatiereDialog({
  schoolId,
  matiere,
  trigger,
}: {
  schoolId: string | null
  matiere?: Matiere
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [etat, setEtat] = useState<EtatFormulaire>('saisie')
  const [message, setMessage] = useState('')

  const [code, setCode] = useState('')
  const [nom, setNom] = useState('')
  const [coefficient, setCoefficient] = useState('1')
  const [cycle, setCycle] = useState<Cycle>('Collège')

  const edition = Boolean(matiere)

  function reinitialiser() {
    setCode(matiere?.code ?? '')
    setNom(matiere?.nom ?? '')
    setCoefficient(String(matiere?.coefficient ?? 1))
    setCycle((matiere?.cycle as Cycle) ?? 'Collège')
    setEtat('saisie')
    setMessage('')
  }

  async function enregistrer() {
    if (!schoolId) return
    const coefficientValue = Number.parseFloat(coefficient || '1')
    setEtat('envoi')
    setMessage('')

    const res = edition && matiere
      ? await modifierMatiere(matiere.id, {
          code,
          nom,
          coefficient: coefficientValue,
          cycle,
        })
      : await creerMatiere({
          schoolId,
          code,
          nom,
          coefficient: coefficientValue,
          cycle,
        })

    if (res.ok) {
      setEtat('succes')
      router.refresh()
    } else {
      setMessage(res.message)
      setEtat('erreur')
    }
  }

  const desactive = etat === 'envoi'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        reinitialiser()
        setOpen(next)
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {matiere ? `Matière — ${matiere.nom}` : 'Nouvelle matière'}
          </DialogTitle>
          <DialogDescription>
            Code, libellé, coefficient et cycle concerné.
          </DialogDescription>
        </DialogHeader>

        {etat === 'succes' ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 py-6 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="font-medium">{edition ? 'Matière modifiée' : 'Matière créée'}</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{code.toUpperCase()}</span> — {nom}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-code">Code</Label>
              <Input
                id="m-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={desactive}
                placeholder="MATH"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-coef">Coefficient</Label>
              <Input
                id="m-coef"
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={coefficient}
                onChange={(e) => setCoefficient(e.target.value)}
                disabled={desactive}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="m-nom">Libellé</Label>
              <Input
                id="m-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                disabled={desactive}
                placeholder="Mathématiques"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="m-cycle">Cycle</Label>
              <Select value={cycle} onValueChange={(v) => setCycle(v as Cycle)} disabled={desactive}>
                <SelectTrigger id="m-cycle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {etat === 'erreur' ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{message}</span>
          </div>
        ) : null}

        <DialogFooter>
          {etat === 'succes' ? (
            <Button
              onClick={() => {
                setOpen(false)
                reinitialiser()
              }}
            >
              Terminé
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={desactive}>
                Annuler
              </Button>
              <Button
                onClick={enregistrer}
                disabled={desactive || !schoolId || !code.trim() || !nom.trim()}
              >
                {desactive ? (
                  <>
                    <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                    Enregistrement…
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function MatieresTable({
  matieres,
  cycles,
  schoolId,
}: {
  matieres: Matiere[]
  cycles: readonly string[]
  schoolId: string | null
}) {
  const [q, setQ] = useState('')
  const [cycle, setCycle] = useState('tous')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return matieres.filter((m) => {
      const matchTerm =
        !term || m.nom.toLowerCase().includes(term) || m.code.toLowerCase().includes(term)
      const matchCycle = cycle === 'tous' || m.cycle === cycle
      return matchTerm && matchCycle
    })
  }, [matieres, q, cycle])

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une matière..."
              className="pl-8"
              aria-label="Rechercher une matière"
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
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed">
            <EmptyState
              icon={BookOpen}
              title="Aucune matière trouvée"
              description="Créez votre première matière pour organiser les évaluations."
            >
              <MatiereDialog
                schoolId={schoolId}
                trigger={
                  <Button>
                    <Plus className="size-4" data-icon="inline-start" />
                    Créer une matière
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
                  <TableHead>Code</TableHead>
                  <TableHead>Matière</TableHead>
                  <TableHead className="text-center">Coefficient</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Enseignants affectés</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {m.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{m.nom}</TableCell>
                    <TableCell className="text-center tabular-nums">{m.coefficient}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.cycle}</Badge>
                    </TableCell>
                    <TableCell>
                      {m.enseignants.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Non affectée</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {m.enseignants.map((t) => (
                            <Link
                              key={t.id}
                              href="/enseignants"
                              className="text-sm underline-offset-4 hover:underline"
                            >
                              {t.prenoms} {t.nom}
                            </Link>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <MatiereDialog
                        schoolId={schoolId}
                        matiere={m}
                        trigger={
                          <Button variant="ghost" size="sm">
                            Modifier
                          </Button>
                        }
                      />
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
