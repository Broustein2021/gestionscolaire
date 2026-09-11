'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PencilRuler,
  Save,
  ShieldCheck,
  UserX,
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
import { cn } from '@/lib/utils'
import { StatutEvaluationBadge } from '@/components/evaluations/evaluations-table'
import type { StatutEvaluation } from '@/lib/grades-meta'
import { chargerNotes, sauvegarderNotes } from '@/lib/grades-write'
import type { SaisieNotesData } from '@/lib/grades-write'
import type { Evaluation, EvaluationOptions } from '@/lib/queries/grades'

type Etat = 'brouillon' | 'enregistre' | 'valide'

export function SaisieNotes({
  options,
  evaluations,
}: {
  options: EvaluationOptions | null
  evaluations: Evaluation[]
}) {
  const params = useSearchParams()
  const router = useRouter()
  const evaluationParam = params.get('evaluation')

  const classes = options?.classes ?? []
  const termes = options?.termes ?? []

  const [periodeId, setPeriodeId] = useState<string>(() => termes[0]?.id ?? '')
  const [classeId, setClasseId] = useState<string>(() => {
    const cible = evaluations.find((e) => e.id === evaluationParam)?.classeId
    return cible ?? classes[0]?.id ?? ''
  })
  const [matiereId, setMatiereId] = useState<string>('toutes')
  const [evaluationId, setEvaluationId] = useState<string>(
    () => evaluationParam ?? '',
  )

  const [feuille, setFeuille] = useState<SaisieNotesData | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [absents, setAbsents] = useState<Record<string, boolean>>({})
  const [chargement, setChargement] = useState(false)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [etat, setEtat] = useState<Etat>('brouillon')
  const [erreur, setErreur] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const evaluationsClasse = useMemo(
    () =>
      evaluations.filter(
        (ev) =>
          ev.classeId === classeId &&
          (matiereId === 'toutes' || ev.matiereId === matiereId),
      ),
    [evaluations, classeId, matiereId],
  )

  const matieresDisponibles = useMemo(() => {
    const ids = Array.from(
      new Set(
        evaluations
          .filter((ev) => ev.classeId === classeId && ev.matiereId)
          .map((ev) => ev.matiereId as string),
      ),
    )
    return Array.from(new Set(ids)).map((id) => {
      const ev = evaluations.find((e) => e.matiereId === id)
      return { id, nom: ev?.matiereNom ?? null }
    })
  }, [evaluations, classeId])

  // Chargement des notes réelles à chaque changement d'évaluation
  useEffect(() => {
    if (!evaluationId) {
      queueMicrotask(() => {
        setFeuille(null)
        setNotes({})
        setAbsents({})
        setErreur(null)
        setMessage(null)
      })
      return
    }
    let actif = true
    queueMicrotask(() => {
      setChargement(true)
      setErreur(null)
      setMessage(null)
      setEtat('brouillon')
    })
    chargerNotes(evaluationId).then((donnees) => {
      if (!actif) return
      setChargement(false)
      if (!donnees) {
        setFeuille(null)
        return
      }
      setFeuille(donnees)
      const map: Record<string, string> = {}
      const abs: Record<string, boolean> = {}
      for (const e of donnees.eleves) {
        if (e.note !== null) map[e.studentId] = String(e.note)
        abs[e.studentId] = e.absent
      }
      setNotes(map)
      setAbsents(abs)
      setEtat(donnees.evaluation.statut === 'validee' ? 'valide' : 'brouillon')
    })
    return () => {
      actif = false
    }
  }, [evaluationId])

  const bareme = feuille?.evaluation.bareme ?? 20

  function erreurNote(valeur: string) {
    if (valeur.trim() === '') return null
    const n = Number(valeur.replace(',', '.'))
    if (Number.isNaN(n)) return 'Valeur invalide'
    if (n < 0) return 'La note ne peut pas être négative'
    if (n > bareme) return `La note ne peut pas dépasser ${bareme}`
    return null
  }

  const eleves = feuille?.eleves ?? []
  const saisies = eleves.filter(
    (e) => absents[e.studentId] || (notes[e.studentId] ?? '').trim() !== '',
  )
  const manquantes = eleves.length - saisies.length
  const valeurs = eleves
    .map((e) => Number((notes[e.studentId] ?? '').replace(',', '.')))
    .filter((n) => !Number.isNaN(n))
  const moyenne = valeurs.length > 0 ? valeurs.reduce((s, n) => s + n, 0) / valeurs.length : 0

  const verrouille = etat === 'valide'

  async function enregistrer(valider: boolean) {
    if (!feuille) return
    setSauvegarde(true)
    setErreur(null)
    setMessage(null)
    const rows = eleves.map((e) => ({
      studentId: e.studentId,
      note: absents[e.studentId]
        ? null
        : (() => {
            const n = Number((notes[e.studentId] ?? '').replace(',', '.'))
            return Number.isNaN(n) ? null : n
          })(),
      absent: absents[e.studentId] ?? false,
    }))
    const resultat = await sauvegarderNotes(feuille.evaluation.id, rows, valider)
    if (resultat.ok) {
      setEtat(valider ? 'valide' : 'enregistre')
      setMessage(resultat.message)
      router.refresh()
    } else {
      setErreur(resultat.message)
    }
    setSauvegarde(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Sélection de l&apos;évaluation</CardTitle>
          <CardDescription>
            Période, classe puis matière pour retrouver l&apos;évaluation à noter —{' '}
            {options?.anneeLabel ?? 'année courante'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="n-periode">Période</Label>
            <Select
              value={periodeId}
              items={Object.fromEntries(
                termes.map((t) => [
                  String(t.id),
                  `${t.label}${t.estCourant ? ' (en cours)' : ''}`,
                ])
              )}
              onValueChange={(v) => {
                setPeriodeId((v as string) ?? '')
                setEvaluationId('')
              }}
            >
              <SelectTrigger id="n-periode">
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
            <Label htmlFor="n-classe">Classe</Label>
            <Select
              value={classeId}
              items={Object.fromEntries(classes.map((c) => [String(c.id), c.nom]))}
              onValueChange={(v) => {
                setClasseId((v as string) ?? '')
                setMatiereId('toutes')
                setEvaluationId('')
              }}
            >
              <SelectTrigger id="n-classe">
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
            <Label htmlFor="n-matiere">Matière</Label>
            <Select
              value={matiereId}
              items={Object.fromEntries(
                matieresDisponibles.map((m) => [String(m.id), m.nom])
              )}
              onValueChange={(v) => {
                setMatiereId((v as string) ?? 'toutes')
                setEvaluationId('')
              }}
            >
              <SelectTrigger id="n-matiere">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes</SelectItem>
                {matieresDisponibles.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nom}
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

      {!feuille ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={PencilRuler}
              title={chargement ? 'Chargement des notes…' : 'Sélectionnez une évaluation'}
              description={
                chargement
                  ? "Récupération des notes déjà saisies en cours."
                  : evaluationsClasse.length === 0
                    ? `Aucune évaluation n'est planifiée pour ${classes.find((c) => c.id === classeId)?.nom ?? 'cette classe'}. Créez-la depuis le module Évaluations.`
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
                <CardTitle>{feuille.evaluation.libelle}</CardTitle>
                <CardDescription>
                  {feuille.evaluation.statut === 'validee'
                    ? 'Notes validées — la modification est verrouillée.'
                    : `${feuille.evaluation.bareme} points — coefficient ${feuille.evaluation.coefficient}`}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Barème /{feuille.evaluation.bareme}</Badge>
                <Badge variant="outline">Coef. {feuille.evaluation.coefficient}</Badge>
                <StatutEvaluationBadge statut={feuille.evaluation.statut as StatutEvaluation} />
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
                  {valeurs.length > 0 ? `${moyenne.toFixed(2)}/${bareme}` : '—'}
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
                    <TableHead className="text-center">Absence</TableHead>
                    <TableHead className="text-center">Barème</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eleves.map((e) => {
                    const valeur = notes[e.studentId] ?? ''
                    const erreur = erreurNote(valeur)
                    const absent = absents[e.studentId] ?? false
                    return (
                      <TableRow key={e.studentId}>
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
                            max={bareme}
                            value={absent ? '' : valeur}
                            disabled={verrouille || absent}
                            placeholder={absent ? 'Absent' : undefined}
                            onChange={(ev) =>
                              setNotes((n) => ({ ...n, [e.studentId]: ev.target.value }))
                            }
                            aria-label={`Note de ${e.prenoms} ${e.nom}`}
                            aria-invalid={erreur ? true : undefined}
                            className={cn(
                              'w-28 tabular-nums',
                              erreur ? 'border-destructive' : '',
                              absent ? 'opacity-60' : '',
                            )}
                          />
                          {erreur ? (
                            <span className="mt-1 block text-xs text-destructive">
                              {erreur}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={verrouille}
                            onClick={() => {
                              setAbsents((a) => ({
                                ...a,
                                [e.studentId]: !(a[e.studentId] ?? false),
                              }))
                              setNotes((n) => {
                                if ((n[e.studentId] ?? '') !== '') {
                                  const next = { ...n }
                                  delete next[e.studentId]
                                  return next
                                }
                                return n
                              })
                            }}
                            aria-pressed={absent}
                          >
                            <UserX
                              className={cn(
                                'size-4',
                                absent ? 'text-destructive' : 'text-muted-foreground',
                              )}
                            />
                            {absent ? 'Absent' : 'Marquer absent'}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-muted-foreground">
                          /{bareme}
                        </TableCell>
                        <TableCell>
                          {absent ? (
                            <Badge
                              variant="secondary"
                              className="border-transparent bg-chart-3/15 text-chart-3"
                            >
                              Absent
                            </Badge>
                          ) : valeur.trim() === '' ? (
                            <Badge
                              variant="secondary"
                              className="border-transparent bg-muted text-muted-foreground"
                            >
                              Non saisie
                            </Badge>
                          ) : verrouille ? (
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

            {erreur ? (
              <div className="mx-4 rounded-lg border border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive md:mx-6">
                {erreur}
              </div>
            ) : message ? (
              <div className="mx-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary md:mx-6">
                <CheckCircle2 className="size-4" />
                {message}
              </div>
            ) : null}

            <Separator />

            <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <p className="text-xs text-muted-foreground">
                {verrouille
                  ? 'Notes validées : la modification est verrouillée.'
                  : 'Les notes sont sauvegardées dans la base — utilisez « Enregistrer » en cours de saisie.'}
              </p>
              <div className="flex items-center gap-2">
                {verrouille ? (
                  <Button variant="outline" onClick={() => setEtat('brouillon')}>
                    Modifier les notes
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => enregistrer(false)}
                      disabled={sauvegarde}
                    >
                      {sauvegarde ? (
                        <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                      ) : (
                        <Save className="size-4" data-icon="inline-start" />
                      )}
                      Enregistrer le brouillon
                    </Button>
                    <Button
                      onClick={() => enregistrer(true)}
                      disabled={sauvegarde || saisies.length === 0}
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