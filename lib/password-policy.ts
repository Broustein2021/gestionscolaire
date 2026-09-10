'use client'

/**
 * Politique de mot de passe unique de la plateforme (cohérente entre
 * inscription et réinitialisation ; Supabase impose en plus 8 caractères
 * minimum côté serveur, cette règle client est volontairement plus stricte).
 */
export function validerMotDePasse(password: string): string | null {
  if (password.length < 12) {
    return 'Le mot de passe doit contenir au moins 12 caractères.'
  }
  if (!/[a-z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une lettre minuscule.'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une lettre majuscule.'
  }
  if (!/[0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins un chiffre.'
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins un symbole.'
  }
  return null
}