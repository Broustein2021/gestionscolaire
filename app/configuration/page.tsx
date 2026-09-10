'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  School,
  ShieldCheck,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

const schoolTypes = [
  { value: 'primaire', label: 'École primaire' },
  { value: 'secondaire', label: 'Établissement secondaire' },
  { value: 'primaire_secondaire', label: 'Primaire et secondaire' },
  { value: 'lycee', label: 'Lycée' },
  { value: 'autre', label: 'Autre' },
]

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

export default function ConfigurationPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    organizationName: '',
    schoolName: '',
    schoolType: 'primaire_secondaire',
    shortName: '',
    address: '',
    city: '',
    commune: '',
    phone: '',
    schoolEmail: '',
  })

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')

    if (!form.fullName.trim()) {
      setError('Veuillez renseigner votre nom complet.')
      return
    }

    if (!form.organizationName.trim()) {
      setError('Veuillez renseigner le nom de l’organisation.')
      return
    }

    if (!form.schoolName.trim()) {
      setError('Veuillez renseigner le nom de l’établissement.')
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'Votre session a expiré. Veuillez vous reconnecter.'
        )
      }

      const { error: rpcError } = await supabase.rpc(
        'create_initial_school',
        {
          p_organization_name: form.organizationName.trim(),
          p_school_name: form.schoolName.trim(),
          p_school_type: form.schoolType,
          p_short_name: form.shortName.trim() || null,
          p_address: form.address.trim() || null,
          p_city: form.city.trim() || null,
          p_commune: form.commune.trim() || null,
          p_phone: form.phone.trim() || null,
          p_school_email: form.schoolEmail.trim() || null,
          p_full_name: form.fullName.trim(),
        }
      )

      if (rpcError) {
        if (rpcError.message.includes('USER_ALREADY_HAS_SCHOOL')) {
          router.replace('/')
          return
        }

        throw new Error(
          rpcError.message || 'Impossible de créer l’établissement.'
        )
      }

      router.replace('/')
      router.refresh()
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la configuration.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <School className="size-7" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Configurez votre établissement
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Quelques informations suffisent pour créer votre espace
            de gestion scolaire.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Colonne principale */}
            <div className="space-y-6 lg:col-span-2">
              {/* Organisation */}
              <section className="rounded-xl border bg-background p-6 shadow-sm">
                <div className="mb-6 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Organisation</h2>
                    <p className="text-sm text-muted-foreground">
                      Informations générales de votre structure.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <Field label="Nom de l’organisation" htmlFor="organizationName" required>
                    <Input
                      id="organizationName"
                      value={form.organizationName}
                      onChange={(e) =>
                        updateField('organizationName', e.target.value)
                      }
                      placeholder="Ex. Groupe Scolaire Excellence"
                      required
                    />
                  </Field>
                </div>
              </section>

              {/* Établissement */}
              <section className="rounded-xl border bg-background p-6 shadow-sm">
                <div className="mb-6 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <School className="size-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Établissement</h2>
                    <p className="text-sm text-muted-foreground">
                      Informations qui apparaîtront dans votre espace
                      scolaire.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Nom de l’établissement" htmlFor="schoolName" required>
                      <Input
                        id="schoolName"
                        value={form.schoolName}
                        onChange={(e) =>
                          updateField('schoolName', e.target.value)
                        }
                        placeholder="Ex. Groupe Scolaire Excellence"
                        required
                      />
                    </Field>
                  </div>

                  <Field label="Nom court" htmlFor="shortName">
                    <Input
                      id="shortName"
                      value={form.shortName}
                      onChange={(e) =>
                        updateField('shortName', e.target.value)
                      }
                      placeholder="Ex. GSE"
                    />
                  </Field>

                  <Field label="Type d’établissement" htmlFor="schoolType" required>
                    <Select
                      value={form.schoolType}
                      onValueChange={(v) =>
                        updateField('schoolType', v ?? 'primaire_secondaire')
                      }
                    >
                      <SelectTrigger id="schoolType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Ville" htmlFor="city">
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Ex. Abidjan"
                    />
                  </Field>

                  <Field label="Commune" htmlFor="commune">
                    <Input
                      id="commune"
                      value={form.commune}
                      onChange={(e) => updateField('commune', e.target.value)}
                      placeholder="Ex. Cocody"
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Adresse" htmlFor="address">
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="address"
                          value={form.address}
                          onChange={(e) => updateField('address', e.target.value)}
                          placeholder="Adresse complète"
                          className="pl-8"
                        />
                      </div>
                    </Field>
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section className="rounded-xl border bg-background p-6 shadow-sm">
                <div className="mb-6 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Phone className="size-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Coordonnées</h2>
                    <p className="text-sm text-muted-foreground">
                      Informations de contact de l’établissement.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Téléphone" htmlFor="phone">
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className="pl-8"
                      />
                    </div>
                  </Field>

                  <Field label="Email de l’établissement" htmlFor="schoolEmail">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="schoolEmail"
                        type="email"
                        value={form.schoolEmail}
                        onChange={(e) =>
                          updateField('schoolEmail', e.target.value)
                        }
                        placeholder="contact@ecole.ci"
                        className="pl-8"
                      />
                    </div>
                  </Field>
                </div>
              </section>
            </div>

            {/* Colonne droite */}
            <aside className="space-y-6">
              <section className="rounded-xl border bg-background p-6 shadow-sm">
                <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="size-5" />
                </div>

                <h2 className="font-semibold">Administrateur</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Ces informations seront associées à votre compte
                  administrateur.
                </p>

                <div className="mt-5">
                  <Field label="Nom complet" htmlFor="fullName" required>
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      placeholder="Jean Marie BROU"
                      required
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-xl border bg-primary/5 p-6">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />

                  <div>
                    <h3 className="font-semibold">Votre espace est sécurisé</h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Vous serez automatiquement enregistré comme
                      administrateur principal de l’établissement.
                    </p>
                  </div>
                </div>
              </section>

              {error ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    Créer mon établissement
                    <ArrowRight className="size-4" data-icon="inline-end" />
                  </>
                )}
              </Button>
            </aside>
          </div>
        </form>
      </div>
    </main>
  )
}