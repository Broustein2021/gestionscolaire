"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Contact,
  School,
  GraduationCap,
  BookOpen,
  ClipboardList,
  PencilRuler,
  FileText,
  Wallet,
  CalendarCheck,
  Settings,
  GraduationCap as Logo,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import { nav } from "@/lib/data"
import { useSchool } from "@/components/school-provider"

const iconMap = {
  dashboard: LayoutDashboard,
  students: Users,
  enroll: UserPlus,
  parents: Contact,
  classes: School,
  teachers: GraduationCap,
  subjects: BookOpen,
  assess: ClipboardList,
  grades: PencilRuler,
  reports: FileText,
  finance: Wallet,
  calendarCheck: CalendarCheck,
  settings: Settings,
} as const

export function AppSidebar() {
  const pathname = usePathname()
  const { school, organization } = useSchool()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            {school?.logo_url ? (
              <Image
                src={school.logo_url}
                alt=""
                fill
                sizes="36px"
                unoptimized
                className="object-cover"
              />
            ) : (
              <Logo className="size-5" />
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              {organization?.name ?? "GESTION-SCOLAIRE"}
            </span>

            <span className="truncate text-xs text-sidebar-foreground/60">
              {school?.name ?? "Établissement"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {nav.map((section) => (
          <SidebarGroup key={section.group}>
            <SidebarGroupLabel>{section.group}</SidebarGroupLabel>

            <SidebarMenu>
              {section.items.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap]

                if (!Icon) {
                  return null
                }

                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      render={
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
