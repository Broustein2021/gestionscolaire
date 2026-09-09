'use client'

import { useMemo, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserPlus,
} from 'lucide-react'

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
import { formatFCFA } from '@/lib/data'
import { enregistrerInscription } from '@/lib/enroll-create'
import type { InscriptionOptions } from '@/lib/queries/enrollments'

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

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value || '—'}</span>
    </div>
  )
}

type Props = {
  options: InscriptionOptions
}

export function InscriptionWizard({ options }: Props) {
  const initial = useMemo(() => buildInitial(options), [options])
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Form>(initial)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
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

  const etape1Valide = form.nom.trim() !== '' && form.prenoms.trim() !== ''
  const peutContinuer = step !== 0 || etape1Valide

  function reset() {
    setStep(0)
    setForm(initial)
    setResultat(null)
    setErreur('')
    setEnvoi(false)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  async function soumettre() {
    if (envoi) return
    setErreur('')

    if (!classe) {
      setErreur('Sélectionnez une classe.')
      return
    }

    if (form.parentMode === 'existant' && !form.parentId) {
      setErreur('Sélectionnez un responsable existant.')
      return
    }

    if (
      form.parentMode === 'nouveau' &&
      (form.nouveauParentNom.trim() === '' || form.nouveauParentPrenoms.trim() === '')
    ) {
      setErreur('Le nom et les prénoms du nouveau responsable sont obligatoires.')
      return
    }

    const dateInscription =
      form.dateInscription || new Date().toISOString().slice(0, 10)
    const catInscription =
      options.frais.find((f) => /inscription/i.test(f.nom)) ?? null

    setEnvoi(true)
    const res = await enregistrerInscription({
      schoolId: options.schoolId,
      academicYearId: options.academicYearId,
      anneePrefixe: (
        options.anneeCourante?.libelle ?? String(new Date().getFullYear())
      ).slice(0, 4),
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
    setEnvoi(false)

    if (res.ok) {
      setResultat(res)
    } else {
      setErreur(res.message)
    }
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
        {resultat ? (
          <>
            <DialogHeader>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-5" />
              </div>
              <DialogTitle>Inscription enregistrée</DialogTitle>
              <DialogDescription>
                Le dossier de {form.prenoms} {form.nom} a été créé{' '}
                {resultat.matricule ? `(matricule ${resultat.matricule})` : ''}{' '}
                pour la classe {classe?.nom}. Montant dû : {formatFCFA(montantTotal)} —{' '}
                {acompte > 0
                  ? `acompte ${formatFCFA(acompte)}, solde ${formatFCFA(solde)}`
                  : `solde à payer ${formatFCFA(solde)}`}.
              </DialogDescription>
            </DialogHeader>

            {resultat.avertissement ? (
              <p className="rounded-lg border border-amber-300/40 bg-amber-500/10 p-3 text-xs text-amber-700">
                {resultat.avertissement}
              </p>
            ) : null}

            <p className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
              Dossier créé avec succès et enregistré dans votre base de données
              Supabase. Il apparaîtra dans la liste des inscriptions et dans le
              dossier de l&apos;élève.
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
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={form.parentMode === 'existant' ? 'secondary' : 'outline'}
                      onClick={() => set('parentMode', 'existant')}
                    >
                      Responsable existant
                    </Button>
                    <Button
                      type="button"
                      variant={form.parentMode === 'nouveau' ? 'secondary' : 'outline'}
                      onClick={() => set('parentMode', 'nouveau')}
                    >
                      Nouveau responsable
                    </Button>
                  </div>

                  {form.parentMode === 'existant' ? (
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
                        >
                          <SelectTrigger>
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
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Nom" htmlFor="npnom" required>
                        <Input
                          id="npnom"
                          value={form.nouveauParentNom}
                          onChange={(e) => set('nouveauParentNom', e.target.value)}
                          placeholder="Kouadio"
                        />
                      </Field>
                      <Field label="Prénoms" htmlFor="npprenoms" required>
                        <Input
                          id="npprenoms"
                          value={form.nouveauParentPrenoms}
                          onChange={(e) => set('nouveauParentPrenoms', e.target.value)}
                          placeholder="Émile"
                        />
                      </Field>
                      <Field label="Lien de parenté">
                        <Select
                          value={form.nouveauParentLien}
                          onValueChange={(v) => set('nouveauParentLien', v ?? '')}
                        >
                          <SelectTrigger>
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
                          placeholder="+225 07 00 00 00 00"
                        />
                      </Field>
                      <Field label="Email" htmlFor="npmail">
                        <Input
                          id="npmail"
                          type="email"
                          value={form.nouveauParentEmail}
                          onChange={(e) => set('nouveauParentEmail', e.target.value)}
                          placeholder="email@exemple.com"
                        />
                      </Field>
                    </div>
                  )}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Année scolaire">
                    <Input
                      value={options.anneeCourante?.libelle ?? '—'}
                      disabled
                      className="opacity-70"
                    />
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
                    <Field label="Acompte versé aujourd'hui" htmlFor="acompte">
                      <Input
                        id="acompte"
                        type="number"
                        min={0}
                        value={form.acompte}
                        onChange={(e) => set('acompte', Number(e.target.value))}
                        placeholder="0"
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
                        {formatFCFA(montantTotal)}
                      </span>
                    </div>
                    {acompte > 0 ? (
                      <>
                        <Recap
                          label="Acompte versé"
                          value={`- ${formatFCFA(acompte)}`}
                        />
                        <Recap label="Solde dû" value={formatFCFA(solde)} />
                      </>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Échéancier suggéré : {Math.max(1, Math.ceil(solde / 3)) > 0
                        ? `${Math.ceil(solde / 3) === 0 ? '—' : formatFCFA(Math.round(solde / 3))}`
                        : '—'}{' '}
                      sur 3 versements.
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
                      value={
                        form.parentMode === 'nouveau'
                          ? `${form.nouveauParentPrenoms} ${form.nouveauParentNom} (${form.nouveauParentLien})`
                          : parent
                            ? `${parent.prenoms} ${parent.nom} (${form.lien})`
                            : '—'
                      }
                    />
                    <Recap
                      label="Classe"
                      value={`${classe?.nom ?? ''} — ${classe?.niveau ?? ''}`}
                    />
                    <Recap
                      label="Année scolaire"
                      value={options.anneeCourante?.libelle ?? '—'}
                    />
                    <Recap
                      label="Date d'inscription"
                      value={new Date(form.dateInscription).toLocaleDateString(
                        'fr-FR',
                      )}
                    />
                    <Recap
                      label="Statut"
                      value={
                        form.statut === 'nouveau' ? 'Nouvel élève' : 'Ancien élève'
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Montant à payer</span>
                      <Badge
                        variant="secondary"
                        className="border-transparent bg-primary/10 text-base tabular-nums text-primary"
                      >
                        {formatFCFA(montantTotal)}
                      </Badge>
                    </div>
                    {acompte > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Acompte versé aujourd&apos;hui
                        </span>
                        <span className="font-medium tabular-nums">
                          - {formatFCFA(acompte)}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Solde dû</span>
                      <span className="font-semibold tabular-nums">
                        {formatFCFA(solde)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {erreur ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {erreur}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || envoi}
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
                <Button onClick={soumettre} disabled={envoi}>
                  {envoi ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="size-4" data-icon="inline-start" />
                      Confirmer l&apos;inscription
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}