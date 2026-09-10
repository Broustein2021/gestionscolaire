-- ============================================================
-- 0001_base_schema.sql — recréé par scripts/dump-schema.mjs
-- Snapshoot du schéma complet (sans les données) à la date du jour.
-- Ordre : types → tables → contraintes → index → fonctions →
-- triggers → RLS/politiques. Reproduit un environnement à l’identique.
-- ============================================================

SET search_path = public;

BEGIN;
SET check_function_bodies = off;

CREATE TYPE public.academic_year_status AS ENUM ('planifiee', 'active', 'cloturee');
CREATE TYPE public.app_role AS ENUM ('super_admin', 'org_admin', 'directeur', 'comptable', 'secretaire', 'enseignant', 'parent', 'eleve');
CREATE TYPE public.assessment_status AS ENUM ('planifiee', 'saisie', 'validee', 'annulee');
CREATE TYPE public.assessment_type AS ENUM ('Interrogation', 'Devoir', 'Composition', 'Contrôle continu', 'Examen');
CREATE TYPE public.cycle_type AS ENUM ('Primaire', 'Collège', 'Lycée');
CREATE TYPE public.enrollment_status AS ENUM ('brouillon', 'validee', 'annulee');
CREATE TYPE public.gender_type AS ENUM ('M', 'F');
CREATE TYPE public.guardian_relation AS ENUM ('Père', 'Mère', 'Tuteur', 'Tutrice', 'Autre');
CREATE TYPE public.membership_status AS ENUM ('invited', 'active', 'suspended', 'left');
CREATE TYPE public.payment_method AS ENUM ('Espèces', 'Mobile Money', 'Virement', 'Chèque', 'Carte', 'Autre');
CREATE TYPE public.payment_status AS ENUM ('a_jour', 'partiel', 'retard');
CREATE TYPE public.school_type AS ENUM ('primaire', 'secondaire', 'primaire_secondaire', 'lycee', 'autre');
CREATE TYPE public.student_status AS ENUM ('inscrit', 'nouveau', 'archive', 'radie', 'transfere');
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'suspended');
CREATE TYPE public.teacher_status AS ENUM ('actif', 'conge', 'archive');
CREATE TYPE public.term_status AS ENUM ('planifie', 'en_cours', 'cloture');

CREATE TABLE public.academic_years (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  label text NOT NULL,
  starts_on date,
  ends_on date,
  status academic_year_status DEFAULT 'planifiee'::academic_year_status NOT NULL,
  is_current boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.announcements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  audience text DEFAULT 'tous'::text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  pinned boolean DEFAULT false NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.assessments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  term_id uuid,
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  teacher_id uuid,
  title text NOT NULL,
  assessment_type assessment_type DEFAULT 'Devoir'::assessment_type NOT NULL,
  assessed_on date,
  max_score numeric(6,2) DEFAULT 20 NOT NULL,
  coefficient numeric(4,1) DEFAULT 1 NOT NULL,
  status assessment_status DEFAULT 'planifiee'::assessment_status NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.attendance_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  class_id uuid NOT NULL,
  attendance_date date NOT NULL,
  student_id uuid NOT NULL,
  status text NOT NULL,
  justification text,
  recorded_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid,
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.classes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  level_id uuid,
  name text NOT NULL,
  level_label text NOT NULL,
  cycle cycle_type NOT NULL,
  capacity integer DEFAULT 40 NOT NULL,
  room text,
  head_teacher_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.classrooms (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  capacity integer DEFAULT 30 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.enrollments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  student_id uuid NOT NULL,
  class_id uuid,
  level_label text,
  enrolled_on date DEFAULT CURRENT_DATE NOT NULL,
  status enrollment_status DEFAULT 'validee'::enrollment_status NOT NULL,
  is_new_student boolean DEFAULT false NOT NULL,
  amount_due numeric(14,0) DEFAULT 0 NOT NULL,
  amount_paid numeric(14,0) DEFAULT 0 NOT NULL,
  payment_status payment_status DEFAULT 'retard'::payment_status NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.fee_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  default_amount numeric(14,0) DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.fee_structures (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  fee_category_id uuid NOT NULL,
  level_id uuid,
  amount numeric(14,0) DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.grades (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  assessment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  score numeric(6,2),
  is_absent boolean DEFAULT false NOT NULL,
  comment text,
  entered_by uuid,
  entered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.guardians (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  last_name text NOT NULL,
  first_name text NOT NULL,
  phone text,
  email text,
  profession text,
  address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  profile_id uuid
);

CREATE TABLE public.incident_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  student_id uuid NOT NULL,
  class_id uuid,
  reported_on date DEFAULT CURRENT_DATE NOT NULL,
  incident_type text NOT NULL,
  severity text DEFAULT 'legere'::text NOT NULL,
  description text NOT NULL,
  action_taken text,
  status text DEFAULT 'ouverte'::text NOT NULL,
  reported_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.levels (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  cycle cycle_type NOT NULL,
  sequence_no smallint DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.organizations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  email text,
  phone text,
  country_code text DEFAULT 'CI'::text NOT NULL,
  subscription_status subscription_status DEFAULT 'trial'::subscription_status NOT NULL,
  trial_ends_at timestamp with time zone,
  plan_code text DEFAULT 'starter'::text,
  max_schools integer DEFAULT 1 NOT NULL,
  max_students integer DEFAULT 500 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  student_id uuid NOT NULL,
  enrollment_id uuid,
  fee_category_id uuid,
  amount numeric(14,0) NOT NULL,
  paid_on date DEFAULT CURRENT_DATE NOT NULL,
  method payment_method DEFAULT 'Espèces'::payment_method NOT NULL,
  reference text,
  motif text,
  recorded_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code text NOT NULL,
  module text NOT NULL,
  action text NOT NULL,
  label text NOT NULL,
  description text,
  is_sensitive boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  is_platform_admin boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.receipts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  payment_id uuid NOT NULL,
  receipt_number text NOT NULL,
  issued_at timestamp with time zone DEFAULT now() NOT NULL,
  balance_after numeric(14,0),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.role_permissions (
  role app_role NOT NULL,
  permission_id uuid NOT NULL
);

CREATE TABLE public.school_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  role app_role NOT NULL,
  status membership_status DEFAULT 'invited'::membership_status NOT NULL,
  invited_at timestamp with time zone DEFAULT now(),
  joined_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.school_role_permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  role app_role NOT NULL,
  permission_id uuid NOT NULL,
  allowed boolean NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.schools (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  organization_id uuid NOT NULL,
  name text NOT NULL,
  short_name text,
  type school_type DEFAULT 'primaire_secondaire'::school_type NOT NULL,
  address text,
  city text,
  commune text,
  phone text,
  email text,
  website text,
  logo_url text,
  currency_code text DEFAULT 'XOF'::text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.student_guardians (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  guardian_id uuid NOT NULL,
  relation guardian_relation DEFAULT 'Tuteur'::guardian_relation NOT NULL,
  is_primary boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.students (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  matricule text NOT NULL,
  last_name text NOT NULL,
  first_name text NOT NULL,
  gender gender_type NOT NULL,
  birth_date date,
  birth_place text,
  nationality text DEFAULT 'Ivoirienne'::text,
  phone text,
  address text,
  photo_url text,
  status student_status DEFAULT 'inscrit'::student_status NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  profile_id uuid
);

CREATE TABLE public.subjects (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  coefficient numeric(4,1) DEFAULT 1 NOT NULL,
  cycle cycle_type NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.teacher_assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  class_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.teachers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  profile_id uuid,
  matricule text NOT NULL,
  last_name text NOT NULL,
  first_name text NOT NULL,
  gender gender_type,
  phone text,
  email text,
  hired_on date,
  status teacher_status DEFAULT 'actif'::teacher_status NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.terms (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  label text NOT NULL,
  sequence_no smallint DEFAULT 1 NOT NULL,
  starts_on date,
  ends_on date,
  status term_status DEFAULT 'planifie'::term_status NOT NULL,
  is_current boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.time_slots (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  name text NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.timetable_entries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_id uuid NOT NULL,
  class_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  day_of_week smallint NOT NULL,
  time_slot_id uuid NOT NULL,
  subject_id uuid,
  teacher_id uuid,
  classroom_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.academic_years ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);
ALTER TABLE public.academic_years ADD CONSTRAINT academic_years_school_id_label_key UNIQUE (school_id, label);
ALTER TABLE public.announcements ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);
ALTER TABLE public.assessments ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_unique_day UNIQUE (school_id, class_id, attendance_date, student_id);
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.classes ADD CONSTRAINT classes_academic_year_id_name_key UNIQUE (academic_year_id, name);
ALTER TABLE public.classes ADD CONSTRAINT classes_pkey PRIMARY KEY (id);
ALTER TABLE public.classrooms ADD CONSTRAINT classrooms_pkey PRIMARY KEY (id);
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_academic_year_id_student_id_key UNIQUE (academic_year_id, student_id);
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);
ALTER TABLE public.fee_categories ADD CONSTRAINT fee_categories_pkey PRIMARY KEY (id);
ALTER TABLE public.fee_categories ADD CONSTRAINT fee_categories_school_id_name_key UNIQUE (school_id, name);
ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_academic_year_id_fee_category_id_level_id_key UNIQUE (academic_year_id, fee_category_id, level_id);
ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_pkey PRIMARY KEY (id);
ALTER TABLE public.grades ADD CONSTRAINT grades_assessment_id_student_id_key UNIQUE (assessment_id, student_id);
ALTER TABLE public.grades ADD CONSTRAINT grades_pkey PRIMARY KEY (id);
ALTER TABLE public.guardians ADD CONSTRAINT guardians_pkey PRIMARY KEY (id);
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.levels ADD CONSTRAINT levels_pkey PRIMARY KEY (id);
ALTER TABLE public.levels ADD CONSTRAINT levels_school_id_code_key UNIQUE (school_id, code);
ALTER TABLE public.organizations ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);
ALTER TABLE public.organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);
ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE public.permissions ADD CONSTRAINT permissions_code_key UNIQUE (code);
ALTER TABLE public.permissions ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
ALTER TABLE public.receipts ADD CONSTRAINT receipts_payment_id_key UNIQUE (payment_id);
ALTER TABLE public.receipts ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);
ALTER TABLE public.receipts ADD CONSTRAINT receipts_school_id_receipt_number_key UNIQUE (school_id, receipt_number);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role, permission_id);
ALTER TABLE public.school_members ADD CONSTRAINT school_members_pkey PRIMARY KEY (id);
ALTER TABLE public.school_members ADD CONSTRAINT school_members_school_id_profile_id_role_key UNIQUE (school_id, profile_id, role);
ALTER TABLE public.school_role_permissions ADD CONSTRAINT school_role_permissions_pkey PRIMARY KEY (id);
ALTER TABLE public.school_role_permissions ADD CONSTRAINT school_role_permissions_school_id_role_permission_id_key UNIQUE (school_id, role, permission_id);
ALTER TABLE public.schools ADD CONSTRAINT schools_pkey PRIMARY KEY (id);
ALTER TABLE public.student_guardians ADD CONSTRAINT student_guardians_pkey PRIMARY KEY (id);
ALTER TABLE public.student_guardians ADD CONSTRAINT student_guardians_student_id_guardian_id_key UNIQUE (student_id, guardian_id);
ALTER TABLE public.students ADD CONSTRAINT students_pkey PRIMARY KEY (id);
ALTER TABLE public.students ADD CONSTRAINT students_school_id_matricule_key UNIQUE (school_id, matricule);
ALTER TABLE public.subjects ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);
ALTER TABLE public.subjects ADD CONSTRAINT subjects_school_id_code_key UNIQUE (school_id, code);
ALTER TABLE public.teacher_assignments ADD CONSTRAINT teacher_assignments_academic_year_id_teacher_id_subject_id__key UNIQUE (academic_year_id, teacher_id, subject_id, class_id);
ALTER TABLE public.teacher_assignments ADD CONSTRAINT teacher_assignments_pkey PRIMARY KEY (id);
ALTER TABLE public.teachers ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);
ALTER TABLE public.teachers ADD CONSTRAINT teachers_school_id_matricule_key UNIQUE (school_id, matricule);
ALTER TABLE public.terms ADD CONSTRAINT terms_academic_year_id_label_key UNIQUE (academic_year_id, label);
ALTER TABLE public.terms ADD CONSTRAINT terms_pkey PRIMARY KEY (id);
ALTER TABLE public.time_slots ADD CONSTRAINT time_slots_pkey PRIMARY KEY (id);
ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_pkey PRIMARY KEY (id);
ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_unique_cell UNIQUE (class_id, academic_year_id, day_of_week, time_slot_id);

ALTER TABLE public.academic_years ADD CONSTRAINT academic_years_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.announcements ADD CONSTRAINT announcements_audience_check CHECK (audience = ANY (ARRAY['tous'::text, 'enseignants'::text, 'parents'::text, 'eleves'::text]));
ALTER TABLE public.announcements ADD CONSTRAINT announcements_school_fk FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_coefficient_positive CHECK (coefficient > 0::numeric);
ALTER TABLE public.assessments ADD CONSTRAINT assessments_max_score_positive CHECK (max_score > 0::numeric);
ALTER TABLE public.assessments ADD CONSTRAINT assessments_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_term_id_fkey FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL;
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_school_fk FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_status_check CHECK (status = ANY (ARRAY['present'::text, 'retard'::text, 'absent'::text, 'justifie'::text]));
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_student_fk FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_year_fk FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD CONSTRAINT classes_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;
ALTER TABLE public.classes ADD CONSTRAINT classes_head_teacher_fkey FOREIGN KEY (head_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD CONSTRAINT classes_level_id_fkey FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD CONSTRAINT classes_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_amount_due_nonnegative CHECK (amount_due >= 0::numeric);
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_amount_paid_nonnegative CHECK (amount_paid >= 0::numeric);
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE public.fee_categories ADD CONSTRAINT fee_categories_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;
ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_fee_category_id_fkey FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE CASCADE;
ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_level_id_fkey FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE SET NULL;
ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.grades ADD CONSTRAINT grades_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;
ALTER TABLE public.grades ADD CONSTRAINT grades_entered_by_fkey FOREIGN KEY (entered_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.grades ADD CONSTRAINT grades_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.grades ADD CONSTRAINT grades_score_finite CHECK (score IS NULL OR (score::text <> ALL (ARRAY['NaN'::text, 'Infinity'::text, '-Infinity'::text])));
ALTER TABLE public.grades ADD CONSTRAINT grades_score_non_negative CHECK (score IS NULL OR score >= 0::numeric);
ALTER TABLE public.grades ADD CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE public.guardians ADD CONSTRAINT guardians_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.guardians ADD CONSTRAINT guardians_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_incident_type_check CHECK (incident_type = ANY (ARRAY['comportement'::text, 'absenteisme'::text, 'retard'::text, 'travail_non_fait'::text, 'violence'::text, 'autre'::text]));
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_school_fk FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_severity_check CHECK (severity = ANY (ARRAY['legere'::text, 'moyenne'::text, 'grave'::text]));
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_status_check CHECK (status = ANY (ARRAY['ouverte'::text, 'traitee'::text, 'cloturee'::text]));
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_student_fk FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE public.incident_reports ADD CONSTRAINT incident_reports_year_fk FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;
ALTER TABLE public.levels ADD CONSTRAINT levels_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD CONSTRAINT payments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_check CHECK (amount > 0::numeric);
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_positive CHECK (amount > 0::numeric);
ALTER TABLE public.payments ADD CONSTRAINT payments_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT payments_fee_category_id_fkey FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT payments_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE public.permissions ADD CONSTRAINT permissions_code_format CHECK (code ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'::text);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.receipts ADD CONSTRAINT receipts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE;
ALTER TABLE public.receipts ADD CONSTRAINT receipts_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
ALTER TABLE public.school_members ADD CONSTRAINT school_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.school_members ADD CONSTRAINT school_members_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.school_role_permissions ADD CONSTRAINT school_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
ALTER TABLE public.school_role_permissions ADD CONSTRAINT school_role_permissions_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.schools ADD CONSTRAINT schools_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public.student_guardians ADD CONSTRAINT student_guardians_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES guardians(id) ON DELETE CASCADE;
ALTER TABLE public.student_guardians ADD CONSTRAINT student_guardians_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.student_guardians ADD CONSTRAINT student_guardians_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE public.students ADD CONSTRAINT students_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.students ADD CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.subjects ADD CONSTRAINT subjects_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.teacher_assignments ADD CONSTRAINT teacher_assignments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;
ALTER TABLE public.teacher_assignments ADD CONSTRAINT teacher_assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public.teacher_assignments ADD CONSTRAINT teacher_assignments_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.teacher_assignments ADD CONSTRAINT teacher_assignments_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
ALTER TABLE public.teacher_assignments ADD CONSTRAINT teacher_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;
ALTER TABLE public.teachers ADD CONSTRAINT teachers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.teachers ADD CONSTRAINT teachers_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.terms ADD CONSTRAINT terms_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;
ALTER TABLE public.terms ADD CONSTRAINT terms_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.time_slots ADD CONSTRAINT time_slots_coherence CHECK (end_time > start_time);
ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_class_fk FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_day_of_week_check CHECK (day_of_week >= 0 AND day_of_week <= 6);
ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_room_fk FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL;
ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_school_fk FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_slot_fk FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE;
ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_teacher_fk FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
ALTER TABLE public.timetable_entries ADD CONSTRAINT timetable_entries_year_fk FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;

CREATE INDEX guardians_profile_id_idx ON public.guardians USING btree (profile_id);
CREATE UNIQUE INDEX guardians_profile_school_unique ON public.guardians USING btree (profile_id, school_id) WHERE (profile_id IS NOT NULL);
CREATE INDEX idx_academic_years_school ON public.academic_years USING btree (school_id);
CREATE INDEX idx_announcements_school_order ON public.announcements USING btree (school_id, pinned DESC, created_at DESC);
CREATE INDEX idx_assessments_academic_year ON public.assessments USING btree (academic_year_id);
CREATE INDEX idx_assessments_class ON public.assessments USING btree (class_id);
CREATE INDEX idx_assessments_school ON public.assessments USING btree (school_id);
CREATE INDEX idx_assessments_subject ON public.assessments USING btree (subject_id);
CREATE INDEX idx_assessments_teacher ON public.assessments USING btree (teacher_id);
CREATE INDEX idx_assessments_term ON public.assessments USING btree (term_id);
CREATE INDEX idx_attendance_class_date ON public.attendance_records USING btree (class_id, attendance_date);
CREATE INDEX idx_attendance_school_year ON public.attendance_records USING btree (school_id, academic_year_id);
CREATE INDEX idx_attendance_student ON public.attendance_records USING btree (student_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);
CREATE INDEX idx_audit_logs_school ON public.audit_logs USING btree (school_id, created_at DESC);
CREATE INDEX idx_classes_head_teacher ON public.classes USING btree (head_teacher_id);
CREATE INDEX idx_classes_level ON public.classes USING btree (level_id);
CREATE INDEX idx_classes_school ON public.classes USING btree (school_id);
CREATE INDEX idx_classes_year ON public.classes USING btree (academic_year_id);
CREATE INDEX idx_classrooms_school ON public.classrooms USING btree (school_id);
CREATE INDEX idx_enrollments_class ON public.enrollments USING btree (class_id);
CREATE INDEX idx_enrollments_school ON public.enrollments USING btree (school_id);
CREATE INDEX idx_enrollments_student ON public.enrollments USING btree (student_id);
CREATE INDEX idx_fee_categories_school ON public.fee_categories USING btree (school_id);
CREATE INDEX idx_fee_structures_fee_category ON public.fee_structures USING btree (fee_category_id);
CREATE INDEX idx_fee_structures_level ON public.fee_structures USING btree (level_id);
CREATE INDEX idx_fee_structures_school ON public.fee_structures USING btree (school_id);
CREATE INDEX idx_grades_assessment ON public.grades USING btree (assessment_id);
CREATE INDEX idx_grades_entered_by ON public.grades USING btree (entered_by);
CREATE INDEX idx_grades_school ON public.grades USING btree (school_id);
CREATE INDEX idx_grades_student ON public.grades USING btree (student_id);
CREATE INDEX idx_guardians_school ON public.guardians USING btree (school_id);
CREATE INDEX idx_incidents_status ON public.incident_reports USING btree (school_id, status);
CREATE INDEX idx_incidents_student ON public.incident_reports USING btree (student_id, reported_on);
CREATE INDEX idx_levels_school ON public.levels USING btree (school_id);
CREATE INDEX idx_payments_academic_year ON public.payments USING btree (academic_year_id);
CREATE INDEX idx_payments_date ON public.payments USING btree (school_id, paid_on DESC);
CREATE INDEX idx_payments_enrollment ON public.payments USING btree (enrollment_id);
CREATE INDEX idx_payments_fee_category ON public.payments USING btree (fee_category_id);
CREATE INDEX idx_payments_recorded_by ON public.payments USING btree (recorded_by);
CREATE INDEX idx_payments_school ON public.payments USING btree (school_id);
CREATE INDEX idx_payments_student ON public.payments USING btree (student_id);
CREATE INDEX idx_profiles_user ON public.profiles USING btree (user_id);
CREATE INDEX idx_receipts_school ON public.receipts USING btree (school_id);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id);
CREATE INDEX idx_school_members_profile ON public.school_members USING btree (profile_id);
CREATE INDEX idx_school_members_school ON public.school_members USING btree (school_id);
CREATE INDEX idx_school_role_permissions_permission ON public.school_role_permissions USING btree (permission_id);
CREATE INDEX idx_school_role_permissions_school_role ON public.school_role_permissions USING btree (school_id, role);
CREATE INDEX idx_schools_organization ON public.schools USING btree (organization_id);
CREATE INDEX idx_student_guardians_guardian ON public.student_guardians USING btree (guardian_id);
CREATE INDEX idx_student_guardians_school ON public.student_guardians USING btree (school_id);
CREATE INDEX idx_student_guardians_student ON public.student_guardians USING btree (student_id);
CREATE INDEX idx_students_name ON public.students USING btree (school_id, last_name, first_name);
CREATE INDEX idx_students_school ON public.students USING btree (school_id);
CREATE INDEX idx_subjects_school ON public.subjects USING btree (school_id);
CREATE INDEX idx_teacher_assignments_class ON public.teacher_assignments USING btree (class_id);
CREATE INDEX idx_teacher_assignments_school ON public.teacher_assignments USING btree (school_id);
CREATE INDEX idx_teacher_assignments_subject ON public.teacher_assignments USING btree (subject_id);
CREATE INDEX idx_teacher_assignments_teacher ON public.teacher_assignments USING btree (teacher_id);
CREATE INDEX idx_teachers_profile ON public.teachers USING btree (profile_id);
CREATE INDEX idx_teachers_school ON public.teachers USING btree (school_id);
CREATE INDEX idx_terms_school ON public.terms USING btree (school_id);
CREATE INDEX idx_terms_year ON public.terms USING btree (academic_year_id);
CREATE INDEX idx_time_slots_school ON public.time_slots USING btree (school_id);
CREATE INDEX idx_timetable_class ON public.timetable_entries USING btree (class_id, day_of_week);
CREATE INDEX idx_timetable_room ON public.timetable_entries USING btree (classroom_id);
CREATE INDEX idx_timetable_teacher ON public.timetable_entries USING btree (teacher_id);
CREATE INDEX students_profile_id_idx ON public.students USING btree (profile_id);
CREATE UNIQUE INDEX students_profile_school_unique ON public.students USING btree (profile_id, school_id) WHERE (profile_id IS NOT NULL);
CREATE UNIQUE INDEX uq_academic_years_current ON public.academic_years USING btree (school_id) WHERE (is_current = true);

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.complete_onboarding(p_organization_name text, p_school_name text, p_school_type school_type, p_short_name text, p_address text, p_city text, p_commune text, p_phone text, p_school_email text, p_full_name text, p_academic_year_label text, p_starts_on date, p_ends_on date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
  v_school_id uuid;
  v_year_id uuid;
  v_label text := nullif(trim(p_academic_year_label), '');
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if v_label is null then
    raise exception 'ACADEMIC_YEAR_LABEL_REQUIRED' using errcode = '22023';
  end if;

  if length(v_label) > 50 then
    raise exception 'ACADEMIC_YEAR_LABEL_TOO_LONG' using errcode = '22023';
  end if;

  if p_starts_on is null or p_ends_on is null then
    raise exception 'ACADEMIC_YEAR_DATES_REQUIRED' using errcode = '22023';
  end if;

  if p_ends_on <= p_starts_on then
    raise exception 'ACADEMIC_YEAR_INVALID_DATES' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  v_result := private.create_initial_school(
    p_organization_name => p_organization_name,
    p_school_name => p_school_name,
    p_school_type => p_school_type,
    p_short_name => p_short_name,
    p_address => p_address,
    p_city => p_city,
    p_commune => p_commune,
    p_phone => p_phone,
    p_school_email => p_school_email,
    p_full_name => p_full_name
  );

  v_school_id := (v_result ->> 'school_id')::uuid;

  if exists (
    select 1
    from public.academic_years ay
    where ay.school_id = v_school_id
      and ay.label = v_label
  ) then
    raise exception 'ACADEMIC_YEAR_ALREADY_EXISTS' using errcode = '23505';
  end if;

  insert into public.academic_years (
    school_id, label, starts_on, ends_on, status, is_current
  )
  values (
    v_school_id,
    v_label,
    p_starts_on,
    p_ends_on,
    'active'::public.academic_year_status,
    true
  )
  returning id into v_year_id;

  return v_result || jsonb_build_object('academic_year_id', v_year_id);
end;
$function$;

CREATE OR REPLACE FUNCTION private.create_initial_school(p_organization_name text, p_school_name text, p_school_type school_type DEFAULT 'primaire_secondaire'::school_type, p_short_name text DEFAULT NULL::text, p_address text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_commune text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_school_email text DEFAULT NULL::text, p_full_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_profile_id uuid;
  v_organization_id uuid;
  v_school_id uuid;
  v_slug text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  if nullif(trim(p_organization_name), '') is null then
    raise exception 'ORGANIZATION_NAME_REQUIRED' using errcode = '22023';
  end if;

  if nullif(trim(p_school_name), '') is null then
    raise exception 'SCHOOL_NAME_REQUIRED' using errcode = '22023';
  end if;

  if length(trim(p_organization_name)) > 150 then
    raise exception 'ORGANIZATION_NAME_TOO_LONG' using errcode = '22023';
  end if;

  if length(trim(p_school_name)) > 150 then
    raise exception 'SCHOOL_NAME_TOO_LONG' using errcode = '22023';
  end if;

  select id into v_profile_id
  from public.profiles
  where user_id = v_user_id
  limit 1;

  if v_profile_id is null then
    insert into public.profiles (user_id, email, full_name, is_platform_admin)
    values (v_user_id, v_email, nullif(trim(p_full_name), ''), false)
    returning id into v_profile_id;
  else
    update public.profiles
       set email = coalesce(v_email, email),
           full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
           updated_at = now()
     where id = v_profile_id;
  end if;

  if exists (
    select 1
    from public.school_members sm
    where sm.profile_id = v_profile_id
      and sm.status in ('active'::public.membership_status, 'invited'::public.membership_status)
  ) then
    raise exception 'USER_ALREADY_HAS_SCHOOL' using errcode = '23505';
  end if;

  v_slug := trim(both '-' from regexp_replace(lower(trim(p_organization_name)), '[^a-z0-9]+', '-', 'g'));
  if v_slug is null or v_slug = '' then
    v_slug := 'organisation';
  end if;

  if exists (select 1 from public.organizations where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  end if;

  insert into public.organizations (
    name, slug, email, phone, country_code, subscription_status,
    trial_ends_at, plan_code
  )
  values (
    trim(p_organization_name),
    v_slug,
    coalesce(nullif(trim(p_school_email), ''), v_email),
    nullif(trim(p_phone), ''),
    'CI',
    'trial'::public.subscription_status,
    now() + interval '14 days',
    'starter'
  )
  returning id into v_organization_id;

  insert into public.schools (
    organization_id, name, short_name, type, address, city, commune,
    phone, email, currency_code, is_active, settings
  )
  values (
    v_organization_id,
    trim(p_school_name),
    nullif(trim(p_short_name), ''),
    p_school_type,
    nullif(trim(p_address), ''),
    nullif(trim(p_city), ''),
    nullif(trim(p_commune), ''),
    nullif(trim(p_phone), ''),
    coalesce(nullif(trim(p_school_email), ''), v_email),
    'XOF', true, '{}'::jsonb
  )
  returning id into v_school_id;

  insert into public.school_members (school_id, profile_id, role, status, joined_at)
  values (
    v_school_id,
    v_profile_id,
    'org_admin'::public.app_role,
    'active'::public.membership_status,
    now()
  );

  perform private.seed_school_defaults(v_school_id);

  return jsonb_build_object(
    'organization_id', v_organization_id,
    'school_id', v_school_id,
    'profile_id', v_profile_id,
    'role', 'org_admin'
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.get_user_permissions(p_school_id uuid)
 RETURNS TABLE(permission_code text, module text, action text, label text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with membership as (
    select sm.role
    from public.school_members sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.school_id = p_school_id
      and sm.status = 'active'::public.membership_status
    limit 1
  ), effective as (
    select p.code, p.module, p.action, p.label
    from membership m
    join public.permissions p on true
    left join public.role_permissions rp
      on rp.role = m.role
     and rp.permission_id = p.id
    left join public.school_role_permissions srp
      on srp.school_id = p_school_id
     and srp.role = m.role
     and srp.permission_id = p.id
    where m.role in ('super_admin'::public.app_role, 'org_admin'::public.app_role, 'directeur'::public.app_role)
       or coalesce(srp.allowed, rp.permission_id is not null)
  )
  select code, module, action, label
  from effective
  order by module, action, code;
$function$;

CREATE OR REPLACE FUNCTION private.is_platform_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid()) and p.is_platform_admin = true
  );
$function$;

CREATE OR REPLACE FUNCTION private.is_school_admin_of_profile(p_profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.school_members sm_target
    join public.school_members sm_me on sm_me.school_id = sm_target.school_id
    join public.profiles p_me on p_me.id = sm_me.profile_id
    where sm_target.profile_id = p_profile_id
      and p_me.user_id = auth.uid()
      and sm_me.role = any(array['org_admin'::public.app_role, 'directeur'::public.app_role])
      and sm_me.status = 'active'::public.membership_status
  );
$function$;

CREATE OR REPLACE FUNCTION private.seed_school_defaults(p_school_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_academic_year_id uuid;
  v_level_id uuid;
begin
  if p_school_id is null then
    return;
  end if;

  -- Années scolaires : clôturée 2025-2026, active 2026-2027.
  insert into public.academic_years
    (school_id, label, starts_on, ends_on, status, is_current, created_at, updated_at)
  values
    (p_school_id, '2025-2026', date '2025-09-01', date '2026-06-30',
     'cloturee'::public.academic_year_status, false, now(), now()),
    (p_school_id, '2026-2027', date '2026-09-01', date '2027-07-31',
     'active'::public.academic_year_status, true, now(), now())
  on conflict do nothing;

  -- Une seule année courante par école.
  update public.academic_years
     set is_current = (label = '2026-2027')
   where school_id = p_school_id;

  -- Niveaux (référentiel CP1 -> Tle).
  if not exists (select 1 from public.levels where school_id = p_school_id) then
    insert into public.levels (school_id, code, name, cycle, sequence_no, created_at)
    select p_school_id, v.code, v.name, v.cycle::public.cycle_type, v.seq, now()
    from (
      values
        (1, 'CP1',  'Cours Préparatoire 1', 'Primaire'),
        (2, 'CP2',  'Cours Préparatoire 2', 'Primaire'),
        (3, 'CE1',  'Cours élémentaire 1',  'Primaire'),
        (4, 'CE2',  'Cours élémentaire 2',  'Primaire'),
        (5, 'CM1',  'Cours moyen 1',        'Primaire'),
        (6, 'CM2',  'Cours moyen 2',        'Primaire'),
        (7, '6e',   'Sixième',              'Collège'),
        (8, '5e',   'Cinquième',            'Collège'),
        (9, '4e',   'Quatrième',            'Collège'),
        (10, '3e',  'Troisième',            'Collège'),
        (11, '2nde', 'Seconde',             'Lycée'),
        (12, '1ère', 'Première',            'Lycée'),
        (13, 'Tle', 'Terminale',            'Lycée')
    ) as v(seq, code, name, cycle)
    order by v.seq;
  end if;

  -- Trimestres de l'année scolaire courante.
  select id into v_academic_year_id
  from public.academic_years
  where school_id = p_school_id and label = '2026-2027'
  limit 1;

  if v_academic_year_id is not null then
    if not exists (
      select 1 from public.terms
      where school_id = p_school_id and academic_year_id = v_academic_year_id
    ) then
      insert into public.terms
        (school_id, academic_year_id, label, sequence_no, starts_on, ends_on,
         status, is_current, created_at, updated_at)
      values
        (p_school_id, v_academic_year_id, 'Trimestre 1', 1,
         date '2026-09-01', date '2026-12-18',
         'en_cours'::public.term_status, true, now(), now()),
        (p_school_id, v_academic_year_id, 'Trimestre 2', 2,
         date '2027-01-04', date '2027-03-26',
         'planifie'::public.term_status, false, now(), now()),
        (p_school_id, v_academic_year_id, 'Trimestre 3', 3,
         date '2027-04-12', date '2027-07-09',
         'planifie'::public.term_status, false, now(), now());
    end if;

    -- Classes par défaut : une par niveau.
    if not exists (
      select 1 from public.classes
      where school_id = p_school_id and academic_year_id = v_academic_year_id
    ) then
      for v_level_id in
        select l.id from public.levels l
        where l.school_id = p_school_id
        order by l.sequence_no
      loop
        insert into public.classes
          (school_id, academic_year_id, level_id, name, level_label, cycle,
           capacity, created_at, updated_at)
        select p_school_id, v_academic_year_id, l.id, l.code, l.code, l.cycle,
               45, now(), now()
        from public.levels l
        where l.id = v_level_id;
      end loop;
    end if;
  end if;

  -- Catégories de frais : inscription + scolarité annuelle.
  if not exists (select 1 from public.fee_categories where school_id = p_school_id) then
    insert into public.fee_categories (school_id, name, code, default_amount, is_active, created_at)
    values
      (p_school_id, 'Frais d''inscription', 'INSCRIPTION', 25000, true, now()),
      (p_school_id, 'Scolarité annuelle',   'SCOLARITE',   200000, true, now());
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION private.user_can_manage_assessment(p_assessment_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = (select auth.uid())
      AND p.is_platform_admin = true
  )
  OR EXISTS (
    SELECT 1
    FROM public.assessments a
    WHERE a.id = p_assessment_id
      AND private.user_has_school_role(
        a.school_id,
        ARRAY['org_admin','directeur']::public.app_role[]
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.assessments a
    JOIN public.teachers t ON t.id = a.teacher_id
    JOIN public.profiles p ON p.id = t.profile_id
    JOIN public.teacher_assignments ta
      ON ta.teacher_id = t.id
     AND ta.school_id = a.school_id
     AND ta.academic_year_id = a.academic_year_id
     AND ta.subject_id = a.subject_id
     AND ta.class_id = a.class_id
    WHERE a.id = p_assessment_id
      AND p.user_id = (select auth.uid())
      AND t.school_id = a.school_id
      AND t.status = 'actif'
  );
$function$;

CREATE OR REPLACE FUNCTION private.user_has_permission(p_school_id uuid, p_permission_code text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with membership as (
    select sm.role
    from public.school_members sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.school_id = p_school_id
      and sm.status = 'active'::public.membership_status
    limit 1
  ), permission as (
    select id
    from public.permissions
    where code = p_permission_code
    limit 1
  )
  select exists (
    select 1 from membership m
    where m.role in ('super_admin'::public.app_role, 'org_admin'::public.app_role, 'directeur'::public.app_role)
  )
  or exists (
    select 1
    from membership m
    cross join permission p
    left join public.school_role_permissions override
      on override.school_id = p_school_id
     and override.role = m.role
     and override.permission_id = p.id
    left join public.role_permissions rp
      on rp.role = m.role
     and rp.permission_id = p.id
    where coalesce(override.allowed, rp.permission_id is not null)
  );
$function$;

CREATE OR REPLACE FUNCTION private.user_has_school_role(p_school_id uuid, roles app_role[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.school_members sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.school_id = p_school_id
      and sm.status = 'active'::public.membership_status
      and sm.role = any(roles)
  );
$function$;

CREATE OR REPLACE FUNCTION private.user_is_school_member(p_school_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM private.user_school_ids() sid
    WHERE sid = p_school_id
  );
$function$;

CREATE OR REPLACE FUNCTION private.user_related_guardian_ids(p_school_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select g.id
  from public.guardians g
  join public.profiles p on p.id = g.profile_id
  where p.user_id = (select auth.uid())
    and g.school_id = p_school_id

  union

  select sg.guardian_id
  from public.student_guardians sg
  where sg.school_id = p_school_id
    and sg.student_id in (select private.user_related_student_ids(p_school_id));
$function$;

CREATE OR REPLACE FUNCTION private.user_related_student_ids(p_school_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select s.id
  from public.students s
  join public.profiles p on p.id = s.profile_id
  where p.user_id = (select auth.uid())
    and s.school_id = p_school_id

  union

  select sg.student_id
  from public.student_guardians sg
  join public.guardians g on g.id = sg.guardian_id
  join public.profiles p on p.id = g.profile_id
  where p.user_id = (select auth.uid())
    and sg.school_id = p_school_id;
$function$;

CREATE OR REPLACE FUNCTION private.user_school_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT sm.school_id
  FROM public.school_members sm
  JOIN public.profiles p ON p.id = sm.profile_id
  WHERE p.user_id = (select auth.uid())
    AND sm.status = 'active';
$function$;

CREATE OR REPLACE FUNCTION private.validate_assessment_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Assessment: academic_year_id does not belong to school_id';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.classes c WHERE c.id=NEW.class_id AND c.school_id=NEW.school_id AND c.academic_year_id=NEW.academic_year_id) THEN
    RAISE EXCEPTION 'Assessment: class_id does not belong to school and academic year';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subjects s WHERE s.id=NEW.subject_id AND s.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Assessment: subject_id does not belong to school_id';
  END IF;
  IF NEW.teacher_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id=NEW.teacher_id AND t.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Assessment: teacher_id does not belong to school_id';
  END IF;
  IF NEW.term_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.terms t WHERE t.id=NEW.term_id AND t.school_id=NEW.school_id AND t.academic_year_id=NEW.academic_year_id) THEN
    RAISE EXCEPTION 'Assessment: term_id does not belong to school and academic year';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION private.validate_enrollment_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id=NEW.student_id AND s.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Enrollment: student_id does not belong to school_id';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Enrollment: academic_year_id does not belong to school_id';
  END IF;
  IF NEW.class_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.classes c WHERE c.id=NEW.class_id AND c.school_id=NEW.school_id AND c.academic_year_id=NEW.academic_year_id) THEN
    RAISE EXCEPTION 'Enrollment: class_id does not belong to school and academic year';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION private.validate_fee_structure_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Fee structure: academic_year_id does not belong to school_id';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.fee_categories f WHERE f.id=NEW.fee_category_id AND f.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Fee structure: fee_category_id does not belong to school_id';
  END IF;
  IF NEW.level_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.levels l WHERE l.id=NEW.level_id AND l.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Fee structure: level_id does not belong to school_id';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION private.validate_grade_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_class_id uuid; v_year_id uuid;
BEGIN
  -- Legacy rows that already contain a class mismatch may still have their score edited;
  -- any attempt to reassign the school, assessment, or student is revalidated.
  IF TG_OP = 'UPDATE'
     AND NEW.school_id = OLD.school_id
     AND NEW.assessment_id = OLD.assessment_id
     AND NEW.student_id = OLD.student_id THEN
    RETURN NEW;
  END IF;

  SELECT a.class_id, a.academic_year_id INTO v_class_id, v_year_id
  FROM public.assessments a
  WHERE a.id=NEW.assessment_id AND a.school_id=NEW.school_id;
  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'Grade: assessment_id does not belong to school_id';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id=NEW.student_id AND s.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Grade: student_id does not belong to school_id';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.student_id=NEW.student_id
      AND e.school_id=NEW.school_id
      AND e.academic_year_id=v_year_id
      AND e.class_id=v_class_id
      AND e.status <> 'annulee'::public.enrollment_status
  ) THEN
    RAISE EXCEPTION 'Grade: student is not enrolled in the assessed class and academic year';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION private.validate_payment_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id=NEW.student_id AND s.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Payment: student_id does not belong to school_id';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Payment: academic_year_id does not belong to school_id';
  END IF;
  IF NEW.enrollment_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.id=NEW.enrollment_id AND e.school_id=NEW.school_id
      AND e.student_id=NEW.student_id AND e.academic_year_id=NEW.academic_year_id
  ) THEN
    RAISE EXCEPTION 'Payment: enrollment_id is inconsistent with school, student or academic year';
  END IF;
  IF NEW.fee_category_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.fee_categories f WHERE f.id=NEW.fee_category_id AND f.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Payment: fee_category_id does not belong to school_id';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION private.validate_receipt_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.payments p WHERE p.id=NEW.payment_id AND p.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Receipt: payment_id does not belong to school_id';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION private.validate_student_guardian_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id=NEW.student_id AND s.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Student guardian link: student_id does not belong to school_id';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.guardians g WHERE g.id=NEW.guardian_id AND g.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Student guardian link: guardian_id does not belong to school_id';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION private.validate_teacher_assignment_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id=NEW.teacher_id AND t.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Teacher assignment: teacher_id does not belong to school_id';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subjects s WHERE s.id=NEW.subject_id AND s.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Teacher assignment: subject_id does not belong to school_id';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.classes c WHERE c.id=NEW.class_id AND c.school_id=NEW.school_id AND c.academic_year_id=NEW.academic_year_id) THEN
    RAISE EXCEPTION 'Teacher assignment: class_id does not belong to school and academic year';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id) THEN
    RAISE EXCEPTION 'Teacher assignment: academic_year_id does not belong to school_id';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.check_grade_max_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_max numeric;
BEGIN
  IF NEW.score IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT max_score INTO v_max FROM public.assessments WHERE id = NEW.assessment_id;
  IF NEW.score > v_max THEN
    RAISE EXCEPTION 'Note % supérieure au barème %', NEW.score, v_max;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_onboarding(p_organization_name text, p_school_name text, p_school_type school_type, p_short_name text DEFAULT NULL::text, p_address text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_commune text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_school_email text DEFAULT NULL::text, p_full_name text DEFAULT NULL::text, p_academic_year_label text DEFAULT NULL::text, p_starts_on date DEFAULT NULL::date, p_ends_on date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if (select auth.uid()) is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  return private.complete_onboarding(
    p_organization_name => p_organization_name,
    p_school_name => p_school_name,
    p_school_type => p_school_type,
    p_short_name => p_short_name,
    p_address => p_address,
    p_city => p_city,
    p_commune => p_commune,
    p_phone => p_phone,
    p_school_email => p_school_email,
    p_full_name => p_full_name,
    p_academic_year_label => p_academic_year_label,
    p_starts_on => p_starts_on,
    p_ends_on => p_ends_on
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_initial_school(p_organization_name text, p_school_name text, p_school_type school_type DEFAULT 'primaire_secondaire'::school_type, p_short_name text DEFAULT NULL::text, p_address text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_commune text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_school_email text DEFAULT NULL::text, p_full_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  return private.create_initial_school(
    p_organization_name => p_organization_name,
    p_school_name => p_school_name,
    p_school_type => p_school_type,
    p_short_name => p_short_name,
    p_address => p_address,
    p_city => p_city,
    p_commune => p_commune,
    p_phone => p_phone,
    p_school_email => p_school_email,
    p_full_name => p_full_name
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.current_profile_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT id
  FROM public.profiles
  WHERE user_id = (select auth.uid())
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_school_admin_of_profile(p_profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select private.is_school_admin_of_profile(p_profile_id);
$function$;

CREATE OR REPLACE FUNCTION public.my_permissions(p_school_id uuid)
 RETURNS TABLE(permission_code text, module text, action text, label text)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select * from private.get_user_permissions(p_school_id);
$function$;

CREATE OR REPLACE FUNCTION public.protect_audit_log_immutability()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.actor_id IS DISTINCT FROM OLD.actor_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Un audit log est immuable';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  -- Server-side/service-role operations are allowed to manage these fields.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Modification de user_id interdite';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Modification de id interdite';
  END IF;

  IF NEW.is_platform_admin IS DISTINCT FROM OLD.is_platform_admin THEN
    RAISE EXCEPTION 'Modification de is_platform_admin interdite';
  END IF;

  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Modification de created_at interdite';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_school_member_identity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Modification de id interdite';
  END IF;

  IF NEW.school_id IS DISTINCT FROM OLD.school_id THEN
    RAISE EXCEPTION 'Modification de school_id interdite';
  END IF;

  IF NEW.profile_id IS DISTINCT FROM OLD.profile_id THEN
    RAISE EXCEPTION 'Modification de profile_id interdite';
  END IF;

  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Modification de created_at interdite';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_enrollment_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_enrollment_id uuid;
  v_paid numeric;
  v_due numeric;
  v_student_id uuid;
  v_year_id uuid;
BEGIN
  v_enrollment_id := COALESCE(NEW.enrollment_id, OLD.enrollment_id);
  v_student_id := COALESCE(NEW.student_id, OLD.student_id);
  v_year_id := COALESCE(NEW.academic_year_id, OLD.academic_year_id);

  IF v_enrollment_id IS NULL AND v_student_id IS NOT NULL AND v_year_id IS NOT NULL THEN
    SELECT e.id INTO v_enrollment_id
    FROM public.enrollments e
    WHERE e.student_id = v_student_id AND e.academic_year_id = v_year_id
    LIMIT 1;
  END IF;

  IF v_enrollment_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(p.amount), 0) INTO v_paid
  FROM public.payments p
  WHERE p.enrollment_id = v_enrollment_id
     OR (
       p.student_id = (SELECT student_id FROM public.enrollments WHERE id = v_enrollment_id)
       AND p.academic_year_id = (SELECT academic_year_id FROM public.enrollments WHERE id = v_enrollment_id)
     );

  SELECT amount_due INTO v_due FROM public.enrollments WHERE id = v_enrollment_id;

  UPDATE public.enrollments
  SET
    amount_paid = v_paid,
    payment_status = CASE
      WHEN v_paid <= 0 THEN 'retard'::public.payment_status
      WHEN v_paid >= v_due THEN 'a_jour'::public.payment_status
      ELSE 'partiel'::public.payment_status
    END,
    updated_at = now()
  WHERE id = v_enrollment_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.stamp_audit_log()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.actor_id := public.current_profile_id();
    NEW.created_at := now();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_can_manage_assessment(p_assessment_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$ SELECT private.user_can_manage_assessment(p_assessment_id); $function$;

CREATE OR REPLACE FUNCTION public.user_has_permission(p_school_id uuid, p_permission_code text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select private.user_has_permission(p_school_id, p_permission_code);
$function$;

CREATE OR REPLACE FUNCTION public.user_has_school_role(p_school_id uuid, roles app_role[])
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$ SELECT private.user_has_school_role(p_school_id, roles); $function$;

CREATE OR REPLACE FUNCTION public.user_is_school_member(p_school_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$ SELECT private.user_is_school_member(p_school_id); $function$;

CREATE OR REPLACE FUNCTION public.user_school_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$ SELECT * FROM private.user_school_ids(); $function$;

CREATE OR REPLACE FUNCTION public.validate_school_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'classes' THEN
    IF NOT EXISTS (SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id) THEN
      RAISE EXCEPTION 'La classe doit appartenir à la même école que l''année académique';
    END IF;
    IF NEW.level_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM levels l WHERE l.id=NEW.level_id AND l.school_id=NEW.school_id) THEN
      RAISE EXCEPTION 'Le niveau doit appartenir à la même école que la classe';
    END IF;
    IF NEW.head_teacher_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.id=NEW.head_teacher_id AND t.school_id=NEW.school_id) THEN
      RAISE EXCEPTION 'Le professeur principal doit appartenir à la même école que la classe';
    END IF;
  ELSIF TG_TABLE_NAME = 'enrollments' THEN
    IF NOT EXISTS (SELECT 1 FROM students s WHERE s.id=NEW.student_id AND s.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''élève doit appartenir à la même école que l''inscription'; END IF;
    IF NOT EXISTS (SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''année académique doit appartenir à la même école que l''inscription'; END IF;
    IF NEW.class_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM classes c WHERE c.id=NEW.class_id AND c.school_id=NEW.school_id AND c.academic_year_id=NEW.academic_year_id) THEN RAISE EXCEPTION 'La classe doit appartenir à la même école et année académique'; END IF;
  ELSIF TG_TABLE_NAME = 'assessments' THEN
    IF NOT EXISTS (SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''année académique de l''évaluation est incohérente'; END IF;
    IF NOT EXISTS (SELECT 1 FROM classes c WHERE c.id=NEW.class_id AND c.school_id=NEW.school_id AND c.academic_year_id=NEW.academic_year_id) THEN RAISE EXCEPTION 'La classe de l''évaluation est incohérente'; END IF;
    IF NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id=NEW.subject_id AND s.school_id=NEW.school_id) THEN RAISE EXCEPTION 'La matière de l''évaluation est incohérente'; END IF;
    IF NEW.teacher_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.id=NEW.teacher_id AND t.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''enseignant de l''évaluation est incohérent'; END IF;
    IF NEW.term_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM terms t WHERE t.id=NEW.term_id AND t.school_id=NEW.school_id AND t.academic_year_id=NEW.academic_year_id) THEN RAISE EXCEPTION 'Le trimestre de l''évaluation est incohérent'; END IF;
  ELSIF TG_TABLE_NAME = 'teacher_assignments' THEN
    IF NOT EXISTS (SELECT 1 FROM teachers t WHERE t.id=NEW.teacher_id AND t.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''enseignant affecté est incohérent'; END IF;
    IF NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id=NEW.subject_id AND s.school_id=NEW.school_id) THEN RAISE EXCEPTION 'La matière affectée est incohérente'; END IF;
    IF NOT EXISTS (SELECT 1 FROM classes c WHERE c.id=NEW.class_id AND c.school_id=NEW.school_id AND c.academic_year_id=NEW.academic_year_id) THEN RAISE EXCEPTION 'La classe affectée est incohérente'; END IF;
    IF NOT EXISTS (SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''année académique affectée est incohérente'; END IF;
  ELSIF TG_TABLE_NAME = 'grades' THEN
    IF NOT EXISTS (SELECT 1 FROM assessments a WHERE a.id=NEW.assessment_id AND a.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''évaluation de la note est incohérente'; END IF;
    IF NOT EXISTS (SELECT 1 FROM students s WHERE s.id=NEW.student_id AND s.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''élève de la note est incohérent'; END IF;
    IF NOT EXISTS (SELECT 1 FROM assessments a JOIN enrollments e ON e.academic_year_id=a.academic_year_id AND e.class_id=a.class_id WHERE a.id=NEW.assessment_id AND e.student_id=NEW.student_id AND e.school_id=NEW.school_id AND e.status <> 'annulee') THEN RAISE EXCEPTION 'La note doit concerner un élève inscrit dans la classe et l''année de l''évaluation'; END IF;
  ELSIF TG_TABLE_NAME = 'fee_structures' THEN
    IF NOT EXISTS (SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''année de tarification est incohérente'; END IF;
    IF NOT EXISTS (SELECT 1 FROM fee_categories f WHERE f.id=NEW.fee_category_id AND f.school_id=NEW.school_id) THEN RAISE EXCEPTION 'La catégorie de frais est incohérente'; END IF;
    IF NEW.level_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM levels l WHERE l.id=NEW.level_id AND l.school_id=NEW.school_id) THEN RAISE EXCEPTION 'Le niveau tarifaire est incohérent'; END IF;
  ELSIF TG_TABLE_NAME = 'payments' THEN
    IF NOT EXISTS (SELECT 1 FROM students s WHERE s.id=NEW.student_id AND s.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''élève du paiement est incohérent'; END IF;
    IF NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.id=NEW.enrollment_id AND e.school_id=NEW.school_id AND e.student_id=NEW.student_id) THEN RAISE EXCEPTION 'L''inscription du paiement est incohérente'; END IF;
    IF NOT EXISTS (SELECT 1 FROM academic_years y WHERE y.id=NEW.academic_year_id AND y.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''année du paiement est incohérente'; END IF;
    IF NOT EXISTS (SELECT 1 FROM fee_categories f WHERE f.id=NEW.fee_category_id AND f.school_id=NEW.school_id) THEN RAISE EXCEPTION 'La catégorie du paiement est incohérente'; END IF;
  ELSIF TG_TABLE_NAME = 'receipts' THEN
    IF NOT EXISTS (SELECT 1 FROM payments p WHERE p.id=NEW.payment_id AND p.school_id=NEW.school_id) THEN RAISE EXCEPTION 'Le paiement du reçu est incohérent'; END IF;
  ELSIF TG_TABLE_NAME = 'student_guardians' THEN
    IF NOT EXISTS (SELECT 1 FROM students s WHERE s.id=NEW.student_id AND s.school_id=NEW.school_id) THEN RAISE EXCEPTION 'L''élève du responsable est incohérent'; END IF;
    IF NOT EXISTS (SELECT 1 FROM guardians g WHERE g.id=NEW.guardian_id AND g.school_id=NEW.school_id) THEN RAISE EXCEPTION 'Le responsable est incohérent'; END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_academic_years_updated BEFORE UPDATE ON academic_years FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_assessments_school_integrity BEFORE INSERT OR UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION validate_school_integrity();

CREATE TRIGGER trg_assessments_updated BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_validate_assessment_scope BEFORE INSERT OR UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION private.validate_assessment_scope();

CREATE TRIGGER trg_attendance_records_updated BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_audit_logs_immutable BEFORE UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION protect_audit_log_immutability();

CREATE TRIGGER trg_audit_logs_stamp BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION stamp_audit_log();

CREATE TRIGGER trg_classes_school_integrity BEFORE INSERT OR UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION validate_school_integrity();

CREATE TRIGGER trg_classes_updated BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_classrooms_updated BEFORE UPDATE ON classrooms FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_enrollments_school_integrity BEFORE INSERT OR UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION validate_school_integrity();

CREATE TRIGGER trg_enrollments_updated BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_validate_enrollment_scope BEFORE INSERT OR UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION private.validate_enrollment_scope();

CREATE TRIGGER trg_fee_structures_school_integrity BEFORE INSERT OR UPDATE ON fee_structures FOR EACH ROW EXECUTE FUNCTION validate_school_integrity();

CREATE TRIGGER trg_validate_fee_structure_scope BEFORE INSERT OR UPDATE ON fee_structures FOR EACH ROW EXECUTE FUNCTION private.validate_fee_structure_scope();

CREATE TRIGGER trg_grades_max_score BEFORE INSERT OR UPDATE OF score ON grades FOR EACH ROW EXECUTE FUNCTION check_grade_max_score();

CREATE TRIGGER trg_grades_school_integrity BEFORE INSERT OR UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION validate_school_integrity();

CREATE TRIGGER trg_grades_updated BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_validate_grade_scope BEFORE INSERT OR UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION private.validate_grade_scope();

CREATE TRIGGER trg_guardians_updated BEFORE UPDATE ON guardians FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_incident_reports_updated BEFORE UPDATE ON incident_reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_refresh_enrollment AFTER INSERT OR DELETE OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION refresh_enrollment_payment_status();

CREATE TRIGGER trg_payments_school_integrity BEFORE INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION validate_school_integrity();

CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_validate_payment_scope BEFORE INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION private.validate_payment_scope();

CREATE TRIGGER trg_profiles_protect_security_fields BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_security_fields();

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_receipts_school_integrity BEFORE INSERT OR UPDATE ON receipts FOR EACH ROW EXECUTE FUNCTION validate_school_integrity();

CREATE TRIGGER trg_validate_receipt_scope BEFORE INSERT OR UPDATE ON receipts FOR EACH ROW EXECUTE FUNCTION private.validate_receipt_scope();

CREATE TRIGGER trg_school_members_protect_identity BEFORE UPDATE ON school_members FOR EACH ROW EXECUTE FUNCTION protect_school_member_identity();

CREATE TRIGGER trg_school_members_updated BEFORE UPDATE ON school_members FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_schools_updated BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_student_guardians_school_integrity BEFORE INSERT OR UPDATE ON student_guardians FOR EACH ROW EXECUTE FUNCTION validate_school_integrity();

CREATE TRIGGER trg_validate_student_guardian_scope BEFORE INSERT OR UPDATE ON student_guardians FOR EACH ROW EXECUTE FUNCTION private.validate_student_guardian_scope();

CREATE TRIGGER trg_students_updated BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_teacher_assignments_school_integrity BEFORE INSERT OR UPDATE ON teacher_assignments FOR EACH ROW EXECUTE FUNCTION validate_school_integrity();

CREATE TRIGGER trg_validate_teacher_assignment_scope BEFORE INSERT OR UPDATE ON teacher_assignments FOR EACH ROW EXECUTE FUNCTION private.validate_teacher_assignment_scope();

CREATE TRIGGER trg_teachers_updated BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_terms_updated BEFORE UPDATE ON terms FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_timetable_entries_updated BEFORE UPDATE ON timetable_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = 'ensure_rls') THEN
    CREATE EVENT TRIGGER ensure_rls ON ddl_command_end EXECUTE FUNCTION public.rls_auto_enable();
  END IF;
END $$;

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY academic_years_delete_authorized ON public.academic_years
  FOR DELETE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))))
;
CREATE POLICY academic_years_insert_authorized ON public.academic_years
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));
CREATE POLICY academic_years_select_member ON public.academic_years
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY academic_years_update_authorized ON public.academic_years
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY announcements_delete_authorized ON public.announcements
  FOR DELETE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]))
;
CREATE POLICY announcements_insert_authorized ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role]));
CREATE POLICY announcements_select_member ON public.announcements
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY announcements_update_authorized ON public.announcements
  FOR UPDATE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role]))
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role]));

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessments_delete_authorized ON public.assessments
  FOR DELETE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
;
CREATE POLICY assessments_insert_authorized ON public.assessments
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) OR (user_has_school_role(school_id, ARRAY['enseignant'::app_role]) AND (EXISTS ( SELECT 1
   FROM ((teachers t
     JOIN profiles p ON ((p.id = t.profile_id)))
     JOIN teacher_assignments ta ON (((ta.teacher_id = t.id) AND (ta.school_id = assessments.school_id) AND (ta.academic_year_id = assessments.academic_year_id) AND (ta.subject_id = assessments.subject_id) AND (ta.class_id = assessments.class_id))))
  WHERE ((p.user_id = auth.uid()) AND (t.id = assessments.teacher_id) AND (t.status = 'actif'::teacher_status)))))));
CREATE POLICY assessments_select_member ON public.assessments
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY assessments_update_authorized ON public.assessments
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) OR (user_has_school_role(school_id, ARRAY['enseignant'::app_role]) AND user_can_manage_assessment(id))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) OR (user_has_school_role(school_id, ARRAY['enseignant'::app_role]) AND user_can_manage_assessment(id))));

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendance_records_delete_authorized ON public.attendance_records
  FOR DELETE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]))
;
CREATE POLICY attendance_records_insert_authorized ON public.attendance_records
  FOR INSERT TO authenticated
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role, 'enseignant'::app_role]));
CREATE POLICY attendance_records_select_member ON public.attendance_records
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY attendance_records_update_authorized ON public.attendance_records
  FOR UPDATE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role, 'enseignant'::app_role]))
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role, 'enseignant'::app_role]));

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (((actor_id = current_profile_id()) AND (((school_id IS NOT NULL) AND user_is_school_member(school_id)) OR ((school_id IS NULL) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = current_profile_id()) AND (p.is_platform_admin = true))))))));
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING ((((school_id IS NOT NULL) AND user_is_school_member(school_id)) OR ((school_id IS NULL) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))))))
;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY classes_delete_authorized ON public.classes
  FOR DELETE TO authenticated
  USING (( SELECT user_has_school_role(classes.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role))
;
CREATE POLICY classes_insert_authorized ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));
CREATE POLICY classes_select_member ON public.classes
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY classes_update_authorized ON public.classes
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY classrooms_delete_authorized ON public.classrooms
  FOR DELETE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]))
;
CREATE POLICY classrooms_insert_authorized ON public.classrooms
  FOR INSERT TO authenticated
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]));
CREATE POLICY classrooms_select_member ON public.classrooms
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY classrooms_update_authorized ON public.classrooms
  FOR UPDATE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]))
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]));

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY enrollments_delete_authorized ON public.enrollments
  FOR DELETE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
;
CREATE POLICY enrollments_insert_authorized ON public.enrollments
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role])));
CREATE POLICY enrollments_select_scoped ON public.enrollments
  FOR SELECT TO authenticated
  USING ((private.is_platform_admin() OR private.user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role, 'comptable'::app_role]) OR (student_id IN ( SELECT private.user_related_student_ids(enrollments.school_id) AS user_related_student_ids))))
;
CREATE POLICY enrollments_update_authorized ON public.enrollments
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role])))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role])));

ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_categories_delete_authorized ON public.fee_categories
  FOR DELETE TO authenticated
  USING (( SELECT user_has_school_role(fee_categories.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role))
;
CREATE POLICY fee_categories_insert_authorized ON public.fee_categories
  FOR INSERT TO authenticated
  WITH CHECK (( SELECT user_has_school_role(fee_categories.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'comptable'::app_role]) AS user_has_school_role));
CREATE POLICY fee_categories_select_member ON public.fee_categories
  FOR SELECT TO authenticated
  USING (( SELECT user_is_school_member(fee_categories.school_id) AS user_is_school_member))
;
CREATE POLICY fee_categories_update_authorized ON public.fee_categories
  FOR UPDATE TO authenticated
  USING (( SELECT user_has_school_role(fee_categories.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'comptable'::app_role]) AS user_has_school_role))
  WITH CHECK (( SELECT user_has_school_role(fee_categories.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'comptable'::app_role]) AS user_has_school_role));

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_structures_delete_authorized ON public.fee_structures
  FOR DELETE TO authenticated
  USING (( SELECT user_has_school_role(fee_structures.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role))
;
CREATE POLICY fee_structures_insert_authorized ON public.fee_structures
  FOR INSERT TO authenticated
  WITH CHECK (( SELECT user_has_school_role(fee_structures.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'comptable'::app_role]) AS user_has_school_role));
CREATE POLICY fee_structures_select_member ON public.fee_structures
  FOR SELECT TO authenticated
  USING (( SELECT user_is_school_member(fee_structures.school_id) AS user_is_school_member))
;
CREATE POLICY fee_structures_update_authorized ON public.fee_structures
  FOR UPDATE TO authenticated
  USING (( SELECT user_has_school_role(fee_structures.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'comptable'::app_role]) AS user_has_school_role))
  WITH CHECK (( SELECT user_has_school_role(fee_structures.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'comptable'::app_role]) AS user_has_school_role));

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY grades_delete_authorized ON public.grades
  FOR DELETE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
;
CREATE POLICY grades_insert_authorized ON public.grades
  FOR INSERT TO authenticated
  WITH CHECK ((((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) OR (user_has_school_role(school_id, ARRAY['enseignant'::app_role]) AND user_can_manage_assessment(assessment_id))) AND (EXISTS ( SELECT 1
   FROM students s
  WHERE ((s.id = grades.student_id) AND (s.school_id = grades.school_id)))) AND (EXISTS ( SELECT 1
   FROM assessments a
  WHERE ((a.id = grades.assessment_id) AND (a.school_id = grades.school_id))))));
CREATE POLICY grades_select_scoped ON public.grades
  FOR SELECT TO authenticated
  USING ((private.is_platform_admin() OR private.user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'enseignant'::app_role]) OR (student_id IN ( SELECT private.user_related_student_ids(grades.school_id) AS user_related_student_ids))))
;
CREATE POLICY grades_update_authorized ON public.grades
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) OR (user_has_school_role(school_id, ARRAY['enseignant'::app_role]) AND user_can_manage_assessment(assessment_id))))
  WITH CHECK ((((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) OR (user_has_school_role(school_id, ARRAY['enseignant'::app_role]) AND user_can_manage_assessment(assessment_id))) AND (EXISTS ( SELECT 1
   FROM students s
  WHERE ((s.id = grades.student_id) AND (s.school_id = grades.school_id)))) AND (EXISTS ( SELECT 1
   FROM assessments a
  WHERE ((a.id = grades.assessment_id) AND (a.school_id = grades.school_id))))));

ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
CREATE POLICY guardians_delete_authorized ON public.guardians
  FOR DELETE TO authenticated
  USING (( SELECT user_has_school_role(guardians.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role))
;
CREATE POLICY guardians_insert_authorized ON public.guardians
  FOR INSERT TO authenticated
  WITH CHECK (( SELECT user_has_school_role(guardians.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role]) AS user_has_school_role));
CREATE POLICY guardians_select_scoped ON public.guardians
  FOR SELECT TO authenticated
  USING ((private.is_platform_admin() OR private.user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role, 'comptable'::app_role]) OR (id IN ( SELECT private.user_related_guardian_ids(guardians.school_id) AS user_related_guardian_ids))))
;
CREATE POLICY guardians_update_authorized ON public.guardians
  FOR UPDATE TO authenticated
  USING (( SELECT user_has_school_role(guardians.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role]) AS user_has_school_role))
  WITH CHECK (( SELECT user_has_school_role(guardians.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role]) AS user_has_school_role));

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY incident_reports_delete_authorized ON public.incident_reports
  FOR DELETE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]))
;
CREATE POLICY incident_reports_insert_authorized ON public.incident_reports
  FOR INSERT TO authenticated
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role, 'enseignant'::app_role]));
CREATE POLICY incident_reports_select_member ON public.incident_reports
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY incident_reports_update_authorized ON public.incident_reports
  FOR UPDATE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role]))
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role]));

ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY levels_delete_authorized ON public.levels
  FOR DELETE TO authenticated
  USING (( SELECT user_has_school_role(levels.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role))
;
CREATE POLICY levels_insert_authorized ON public.levels
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));
CREATE POLICY levels_select_member ON public.levels
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY levels_update_authorized ON public.levels
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY organizations_select ON public.organizations
  FOR SELECT TO authenticated
  USING (((id IN ( SELECT s.organization_id
   FROM schools s
  WHERE (s.id IN ( SELECT user_school_ids() AS user_school_ids)))) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND p.is_platform_admin)))))
;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_delete_authorized ON public.payments
  FOR DELETE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))))
;
CREATE POLICY payments_insert_authorized ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'comptable'::app_role])));
CREATE POLICY payments_select_scoped ON public.payments
  FOR SELECT TO authenticated
  USING ((private.is_platform_admin() OR private.user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'comptable'::app_role, 'secretaire'::app_role]) OR (student_id IN ( SELECT private.user_related_student_ids(payments.school_id) AS user_related_student_ids))))
;
CREATE POLICY payments_update_authorized ON public.payments
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY permissions_select_members ON public.permissions
  FOR SELECT TO authenticated
  USING ((private.is_platform_admin() OR (EXISTS ( SELECT 1
   FROM (school_members sm
     JOIN profiles p ON ((p.id = sm.profile_id)))
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::membership_status))))))
;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (is_platform_admin = false)));
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (((user_id = auth.uid()) OR (is_platform_admin = true)))
;
CREATE POLICY profiles_select_school_admin ON public.profiles
  FOR SELECT TO public
  USING (is_school_admin_of_profile(id))
;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (is_platform_admin = false)));

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY receipts_delete_authorized ON public.receipts
  FOR DELETE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))))
;
CREATE POLICY receipts_insert_authorized ON public.receipts
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'comptable'::app_role])));
CREATE POLICY receipts_select_scoped ON public.receipts
  FOR SELECT TO authenticated
  USING ((private.is_platform_admin() OR private.user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'comptable'::app_role, 'secretaire'::app_role]) OR (EXISTS ( SELECT 1
   FROM payments pay
  WHERE ((pay.id = receipts.payment_id) AND (pay.student_id IN ( SELECT private.user_related_student_ids(receipts.school_id) AS user_related_student_ids)))))))
;
CREATE POLICY receipts_update_authorized ON public.receipts
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_permissions_select_members ON public.role_permissions
  FOR SELECT TO authenticated
  USING ((private.is_platform_admin() OR (EXISTS ( SELECT 1
   FROM (school_members sm
     JOIN profiles p ON ((p.id = sm.profile_id)))
  WHERE ((p.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::membership_status))))))
;

ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY school_members_delete_manage ON public.school_members
  FOR DELETE TO authenticated
  USING ((( SELECT user_has_school_role(school_members.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role) AND ((role <> 'org_admin'::app_role) OR ( SELECT user_has_school_role(school_members.school_id, ARRAY['org_admin'::app_role]) AS user_has_school_role))))
;
CREATE POLICY school_members_insert_manage ON public.school_members
  FOR INSERT TO authenticated
  WITH CHECK ((( SELECT user_has_school_role(school_members.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role) AND ((role <> 'org_admin'::app_role) OR ( SELECT user_has_school_role(school_members.school_id, ARRAY['org_admin'::app_role]) AS user_has_school_role))));
CREATE POLICY school_members_select ON public.school_members
  FOR SELECT TO authenticated
  USING ((school_id IN ( SELECT user_school_ids() AS user_school_ids)))
;
CREATE POLICY school_members_update_manage ON public.school_members
  FOR UPDATE TO authenticated
  USING (( SELECT user_has_school_role(school_members.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role))
  WITH CHECK ((( SELECT user_has_school_role(school_members.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role) AND ((role <> 'org_admin'::app_role) OR ( SELECT user_has_school_role(school_members.school_id, ARRAY['org_admin'::app_role]) AS user_has_school_role))));

ALTER TABLE public.school_role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY school_role_permissions_delete_managers ON public.school_role_permissions
  FOR DELETE TO authenticated
  USING ((( SELECT private.user_has_school_role(school_role_permissions.school_id, ARRAY['super_admin'::app_role, 'org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role) AND (role <> ALL (ARRAY['super_admin'::app_role, 'org_admin'::app_role, 'directeur'::app_role]))))
;
CREATE POLICY school_role_permissions_insert_managers ON public.school_role_permissions
  FOR INSERT TO authenticated
  WITH CHECK (((updated_by = ( SELECT auth.uid() AS uid)) AND ( SELECT private.user_has_school_role(school_role_permissions.school_id, ARRAY['super_admin'::app_role, 'org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role) AND (role <> ALL (ARRAY['super_admin'::app_role, 'org_admin'::app_role, 'directeur'::app_role]))));
CREATE POLICY school_role_permissions_select_managers ON public.school_role_permissions
  FOR SELECT TO authenticated
  USING (( SELECT private.user_has_school_role(school_role_permissions.school_id, ARRAY['super_admin'::app_role, 'org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role))
;
CREATE POLICY school_role_permissions_update_managers ON public.school_role_permissions
  FOR UPDATE TO authenticated
  USING ((( SELECT private.user_has_school_role(school_role_permissions.school_id, ARRAY['super_admin'::app_role, 'org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role) AND (role <> ALL (ARRAY['super_admin'::app_role, 'org_admin'::app_role, 'directeur'::app_role]))))
  WITH CHECK (((updated_by = ( SELECT auth.uid() AS uid)) AND ( SELECT private.user_has_school_role(school_role_permissions.school_id, ARRAY['super_admin'::app_role, 'org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role) AND (role <> ALL (ARRAY['super_admin'::app_role, 'org_admin'::app_role, 'directeur'::app_role]))));

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY schools_select_member ON public.schools
  FOR SELECT TO authenticated
  USING (((id IN ( SELECT user_school_ids() AS user_school_ids)) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND p.is_platform_admin)))))
;
CREATE POLICY schools_update_admin ON public.schools
  FOR UPDATE TO authenticated
  USING (user_has_school_role(id, ARRAY['org_admin'::app_role, 'directeur'::app_role]))
;

ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_guardians_delete_authorized ON public.student_guardians
  FOR DELETE TO authenticated
  USING (( SELECT user_has_school_role(student_guardians.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role))
;
CREATE POLICY student_guardians_insert_authorized ON public.student_guardians
  FOR INSERT TO authenticated
  WITH CHECK (( SELECT user_has_school_role(student_guardians.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role]) AS user_has_school_role));
CREATE POLICY student_guardians_select_scoped ON public.student_guardians
  FOR SELECT TO authenticated
  USING ((private.is_platform_admin() OR private.user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role, 'comptable'::app_role]) OR (student_id IN ( SELECT private.user_related_student_ids(student_guardians.school_id) AS user_related_student_ids))))
;
CREATE POLICY student_guardians_update_authorized ON public.student_guardians
  FOR UPDATE TO authenticated
  USING (( SELECT user_has_school_role(student_guardians.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role]) AS user_has_school_role))
  WITH CHECK (( SELECT user_has_school_role(student_guardians.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role]) AS user_has_school_role));

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY students_delete_authorized ON public.students
  FOR DELETE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
;
CREATE POLICY students_insert_authorized ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role])));
CREATE POLICY students_select_scoped ON public.students
  FOR SELECT TO authenticated
  USING ((private.is_platform_admin() OR private.user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role, 'comptable'::app_role, 'enseignant'::app_role]) OR (id IN ( SELECT private.user_related_student_ids(students.school_id) AS user_related_student_ids))))
;
CREATE POLICY students_update_authorized ON public.students
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role])))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role])));

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY subjects_delete_authorized ON public.subjects
  FOR DELETE TO authenticated
  USING (( SELECT user_has_school_role(subjects.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role))
;
CREATE POLICY subjects_insert_authorized ON public.subjects
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));
CREATE POLICY subjects_select_member ON public.subjects
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY subjects_update_authorized ON public.subjects
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY teacher_assignments_delete_authorized ON public.teacher_assignments
  FOR DELETE TO authenticated
  USING (( SELECT user_has_school_role(teacher_assignments.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role))
;
CREATE POLICY teacher_assignments_insert_authorized ON public.teacher_assignments
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));
CREATE POLICY teacher_assignments_select_member ON public.teacher_assignments
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY teacher_assignments_update_authorized ON public.teacher_assignments
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY teachers_delete_authorized ON public.teachers
  FOR DELETE TO authenticated
  USING (( SELECT user_has_school_role(teachers.school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]) AS user_has_school_role))
;
CREATE POLICY teachers_insert_authorized ON public.teachers
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));
CREATE POLICY teachers_select_member ON public.teachers
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY teachers_update_authorized ON public.teachers
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY terms_delete_authorized ON public.terms
  FOR DELETE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))))
;
CREATE POLICY terms_insert_authorized ON public.terms
  FOR INSERT TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));
CREATE POLICY terms_select_member ON public.terms
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY terms_update_authorized ON public.terms
  FOR UPDATE TO authenticated
  USING (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.is_platform_admin = true)))) OR user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role])));

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY time_slots_delete_authorized ON public.time_slots
  FOR DELETE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]))
;
CREATE POLICY time_slots_insert_authorized ON public.time_slots
  FOR INSERT TO authenticated
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]));
CREATE POLICY time_slots_select_member ON public.time_slots
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY time_slots_update_authorized ON public.time_slots
  FOR UPDATE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]))
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]));

ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY timetable_entries_delete_authorized ON public.timetable_entries
  FOR DELETE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role]))
;
CREATE POLICY timetable_entries_insert_authorized ON public.timetable_entries
  FOR INSERT TO authenticated
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role, 'enseignant'::app_role]));
CREATE POLICY timetable_entries_select_member ON public.timetable_entries
  FOR SELECT TO authenticated
  USING (user_is_school_member(school_id))
;
CREATE POLICY timetable_entries_update_authorized ON public.timetable_entries
  FOR UPDATE TO authenticated
  USING (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role, 'enseignant'::app_role]))
  WITH CHECK (user_has_school_role(school_id, ARRAY['org_admin'::app_role, 'directeur'::app_role, 'secretaire'::app_role, 'enseignant'::app_role]));

COMMIT;

