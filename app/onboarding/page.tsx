"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const SCHOOL_TYPES = [
  {
    value: "primaire",
    label: "École primaire",
  },
  {
    value: "secondaire",
    label: "Collège / Secondaire",
  },
  {
    value: "primaire_secondaire",
    label: "Primaire + Secondaire",
  },
  {
    value: "lycee",
    label: "Lycée",
  },
  {
    value: "autre",
    label: "Autre",
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [organization, setOrganization] = useState("")
  const [school, setSchool] = useState("")
  const [schoolType, setSchoolType] = useState("primaire")
  const [shortName, setShortName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [commune, setCommune] = useState("")
  const [phone, setPhone] = useState("")
  const [schoolEmail, setSchoolEmail] = useState("")
  const [fullName, setFullName] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    setError("")
    setSuccess("")

    const organizationName = organization.trim()
    const schoolName = school.trim()
    const type = schoolType.trim()

    if (!organizationName) {
      setError("Le nom de l'organisation est obligatoire.")
      return
    }

    if (!schoolName) {
      setError("Le nom de l'établissement est obligatoire.")
      return
    }

    if (!type) {
      setError("Veuillez sélectionner le type d'établissement.")
      return
    }

    setSubmitting(true)

    try {
      /*
       * Vérification de la session avant l'appel RPC.
       * La sécurité réelle reste assurée côté PostgreSQL/RLS/RPC.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError(
          "Votre session a expiré. Veuillez vous reconnecter."
        )
        return
      }

      const { data, error: rpcError } = await supabase.rpc(
        "create_initial_school",
        {
          p_organization_name: organizationName,
          p_school_name: schoolName,
          p_school_type: type,
          p_short_name: shortName.trim() || null,
          p_address: address.trim() || null,
          p_city: city.trim() || null,
          p_commune: commune.trim() || null,
          p_phone: phone.trim() || null,
          p_school_email: schoolEmail.trim() || null,
          p_full_name: fullName.trim() || null,
        }
      )

      /*
       * IMPORTANT :
       * Toute la gestion de rpcError reste dans ce bloc.
       * Ne pas fermer ce if avant les tests ci-dessous.
       */
      if (rpcError) {
        console.error("Erreur onboarding complète :", rpcError)
        console.error("Message :", rpcError.message)
        console.error("Code :", rpcError.code)
        console.error("Details :", rpcError.details)
        console.error("Hint :", rpcError.hint)

        const message = rpcError.message || ""

        if (message.includes("USER_ALREADY_HAS_SCHOOL")) {
          setError(
            "Votre compte possède déjà un établissement."
          )
        } else if (message.includes("AUTH_REQUIRED")) {
          setError(
            "Votre session a expiré. Veuillez vous reconnecter."
          )
        } else if (
          message.includes("ORGANIZATION_NAME_REQUIRED")
        ) {
          setError(
            "Le nom de l'organisation est obligatoire."
          )
        } else if (
          message.includes("SCHOOL_NAME_REQUIRED")
        ) {
          setError(
            "Le nom de l'établissement est obligatoire."
          )
        } else if (
          message.includes("SCHOOL_TYPE_REQUIRED")
        ) {
          setError(
            "Le type d'établissement est obligatoire."
          )
        } else {
          setError(
            message ||
              "Impossible de créer l'établissement. Veuillez vérifier les informations et réessayer."
          )
        }

        return
      }

      if (!data) {
        setError(
          "La création n'a retourné aucune information."
        )
        return
      }

      console.log("Établissement créé :", data)

      setSuccess(
        "Votre établissement a été créé avec succès."
      )

      /*
       * On retourne ensuite vers l'application.
       * Le proxy vérifiera automatiquement la session.
       */
      setTimeout(() => {
        router.replace("/")
        router.refresh()
      }, 800)
    } catch (err) {
      console.error("Erreur inattendue onboarding :", err)

      setError(
        "Une erreur inattendue est survenue. Veuillez réessayer."
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mb-3 text-3xl font-bold text-slate-900">
            GESTION-SCOLAIRE
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Configurez votre établissement
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Quelques informations sont nécessaires avant
            d’accéder à votre espace de gestion.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h2 className="mb-1 text-lg font-semibold text-slate-900">
                Organisation
              </h2>

              <p className="mb-5 text-sm text-slate-500">
                Informations générales de votre organisation.
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label
                    htmlFor="organization"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Nom de l’organisation *
                  </label>

                  <input
                    id="organization"
                    type="text"
                    value={organization}
                    onChange={(e) =>
                      setOrganization(e.target.value)
                    }
                    placeholder="Ex. Groupe Scolaire Excellence"
                    maxLength={150}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Nom du responsable
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Nom et prénom"
                    maxLength={150}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h2 className="mb-1 text-lg font-semibold text-slate-900">
                Établissement
              </h2>

              <p className="mb-5 text-sm text-slate-500">
                Informations concernant votre établissement.
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="school"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Nom de l’établissement *
                  </label>

                  <input
                    id="school"
                    type="text"
                    value={school}
                    onChange={(e) =>
                      setSchool(e.target.value)
                    }
                    placeholder="Ex. Groupe Scolaire Les Élites"
                    maxLength={150}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="shortName"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Abréviation
                  </label>

                  <input
                    id="shortName"
                    type="text"
                    value={shortName}
                    onChange={(e) =>
                      setShortName(e.target.value)
                    }
                    placeholder="Ex. GSE"
                    maxLength={30}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="schoolType"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Type d’établissement *
                  </label>

                  <select
                    id="schoolType"
                    value={schoolType}
                    onChange={(e) =>
                      setSchoolType(e.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    {SCHOOL_TYPES.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="schoolEmail"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email de l’établissement
                  </label>

                  <input
                    id="schoolEmail"
                    type="email"
                    value={schoolEmail}
                    onChange={(e) =>
                      setSchoolEmail(e.target.value)
                    }
                    placeholder="contact@ecole.com"
                    maxLength={255}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h2 className="mb-1 text-lg font-semibold text-slate-900">
                Coordonnées
              </h2>

              <p className="mb-5 text-sm text-slate-500">
                Vous pourrez modifier ces informations plus
                tard depuis la configuration.
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Adresse
                  </label>

                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) =>
                      setAddress(e.target.value)
                    }
                    placeholder="Adresse de l'établissement"
                    maxLength={255}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Ville
                  </label>

                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) =>
                      setCity(e.target.value)
                    }
                    placeholder="Ex. Abidjan"
                    maxLength={100}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="commune"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Commune
                  </label>

                  <input
                    id="commune"
                    type="text"
                    value={commune}
                    onChange={(e) =>
                      setCommune(e.target.value)
                    }
                    placeholder="Ex. Cocody"
                    maxLength={100}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Téléphone
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    placeholder="+225 07 00 00 00 00"
                    maxLength={30}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>
            </section>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Se déconnecter
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Création en cours..."
                    : "Créer mon établissement"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Votre compte et vos données sont protégés par
          Supabase Auth et les règles de sécurité PostgreSQL.
        </p>
      </div>
    </main>
  )
}
