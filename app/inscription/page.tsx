'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { validerMotDePasse } from '@/lib/password-policy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function InscriptionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess(false)

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setError('Veuillez saisir votre adresse e-mail.')
      return
    }

    const erreurMdp = validerMotDePasse(password)

    if (erreurMdp) {
      setError(erreurMdp)
      return
    }

    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    /*
     * Si la confirmation e-mail est activée dans Supabase,
     * Supabase crée l'utilisateur mais ne crée pas encore
     * de session utilisable tant que l'adresse n'est pas confirmée.
     */
    if (!data.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    router.replace('/')
    router.refresh()
  }

  if (success) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <CheckCircle2 className="size-7" />
              </div>

              <div>
                <CardTitle className="text-2xl">
                  Vérifiez votre adresse e-mail
                </CardTitle>

                <CardDescription className="mt-2">
                  Un e-mail de confirmation vient d’être envoyé à :
                </CardDescription>

                <p className="mt-3 font-medium break-all">
                  {email.trim().toLowerCase()}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                Cliquez sur le lien reçu par e-mail pour confirmer votre
                compte. Vous pourrez ensuite vous connecter à
                GESTION-SCOLAIRE.
              </div>

              <Button
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Retour à la connexion
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-7" />
            </div>

            <div>
              <CardTitle className="text-2xl">
                Créer un compte
              </CardTitle>

              <CardDescription className="mt-2">
                Créez votre accès à GESTION-SCOLAIRE
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignup} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">
                  Adresse e-mail
                </Label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Mot de passe
                </Label>

                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimum 12 caractères"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-9"
                    required
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  12 caractères minimum avec majuscule, minuscule,
                  chiffre et symbole.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmer le mot de passe
                </Label>

                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Répétez votre mot de passe"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Vous avez déjà un compte ?{' '}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Se connecter
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Votre compte sera activé après confirmation de votre adresse
          e-mail.
        </p>
      </div>
    </main>
  )
}
