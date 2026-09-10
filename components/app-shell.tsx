"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Topbar } from "@/components/topbar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SchoolProvider, useSchool } from "@/components/school-provider"

function ProtectedAppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { loading, school } = useSchool()

  useEffect(() => {
    if (loading) return

    if (!school && pathname !== "/onboarding") {
      router.replace("/onboarding")
    }
  }, [loading, school, pathname, router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">
            Chargement de votre établissement...
          </p>
        </div>
      </main>
    )
  }

  if (!school) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">
          Redirection vers la création de votre établissement...
        </p>
      </main>
    )
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          <Topbar />

          <main className="flex flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isStandaloneRoute =
    pathname === "/login" ||
    pathname === "/inscription" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding")

  if (isStandaloneRoute) {
    return <>{children}</>
  }

  return (
    <SchoolProvider>
      <ProtectedAppShell>{children}</ProtectedAppShell>
    </SchoolProvider>
  )
}
