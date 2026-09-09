'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  PencilRuler,
  Save,
  ShieldCheck,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/empty-state'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { StatutEvaluationBadge } from '@/components/evaluations/evaluations-table'
import {
  anneesScolaires,
  classes,
  evaluations,
  getClasse,
  getElevesByClasse,
  getEnseignant,
  getMatiere,
  notesEvaluation,
  trimestres,
} from '@/lib/data'

type Etat = 'brouillon' | 'enregistre' | 'valide'

export function SaisieNotes() {
  const params = useSearchParams()
  const evaluationParam = params.get('evaluation')

  const [anneeId, setAnneeId] = useState(anneesScolaires[0].id)
  const [periode, setPeriode] = useState(trimestres[0])
  const [classeId, setClasseId] = useState<string>(
    () => evaluations.find((e) => e.id === evaluationParam)?.classeId ?? classes[3].id,
  )
  const [matiereId, setMatiereId] = useState<string>('toutes')
  const [evaluationId, setEvaluationId] = useState<string>(
    () => evaluationParam ?? '',
  )
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [etat, setEtat] = useState<Etat>('brouillon')

  const evaluationsClasse = useMemo(
    () =>
      evaluations.filter(
        (ev) =>
          ev.classeId === classeId &&
          ev.periode === periode &&
          (matiereId === 'toutes' || ev.matiereId === matiereId),
      ),
    [classeId, periode, matiereId],
  )

  const evaluation = evaluations.find((ev) => ev.id === evaluationId)
  const eleves = evaluation ? getElevesByClasse(evaluation.classeId) : []
  const matiere = evaluation ? getMatiere(evaluation.matiereId) : undefined
  const enseignant = evaluation ? getEnseignant(evaluation.enseignantId) : undefined

  // Pré-remplissage des notes déjà saisies (données de démonstration)
  useEffect(() => {
    if (!evaluationId) return
    const existantes = notesEvaluation[evaluationId] ?? []
    const map: Record<string, string> = {}
    for (const n of existantes) {
      if (n.note !== null) map[n.eleveId] = String(n.note)
    }
    setNotes(map)
    setEtat('brouillon')
  }, [evaluationId])

  function erreurNote(valeur: string) {
    if (valeur.trim() === '') return null
    const n = Number(valeur.replace(',', '.'))
    if (Number.isNaN(n)) return 'Valeur invalide'
    if (n < 0) return 'La note ne peut pas être négative'
    if (evaluation && n > evaluation.bareme)
      return `La note ne peut pas dépasser ${evaluation.bareme}`
    return null
  }

  const erreurs = eleves.filter((e) => erreurNote(notes[e.id] ?? '') !== null)
  const saisies = eleves.filter((e) => (notes[e.id] ?? '').trim() !== '')
  const manquantes = eleves.length - saisies.length
  const valeurs = saisies
    .map((e) => Number((notes[e.id] ?? '').replace(',', '.')))
    .filter((n) => !Number.isNaN(n))
  const moyenne =
    valeurs.length > 0 ? valeurs.reduce((s, n) => s + n, 0) / valeurs.length : 0

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Sélection de l&apos;évaluation</CardTitle>
          <CardDescription>
            Année scolaire, période, classe puis matière pour retrouver
            l&apos;évaluation à noter
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="n-annee">Année scolaire</Label>
            <Select value={anneeId} onValueChange={(value) => setAnneeId(value ?? '')}>
              <SelectTrigger id="n-annee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anneesScolaires.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="n-periode">Période</Label>
            <Select
              value={periode}
              onValueChange={(v) => {
                setPeriode(v ?? '')
                setEvaluationId('')
              }}
            >
              <SelectTrigger id="n-periode">
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
            <Label htmlFor="n-classe">Classe</Label>
            <Select
              value={classeId}
              onValueChange={(v) => {
                setClasseId(v ?? '')
                setEvaluationId('')
              }}
            >
              <SelectTrigger id="n-classe">
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
            <Label htmlFor="n-matiere">Matière</Label>
            <Select
              value={matiereId}
              onValueChange={(v) => {
                setMatiereId(v ?? '')
                setEvaluationId('')
              }}
            >
              <SelectTrigger id="n-matiere">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes</SelectItem>
                {Array.from(
                  new Set(
                    evaluations
                      .filter((ev) => ev.classeId === classeId)
                      .map((ev) => ev.matiereId),
                  ),
                ).map((mid) => (
                  <SelectItem key={mid} value={mid}>
                    {getMatiere(mid)?.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="n-eval">Évaluation</Label>
            <Select
              value={evaluationId === '' ? null : evaluationId}
              onValueChange={(v) => setEvaluationId((v as string) ?? '')}
            >
              <SelectTrigger id="n-eval">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {evaluationsClasse.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!evaluation ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={PencilRuler}
              title="Sélectionnez une évaluation"
              description={
                evaluationsClasse.length === 0
                  ? `Aucune évaluation n'est planifiée pour ${getClasse(classeId)?.nom} sur cette période. Créez-la depuis le module Évaluations.`
                  : "Choisissez l'évaluation à noter dans la liste ci-dessus pour afficher les élèves."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle>{evaluation.libelle}</CardTitle>
                <CardDescription>
                  {getClasse(evaluation.classeId)?.nom} — {matiere?.nom} —{' '}
                  {enseignant ? `${enseignant.prenoms} ${enseignant.nom}` : '—'} —{' '}
                  {new Date(evaluation.date).toLocaleDateString('fr-FR')}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Barème /{evaluation.bareme}</Badge>
                <Badge variant="outline">Coef. {evaluation.coefficient}</Badge>
                <StatutEvaluationBadge statut={evaluation.statut} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
              <span className="text-muted-foreground">
                Notes saisies :{' '}
                <span className="font-medium text-foreground tabular-nums">
                  {saisies.length}/{eleves.length}
                </span>
              </span>
              <span className="text-muted-foreground">
                Moyenne :{' '}
                <span className="font-medium text-foreground tabular-nums">
                  {valeurs.length > 0 ? `${moyenne.toFixed(2)}/${evaluation.bareme}` : '—'}
                </span>
              </span>
              {manquantes > 0 ? (
                <span className="flex items-center gap-1.5 text-chart-3">
                  <AlertCircle className="size-4" />
                  {manquantes} note(s) manquante(s)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-primary">
                  <CheckCircle2 className="size-4" />
                  Saisie complète
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead>
                    <TableHead className="w-40">Note</TableHead>
                    <TableHead className="text-center">Barème</TableHead>
                    <TableHead className="text-center">Coef.</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eleves.map((e) => {
                    const valeur = notes[e.id] ?? ''
                    const erreur = erreurNote(valeur)
                    return (
                      <TableRow key={e.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium leading-tight">
                              {e.prenoms} {e.nom}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              {e.matricule}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.25"
                            min={0}
                            max={evaluation.bareme}
                            value={valeur}
                            disabled={etat === 'valide'}
                            onChange={(ev) =>
                              setNotes((n) => ({ ...n, [e.id]: ev.target.value }))
                            }
                            aria-label={`Note de ${e.prenoms} ${e.nom}`}
                            aria-invalid={erreur ? true : undefined}
                            className={
                              erreur
                                ? 'w-28 border-destructive tabular-nums'
                                : 'w-28 tabular-nums'
                            }
                          />
                          {erreur ? (
                            <span className="mt-1 block text-xs text-destructive">
                              {erreur}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-muted-foreground">
                          /{evaluation.bareme}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-muted-foreground">
                          {evaluation.coefficient}
                        </TableCell>
                        <TableCell>
                          {valeur.trim() === '' ? (
                            <Badge
                              variant="secondary"
                              className="border-transparent bg-muted text-muted-foreground"
                            >
                              Non saisie
                            </Badge>
                          ) : etat === 'valide' ? (
                            <Badge
                              variant="secondary"
                              className="border-transparent bg-primary/10 text-primary"
                            >
                              Validée
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="border-transparent bg-chart-3/15 text-chart-3"
                            >
                              Saisie
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <Separator />

            <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <p className="text-xs text-muted-foreground">
                {etat === 'valide'
                  ? 'Notes validées : la modification est verrouillée.'
                  : etat === 'enregistre'
                    ? 'Brouillon enregistré (mode maquette, sans persistance).'
                    : 'Mode maquette : la saisie n’est pas encore persistée en base.'}
              </p>
              <div className="flex items-center gap-2">
                {etat === 'valide' ? (
                  <Button variant="outline" onClick={() => setEtat('brouillon')}>
                    Modifier les notes
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setEtat('enregistre')}
                      disabled={erreurs.length > 0}
                    >
                      <Save className="size-4" data-icon="inline-start" />
                      Enregistrer le brouillon
                    </Button>
                    <Button
                      onClick={() => setEtat('valide')}
                      disabled={erreurs.length > 0 || saisies.length === 0}
                    >
                      <ShieldCheck className="size-4" data-icon="inline-start" />
                      Valider les notes
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

