'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, MailCheck, ShieldCheck } from 'lucide-react'

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

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading) return

    setError('')
    setLoading(true)

    try {
      const cleanEmail = email.trim()

      if (!cleanEmail) {
        setError(
          'Veuillez renseigner votre adresse e-mail pour recevoir les instructions.'
        )
        return
      }

      const { error: authError } =
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reinitialiser`,
        })

      if (authError) {
        setError(authError.message)
        return
      }

      setSent(true)
    } catch {
      setError(
        'Une erreur inattendue est survenue. Veuillez réessayer.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
        <div className="w-full max-w-md">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MailCheck className="size-6" />
                </div>

                <div>
                  <CardTitle className="text-2xl">
                    Instructions envoyées
                  </CardTitle>

                  <CardDescription className="mt-1">
                    Vérifiez votre boîte de réception
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Si une adresse correspond à un compte, un lien de
                réinitialisation vient d'être envoyé à{' '}
                <span className="font-medium text-foreground">
                  {email.trim()}
                </span>
                . Pensez à consulter vos courriers indésirables.
              </p>

              <div className="text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Retour à la connexion
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

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
                  Mot de passe oublié
                </CardTitle>

                <CardDescription className="mt-1">
                  Recevez un lien pour réinitialiser votre mot de
                  passe
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form
              method="post"
              action="/mot-de-passe-oublie"
              onSubmit={handleSubmit}
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
                    autoComplete="email"
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Recevoir les instructions'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Retour à la connexion
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