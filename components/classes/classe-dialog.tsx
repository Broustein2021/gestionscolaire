'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { creerClasse, modifierClasse } from '@/lib/classes-create'
import type { Classe } from '@/lib/queries/classes'
import type { ClasseOptions } from '@/lib/queries/class-options'

type Cycle = 'Primaire' | 'Collège' | 'Lycée'
type EtatFormulaire = 'saisie' | 'envoi' | 'succes' | 'erreur'

const CYCLES: Cycle[] = ['Primaire', 'Collège', 'Lycée']
const AUTRE = '__autre'
const AUCUN = '__aucun'

export function ClasseDialog({
  options,
  classe,
  trigger,
}: {
  options: ClasseOptions | null
  classe?: Classe | null
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [etat, setEtat] = useState<EtatFormulaire>('saisie')
  const [message, setMessage] = useState('')

  const [nom, setNom] = useState('')
  const [cycle, setCycle] = useState<Cycle>('Primaire')
  const [niveauSel, setNiveauSel] = useState<string>(AUTRE)
  const [niveauAutre, setNiveauAutre] = useState('')
  const [salle, setSalle] = useState('')
  const [capacite, setCapacite] = useState('40')
  const [headTeacherId, setHeadTeacherId] = useState<string>(AUCUN)

  const edition = Boolean(classe)

  function reinitialiser() {
    const c = classe
    setNom(c?.nom ?? '')
    setCycle(c?.cycle ?? 'Primaire')
    const niveauxCycle = (options?.niveaux ?? []).filter((n) => n.cycle === (c?.cycle ?? 'Primaire'))
    const matchNiveau = c ? niveauxCycle.find((n) => n.code === c.niveau) : undefined
    setNiveauSel(matchNiveau?.id ?? AUTRE)
    setNiveauAutre(c && !matchNiveau ? c.niveau : '')
    setSalle(c && c.salle !== '—' ? c.salle : '')
    setCapacite(String(c?.capacite ?? 40))
    setHeadTeacherId(c?.profPrincipalId ?? AUCUN)
    setEtat('saisie')
    setMessage('')
  }

  const niveauxCycle = (options?.niveaux ?? []).filter((n) => n.cycle === cycle)
  const showNiveauAutre = niveauSel === AUTRE || niveauxCycle.length === 0

  async function enregistrer() {
    if (!options) return
    const niveauLabel =
      niveauSel === AUTRE ? niveauAutre.trim() : (niveauxCycle.find((n) => n.id === niveauSel)?.code ?? '')
    const input = {
      schoolId: options.schoolId,
      academicYearId: options.academicYearId,
      nom: nom.trim(),
      cycle,
      niveauLabel,
      levelId: niveauSel === AUTRE ? null : niveauSel,
      capacite: Number.parseInt(capacite, 10) || 40,
      salle,
      headTeacherId: headTeacherId === AUCUN ? null : headTeacherId,
    }

    setEtat('envoi')
    setMessage('')
    const res = edition && classe
      ? await modifierClasse(classe.id, input)
      : await creerClasse(input)

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
          <DialogTitle>{classe ? `Modifier la classe — ${classe.nom}` : 'Nouvelle classe'}</DialogTitle>
          <DialogDescription>
            Identification, effectif autorisé et professeur principal.
          </DialogDescription>
        </DialogHeader>

        {etat === 'succes' ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 py-6 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="font-medium">{edition ? 'Classe modifiée' : 'Classe créée'}</p>
            <p className="text-sm text-muted-foreground">{nom.trim()}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-nom">Nom de la classe</Label>
              <Input
                id="cl-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                disabled={desactive}
                placeholder="Ex. 6e A"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-cycle">Cycle</Label>
              <Select
                value={cycle}
                onValueChange={(v) => {
                  const nouveau = v as Cycle
                  setCycle(nouveau)
                  const niveaux = (options?.niveaux ?? []).filter((n) => n.cycle === nouveau)
                  setNiveauSel(niveaux[0]?.id ?? AUTRE)
                  setNiveauAutre('')
                }}
                disabled={desactive}
              >
                <SelectTrigger id="cl-cycle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="cl-niveau">Niveau</Label>
              {niveauxCycle.length > 0 ? (
                <Select
                  value={niveauSel}
                  onValueChange={(v) => setNiveauSel(v ?? AUTRE)}
                  disabled={desactive}
                >
                  <SelectTrigger id="cl-niveau">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveauxCycle.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.code}
                      </SelectItem>
                    ))}
                    <SelectItem value={AUTRE}>Autre niveau…</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {showNiveauAutre ? (
                <Input
                  id="cl-niveau-libre"
                  value={niveauAutre}
                  onChange={(e) => setNiveauAutre(e.target.value)}
                  disabled={desactive}
                  placeholder={cycle === 'Primaire' ? 'Ex. CE1' : 'Ex. 4e'}
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-capacite">Capacité (places)</Label>
              <Input
                id="cl-capacite"
                type="number"
                min={1}
                max={200}
                value={capacite}
                onChange={(e) => setCapacite(e.target.value)}
                disabled={desactive}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cl-salle">Salle</Label>
              <Input
                id="cl-salle"
                value={salle}
                onChange={(e) => setSalle(e.target.value)}
                disabled={desactive}
                placeholder="Ex. Salle 12"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="cl-prof">Professeur principal</Label>
              <Select
                value={headTeacherId}
                onValueChange={(v) => setHeadTeacherId(v ?? AUCUN)}
                disabled={desactive}
              >
                <SelectTrigger id="cl-prof">
                  <SelectValue placeholder="Non affecté" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUCUN}>Non affecté</SelectItem>
                  {options?.enseignants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.prenoms} {t.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={desactive || !options || !nom.trim() || (niveauSel === AUTRE && !niveauAutre.trim())}
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