do $$
declare
  features_type text;
  starter_features text[] := array[
    'Up to 3 users',
    '1 department only',
    'User account management',
    'Roles & feature access',
    'Basic grade computation',
    'Subject management',
    'Room management',
    'Academic approvals',
    'Attendance tracking',
    'Custom branding',
    'TESDA workspace modules'
  ];
  basic_features text[] := array[
    'Up to 3 users',
    'Up to 3 departments',
    'User account management',
    'Roles & feature access',
    'Basic grade computation',
    'Subject management',
    'Room management',
    'Academic approvals',
    'Attendance tracking',
    'Custom branding',
    'TESDA workspace modules'
  ];
  premium_features text[] := array[
    'Up to 50 users',
    'Up to 10 departments',
    'User account management',
    'Roles & feature access',
    'Basic grade computation',
    'Subject management',
    'Room management',
    'Academic approvals',
    'Attendance tracking',
    'Full analytics & reports',
    'Custom branding',
    'TESDA workspace modules'
  ];
  diamond_features text[] := array[
    'Unlimited users',
    'Unlimited departments',
    'User account management',
    'Roles & feature access',
    'Basic grade computation',
    'Subject management',
    'Room management',
    'Academic approvals',
    'Attendance tracking',
    'Full analytics & reports',
    'Custom branding',
    'TESDA workspace modules'
  ];
begin
  select data_type
    into features_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'subscription_plans'
    and column_name = 'features';

  if features_type is null then
    raise exception 'public.subscription_plans.features column was not found';
  end if;

  if features_type = 'ARRAY' then
    update public.subscription_plans
    set features = starter_features,
        instructors = 3,
        departments = 1
    where lower(name) = 'starter';

    update public.subscription_plans
    set features = basic_features,
        instructors = 3,
        departments = 3
    where lower(name) = 'basic';

    update public.subscription_plans
    set features = premium_features,
        instructors = 50,
        departments = 10
    where lower(name) = 'premium';

    update public.subscription_plans
    set features = diamond_features,
        instructors = 999,
        departments = 999
    where lower(name) = 'diamond';
  elsif features_type = 'jsonb' then
    update public.subscription_plans
    set features = to_jsonb(starter_features),
        instructors = 3,
        departments = 1
    where lower(name) = 'starter';

    update public.subscription_plans
    set features = to_jsonb(basic_features),
        instructors = 3,
        departments = 3
    where lower(name) = 'basic';

    update public.subscription_plans
    set features = to_jsonb(premium_features),
        instructors = 50,
        departments = 10
    where lower(name) = 'premium';

    update public.subscription_plans
    set features = to_jsonb(diamond_features),
        instructors = 999,
        departments = 999
    where lower(name) = 'diamond';
  elsif features_type = 'json' then
    update public.subscription_plans
    set features = to_json(starter_features),
        instructors = 3,
        departments = 1
    where lower(name) = 'starter';

    update public.subscription_plans
    set features = to_json(basic_features),
        instructors = 3,
        departments = 3
    where lower(name) = 'basic';

    update public.subscription_plans
    set features = to_json(premium_features),
        instructors = 50,
        departments = 10
    where lower(name) = 'premium';

    update public.subscription_plans
    set features = to_json(diamond_features),
        instructors = 999,
        departments = 999
    where lower(name) = 'diamond';
  else
    raise exception 'Unsupported public.subscription_plans.features data type: %', features_type;
  end if;
end $$;
