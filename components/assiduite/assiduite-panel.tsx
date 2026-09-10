'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Save,
  Search,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import {
  sauverPresence,
  statutPresenceLibelle,
  type StatutPresence,
} from '@/lib/assiduite-create'
import type { ClassePresence } from '@/lib/queries/assiduite'

type Ligne = {
  studentId: string
  nom: string
  prenoms: string
  matricule: string
  status: StatutPresence
  justification: string
}

type LigneRecord = {
  student_id: string
  status: StatutPresence
  justification: string | null
}

function formatDateFR(date: string): string {
  if (!date) return ''
  return new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function AssiduitePanel({
  classes,
  schoolId,
  academicYearId,
  dateInitiale,
}: {
  classes: ClassePresence[]
  schoolId: string
  academicYearId: string
  dateInitiale: string
}) {
  const router = useRouter()
  const [classeId, setClasseId] = useState('')
  const [date, setDate] = useState(dateInitiale)
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [chargement, setChargement] = useState(false)
  const [migrationManquante, setMigrationManquante] = useState(false)
  const [q, setQ] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(
    null,
  )
  const requeteCourante = useRef(0)

  const classeSelectionnee = classes.find((c) => c.id === classeId)

  const chargerFeuille = useCallback(
    async (classId: string, jour: string) => {
      const requete = ++requeteCourante.current
      setChargement(true)
      setMessage(null)
      setMigrationManquante(false)

      try {
        const supabase = createClient()

        // 1. Effectif de la classe (inscriptions validées, année courante)
        const { data: enrollmentRows, error: errEffectif } = await supabase
          .from('enrollments')
          .select('students:student_id ( id, last_name, first_name, matricule )')
          .eq('school_id', schoolId)
          .eq('academic_year_id', academicYearId)
          .eq('class_id', classId)
          .eq('status', 'validee')

        if (requete !== requeteCourante.current) return

        if (errEffectif) {
          setMessage({
            type: 'erreur',
            texte: 'Impossible de charger l’effectif de la classe. Réessayez.',
          })
          return
        }

        const eleves: Array<{
          id: string
          nom: string
          prenoms: string
          matricule: string
        }> = ((enrollmentRows ?? []) as unknown as Array<{
          students: { id: string; last_name: string; first_name: string; matricule: string } | Array<{
            id: string
            last_name: string
            first_name: string
            matricule: string
          }> | null
        }>)
          .map((r) => (Array.isArray(r.students) ? r.students[0] : r.students))
          .filter((s): s is NonNullable<typeof s> => Boolean(s))
          .map((s) => ({
            id: s.id,
            nom: s.last_name ?? '',
            prenoms: s.first_name ?? '',
            matricule: s.matricule ?? '',
          }))

        // 2. Présences déjà enregistrées pour cette date
        let existantes = new Map<string, LigneRecord>()
        const { data: recordRows, error: errRecords } = await supabase
          .from('attendance_records')
          .select('student_id, status, justification')
          .eq('school_id', schoolId)
          .eq('class_id', classId)
          .eq('attendance_date', jour)

        if (requete !== requeteCourante.current) return

        if (errRecords) {
          // Table pas encore créée (migration en attente) : on garde la feuille
          // éditable mais sans historique ni sauvegarde possible.
          setMigrationManquante(true)
        } else {
          existantes = new Map(
            (recordRows ?? []).map((r) => [r.student_id, r as LigneRecord]),
          )
        }

        setLignes(
          eleves.map((e) => {
            const ex = existantes.get(e.id)
            return {
              studentId: e.id,
              nom: e.nom,
              prenoms: e.prenoms,
              matricule: e.matricule,
              status: ex?.status ?? 'present',
              justification: ex?.justification ?? '',
            }
          }),
        )
      } finally {
        if (requete === requeteCourante.current) {
          setChargement(false)
        }
      }
    },
    [schoolId, academicYearId],
  )

  function onClasseChange(value: string | null) {
    const classId = value ?? ''
    setClasseId(classId)
    setLignes([])
    setMessage(null)
    if (classId) {
      void chargerFeuille(classId, date)
    }
  }

  function onDateChange(jour: string) {
    setDate(jour)
    if (classeId) {
      void chargerFeuille(classeId, jour)
    }
  }

  function changerStatut(studentId: string, status: StatutPresence) {
    setLignes((prev) =>
      prev.map((l) => (l.studentId === studentId ? { ...l, status } : l)),
    )
  }

  function changerJustification(studentId: string, texte: string) {
    setLignes((prev) =>
      prev.map((l) => (l.studentId === studentId ? { ...l, justification: texte } : l)),
    )
  }

  function toutPresent() {
    setLignes((prev) => prev.map((l) => ({ ...l, status: 'present' })))
  }

  const filtrees = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return lignes
    return lignes.filter(
      (l) =>
        `${l.prenoms} ${l.nom}`.toLowerCase().includes(term) ||
        l.matricule.toLowerCase().includes(term),
    )
  }, [lignes, q])

  const compteurs = useMemo(() => {
    const c = { present: 0, retard: 0, absent: 0, justifie: 0 }
    for (const l of lignes) c[l.status] += 1
    return c
  }, [lignes])

  const aPlusieurs = classes.length > 1

  async function enregistrer() {
    if (!classeId || !schoolId) return
    setSaving(true)
    setMessage(null)

    const res = await sauverPresence({
      schoolId,
      academicYearId,
      classId: classeId,
      date,
      lignes: lignes.map((l) => ({
        studentId: l.studentId,
        status: l.status,
        justification: l.justification,
      })),
    })

    if (res.ok) {
      setMessage({
        type: 'succes',
        texte: 'Feuille de présence enregistrée. Merci !',
      })
      router.refresh()
    } else {
      setMessage({ type: 'erreur', texte: res.message })
    }
    setSaving(false)
  }

  const bilan = Object.entries(compteurs)
    .filter(([, n]) => n > 0)
    .map(([statut, n]) => ({
      statut: statut as StatutPresence,
      n,
    }))

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
            <div className="flex flex-col gap-1.5 sm:min-w-56">
              <Label htmlFor="ass-classe">Classe</Label>
              <Select value={classeId || undefined} onValueChange={onClasseChange}>
                <SelectTrigger id="ass-classe" className="w-full">
                  <SelectValue placeholder={aPlusieurs ? 'Choisir une classe' : classes[0]?.nom ?? 'Aucune classe'} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                      <span className="text-muted-foreground">{c.niveau}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ass-date">Date</Label>
              <Input
                id="ass-date"
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full sm:w-44"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {bilan.map(({ statut, n }) => (
              <Badge
                key={statut}
                variant={statut === 'absent' ? 'destructive' : statut === 'retard' ? 'outline' : 'secondary'}
                className={statut === 'justifie' ? 'border-transparent bg-chart-2/15 text-chart-2' : ''}
              >
                {n} {statutPresenceLibelle[statut]}
                {n > 1 ? 's' : ''}
              </Badge>
            ))}
          </div>
        </div>

        {migrationManquante ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              La table de présence n’est pas encore active sur la base. Exécutez la
              migration v2 dans le SQL editor de Supabase pour pouvoir enregistrer
              les feuilles.
            </span>
          </div>
        ) : null}

        {message ? (
          <div
            className={
              message.type === 'succes'
                ? 'flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary'
                : 'flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'
            }
          >
            {message.type === 'succes' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            )}
            <span>{message.texte}</span>
          </div>
        ) : null}

        {!classeId ? (
          <EmptyState
            icon={CalendarCheck}
            title="Sélectionnez une classe"
            description="Choisissez une classe et une date pour ouvrir la feuille de présence du jour."
          />
        ) : chargement ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Chargement de la feuille…</p>
          </div>
        ) : lignes.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun élève inscrit"
            description="Cette classe n'a pas encore d'élèves inscrits pour l'année en cours."
          />
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm capitalize text-muted-foreground">
                {formatDateFR(date)} — {classeSelectionnee?.nom ?? ''}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1 sm:w-56">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Rechercher un élève…"
                    className="pl-8"
                    aria-label="Rechercher un élève"
                  />
                </div>
                <Button type="button" variant="outline" onClick={toutPresent}>
                  Tout présent
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead className="min-w-36">Statut</TableHead>
                    <TableHead className="min-w-56">Justification (si absent)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrees.map((l, i) => {
                    const justifieDemande = l.status === 'absent' || l.status === 'justifie'
                    return (
                      <TableRow key={l.studentId}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <span className="font-medium">{l.prenoms} {l.nom}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{l.matricule}</TableCell>
                        <TableCell>
                          <Select
                            value={l.status}
                            onValueChange={(value) =>
                              changerStatut(l.studentId, value as StatutPresence)
                            }
                          >
                            <SelectTrigger size="sm" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                ['present', 'retard', 'absent', 'justifie'] as const
                              ).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {statutPresenceLibelle[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {justifieDemande ? (
                            <Input
                              value={l.justification}
                              onChange={(e) =>
                                changerJustification(l.studentId, e.target.value)
                              }
                              placeholder={l.status === 'justifie' ? 'Motif (ex. certificat médical)' : 'Motif de l’absence…'}
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {lignes.length} élève{lignes.length > 1 ? 's' : ''} —{' '}
                {compteurs.present + compteurs.retard} présent
                {compteurs.present + compteurs.retard > 1 ? 's' : ''},{' '}
                {compteurs.absent + compteurs.justifie} absent
                {compteurs.absent + compteurs.justifie > 1 ? 's' : ''}
              </p>
              <Button onClick={enregistrer} disabled={saving || migrationManquante}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Save className="size-4" data-icon="inline-start" />
                    Enregistrer la feuille
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}