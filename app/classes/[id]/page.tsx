import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, CalendarCheck, DoorOpen, Gauge, Users } from 'lucide-react'

import { LinkButton } from '@/components/link-button'
import { PaymentBadge } from '@/components/payment-badge'
import { StatCard } from '@/components/stat-card'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getClassDetail } from '@/lib/queries/classes'

export default async function FicheClassePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const classe = await getClassDetail(id)
  if (!classe) notFound()

  const taux = classe.capacite > 0 ? Math.round((classe.effectif / classe.capacite) * 100) : 0
  const notes = classe.eleves.filter((e) => e.moyenne > 0)
  const moyenneClasse =
    notes.length > 0 ? notes.reduce((s, e) => s + e.moyenne, 0) / notes.length : 0

  return (
    <>
      <div className="flex items-center gap-2">
        <LinkButton href="/classes" variant="ghost" size="sm">
          <ArrowLeft className="size-4" data-icon="inline-start" />
          Classes
        </LinkButton>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{classe.nom}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{classe.cycle}</Badge>
              <Badge variant="outline">Niveau {classe.niveau}</Badge>
              <Badge variant="outline" className="gap-1.5">
                <DoorOpen className="size-3.5" />
                Salle {classe.salle}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                  {classe.profPrincipalNom
                    ? classe.profPrincipalNom
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : '—'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Professeur principal</span>
                <span className="text-sm font-medium">
                  {classe.profPrincipalNom ?? 'Non affecté'}
                </span>
              </div>
            </div>
            <LinkButton href={`/assiduite?classe=${classe.id}`} variant="outline">
              <CalendarCheck className="size-4" data-icon="inline-start" />
              Pointer la présence
            </LinkButton>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Effectif"
          value={`${classe.effectif} / ${classe.capacite}`}
          hint={`${classe.capacite - classe.effectif} places disponibles`}
          icon={Users}
        />
        <StatCard label="Taux d'occupation" value={`${taux}%`} icon={Gauge} accent="sky" />
        <StatCard
          label="Matières enseignées"
          value={classe.matieres.length}
          icon={BookOpen}
          accent="amber"
        />
        <StatCard
          label="Moyenne de classe"
          value={moyenneClasse > 0 ? `${moyenneClasse.toFixed(2)}/20` : '—'}
          hint={`${notes.length} élève(s) noté(s)`}
          icon={BookOpen}
          accent="rose"
        />
      </div>

      <Tabs defaultValue="eleves" className="gap-4">
        <TabsList>
          <TabsTrigger value="eleves">Élèves</TabsTrigger>
          <TabsTrigger value="matieres">Matières & enseignants</TabsTrigger>
          <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
        </TabsList>

        <TabsContent value="eleves">
          <Card>
            <CardHeader>
              <CardTitle>Liste des élèves</CardTitle>
              <CardDescription>
                {classe.eleves.length} élève(s) inscrit(s) dans cette classe
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {classe.eleves.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Aucun élève affecté"
                  description="Affectez des élèves à cette classe depuis le module Inscriptions."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Élève</TableHead>
                        <TableHead>Matricule</TableHead>
                        <TableHead className="text-right">Moyenne</TableHead>
                        <TableHead>Paiement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classe.eleves.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <Link
                              href={`/eleves/${e.id}`}
                              className="font-medium underline-offset-4 hover:underline"
                            >
                              {e.prenoms} {e.nom}
                            </Link>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{e.matricule}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {e.moyenne > 0 ? `${e.moyenne.toFixed(2)}/20` : '—'}
                          </TableCell>
                          <TableCell>
                            <PaymentBadge statut={e.statutPaiement} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matieres">
          <Card>
            <CardHeader>
              <CardTitle>Matières du cycle {classe.cycle}</CardTitle>
              <CardDescription>Coefficients et enseignants affectés à cette classe</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matière</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-center">Coef.</TableHead>
                      <TableHead>Enseignant(s)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classe.matieres.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.nom}</TableCell>
                        <TableCell className="font-mono text-xs">{m.code}</TableCell>
                        <TableCell className="text-center tabular-nums">{m.coefficient}</TableCell>
                        <TableCell className="text-muted-foreground">{m.enseignants}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations">
          <Card>
            <CardHeader>
              <CardTitle>Évaluations de la classe</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {classe.evaluations.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Aucune évaluation planifiée"
                  description="Créez une évaluation depuis le module Évaluations."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Libellé</TableHead>
                        <TableHead>Matière</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">Barème</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classe.evaluations.map((ev) => (
                        <TableRow key={ev.id}>
                          <TableCell className="font-medium">{ev.libelle}</TableCell>
                          <TableCell>{ev.matiereNom}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {ev.date ? new Date(ev.date).toLocaleDateString('fr-FR') : '—'}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">/{ev.bareme}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
