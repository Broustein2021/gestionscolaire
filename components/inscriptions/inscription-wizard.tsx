'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { formatFCFA } from '@/lib/data'
import { enregistrerInscription } from '@/lib/enroll-create'
import type { InscriptionOptions } from '@/lib/queries/enrollments'

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
  parentMode: 'existant' | 'nouveau'
  nouveauParentNom: string
  nouveauParentPrenoms: string
  nouveauParentLien: string
  nouveauParentTelephone: string
  nouveauParentEmail: string
  classeId: string
  dateInscription: string
  statut: 'nouveau' | 'inscrit'
  fraisInscription: number
  scolarite: number
  reduction: number
  acompte: number
}

function buildInitial(options: InscriptionOptions): Form {
  const classeDefaut =
    options.classes.find((c) => c.niveau === '6e') ?? options.classes[0]
  const catInscription = options.frais.find((f) => /inscription/i.test(f.nom))
  const catScolarite = options.frais.find((f) => /scolar/i.test(f.nom))

  return {
    nom: '',
    prenoms: '',
    sexe: 'F',
    dateNaissance: '',
    lieuNaissance: '',
    nationalite: 'Ivoirienne',
    telephone: '',
    adresse: '',
    parentId: options.responsables[0]?.id ?? '',
    lien: 'Père',
    parentMode: 'existant',
    nouveauParentNom: '',
    nouveauParentPrenoms: '',
    nouveauParentLien: 'Père',
    nouveauParentTelephone: '',
    nouveauParentEmail: '',
    classeId: classeDefaut?.id ?? '',
    dateInscription: new Date().toISOString().slice(0, 10),
    statut: 'nouveau',
    fraisInscription: catInscription?.montant ?? 0,
    scolarite: catScolarite?.montant ?? 0,
    reduction: 0,
    acompte: 0,
  }
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  )
}

type Props = {
  options: InscriptionOptions
}

export function InscriptionWizard({ options }: Props) {
  const initial = useMemo(() => buildInitial(options), [options])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Form>(initial)
  const [etat, setEtat] = useState<'saisie' | 'envoi' | 'succes' | 'erreur'>('saisie')
  const [message, setMessage] = useState('')
  const [resultat, setResultat] = useState<
    { matricule: string; avertissement?: string } | null
  >(null)

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const classe = options.classes.find((c) => c.id === form.classeId)
  const parent = options.responsables.find((p) => p.id === form.parentId)

  const montantTotal = Math.max(
    0,
    form.fraisInscription + form.scolarite - form.reduction,
  )
  const acompte = Math.min(Math.max(0, form.acompte), montantTotal)
  const solde = montantTotal - acompte

  const desactive = etat === 'envoi'

  const peutSoumettre =
    !desactive &&
    form.nom.trim() !== '' &&
    form.prenoms.trim() !== '' &&
    Boolean(classe) &&
    (form.parentMode === 'existant'
      ? form.parentId !== ''
      : form.nouveauParentNom.trim() !== '' &&
        form.nouveauParentPrenoms.trim() !== '')

  function reset() {
    setForm(initial)
    setResultat(null)
    setMessage('')
    setEtat('saisie')
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  async function soumettre() {
    if (desactive) return
    setMessage('')

    if (!classe) {
      setEtat('erreur')
      setMessage('Sélectionnez une classe.')
      return
    }

    if (form.parentMode === 'existant' && !form.parentId) {
      setEtat('erreur')
      setMessage('Sélectionnez un responsable existant.')
      return
    }

    if (
      form.parentMode === 'nouveau' &&
      (form.nouveauParentNom.trim() === '' || form.nouveauParentPrenoms.trim() === '')
    ) {
      setEtat('erreur')
      setMessage('Le nom et les prénoms du nouveau responsable sont obligatoires.')
      return
    }

    const dateInscription =
      form.dateInscription || new Date().toISOString().slice(0, 10)
    const catInscription =
      options.frais.find((f) => /inscription/i.test(f.nom)) ?? null

    setEtat('envoi')
    const res = await enregistrerInscription({
      schoolId: options.schoolId,
      academicYearId: options.academicYearId,
      classe: { id: classe.id, levelLabel: classe.level_label },
      eleve: {
        nom: form.nom.trim(),
        prenoms: form.prenoms.trim(),
        sexe: form.sexe,
        dateNaissance: form.dateNaissance,
        lieuNaissance: form.lieuNaissance.trim(),
        nationalite: form.nationalite.trim(),
        telephone: form.telephone.trim(),
        adresse: form.adresse.trim(),
        statut: form.statut,
      },
      dateInscription,
      responsable:
        form.parentMode === 'nouveau'
          ? {
              mode: 'nouveau',
              gardienId: null,
              nouveau: {
                nom: form.nouveauParentNom,
                prenoms: form.nouveauParentPrenoms,
                telephone: form.nouveauParentTelephone,
                email: form.nouveauParentEmail,
              },
              lien: form.nouveauParentLien,
            }
          : { mode: 'existant', gardienId: form.parentId, lien: form.lien },
      montants: {
        fraisInscription: form.fraisInscription,
        scolarite: form.scolarite,
        reduction: form.reduction,
        acompte: Math.max(0, form.acompte),
      },
      categorieInscriptionId: catInscription?.id ?? null,
    })
    setEtat(res.ok ? 'succes' : 'erreur')

    if (res.ok) {
      setResultat(res)
    } else {
      setMessage(res.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" data-icon="inline-start" />
            Nouvelle inscription
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inscrire un élève</DialogTitle>
          <DialogDescription>
            Identité, responsable, scolarité et financement du dossier.
          </DialogDescription>
        </DialogHeader>

        {resultat ? (
          <>
            <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 py-6 text-center">
              <CheckCircle2 className="size-10 text-primary" />
              <p className="font-medium">Inscription enregistrée</p>
              <p className="text-sm text-muted-foreground">
                {form.prenoms.trim()} {form.nom.trim()} — {classe?.nom}
                {resultat.matricule
                  ? ` (matricule ${resultat.matricule})`
                  : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                Montant dû : {formatFCFA(montantTotal)} —{' '}
                {acompte > 0
                  ? `acompte ${formatFCFA(acompte)}, solde ${formatFCFA(solde)}`
                  : `solde à payer ${formatFCFA(solde)}`}
                .
              </p>
            </div>

            {resultat.avertissement ? (
              <div className="rounded-lg border border-amber-300/40 bg-amber-500/10 p-3 text-xs text-amber-700">
                {resultat.avertissement}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                onClick={() => {
                  setOpen(false)
                  reset()
                }}
              >
                Terminé
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nom" htmlFor="ins-nom" required>
                <Input
                  id="ins-nom"
                  value={form.nom}
                  onChange={(e) => set('nom', e.target.value)}
                  disabled={desactive}
                  placeholder="Kouassi"
                />
              </Field>
              <Field label="Prénoms" htmlFor="ins-prenoms" required>
                <Input
                  id="ins-prenoms"
                  value={form.prenoms}
                  onChange={(e) => set('prenoms', e.target.value)}
                  disabled={desactive}
                  placeholder="Marie-Ange"
                />
              </Field>
              <Field label="Sexe">
                <Select
                  value={form.sexe}
                  onValueChange={(v) => set('sexe', v as 'M' | 'F')}
                  disabled={desactive}
                >
                  <SelectTrigger id="ins-sexe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Féminin</SelectItem>
                    <SelectItem value="M">Masculin</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date de naissance" htmlFor="ins-ddn">
                <Input
                  id="ins-ddn"
                  type="date"
                  value={form.dateNaissance}
                  onChange={(e) => set('dateNaissance', e.target.value)}
                  disabled={desactive}
                />
              </Field>
              <Field label="Lieu de naissance" htmlFor="ins-lieu">
                <Input
                  id="ins-lieu"
                  value={form.lieuNaissance}
                  onChange={(e) => set('lieuNaissance', e.target.value)}
                  disabled={desactive}
                  placeholder="Abidjan"
                />
              </Field>
              <Field label="Nationalité" htmlFor="ins-nat">
                <Input
                  id="ins-nat"
                  value={form.nationalite}
                  onChange={(e) => set('nationalite', e.target.value)}
                  disabled={desactive}
                />
              </Field>
              <Field label="Téléphone" htmlFor="ins-tel">
                <Input
                  id="ins-tel"
                  value={form.telephone}
                  onChange={(e) => set('telephone', e.target.value)}
                  disabled={desactive}
                  placeholder="+225 07 00 00 00 00"
                />
              </Field>
              <Field label="Adresse" htmlFor="ins-adr">
                <Input
                  id="ins-adr"
                  value={form.adresse}
                  onChange={(e) => set('adresse', e.target.value)}
                  disabled={desactive}
                  placeholder="Cocody Angré, Abidjan"
                />
              </Field>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Separator className="my-1" />
                <SectionLabel>Responsable</SectionLabel>
              </div>

              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button
                  type="button"
                  variant={form.parentMode === 'existant' ? 'secondary' : 'outline'}
                  onClick={() => set('parentMode', 'existant')}
                  disabled={desactive}
                >
                  Responsable existant
                </Button>
                <Button
                  type="button"
                  variant={form.parentMode === 'nouveau' ? 'secondary' : 'outline'}
                  onClick={() => set('parentMode', 'nouveau')}
                  disabled={desactive}
                >
                  Nouveau responsable
                </Button>
              </div>

              {form.parentMode === 'existant' ? (
                <>
                  <Field label="Responsable" required>
                    <Select
                      value={form.parentId}
                      onValueChange={(v) => set('parentId', v ?? '')}
                      disabled={desactive}
                    >
                      <SelectTrigger id="ins-parent">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.responsables.map((p) => (
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
                      disabled={desactive}
                    >
                      <SelectTrigger id="ins-lien">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Père">Père</SelectItem>
                        <SelectItem value="Mère">Mère</SelectItem>
                        <SelectItem value="Tuteur">Tuteur</SelectItem>
                        <SelectItem value="Tutrice">Tutrice</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Téléphone du responsable">
                    <Input value={parent?.telephone ?? ''} disabled />
                  </Field>
                  <Field label="Email du responsable">
                    <Input value={parent?.email ?? ''} disabled />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Nom" htmlFor="npnom" required>
                    <Input
                      id="npnom"
                      value={form.nouveauParentNom}
                      onChange={(e) => set('nouveauParentNom', e.target.value)}
                      disabled={desactive}
                      placeholder="Kouadio"
                    />
                  </Field>
                  <Field label="Prénoms" htmlFor="npprenoms" required>
                    <Input
                      id="npprenoms"
                      value={form.nouveauParentPrenoms}
                      onChange={(e) => set('nouveauParentPrenoms', e.target.value)}
                      disabled={desactive}
                      placeholder="Émile"
                    />
                  </Field>
                  <Field label="Lien de parenté">
                    <Select
                      value={form.nouveauParentLien}
                      onValueChange={(v) => set('nouveauParentLien', v ?? '')}
                      disabled={desactive}
                    >
                      <SelectTrigger id="nplien">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Père">Père</SelectItem>
                        <SelectItem value="Mère">Mère</SelectItem>
                        <SelectItem value="Tuteur">Tuteur</SelectItem>
                        <SelectItem value="Tutrice">Tutrice</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Téléphone" htmlFor="nptel">
                    <Input
                      id="nptel"
                      value={form.nouveauParentTelephone}
                      onChange={(e) => set('nouveauParentTelephone', e.target.value)}
                      disabled={desactive}
                      placeholder="+225 07 00 00 00 00"
                    />
                  </Field>
                  <Field label="Email" htmlFor="npmail">
                    <Input
                      id="npmail"
                      type="email"
                      value={form.nouveauParentEmail}
                      onChange={(e) => set('nouveauParentEmail', e.target.value)}
                      disabled={desactive}
                      placeholder="email@exemple.com"
                    />
                  </Field>
                </>
              )}

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Separator className="my-1" />
                <SectionLabel>Scolarité & financement</SectionLabel>
              </div>

              <Field label="Année scolaire">
                <Input
                  value={options.anneeCourante?.libelle ?? '—'}
                  disabled
                  className="opacity-70"
                />
              </Field>
              <Field label="Classe" required>
                <Select
                  value={form.classeId}
                  onValueChange={(v) => set('classeId', v ?? '')}
                  disabled={desactive}
                >
                  <SelectTrigger id="ins-classe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.classes.map((c) => (
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
                  disabled={desactive}
                />
              </Field>
              <Field label="Statut de l'élève">
                <Select
                  value={form.statut}
                  onValueChange={(v) =>
                    set('statut', v as 'nouveau' | 'inscrit')
                  }
                  disabled={desactive}
                >
                  <SelectTrigger id="ins-statut">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nouveau">Nouvel élève</SelectItem>
                    <SelectItem value="inscrit">Ancien élève</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Frais d'inscription" htmlFor="fi">
                <Input
                  id="fi"
                  type="number"
                  min={0}
                  value={form.fraisInscription}
                  onChange={(e) => set('fraisInscription', Number(e.target.value))}
                  disabled={desactive}
                />
              </Field>
              <Field label="Scolarité" htmlFor="sc">
                <Input
                  id="sc"
                  type="number"
                  min={0}
                  value={form.scolarite}
                  onChange={(e) => set('scolarite', Number(e.target.value))}
                  disabled={desactive}
                />
              </Field>
              <Field label="Réduction" htmlFor="red">
                <Input
                  id="red"
                  type="number"
                  min={0}
                  value={form.reduction}
                  onChange={(e) => set('reduction', Number(e.target.value))}
                  disabled={desactive}
                />
              </Field>
              <Field label="Acompte versé aujourd'hui" htmlFor="acompte">
                <Input
                  id="acompte"
                  type="number"
                  min={0}
                  value={form.acompte}
                  onChange={(e) => set('acompte', Number(e.target.value))}
                  disabled={desactive}
                  placeholder="0"
                />
              </Field>

              {classe ? (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Niveau : {classe.niveau} — Effectif actuel {classe.effectif}/
                  {classe.capacite} — Salle {classe.salle}
                </p>
              ) : null}

              <dl className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/40 p-3 text-sm sm:col-span-2">
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Montant à payer</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {formatFCFA(montantTotal)}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Acompte versé</dt>
                  <dd className="font-medium tabular-nums">
                    {formatFCFA(acompte)}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Solde dû</dt>
                  <dd className="font-medium tabular-nums text-destructive">
                    {formatFCFA(solde)}
                  </dd>
                </div>
              </dl>
            </div>

            {etat === 'erreur' ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{message}</span>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={desactive}
              >
                Annuler
              </Button>
              <Button onClick={soumettre} disabled={!peutSoumettre}>
                {desactive ? (
                  <>
                    <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                    Enregistrement…
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}