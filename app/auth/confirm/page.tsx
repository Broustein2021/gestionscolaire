'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

function ConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as
    | 'signup'
    | 'invite'
    | 'magiclink'
    | 'recovery'
    | 'email_change'
    | 'email'
    | 'sms'
    | 'phone'
    | 'phone_change'
    | null
  const next = searchParams.get('next')
  const hasCredentials = !!tokenHash && !!type

  const [status, setStatus] = useState<
    'confirmation' | 'erreur'
  >(hasCredentials ? 'confirmation' : 'erreur')
  const [error, setError] = useState(
    hasCredentials
      ? ''
      : 'Lien de confirmation invalide ou expiré.'
  )

  useEffect(() => {
    if (!hasCredentials) return

    const token = tokenHash
    const otpType = type

    let cancelled = false

    async function confirm() {
      try {
        const { error: confirmError } =
          await supabase.auth.verifyOtp({
            token_hash: token,
            type: otpType,
            options: {
              redirectTo: `${
                window.location.origin
              }${next ?? '/'}`,
            },
          })

        if (cancelled) return

        if (confirmError) {
          setStatus('erreur')
          setError(
            `La confirmation a échoué. ${confirmError.message}`
          )
          return
        }

        router.replace(next ?? '/')
        router.refresh()
      } catch {
        if (!cancelled) {
          setStatus('erreur')
          setError(
            'Une erreur inattendue est survenue. Veuillez réessayer.'
          )
        }
      }
    }

    confirm()

    return () => {
      cancelled = true
    }
  }, [searchParams, supabase, router, hasCredentials, tokenHash, type, next])

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {status === 'confirmation' && (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span>Confirmation du compte…</span>
            </CardContent>
          </Card>
        )}

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
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Retour à la connexion
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

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
          <p className="text-muted-foreground">Chargement…</p>
        </main>
      }
    >
      <ConfirmInner />
    </Suspense>
  )
}