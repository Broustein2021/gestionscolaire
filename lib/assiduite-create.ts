'use client'

import { createClient } from '@/lib/supabase/client'

export type StatutPresence = 'absent' | 'justifie' | 'present' | 'retard'

export type LignePresence = {
  studentId: string
  status: StatutPresence
  justification?: string
}

export type SauverPresenceInput = {
  schoolId: string
  academicYearId: string
  classId: string
  date: string
  lignes: LignePresence[]
}

export type ResultatPresence = { ok: true } | { ok: false; message: string }

export const statutPresenceLibelle: Record<StatutPresence, string> = {
  present: 'Présent',
  retard: 'Retard',
  absent: 'Absent',
  justifie: 'Justifié',
}

const RLS =
  /row-level security|violates row level security|permission denied|new row violates/i

function messageErreur(erreur: unknown, contexte: string): string {
  const msg = (erreur as { message?: string } | null)?.message ?? ''
  if (RLS.test(msg)) {
    return `${contexte} : action non autorisée pour votre rôle (réservé à la direction, au secrétariat et aux enseignants).`
  }
  return msg ? `${contexte} : ${msg}` : `Échec de l'enregistrement (${contexte.toLowerCase()}).`
}

/**
 * Enregistre la feuille de présence d'une classe pour une date donnée.
 * Upsert par (school_id, class_id, attendance_date, student_id) : les lignes
 * existantes sont mises à jour, les nouvelles créées, et les élèves retirés
 * de la feuille (non transmis) sont ignorés (historique conservé).
 * La sécurité réelle (rôles, école, année) est garantie par la RLS.
 */
export async function sauverPresence(
  input: SauverPresenceInput,
): Promise<ResultatPresence> {
  if (!input.classId) {
    return { ok: false, message: 'Sélectionnez d’abord une classe.' }
  }
  if (!input.date) {
    return { ok: false, message: 'La date de la séance est obligatoire.' }
  }
  if (input.lignes.length === 0) {
    return { ok: false, message: "Aucun élève à pointer pour l'instant." }
  }

  const supabase = createClient()

  const lignesInvalides = input.lignes.filter(
    (l) => !['present', 'retard', 'absent', 'justifie'].includes(l.status),
  )
  if (lignesInvalides.length > 0) {
    return { ok: false, message: 'Le statut de présence enregistré est invalide.' }
  }

  const valeurs = input.lignes.map((l) => ({
    school_id: input.schoolId,
    academic_year_id: input.academicYearId,
    class_id: input.classId,
    attendance_date: input.date,
    student_id: l.studentId,
    status: l.status,
    justification: l.justification?.trim() || null,
  }))

  const { error } = await supabase
    .from('attendance_records')
    .upsert(valeurs, {
      onConflict: 'school_id,class_id,attendance_date,student_id',
    })

  if (error) {
    return { ok: false, message: messageErreur(error, 'Enregistrement des présences') }
  }

  return { ok: true }
}