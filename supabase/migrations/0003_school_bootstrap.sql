-- 0003_school_bootstrap.sql
-- Initialisation des données de fonctionnement d'une école :
-- années scolaires, niveaux (référentiel CI CP1->Tle), trimestres,
-- catégories de frais et classes par défaut.
-- S'applique à toute école neuve (via create_initial_school) et en
-- réparation d'une école existante (select private.seed_school_defaults(id)).

create or replace function private.seed_school_defaults(p_school_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
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

-- La création d'école initialise désormais les données de fonctionnement.
create or replace function private.create_initial_school(
  p_organization_name text,
  p_school_name text,
  p_school_type public.school_type default 'primaire_secondaire',
  p_short_name text default null,
  p_address text default null,
  p_city text default null,
  p_commune text default null,
  p_phone text default null,
  p_school_email text default null,
  p_full_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
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