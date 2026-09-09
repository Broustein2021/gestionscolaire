'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  Contact,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
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
import { creerResponsable, modifierResponsable } from '@/lib/parents-create'
import type { Parent } from '@/lib/queries/parents'

const liensParente = ['Père', 'Mère', 'Tuteur', 'Tutrice', 'Autre'] as const

function initials(prenoms: string, nom: string) {
  return `${prenoms[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}

function ParentFormDialog({
  schoolId,
  parent,
  trigger,
}: {
  schoolId: string | null
  parent?: Parent
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [etat, setEtat] = useState<'saisie' | 'envoi' | 'succes' | 'erreur'>('saisie')
  const [message, setMessage] = useState('')

  const [nom, setNom] = useState('')
  const [prenoms, setPrenoms] = useState('')
  const [profession, setProfession] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [adresse, setAdresse] = useState('')

  const edition = Boolean(parent)

  function reinitialiser() {
    setNom(parent?.nom ?? '')
    setPrenoms(parent?.prenoms ?? '')
    setProfession(parent?.profession ?? '')
    setTelephone(parent?.telephone ?? '')
    setEmail(parent?.email ?? '')
    setAdresse(parent?.adresse ?? '')
    setEtat('saisie')
    setMessage('')
  }

  async function enregistrer() {
    if (!schoolId) return
    const input = {
      schoolId,
      nom,
      prenoms,
      telephone,
      email,
      profession,
      adresse,
    }
    setEtat('envoi')
    setMessage('')

    const res = edition && parent
      ? await modifierResponsable(parent.id, input)
      : await creerResponsable(input)

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{parent ? 'Modifier le responsable' : 'Nouveau responsable'}</DialogTitle>
          <DialogDescription>
            Renseignez les informations du parent ou du tuteur légal.
          </DialogDescription>
        </DialogHeader>

        {etat === 'succes' ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 py-6 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="font-medium">
              {edition ? 'Responsable modifié' : 'Responsable enregistré'}
            </p>
            <p className="text-sm text-muted-foreground">
              {prenoms.trim()} {nom.trim()}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-nom">Nom</Label>
              <Input
                id="p-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                disabled={desactive}
                placeholder="Kouadio"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-prenoms">Prénoms</Label>
              <Input
                id="p-prenoms"
                value={prenoms}
                onChange={(e) => setPrenoms(e.target.value)}
                disabled={desactive}
                placeholder="Émile"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-prof">Profession</Label>
              <Input
                id="p-prof"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                disabled={desactive}
                placeholder="Ingénieur"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-tel">Téléphone</Label>
              <Input
                id="p-tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                disabled={desactive}
                placeholder="+225 07 00 00 00 00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-mail">Email</Label>
              <Input
                id="p-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={desactive}
                placeholder="parent@email.ci"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="p-adresse">Adresse</Label>
              <Input
                id="p-adresse"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                disabled={desactive}
                placeholder="Cocody, Riviera…"
              />
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
                disabled={desactive || !schoolId || !nom.trim() || !prenoms.trim()}
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

export function ParentsList({ parents, schoolId }: { parents: Parent[]; schoolId: string | null }) {
  const [q, setQ] = useState('')
  const [lien, setLien] = useState('tous')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return parents.filter((p) => {
      const matchTerm =
        !term ||
        `${p.prenoms} ${p.nom}`.toLowerCase().includes(term) ||
        (p.telephone ?? '').includes(term) ||
        (p.email ?? '').toLowerCase().includes(term)
      const matchLien = lien === 'tous' || p.lien === lien
      return matchTerm && matchLien
    })
  }, [parents, q, lien])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center md:p-5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un responsable (nom, téléphone, email)..."
              className="pl-8"
              aria-label="Rechercher un responsable"
            />
          </div>
          <Select value={lien} onValueChange={(value) => setLien(value ?? '')}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Lien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les liens</SelectItem>
              {liensParente.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
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
              icon={Contact}
              title="Aucun responsable trouvé"
              description="Commencez par ajouter votre premier parent ou tuteur légal."
            >
              <ParentFormDialog
                schoolId={schoolId}
                trigger={
                  <Button>
                    <Plus className="size-4" data-icon="inline-start" />
                    Ajouter un responsable
                  </Button>
                }
              />
            </EmptyState>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11">
                      <AvatarFallback className="bg-secondary text-sm font-medium text-secondary-foreground">
                        {initials(p.prenoms, p.nom)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium leading-tight">
                        {p.prenoms} {p.nom}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.lien}
                        {p.profession ? ` — ${p.profession}` : ''}
                      </span>
                    </div>
                  </div>
                  {p.principal ? (
                    <Badge variant="secondary" className="border-transparent bg-primary/10 text-primary">
                      Responsable principal
                    </Badge>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-2 border-t pt-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{p.telephone ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{p.email ?? '—'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t pt-3">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Users className="size-3.5" />
                    {p.enfants.length} enfant{p.enfants.length > 1 ? 's' : ''} scolarisé
                    {p.enfants.length > 1 ? 's' : ''}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.enfants.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Aucun enfant associé.</span>
                    ) : (
                      p.enfants.map((e) => (
                        <Link
                          key={e.id}
                          href={`/eleves/${e.id}`}
                          className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-accent"
                        >
                          <span className="font-medium">
                            {e.prenoms} {e.nom}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {e.classeNom ?? '—'}
                          </Badge>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t pt-3">
                  <ParentFormDialog
                    schoolId={schoolId}
                    parent={p}
                    trigger={
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    }
                  />
                  {p.enfants[0] ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/eleves/${p.enfants[0]!.id}`} />}
                    >
                      Voir la fiche élève
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export { ParentFormDialog }
