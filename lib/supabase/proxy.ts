import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  /*
   * ============================================================
   * 1. UTILISATEUR NON AUTHENTIFIÉ
   * ============================================================
   */

  if (!user) {
    const publicRoutes = [
      '/login',
      '/inscription',
      '/auth',
      '/mot-de-passe-oublie',
      '/reinitialiser',
    ]

    const isPublicRoute = publicRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`)
    )

    if (!isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'

      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  /*
   * ============================================================
   * 2. UTILISATEUR AUTHENTIFIÉ
   * ============================================================
   *
   * On cherche d'abord son profil.
   *
   * IMPORTANT :
   * On utilise user.id provenant de Supabase Auth.
   * On ne fait jamais confiance à un user_id envoyé par le navigateur.
   */

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, is_platform_admin')
    .eq('user_id', user.id)
    .maybeSingle()

  /*
   * ============================================================
   * 3. NOUVEL UTILISATEUR
   * ============================================================
   *
   * Un compte Auth peut exister avant que le profil soit créé.
   *
   * Dans ce cas, il doit obligatoirement passer par onboarding.
   */

  if (profileError || !profile) {
    if (
      pathname !== '/onboarding' &&
      !pathname.startsWith('/auth')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'

      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  /*
   * ============================================================
   * 4. ADMINISTRATEUR PLATEFORME
   * ============================================================
   *
   * Un administrateur plateforme peut accéder directement
   * à l'application même sans école.
   */

  if (profile.is_platform_admin === true) {
    if (pathname === '/onboarding') {
      const url = request.nextUrl.clone()
      url.pathname = '/'

      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  /*
   * ============================================================
   * 5. VÉRIFICATION DE L'ÉTABLISSEMENT
   * ============================================================
   */

  const { data: membership, error: membershipError } =
    await supabase
      .from('school_members')
      .select('id, school_id, role, status')
      .eq('profile_id', profile.id)
      .maybeSingle()

  /*
   * ============================================================
   * 6. UTILISATEUR SANS ÉTABLISSEMENT
   * ============================================================
   *
   * Il est connecté mais n'a pas encore créé/rejoint
   * d'établissement.
   */

  if (
    membershipError ||
    !membership ||
    membership.status !== 'active'
  ) {
    if (
      pathname !== '/onboarding' &&
      !pathname.startsWith('/auth')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'

      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  /*
   * ============================================================
   * 7. UTILISATEUR AYANT DÉJÀ UN ÉTABLISSEMENT
   * ============================================================
   *
   * Il ne doit plus rester bloqué sur onboarding.
   */

  if (pathname === '/onboarding') {
    const url = request.nextUrl.clone()
    url.pathname = '/'

    return NextResponse.redirect(url)
  }

  return supabaseResponse
}