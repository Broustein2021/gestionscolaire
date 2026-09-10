-- 0004 : numérotation atomique des reçus (REC-YYYY-NNNNN) et des matricules
-- (ELV-YYYY-NNN), au lieu d'un count+1 côté client (course / doublons 23505).
-- Un compteur (school_id, year_prefix) est incrémenté de façon transactionnelle
-- (upsert + verrou de ligne) : deux insertions concurrentes obtiennent des
-- numéros distincts garantis par les contraintes UNIQUE existantes.
BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

-- Compteur générique par (nature, école, préfixe année).
CREATE TABLE IF NOT EXISTS private.number_counters (
  scope_kind   text NOT NULL,           -- 'receipt' | 'matricule'
  school_id    uuid NOT NULL,
  year_prefix  text NOT NULL,
  last_number  integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope_kind, school_id, year_prefix)
);

-- Retourne le prochain numéro (1, 2, 3…) pour (kind, école, préfixe).
CREATE OR REPLACE FUNCTION private.next_number(
  p_kind text,
  p_school uuid,
  p_prefix text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next integer;
BEGIN
  INSERT INTO private.number_counters (scope_kind, school_id, year_prefix, last_number)
  VALUES (p_kind, p_school, p_prefix, 1)
  ON CONFLICT (scope_kind, school_id, year_prefix)
  DO UPDATE SET last_number = private.number_counters.last_number + 1,
                updated_at = now()
  RETURNING last_number INTO v_next;

  RETURN v_next;
END;
$$;

-- Affecte le numéro de reçu si l'insertion n'en fournit pas un (format
-- REC-AAAA-NNNNN). Le préfixe est dérivé de l'année scolaire du paiement.
CREATE OR REPLACE FUNCTION private.assign_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefix text;
  v_next integer;
BEGIN
  IF NEW.receipt_number IS NOT NULL AND NEW.receipt_number <> '' THEN
    RETURN NEW;
  END IF;

  SELECT to_char(ay.starts_on, 'YYYY')
    INTO v_prefix
    FROM public.payments p
    JOIN public.academic_years ay ON ay.id = p.academic_year_id
   WHERE p.id = NEW.payment_id;

  IF v_prefix IS NULL THEN
    v_prefix := to_char(now(), 'YYYY');
  END IF;

  v_next := private.next_number('receipt', NEW.school_id, v_prefix);
  NEW.receipt_number := 'REC-' || v_prefix || '-' || lpad(v_next::text, 5, '0');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_receipts_assign_number ON public.receipts;
CREATE TRIGGER trg_receipts_assign_number
BEFORE INSERT ON public.receipts
FOR EACH ROW EXECUTE FUNCTION private.assign_receipt_number();

-- Affecte le matricule (ELV-AAAA-NNN) à la création de l'élève, quand aucun
-- n'est fourni. Le préfixe est l'année courante (cohérent avec l'ancien
-- comportement : un élève est inscrit « cette année »). Garanti unique par le
-- compteur + la contrainte UNIQUE (school_id, matricule) existante.
CREATE OR REPLACE FUNCTION private.assign_student_matricule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefix text;
  v_next integer;
BEGIN
  IF NEW.matricule IS NULL OR NEW.matricule = '' THEN
    v_prefix := to_char(now(), 'YYYY');
    v_next := private.next_number('matricule', NEW.school_id, v_prefix);
    NEW.matricule := 'ELV-' || v_prefix || '-' || lpad(v_next::text, 3, '0');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_students_assign_matricule ON public.students;
CREATE TRIGGER trg_students_assign_matricule
BEFORE INSERT ON public.students
FOR EACH ROW EXECUTE FUNCTION private.assign_student_matricule();

-- Sécurité : bascule d'un éventuel ancien trigger sur enrollments.
DROP TRIGGER IF EXISTS trg_enrollments_assign_matricule ON public.enrollments;

-- Amorce des compteurs depuis les numéros existants (ré-application sûre).
INSERT INTO private.number_counters (scope_kind, school_id, year_prefix, last_number)
SELECT 'receipt', r.school_id,
       split_part(r.receipt_number, '-', 2),
       max(coalesce(NULLIF(split_part(r.receipt_number, '-', 3), '')::integer, 0))
  FROM public.receipts r
 WHERE r.receipt_number ~ '^REC-[0-9]{4}-[0-9]+$'
 GROUP BY 1, 2, 3
ON CONFLICT (scope_kind, school_id, year_prefix) DO NOTHING;

INSERT INTO private.number_counters (scope_kind, school_id, year_prefix, last_number)
SELECT 'matricule', s.school_id,
       split_part(s.matricule, '-', 2),
       max(coalesce(NULLIF(split_part(s.matricule, '-', 3), '')::integer, 0))
  FROM public.students s
 WHERE s.matricule ~ '^ELV-[0-9]{4}-[0-9]+$'
 GROUP BY 1, 2, 3
ON CONFLICT (scope_kind, school_id, year_prefix) DO NOTHING;

COMMIT;