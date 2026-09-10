'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
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

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading) return

    setError('')
    setLoading(true)

    try {
      const cleanEmail = email.trim()

      if (!cleanEmail || !password) {
        setError('Veuillez renseigner votre adresse e-mail et votre mot de passe.')
        return
      }

      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

      if (authError) {
        console.error('Erreur de connexion Supabase :', authError)

        if (authError.message === 'Invalid login credentials') {
          setError('Adresse e-mail ou mot de passe incorrect.')
        } else {
          setError(authError.message)
        }

        return
      }

      /*
       * La session Supabase est maintenant créée.
       *
       * On laisse le proxy / middleware et le contexte de l'application
       * déterminer la destination :
       *
       * - utilisateur connecté sans école → /onboarding
       * - utilisateur connecté avec une école → /
       *
       * On ne transmet JAMAIS l'e-mail ou le mot de passe dans l'URL.
       */
      router.replace('/')
      router.refresh()
    } catch (err) {
      console.error('Erreur inattendue lors de la connexion :', err)

      setError(
        'Une erreur inattendue est survenue. Veuillez réessayer.'
      )
    } finally {
      setLoading(false)
    }
  }

  const initials =
    email.trim().length > 0
      ? email
          .trim()
          .split('@')[0]
          .slice(0, 2)
          .toUpperCase()
      : 'GS'

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="size-6" />
              </div>

              <div>
                <CardTitle className="text-2xl">
                  GESTION-SCOLAIRE
                </CardTitle>

                <CardDescription className="mt-1">
                  Connectez-vous à votre espace de gestion
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form
              method="post"
              action="/login"
              onSubmit={handleLogin}
              className="space-y-5"
              autoComplete="on"
            >
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
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
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    className="pl-9"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    Mot de passe
                  </Label>

                  <Link
                    href="/mot-de-passe-oublie"
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    className="pl-9"
                    required
                    disabled={loading}
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
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Vous n’avez pas encore de compte ?{' '}

                <Link
                  href="/inscription"
                  className="font-medium text-primary hover:underline"
                >
                  Créer un compte
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          <span>Accès sécurisé par Supabase Auth</span>
        </div>
      </div>
    </main>
  )
}
