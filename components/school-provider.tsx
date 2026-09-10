"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { createClient } from "@/lib/supabase/client"

type School = {
  id: string
  organization_id: string
  name: string
  short_name: string | null
  type: string
  address: string | null
  city: string | null
  commune: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  currency_code: string
  is_active: boolean
}

type Organization = {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  country_code: string
  subscription_status: string
  trial_ends_at: string | null
  plan_code: string | null
}

type AcademicYear = {
  id: string
  label: string
  starts_on: string | null
  ends_on: string | null
  status: string
  is_current: boolean
}

type SchoolContextValue = {
  loading: boolean
  school: School | null
  organization: Organization | null
  role: string | null
  academicYears: AcademicYear[]
  currentAcademicYear: AcademicYear | null
  refresh: () => Promise<void>
}

const SchoolContext = createContext<SchoolContextValue | undefined>(
  undefined,
)

export function SchoolProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [school, setSchool] = useState<School | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])

  const loadSchoolContext = useCallback(async () => {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setSchool(null)
        setOrganization(null)
        setRole(null)
        setAcademicYears([])
        return
      }

      const { data: memberships, error: membershipError } = await supabase
        .from("school_members")
        .select("school_id, role, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)

      if (membershipError) {
        throw membershipError
      }

      const membership = memberships?.[0]

      if (!membership) {
        setSchool(null)
        setOrganization(null)
        setRole(null)
        setAcademicYears([])
        return
      }

      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .select(
          "id, organization_id, name, short_name, type, address, city, commune, phone, email, website, logo_url, currency_code, is_active",
        )
        .eq("id", membership.school_id)
        .maybeSingle()

      if (schoolError) {
        throw schoolError
      }

      if (!schoolData) {
        setSchool(null)
        setOrganization(null)
        setRole(null)
        setAcademicYears([])
        return
      }

      const { data: organizationData, error: organizationError } =
        await supabase
          .from("organizations")
          .select(
            "id, name, slug, email, phone, country_code, subscription_status, trial_ends_at, plan_code",
          )
          .eq("id", schoolData.organization_id)
          .maybeSingle()

      if (organizationError) {
        throw organizationError
      }

      const { data: yearsData, error: yearsError } = await supabase
        .from("academic_years")
        .select(
          "id, label, starts_on, ends_on, status, is_current",
        )
        .eq("school_id", schoolData.id)
        .order("starts_on", { ascending: false, nullsFirst: false })

      if (yearsError) {
        throw yearsError
      }

      setSchool(schoolData as School)
      setOrganization((organizationData as Organization | null) ?? null)
      setRole(membership.role ?? null)
      setAcademicYears((yearsData as AcademicYear[]) ?? [])
    } catch (error) {
      console.error("Erreur de chargement du contexte scolaire :", error)

      setSchool(null)
      setOrganization(null)
      setRole(null)
      setAcademicYears([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const t = setTimeout(() => void loadSchoolContext(), 0)
    return () => clearTimeout(t)
  }, [loadSchoolContext])

  const currentAcademicYear =
    academicYears.find((year) => year.is_current) ??
    academicYears[0] ??
    null

  const value = useMemo(
    () => ({
      loading,
      school,
      organization,
      role,
      academicYears,
      currentAcademicYear,
      refresh: loadSchoolContext,
    }),
    [
      loading,
      school,
      organization,
      role,
      academicYears,
      currentAcademicYear,
      loadSchoolContext,
    ],
  )

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  )
}

export function useSchool() {
  const context = useContext(SchoolContext)

  if (!context) {
    throw new Error(
      "useSchool doit être utilisé à l'intérieur de <SchoolProvider>.",
    )
  }

  return context
}
