'use client'

import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  anneesScolaires,
  categoriesFrais,
  classes,
  formatFCFA,
  parents,
} from '@/lib/data'

const etapes = [
  'Élève',
  'Responsable',
  'Scolarité',
  'Finances',
  'Confirmation',
] as const

type Form = {
  nom: string
  prenoms: string
  sexe: 'M' | 'F'
  dateNaissance: string
  lieuNaissance: string
  nationalite: string
  telephone: string
  adresse: string
  parentId: string
  lien: string
  parentTelephone: string
  parentEmail: string
  anneeId: string
  classeId: string
  dateInscription: string
  statut: 'nouveau' | 'inscrit'
  fraisInscription: number
  scolarite: number
  reduction: number
}

const initial: Form = {
  nom: '',
  prenoms: '',
  sexe: 'F',
  dateNaissance: '',
  lieuNaissance: '',
  nationalite: 'Ivoirienne',
  telephone: '',
  adresse: '',
  parentId: parents[0]?.id ?? '',
  lien: 'Père',
  parentTelephone: '',
  parentEmail: '',
  anneeId: anneesScolaires[0].id,
  classeId: classes[3]?.id ?? classes[0].id,
  dateInscription: new Date().toISOString().slice(0, 10),
  statut: 'nouveau',
  fraisInscription: categoriesFrais[0].montant,
  scolarite: categoriesFrais[1].montant,
  reduction: 0,
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  )
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value || '—'}</span>
    </div>
  )
}

export function InscriptionWizard() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Form>(initial)
  const [done, setDone] = useState(false)

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const classe = classes.find((c) => c.id === form.classeId)
  const parent = parents.find((p) => p.id === form.parentId)
  const aPayer = form.fraisInscription + form.scolarite - form.reduction

  const etape1Valide = form.nom.trim() !== '' && form.prenoms.trim() !== ''
  const peutContinuer = step !== 0 || etape1Valide

  function reset() {
    setStep(0)
    setForm(initial)
    setDone(false)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus className="size-4" data-icon="inline-start" />
            Nouvelle inscription
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {done ? (
          <>
            <DialogHeader>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-5" />
              </div>
              <DialogTitle>Inscription enregistrée</DialogTitle>
              <DialogDescription>
                Le dossier de {form.prenoms} {form.nom} a été créé pour la classe{' '}
                {classe?.nom}. Montant à payer : {formatFCFA(aPayer)}.
              </DialogDescription>
            </DialogHeader>
            <p className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
              Mode maquette : les données saisies ne sont pas encore persistées.
              La base de données et l&apos;authentification seront branchées dans
              une phase ultérieure.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Nouvelle saisie
              </Button>
              <Button onClick={() => onOpenChange(false)}>Fermer</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Inscription d&apos;un élève</DialogTitle>
              <DialogDescription>
                Étape {step + 1} sur {etapes.length} — {etapes[step]}
              </DialogDescription>
            </DialogHeader>

            {/* Progression */}
            <ol className="flex items-center gap-1.5" aria-label="Progression">
              {etapes.map((e, i) => (
                <li key={e} className="flex flex-1 flex-col gap-1.5">
                  <span
                    className={
                      'h-1 rounded-full ' +
                      (i <= step ? 'bg-primary' : 'bg-muted')
                    }
                  />
                  <span
                    className={
                      'hidden text-xs sm:block ' +
                      (i === step
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground')
                    }
                  >
                    {e}
                  </span>
                </li>
              ))}
            </ol>

            <div className="flex flex-col gap-4">
              {step === 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nom" htmlFor="nom" required>
                    <Input
                      id="nom"
                      value={form.nom}
                      onChange={(e) => set('nom', e.target.value)}
                      placeholder="Kouassi"
                    />
                  </Field>
                  <Field label="Prénoms" htmlFor="prenoms" required>
                    <Input
                      id="prenoms"
                      value={form.prenoms}
                      onChange={(e) => set('prenoms', e.target.value)}
                      placeholder="Marie-Ange"
                    />
                  </Field>
                  <Field label="Sexe">
                    <Select
                      value={form.sexe}
                      onValueChange={(v) => set('sexe', v as 'M' | 'F')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="F">Féminin</SelectItem>
                        <SelectItem value="M">Masculin</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Date de naissance" htmlFor="ddn">
                    <Input
                      id="ddn"
                      type="date"
                      value={form.dateNaissance}
                      onChange={(e) => set('dateNaissance', e.target.value)}
                    />
                  </Field>
                  <Field label="Lieu de naissance" htmlFor="lieu">
                    <Input
                      id="lieu"
                      value={form.lieuNaissance}
                      onChange={(e) => set('lieuNaissance', e.target.value)}
                      placeholder="Abidjan"
                    />
                  </Field>
                  <Field label="Nationalité" htmlFor="nat">
                    <Input
                      id="nat"
                      value={form.nationalite}
                      onChange={(e) => set('nationalite', e.target.value)}
                    />
                  </Field>
                  <Field label="Téléphone" htmlFor="tel">
                    <Input
                      id="tel"
                      value={form.telephone}
                      onChange={(e) => set('telephone', e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                    />
                  </Field>
                  <Field label="Adresse" htmlFor="adr">
                    <Input
                      id="adr"
                      value={form.adresse}
                      onChange={(e) => set('adresse', e.target.value)}
                      placeholder="Cocody Angré, Abidjan"
                    />
                  </Field>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Responsable">
                    <Select
                      value={form.parentId}
                      onValueChange={(v) => set('parentId', v ?? '')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {parents.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.prenoms} {p.nom} — {p.lien}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Lien de parenté">
                    <Select
                      value={form.lien}
                      onValueChange={(v) => set('lien', v ?? '')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Père">Père</SelectItem>
                        <SelectItem value="Mère">Mère</SelectItem>
                        <SelectItem value="Tuteur">Tuteur</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Téléphone du responsable" htmlFor="ptel">
                    <Input
                      id="ptel"
                      value={form.parentTelephone || parent?.telephone || ''}
                      onChange={(e) => set('parentTelephone', e.target.value)}
                    />
                  </Field>
                  <Field label="Email du responsable" htmlFor="pmail">
                    <Input
                      id="pmail"
                      type="email"
                      value={form.parentEmail || parent?.email || ''}
                      onChange={(e) => set('parentEmail', e.target.value)}
                    />
                  </Field>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Année scolaire">
                    <Select
                      value={form.anneeId}
                      onValueChange={(v) => set('anneeId', v ?? '')}
                    >
                      <SelectTrigger>
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
                  </Field>
                  <Field label="Classe">
                    <Select
                      value={form.classeId}
                      onValueChange={(v) => set('classeId', v ?? '')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nom} — {c.cycle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Date d'inscription" htmlFor="dins">
                    <Input
                      id="dins"
                      type="date"
                      value={form.dateInscription}
                      onChange={(e) => set('dateInscription', e.target.value)}
                    />
                  </Field>
                  <Field label="Statut de l'élève">
                    <Select
                      value={form.statut}
                      onValueChange={(v) =>
                        set('statut', v as 'nouveau' | 'inscrit')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nouveau">Nouvel élève</SelectItem>
                        <SelectItem value="inscrit">Ancien élève</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    Niveau : {classe?.niveau} — Effectif actuel {classe?.effectif}/
                    {classe?.capacite} — Salle {classe?.salle}
                  </p>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Frais d'inscription" htmlFor="fi">
                      <Input
                        id="fi"
                        type="number"
                        min={0}
                        value={form.fraisInscription}
                        onChange={(e) =>
                          set('fraisInscription', Number(e.target.value))
                        }
                      />
                    </Field>
                    <Field label="Scolarité" htmlFor="sc">
                      <Input
                        id="sc"
                        type="number"
                        min={0}
                        value={form.scolarite}
                        onChange={(e) => set('scolarite', Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Réduction" htmlFor="red">
                      <Input
                        id="red"
                        type="number"
                        min={0}
                        value={form.reduction}
                        onChange={(e) => set('reduction', Number(e.target.value))}
                      />
                    </Field>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-4">
                    <Recap
                      label="Frais d'inscription"
                      value={formatFCFA(form.fraisInscription)}
                    />
                    <Recap label="Scolarité" value={formatFCFA(form.scolarite)} />
                    <Recap
                      label="Réduction accordée"
                      value={`- ${formatFCFA(form.reduction)}`}
                    />
                    <Separator className="my-1" />
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium">
                        Montant à payer
                      </span>
                      <span className="text-lg font-semibold tabular-nums">
                        {formatFCFA(aPayer)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Échéancier suggéré : 3 versements de{' '}
                      {formatFCFA(Math.round(aPayer / 3))}
                    </p>
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col rounded-lg border p-4">
                    <span className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Élève
                    </span>
                    <Recap
                      label="Nom & prénoms"
                      value={`${form.prenoms} ${form.nom}`}
                    />
                    <Recap
                      label="Sexe"
                      value={form.sexe === 'F' ? 'Féminin' : 'Masculin'}
                    />
                    <Recap
                      label="Naissance"
                      value={
                        form.dateNaissance
                          ? `${new Date(form.dateNaissance).toLocaleDateString('fr-FR')} à ${form.lieuNaissance}`
                          : form.lieuNaissance
                      }
                    />
                    <Recap label="Nationalité" value={form.nationalite} />
                    <Recap label="Adresse" value={form.adresse} />
                  </div>
                  <div className="flex flex-col rounded-lg border p-4">
                    <span className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Responsable & scolarité
                    </span>
                    <Recap
                      label="Responsable"
                      value={parent ? `${parent.prenoms} ${parent.nom} (${form.lien})` : '—'}
                    />
                    <Recap
                      label="Classe"
                      value={`${classe?.nom ?? ''} — ${classe?.niveau ?? ''}`}
                    />
                    <Recap
                      label="Année scolaire"
                      value={
                        anneesScolaires.find((a) => a.id === form.anneeId)
                          ?.libelle ?? ''
                      }
                    />
                    <Recap
                      label="Date d'inscription"
                      value={new Date(form.dateInscription).toLocaleDateString(
                        'fr-FR',
                      )}
                    />
                    <Recap
                      label="Statut"
                      value={form.statut === 'nouveau' ? 'Nouvel élève' : 'Ancien élève'}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-4">
                    <span className="text-sm font-medium">Montant à payer</span>
                    <Badge
                      variant="secondary"
                      className="border-transparent bg-primary/10 text-base tabular-nums text-primary"
                    >
                      {formatFCFA(aPayer)}
                    </Badge>
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ChevronLeft className="size-4" data-icon="inline-start" />
                Précédent
              </Button>
              {step < etapes.length - 1 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!peutContinuer}
                >
                  Continuer
                  <ChevronRight className="size-4" data-icon="inline-end" />
                </Button>
              ) : (
                <Button onClick={() => setDone(true)}>
                  <Check className="size-4" data-icon="inline-start" />
                  Confirmer l&apos;inscription
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

