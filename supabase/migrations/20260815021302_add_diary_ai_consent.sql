-- Serverägd consent för AI-reflektioner i dagboken. Tabellen innehåller
-- enbart nödvändig consentmetadata, aldrig dagbokstext eller AI-underlag.
create table if not exists public.user_ai_consents (
	user_id uuid not null references auth.users (id) on delete cascade,
	scope text not null,
	status text not null,
	policy_version text not null,
	granted_at timestamptz not null default now(),
	revoked_at timestamptz,
	updated_at timestamptz not null default now(),
	primary key (user_id, scope),
	constraint user_ai_consents_scope_check check (scope = 'diary_ai_reflection'),
	constraint user_ai_consents_status_check check (status in ('granted', 'revoked')),
	constraint user_ai_consents_status_timestamps_check check (
		(status = 'granted' and revoked_at is null)
		or (status = 'revoked' and revoked_at is not null)
	)
);

alter table public.user_ai_consents enable row level security;

-- Consent får aldrig skrivas direkt från webbläsaren. Endast den befintliga
-- server-side service-role-klienten läser och skriver tabellen.
revoke all on table public.user_ai_consents from anon, authenticated;
grant select, insert, update, delete on table public.user_ai_consents to service_role;
