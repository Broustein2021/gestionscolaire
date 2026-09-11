'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileText, Printer, Search, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/empty-state'
import { BulletinDocument } from '@/components/bulletins/bulletin-document'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { appreciationNote } from '@/lib/grades-meta'
import type { BulletinRow } from '@/lib/queries/grades'
import type { EvaluationOptions } from '@/lib/queries/grades'

export function BulletinsPanel({
  options,
  rows,
  periodeLabel,
  selectedClasseId,
  selectedTermId,
  selectedStudentId,
}: {
  options: EvaluationOptions | null
  rows: BulletinRow[]
  periodeLabel: string | null
  selectedClasseId: string | null
  selectedTermId: string | null
  selectedStudentId: string | null
}) {
  const router = useRouter()
  const [q, setQ] = useState(() => {
    if (!selectedStudentId) return ''
    const cible = rows.find((r) => r.studentId === selectedStudentId)
    return cible ? cible.nom + ' ' + cible.prenoms : ''
  })
  const [apercuId, setApercuId] = useState<string | null>(() => {
    const cible = selectedStudentId ? rows.find((r) => r.studentId === selectedStudentId) : null
    return cible && cible.moyenne > 0 ? selectedStudentId : null
  })
  const [valides, setValides] = useState<string[]>([])

  const classes = options?.classes ?? []
  const termes = options?.termes ?? []
  const classe = classes.find((c) => c.id === selectedClasseId)

  const studentCible = selectedStudentId
    ? (rows.find((r) => r.studentId === selectedStudentId) ?? null)
    : null

  const filteres = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows
      .filter((r) => {
        const nom = `${r.nom} ${r.prenoms}`
        return (
          !term ||
          nom.toLowerCase().includes(term) ||
          r.matricule.toLowerCase().includes(term)
        )
      })
      .sort((a, b) => a.rang - b.rang)
  }, [rows, q])

  const bulletin = apercuId ? rows.find((r) => r.studentId === apercuId)?.bulletin ?? null : null
  const moyenneClasse =
    rows.length > 0 ? rows.reduce((s, r) => s + r.moyenne, 0) / rows.length : 0

  if (!options) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Users}
            title="Connexion requise"
            description="Reconnectez-vous pour accéder aux bulletins de votre établissement."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Select
              value={selectedClasseId ?? ''}
              items={Object.fromEntries(
                classes.map((c) => [String(c.id), `${c.nom} — ${c.cycle}`])
              )}
              onValueChange={(v) => {
                const classeId = v as string
                setApercuId(null)
                setQ('')
                router.push(`/bulletins?classe=${classeId}&periode=${selectedTermId ?? ''}`)
              }}
            >
              <SelectTrigger className="w-full lg:w-52" aria-label="Classe">
                <SelectValue placeholder="Classe" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom} — {c.cycle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedTermId ?? ''}
              items={Object.fromEntries(
                termes.map((t) => [
                  String(t.id),
                  `${t.label}${t.estCourant ? ' (en cours)' : ''}`,
                ])
              )}
              onValueChange={(v) => {
                const termId = v as string
                setApercuId(null)
                setQ('')
                router.push(`/bulletins?classe=${selectedClasseId ?? ''}&periode=${termId}`)
              }}
            >
              <SelectTrigger className="w-full lg:w-48" aria-label="Période">
                <SelectValue placeholder="Période" />
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
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un élève..."
                className="pl-8"
                aria-label="Rechercher un élève"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setValides(rows.map((r) => r.studentId))}
              disabled={rows.length === 0}
            >
              <CheckCircle2 className="size-4" data-icon="inline-start" />
              Valider la classe
            </Button>
          </div>

          {selectedStudentId ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                Bulletin consulté pour{' '}
                <span className="font-medium">
                  {studentCible ? `${studentCible.nom} ${studentCible.prenoms}` : 'cet élève'}
                </span>
                {classe ? <span className="text-muted-foreground">— {classe.nom}</span> : null}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setApercuId(null)
                  setQ('')
                  router.push(
                    `/bulletins?classe=${selectedClasseId ?? ''}&periode=${selectedTermId ?? ''}`,
                  )
                }}
              >
                Voir la classe entière
              </Button>
            </div>
          ) : null}

          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed">
              <EmptyState
                icon={Users}
                title="Aucun bulletin calculable"
                description={
                  periodeLabel
                    ? `Aucune évaluation (statut « saisie » ou « validée ») pour cette classe sur « ${periodeLabel} ». Saisissez puis validez des notes pour générer les moyennes.`
                    : 'Sélectionnez une période pour générer les bulletins de cette classe.'
                }
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
                <span className="font-medium">{classe?.nom ?? 'Classe'}</span>
                <span className="text-muted-foreground">{periodeLabel ?? ''}</span>
                <span className="text-muted-foreground">
                  Moyenne de classe{' '}
                  <span className="font-medium tabular-nums text-foreground">
                    {moyenneClasse.toFixed(2)} / 20
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {valides.length} bulletin(s) validé(s)
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">Rang</TableHead>
                      <TableHead>Élève</TableHead>
                      <TableHead>Matricule</TableHead>
                      <TableHead className="text-center">Moyenne</TableHead>
                      <TableHead>Appréciation</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-28" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteres.map((r) => (
                      <TableRow key={r.studentId}>
                        <TableCell className="text-center font-medium tabular-nums">
                          {r.rang}
                        </TableCell>
                        <TableCell className="font-medium">
                          {r.nom} {r.prenoms}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {r.matricule}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {r.moyenne > 0 ? r.moyenne.toFixed(2) : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.moyenne > 0 ? appreciationNote(r.moyenne) : '—'}
                        </TableCell>
                        <TableCell>
                          {valides.includes(r.studentId) ? (
                            <Badge
                              variant="secondary"
                              className="border-transparent bg-primary/10 text-primary"
                            >
                              Validé
                            </Badge>
                          ) : (
                            <Badge variant="outline">Brouillon</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setApercuId(r.studentId)}
                            disabled={r.moyenne <= 0}
                          >
                            <FileText className="size-4" data-icon="inline-start" />
                            Bulletin
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={apercuId !== null}
        onOpenChange={(next) => {
          if (!next) setApercuId(null)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader data-print-hidden>
            <DialogTitle>Aperçu du bulletin</DialogTitle>
            <DialogDescription>
              Calculé à partir des évaluations validées de la classe — {periodeLabel ?? ''}, bulletin
              {apercuId && valides.includes(apercuId) ? ' validé' : ' brouillon'}.
            </DialogDescription>
          </DialogHeader>
          {bulletin ? <BulletinDocument bulletin={bulletin} /> : null}
          <DialogFooter data-print-hidden>
            <Button
              variant="outline"
              onClick={() => {
                if (apercuId && !valides.includes(apercuId)) {
                  setValides((v) => [...v, apercuId])
                }
              }}
              disabled={apercuId !== null && valides.includes(apercuId)}
            >
              <CheckCircle2 className="size-4" data-icon="inline-start" />
              Valider
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="size-4" data-icon="inline-start" />
              Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}