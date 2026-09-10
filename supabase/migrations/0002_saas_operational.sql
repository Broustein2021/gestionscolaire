-- =============================================================================
-- GESTION-SCOLAIRE — v2 "SaaS multi-établissement"
-- Modules opérationnels manquants : vie scolaire (présence), emploi du temps,
-- discipline, communication interne.
-- Additif et ré-exécutable : à coller tel quel dans le SQL editor du projet.
-- Conventions reprises du socle v1 : RLS active, rôles public.user_is_school_member
-- / public.user_has_school_role, trigger public.set_updated_at().
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. ASSIDUITÉ / PRÉSENCE (app /assiduite)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  class_id uuid NOT NULL,
  attendance_date date NOT NULL,
  student_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'retard', 'absent', 'justifie')),
  justification text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_unique_day') THEN
    ALTER TABLE public.attendance_records
      ADD CONSTRAINT attendance_records_unique_day
      UNIQUE (school_id, class_id, attendance_date, student_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_school_fk') THEN
    ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_school_fk FOREIGN KEY (school_id) REFERENCES public.schools (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_year_fk') THEN
    ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_year_fk FOREIGN KEY (academic_year_id) REFERENCES public.academic_years (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_class_fk') THEN
    ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_class_fk FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_student_fk') THEN
    ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_student_fk FOREIGN KEY (student_id) REFERENCES public.students (id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance_records (class_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance_records (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_year ON public.attendance_records (school_id, academic_year_id);

DROP TRIGGER IF EXISTS trg_attendance_records_updated ON public.attendance_records;
CREATE TRIGGER trg_attendance_records_updated
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY attendance_records_select_member ON public.attendance_records
  FOR SELECT TO authenticated
  USING (public.user_is_school_member(school_id));

CREATE POLICY attendance_records_insert_authorized ON public.attendance_records
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role, 'enseignant'::public.app_role]));

CREATE POLICY attendance_records_update_authorized ON public.attendance_records
  FOR UPDATE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role, 'enseignant'::public.app_role]))
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role, 'enseignant'::public.app_role]));

CREATE POLICY attendance_records_delete_authorized ON public.attendance_records
  FOR DELETE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]));


-- -----------------------------------------------------------------------------
-- 2. EMPLOI DU TEMPS (salles, créneaux, cases) — app /emploi-du-temps (phase 2)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  capacity integer DEFAULT 30 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_classrooms_school ON public.classrooms (school_id);

DROP TRIGGER IF EXISTS trg_classrooms_updated ON public.classrooms;
CREATE TRIGGER trg_classrooms_updated
  BEFORE UPDATE ON public.classrooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY classrooms_select_member ON public.classrooms
  FOR SELECT TO authenticated
  USING (public.user_is_school_member(school_id));
CREATE POLICY classrooms_insert_authorized ON public.classrooms
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]));
CREATE POLICY classrooms_update_authorized ON public.classrooms
  FOR UPDATE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]))
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]));
CREATE POLICY classrooms_delete_authorized ON public.classrooms
  FOR DELETE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]));

CREATE TABLE IF NOT EXISTS public.time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT time_slots_coherence CHECK (end_time > start_time)
);

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_time_slots_school ON public.time_slots (school_id);

CREATE POLICY time_slots_select_member ON public.time_slots
  FOR SELECT TO authenticated
  USING (public.user_is_school_member(school_id));
CREATE POLICY time_slots_insert_authorized ON public.time_slots
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]));
CREATE POLICY time_slots_update_authorized ON public.time_slots
  FOR UPDATE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]))
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]));
CREATE POLICY time_slots_delete_authorized ON public.time_slots
  FOR DELETE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]));

CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  class_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_slot_id uuid NOT NULL,
  subject_id uuid,
  teacher_id uuid,
  classroom_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timetable_entries_unique_cell') THEN
    ALTER TABLE public.timetable_entries
      ADD CONSTRAINT timetable_entries_unique_cell
      UNIQUE (class_id, academic_year_id, day_of_week, time_slot_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timetable_entries_school_fk') THEN
    ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_school_fk FOREIGN KEY (school_id) REFERENCES public.schools (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timetable_entries_class_fk') THEN
    ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_class_fk FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timetable_entries_year_fk') THEN
    ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_year_fk FOREIGN KEY (academic_year_id) REFERENCES public.academic_years (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timetable_entries_slot_fk') THEN
    ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_slot_fk FOREIGN KEY (time_slot_id) REFERENCES public.time_slots (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timetable_entries_teacher_fk') THEN
    ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_teacher_fk FOREIGN KEY (teacher_id) REFERENCES public.teachers (id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timetable_entries_room_fk') THEN
    ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_room_fk FOREIGN KEY (classroom_id) REFERENCES public.classrooms (id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_timetable_class ON public.timetable_entries (class_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON public.timetable_entries (teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_room ON public.timetable_entries (classroom_id);

DROP TRIGGER IF EXISTS trg_timetable_entries_updated ON public.timetable_entries;
CREATE TRIGGER trg_timetable_entries_updated
  BEFORE UPDATE ON public.timetable_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY timetable_entries_select_member ON public.timetable_entries
  FOR SELECT TO authenticated
  USING (public.user_is_school_member(school_id));
CREATE POLICY timetable_entries_insert_authorized ON public.timetable_entries
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role, 'enseignant'::public.app_role]));
CREATE POLICY timetable_entries_update_authorized ON public.timetable_entries
  FOR UPDATE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role, 'enseignant'::public.app_role]))
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role, 'enseignant'::public.app_role]));
CREATE POLICY timetable_entries_delete_authorized ON public.timetable_entries
  FOR DELETE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]));


-- -----------------------------------------------------------------------------
-- 3. DISCIPLINE / VIE SCOLAIRE (observations & sanctions) — app /discipline
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  student_id uuid NOT NULL,
  class_id uuid,
  reported_on date DEFAULT CURRENT_DATE NOT NULL,
  incident_type text NOT NULL CHECK (incident_type IN ('comportement', 'absenteisme', 'retard', 'travail_non_fait', 'violence', 'autre')),
  severity text DEFAULT 'legere' NOT NULL CHECK (severity IN ('legere', 'moyenne', 'grave')),
  description text NOT NULL,
  action_taken text,
  status text DEFAULT 'ouverte' NOT NULL CHECK (status IN ('ouverte', 'traitee', 'cloturee')),
  reported_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incident_reports_school_fk') THEN
    ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_school_fk FOREIGN KEY (school_id) REFERENCES public.schools (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incident_reports_year_fk') THEN
    ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_year_fk FOREIGN KEY (academic_year_id) REFERENCES public.academic_years (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incident_reports_student_fk') THEN
    ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_student_fk FOREIGN KEY (student_id) REFERENCES public.students (id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incident_reports_class_fk') THEN
    ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_class_fk FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_incidents_student ON public.incident_reports (student_id, reported_on);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incident_reports (school_id, status);

DROP TRIGGER IF EXISTS trg_incident_reports_updated ON public.incident_reports;
CREATE TRIGGER trg_incident_reports_updated
  BEFORE UPDATE ON public.incident_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY incident_reports_select_member ON public.incident_reports
  FOR SELECT TO authenticated
  USING (public.user_is_school_member(school_id));
CREATE POLICY incident_reports_insert_authorized ON public.incident_reports
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role, 'enseignant'::public.app_role]));
CREATE POLICY incident_reports_update_authorized ON public.incident_reports
  FOR UPDATE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role]))
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role]));
CREATE POLICY incident_reports_delete_authorized ON public.incident_reports
  FOR DELETE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]));


-- -----------------------------------------------------------------------------
-- 4. COMMUNICATION INTERNE (annonces direction / enseignants / parents)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  audience text DEFAULT 'tous' NOT NULL CHECK (audience IN ('tous', 'enseignants', 'parents', 'eleves')),
  title text NOT NULL,
  content text NOT NULL,
  pinned boolean DEFAULT false NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_school_fk') THEN
    ALTER TABLE public.announcements ADD CONSTRAINT announcements_school_fk FOREIGN KEY (school_id) REFERENCES public.schools (id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_announcements_school_order ON public.announcements (school_id, pinned DESC, created_at DESC);

DROP TRIGGER IF EXISTS trg_announcements_updated ON public.announcements;
CREATE TRIGGER trg_announcements_updated
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY announcements_select_member ON public.announcements
  FOR SELECT TO authenticated
  USING (public.user_is_school_member(school_id));
CREATE POLICY announcements_insert_authorized ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role]));
CREATE POLICY announcements_update_authorized ON public.announcements
  FOR UPDATE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role]))
  WITH CHECK (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role, 'secretaire'::public.app_role]));
CREATE POLICY announcements_delete_authorized ON public.announcements
  FOR DELETE TO authenticated
  USING (public.user_has_school_role(school_id, ARRAY['org_admin'::public.app_role, 'directeur'::public.app_role]));