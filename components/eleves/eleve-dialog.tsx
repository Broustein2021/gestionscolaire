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
import {
  modifierEleve,
  type EleveUpdateInput,
} from '@/lib/eleves-update'
import type { EleveDetail } from '@/lib/queries/eleves'

type EtatFormulaire = 'saisie' | 'envoi' | 'succes' | 'erreur'

const STATUTS = ['inscrit', 'nouveau', 'archive', 'radie', 'transfere'] as const

const statutLibelle: Record<(typeof STATUTS)[number], string> = {
  inscrit: 'Inscrit',
  nouveau: 'Nouveau',
  archive: 'Archivé',
  radie: 'Radié',
  transfere: 'Transféré',
}

export function EleveEditDialog({
  eleve,
  trigger,
}: {
  eleve: EleveDetail
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [etat, setEtat] = useState<EtatFormulaire>('saisie')
  const [message, setMessage] = useState('')

  const [prenoms, setPrenoms] = useState(eleve.prenoms)
  const [nom, setNom] = useState(eleve.nom)
  const [sexe, setSexe] = useState<'M' | 'F'>(eleve.sexe)
  const [nationalite, setNationalite] = useState(eleve.nationalite)
  const [telephone, setTelephone] = useState(eleve.telephone ?? '')
  const [adresse, setAdresse] = useState(eleve.adresse ?? '')
  const [dateNaissance, setDateNaissance] = useState(eleve.dateNaissance ?? '')
  const [lieuNaissance, setLieuNaissance] = useState(eleve.lieuNaissance ?? '')
  const [statut, setStatut] = useState<(typeof STATUTS)[number]>(
    STATUTS.includes(eleve.statut as (typeof STATUTS)[number])
      ? (eleve.statut as (typeof STATUTS)[number])
      : 'inscrit',
  )

  async function enregistrer() {
    const input: EleveUpdateInput = {
      schoolId: eleve.schoolId,
      prenoms,
      nom,
      sexe,
      nationalite: nationalite || '—',
      telephone,
      adresse,
      dateNaissance,
      lieuNaissance,
      statut,
    }

    setEtat('envoi')
    setMessage('')
    const res = await modifierEleve(eleve.id, input)

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
        if (next) {
          setPrenoms(eleve.prenoms)
          setNom(eleve.nom)
          setSexe(eleve.sexe)
          setNationalite(eleve.nationalite)
          setTelephone(eleve.telephone ?? '')
          setAdresse(eleve.adresse ?? '')
          setDateNaissance(eleve.dateNaissance ?? '')
          setLieuNaissance(eleve.lieuNaissance ?? '')
        }
        setOpen(next)
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Modifier l’élève — {eleve.prenoms} {eleve.nom}
          </DialogTitle>
          <DialogDescription>
            Identité, coordonnées et statut (matricule et affectation inchangées).
          </DialogDescription>
        </DialogHeader>

        {etat === 'succes' ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 py-6 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="font-medium">Élève modifié</p>
            <p className="text-sm text-muted-foreground">
              {prenoms.trim()} {nom.trim()}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="el-prenoms">Prénom(s)</Label>
              <Input
                id="el-prenoms"
                value={prenoms}
                onChange={(e) => setPrenoms(e.target.value)}
                disabled={desactive}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="el-nom">Nom</Label>
              <Input
                id="el-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                disabled={desactive}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="el-sexe">Sexe</Label>
              <Select
                value={sexe}
                items={{ M: 'Masculin', F: 'Féminin' }}
                onValueChange={(v) => setSexe(v as 'M' | 'F')}
                disabled={desactive}
              >
                <SelectTrigger id="el-sexe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="el-nationalite">Nationalité</Label>
              <Input
                id="el-nationalite"
                value={nationalite}
                onChange={(e) => setNationalite(e.target.value)}
                disabled={desactive}
                placeholder="Ivoirienne"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="el-naissance">Date de naissance</Label>
              <Input
                id="el-naissance"
                type="date"
                value={dateNaissance ?? ''}
                onChange={(e) => setDateNaissance(e.target.value)}
                disabled={desactive}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="el-lieu">Lieu de naissance</Label>
              <Input
                id="el-lieu"
                value={lieuNaissance ?? ''}
                onChange={(e) => setLieuNaissance(e.target.value)}
                disabled={desactive}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="el-tel">Téléphone</Label>
              <Input
                id="el-tel"
                value={telephone ?? ''}
                onChange={(e) => setTelephone(e.target.value)}
                disabled={desactive}
                placeholder="+225 ..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="el-adresse">Adresse</Label>
              <Input
                id="el-adresse"
                value={adresse ?? ''}
                onChange={(e) => setAdresse(e.target.value)}
                disabled={desactive}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="el-statut">Statut</Label>
              <Select
                value={statut}
                items={statutLibelle}
                onValueChange={(v) => setStatut(v as (typeof STATUTS)[number])}
                disabled={desactive}
              >
                <SelectTrigger id="el-statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statutLibelle[s]}
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
                setEtat('saisie')
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
                disabled={desactive || !prenoms.trim() || !nom.trim()}
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