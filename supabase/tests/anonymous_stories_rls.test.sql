begin;

select plan(9);

select ok(
  not has_table_privilege('anon', 'public.anonymous_stories', 'select'),
  'anon har inte SELECT pa hela tabellen'
);

select ok(
  has_column_privilege('anon', 'public.anonymous_stories', 'content', 'select'),
  'anon kan lasa publik berattelsetext'
);

select ok(
  has_column_privilege('anon', 'public.anonymous_stories', 'status', 'select'),
  'anon kan anvanda statusfiltret i den publika fragan'
);

select ok(
  not has_column_privilege('anon', 'public.anonymous_stories', 'ip_hash', 'select'),
  'anon kan inte lasa ip_hash'
);

select ok(
  not has_column_privilege('authenticated', 'public.anonymous_stories', 'ip_hash', 'select'),
  'authenticated kan inte lasa ip_hash'
);

set local role anon;

select lives_ok(
  $$select id, content, age_range, gender, emotion_emoji, created_at, approved_at
    from public.anonymous_stories where status = 'approved'$$,
  'anon kan lasa falt som den publika vyn behover'
);

select throws_ok(
  $$select ip_hash from public.anonymous_stories$$,
  '42501',
  null,
  'anon nekas direkt lasning av ip_hash'
);

select throws_ok(
  $$select * from public.anonymous_stories$$,
  '42501',
  null,
  'anon kan inte kringga kolumnskyddet med select star'
);

reset role;
set local role authenticated;

select throws_ok(
  $$select ip_hash from public.anonymous_stories$$,
  '42501',
  null,
  'authenticated nekas direkt lasning av ip_hash'
);

select * from finish();
rollback;
