'use client'

import { FormEvent, useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react'

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

type Status = 'traitement' | 'pret' | 'erreur'

function NewPasswordForm({ email }: { email: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading) return

    setError('')

    if (password.length < 8) {
      setError(
        'Le mot de passe doit contenir au moins 8 caractères.'
      )
      return
    }

    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      router.replace('/login')
      router.refresh()
    } catch {
      setError(
        'Une erreur inattendue est survenue. Veuillez réessayer.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LockKeyhole className="size-6" />
          </div>

          <div>
            <CardTitle className="text-2xl">
              Choisissez un nouveau mot de passe
            </CardTitle>

            <CardDescription className="mt-1">
              Compte : {email}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form
          method="post"
          action="/reinitialiser"
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
            <Label htmlFor="password">
              Nouveau mot de passe
            </Label>

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Au moins 8 caractères"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Confirmer le mot de passe
            </Label>

            <Input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              placeholder="Répétez le mot de passe"
              value={confirmation}
              onChange={(event) =>
                setConfirmation(event.target.value)
              }
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer le mot de passe'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ReinitialiserInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [status, setStatus] = useState<Status>('traitement')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    let cancelled = false

    async function exchange() {
      const code = searchParams.get('code')
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      try {
        const { data, error: sessionError } = code
          ? await supabase.auth.exchangeCodeForSession(code)
          : await supabase.auth.verifyOtp({
              token_hash: tokenHash ?? '',
              type: (type ?? 'recovery') as
                | 'signup'
                | 'invite'
                | 'magiclink'
                | 'recovery'
                | 'email_change'
                | 'email'
                | 'sms'
                | 'phone',
              options: {
                redirectTo: `${window.location.origin}/login`,
              },
            })

        if (cancelled) return

        if (sessionError) {
          setStatus('erreur')
          setError(
            `Lien invalide ou expiré. ${sessionError.message}`
          )
          return
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setEmail(user.email ?? '')
          setStatus('pret')
        } else {
          setStatus('erreur')
          setError(
            'Aucune session active. Le lien est peut-être expiré.'
          )
        }
      } catch {
        if (!cancelled) {
          setStatus('erreur')
          setError(
            'Une erreur inattendue est survenue. Veuillez réessayer.'
          )
        }
      }
    }

    exchange()

    return () => {
      cancelled = true
    }
  }, [searchParams, supabase])

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {status === 'traitement' && (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span>Vérification du lien…</span>
            </CardContent>
          </Card>
        )}

        {status === 'pret' && <NewPasswordForm email={email} />}

        {status === 'erreur' && (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-5 py-8">
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Demandez un nouveau lien sur la page{' '}
                <Link
                  href="/mot-de-passe-oublie"
                  className="font-medium text-primary hover:underline"
                >
                  Mot de passe oublié
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          <span>Accès sécurisé par Supabase Auth</span>
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
          <p className="text-muted-foreground">Chargement…</p>
        </main>
      }
    >
      <ReinitialiserInner />
    </Suspense>
  )
}