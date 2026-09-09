'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { creerEnseignant } from '@/lib/enseignants-create'
import type { Enseignant, MatiereRef } from '@/lib/queries/enseignants'

export type EnseignantOptions = {
  schoolId: string
  academicYearId: string
  matieres: MatiereRef[]
  classes: { id: string; nom: string }[]
}

type EtatFormulaire = 'saisie' | 'envoi' | 'succes' | 'erreur'

const AUCUNE = '__aucune'

export function EnseignantDialog({
  options,
  enseignant,
  trigger,
}: {
  options: EnseignantOptions | null
  enseignant?: Enseignant
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [etat, setEtat] = useState<EtatFormulaire>('saisie')
  const [message, setMessage] = useState('')
  const [resultat, setResultat] = useState<{ matricule: string } | null>(null)

  const [nom, setNom] = useState('')
  const [prenoms, setPrenoms] = useState('')
  const [sexe, setSexe] = useState<'M' | 'F'>('M')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [dateEmbauche, setDateEmbauche] = useState('')
  const [matiereId, setMatiereId] = useState(AUCUNE)
  const [classeId, setClasseId] = useState(AUCUNE)

  const consultation = Boolean(enseignant)

  function reinitialiser() {
    setNom(enseignant?.nom ?? '')
    setPrenoms(enseignant?.prenoms ?? '')
    setSexe(enseignant?.sexe ?? 'M')
    setTelephone(enseignant?.telephone === '—' ? '' : (enseignant?.telephone ?? ''))
    setEmail(enseignant?.email === '—' ? '' : (enseignant?.email ?? ''))
    setDateEmbauche(enseignant?.dateEmbauche ?? '')
    setMatiereId(AUCUNE)
    setClasseId(AUCUNE)
    setEtat('saisie')
    setMessage('')
    setResultat(null)
  }

  async function enregistrer() {
    if (!options) return
    setEtat('envoi')
    setMessage('')
    const res = await creerEnseignant({
      schoolId: options.schoolId,
      academicYearId: options.academicYearId,
      nom: nom.trim(),
      prenoms: prenoms.trim(),
      sexe,
      telephone,
      email,
      hiredOn: dateEmbauche,
      matiereId: matiereId === AUCUNE ? null : matiereId,
      classeId: classeId === AUCUNE ? null : classeId,
    })
    if (res.ok) {
      setResultat({ matricule: res.matricule })
      setEtat('succes')
      router.refresh()
    } else {
      setMessage(res.message)
      setEtat('erreur')
    }
  }

  const champsDesactives = consultation || etat === 'envoi'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        reinitialiser()
        setOpen(next)
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {consultation
              ? `Fiche ${enseignant!.prenoms} ${enseignant!.nom}`
              : 'Nouvel enseignant'}
          </DialogTitle>
          <DialogDescription>
            {consultation
              ? 'Détails du dossier et classes affectées.'
              : 'Identité, contact et affectation pour l\u2019année scolaire courante.'}
          </DialogDescription>
        </DialogHeader>

        {etat === 'succes' && resultat ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 py-6 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="font-medium">Enseignant enregistré</p>
            <p className="text-sm text-muted-foreground">
              Matricule attribué : <span className="font-mono">{resultat.matricule}</span>
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-nom">Nom</Label>
                <Input
                  id="t-nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  disabled={champsDesactives}
                  placeholder="Kouassi"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-prenoms">Prénoms</Label>
                <Input
                  id="t-prenoms"
                  value={prenoms}
                  onChange={(e) => setPrenoms(e.target.value)}
                  disabled={champsDesactives}
                  placeholder="Jean-Marc"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-sexe">Sexe</Label>
                <Select
                  value={sexe}
                  onValueChange={(v) => setSexe(v === 'F' ? 'F' : 'M')}
                  disabled={champsDesactives}
                >
                  <SelectTrigger id="t-sexe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-embauche">Date d&apos;embauche</Label>
                <Input
                  id="t-embauche"
                  type="date"
                  value={dateEmbauche}
                  onChange={(e) => setDateEmbauche(e.target.value)}
                  disabled={champsDesactives}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-tel">Téléphone</Label>
                <Input
                  id="t-tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  disabled={champsDesactives}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-mail">Email</Label>
                <Input
                  id="t-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={champsDesactives}
                />
              </div>
            </div>

            {consultation ? null : (
              <>
                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Affectation pédagogique (optionnel)
                  </span>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="t-matiere">Matière</Label>
                      <Select
                        value={matiereId}
                        onValueChange={(v) => setMatiereId(v ?? AUCUNE)}
                        disabled={etat === 'envoi'}
                      >
                        <SelectTrigger id="t-matiere">
                          <SelectValue placeholder="À choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AUCUNE}>Aucune</SelectItem>
                          {options?.matieres.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="t-classe">Classe</Label>
                      <Select
                        value={classeId}
                        onValueChange={(v) => setClasseId(v ?? AUCUNE)}
                        disabled={etat === 'envoi'}
                      >
                        <SelectTrigger id="t-classe">
                          <SelectValue placeholder="À choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AUCUNE}>Aucune</SelectItem>
                          {options?.classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    L&apos;affectation est rattachée à l&apos;année scolaire courante.
                  </p>
                </div>
              </>
            )}

            {consultation && enseignant && enseignant.classes.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Classes affectées
                </span>
                <div className="flex flex-wrap gap-2">
                  {enseignant.classes.map((c) => (
                    <Link
                      key={c.id}
                      href={`/classes/${c.id}`}
                      className="rounded-md border px-2 py-1 text-sm hover:bg-accent"
                    >
                      {c.nom}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}

        {etat === 'erreur' ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{message}</span>
          </div>
        ) : null}

        <DialogFooter>
          {consultation ? (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          ) : etat === 'succes' ? (
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
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={etat === 'envoi'}
              >
                Annuler
              </Button>
              <Button
                onClick={enregistrer}
                disabled={etat === 'envoi' || !options || !nom.trim() || !prenoms.trim()}
              >
                {etat === 'envoi' ? (
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

export function EnseignantsTable({
  enseignants,
  matieres,
  options,
}: {
  enseignants: Enseignant[]
  matieres: MatiereRef[]
  options: EnseignantOptions | null
}) {
  const [q, setQ] = useState('')
  const [matiereId, setMatiereId] = useState('toutes')
  const [statut, setStatut] = useState('actif')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return enseignants.filter((t) => {
      const matchTerm =
        !term ||
        `${t.prenoms} ${t.nom}`.toLowerCase().includes(term) ||
        t.matricule.toLowerCase().includes(term) ||
        t.email.toLowerCase().includes(term)
      const matchMatiere = matiereId === 'toutes' || t.matiereIds.includes(matiereId)
      const matchStatut = statut === 'tous' || t.statut === statut
      return matchTerm && matchMatiere && matchStatut
    })
  }, [enseignants, q, matiereId, statut])

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un enseignant..."
              className="pl-8"
              aria-label="Rechercher un enseignant"
            />
          </div>
          <Select value={matiereId} onValueChange={(value) => setMatiereId(value ?? '')}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Matière" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes les matières</SelectItem>
              {matieres.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statut} onValueChange={(value) => setStatut(value ?? '')}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous</SelectItem>
              <SelectItem value="actif">Actifs</SelectItem>
              <SelectItem value="conge">En congé</SelectItem>
              <SelectItem value="archive">Archivés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {filtered.length} enseignant{filtered.length > 1 ? 's' : ''}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed">
            <EmptyState
              icon={GraduationCap}
              title="Aucun enseignant trouvé"
              description="Commencez par ajouter votre premier enseignant."
            >
              <EnseignantDialog
                options={options}
                trigger={
                  <Button>
                    <Plus className="size-4" data-icon="inline-start" />
                    Ajouter un enseignant
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
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Matières</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                            {`${t.prenoms[0] ?? ''}${t.nom[0] ?? ''}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium leading-tight">
                            {t.prenoms} {t.nom}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t.dateEmbauche
                              ? `Depuis ${new Date(t.dateEmbauche).toLocaleDateString('fr-FR', {
                                  month: 'long',
                                  year: 'numeric',
                                })}`
                              : 'Date d\u2019embauche non renseignée'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{t.matricule}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.matieres.map((m) => (
                          <Badge key={m.id} variant="secondary">
                            {m.code}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.classes.map((c) => (
                          <Link key={c.id} href={`/classes/${c.id}`}>
                            <Badge variant="outline" className="transition-colors hover:bg-accent">
                              {c.nom}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3.5" />
                          {t.telephone}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Mail className="size-3.5" />
                          {t.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <EnseignantDialog
                        options={options}
                        enseignant={t}
                        trigger={
                          <Button variant="ghost" size="sm">
                            Consulter
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
