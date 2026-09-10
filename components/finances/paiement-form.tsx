'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Loader2, Receipt } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { formatFCFA, modesPaiement } from '@/lib/data'
import {
  enregistrerPaiement,
  type PaiementEnregistre,
} from '@/lib/payments-create'
import type { FinancesOptions } from '@/lib/queries/finances'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: FinancesOptions
  eleveIdParDefaut?: string
  onSuccess: (paiement: PaiementEnregistre) => void
}

export function PaiementForm({
  open,
  onOpenChange,
  options,
  eleveIdParDefaut,
  onSuccess,
}: Props) {
  const [eleveId, setEleveId] = useState(eleveIdParDefaut ?? options.eleves[0]?.id ?? '')
  const [categorieId, setCategorieId] = useState(options.categories[0]?.id ?? '')
  const [montant, setMontant] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [mode, setMode] = useState<string>(modesPaiement[0])
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const eleve = options.eleves.find((e) => e.id === eleveId)
  const categorie = options.categories.find((c) => c.id === categorieId)

  const libellesEleves = useMemo(
    () =>
      Object.fromEntries(
        options.eleves.map((e) => [
          e.id,
          `${e.nom} ${e.prenoms} — ${e.classeNom ?? '—'}`,
        ]),
      ),
    [options.eleves],
  )

  const situation = useMemo(() => {
    if (!eleve) return null
    const nouveau = Number(montant) || 0
    const reste = Math.max(0, eleve.montantDu - eleve.montantPaye)
    return {
      montantDu: eleve.montantDu,
      dejaPaye: eleve.montantPaye,
      reste,
      nouveau,
      resteApres: Math.max(0, reste - nouveau),
    }
  }, [eleve, montant])

  function reinitialiser() {
    setMontant('')
    setReference('')
    setNotes('')
    setErreur(null)
  }

  async function handleSubmit() {
    if (envoi) return
    const valeur = Number(montant)
    if (!eleveId) {
      setErreur('Sélectionnez un élève.')
      return
    }
    if (!Number.isFinite(valeur) || valeur <= 0) {
      setErreur('Saisissez un montant supérieur à 0.')
      return
    }
    if (!date) {
      setErreur('La date du paiement est obligatoire.')
      return
    }

    setErreur(null)
    setEnvoi(true)

    const motif = notes.trim()
      ? `${categorie?.nom ?? 'Frais'} — ${notes.trim()}`
      : (categorie?.nom ?? 'Frais divers')

    const res = await enregistrerPaiement({
      schoolId: options.schoolId,
      academicYearId: options.academicYearId,
      studentId: eleveId,
      feeCategoryId: categorieId || null,
      amount: valeur,
      date,
      method: mode,
      reference: reference.trim() || undefined,
      motif,
    })
    setEnvoi(false)

    if (res.ok) {
      reinitialiser()
      onSuccess(res.paiement)
    } else {
      setErreur(res.message)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reinitialiser()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>
            Les paiements partiels sont acceptés : le solde est recalculé
            automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="paiement-eleve">Élève</Label>
            <Select
              value={eleveId}
              onValueChange={(v) => setEleveId(v as string)}
            >
              <SelectTrigger id="paiement-eleve" className="w-full">
                <SelectValue placeholder="Sélectionner un élève" />
              </SelectTrigger>
              <SelectContent>
                {options.eleves.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {libellesEleves[e.id]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {situation ? (
            <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-sm sm:grid-cols-4">
              <div className="flex flex-col">
                <dt className="text-xs text-muted-foreground">Montant dû</dt>
                <dd className="font-medium tabular-nums">
                  {formatFCFA(situation.montantDu)}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs text-muted-foreground">Déjà payé</dt>
                <dd className="font-medium tabular-nums text-primary">
                  {formatFCFA(situation.dejaPaye)}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs text-muted-foreground">Reste dû</dt>
                <dd className="font-medium tabular-nums">
                  {formatFCFA(situation.reste)}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs text-muted-foreground">Après paiement</dt>
                <dd className="font-medium tabular-nums text-destructive">
                  {formatFCFA(situation.resteApres)}
                </dd>
              </div>
            </dl>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paiement-categorie">Catégorie de frais</Label>
              <Select
                value={categorieId}
                onValueChange={(v) => setCategorieId(v as string)}
              >
                <SelectTrigger id="paiement-categorie" className="w-full">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {options.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom} — {formatFCFA(c.montant)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paiement-montant">Montant encaissé (FCFA)</Label>
              <Input
                id="paiement-montant"
                type="number"
                min={0}
                inputMode="numeric"
                value={montant}
                onChange={(e) => {
                  setMontant(e.target.value)
                  setErreur(null)
                }}
                placeholder={String(categorie?.montant ?? 0)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paiement-date">Date du paiement</Label>
              <Input
                id="paiement-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paiement-mode">Mode de paiement</Label>
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as (typeof modesPaiement)[number])}
              >
                <SelectTrigger id="paiement-mode" className="w-full">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  {modesPaiement.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="paiement-reference">
                Référence (transaction, chèque, virement)
              </Label>
              <Input
                id="paiement-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="MM-88213, CHQ-002145..."
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="paiement-notes">Observation</Label>
              <Input
                id="paiement-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="2e échéance, règlement partiel..."
              />
            </div>
          </div>

          {erreur ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{erreur}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={envoi}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={envoi}>
            {envoi ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Receipt className="size-4" data-icon="inline-start" />
                Enregistrer et générer le reçu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}