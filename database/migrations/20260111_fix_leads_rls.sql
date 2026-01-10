-- Enable RLS
alter table public.leads enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Leads are viewable by admins and staff" on public.leads;
drop policy if exists "Leads are editable by admins and staff" on public.leads;
drop policy if exists "Allow ALL for admins" on public.leads;

-- Create permissive policy for verified staff (or extensive logic)
-- For now, allow authenticated users with valid role to access
create policy "Staff can manage leads"
on public.leads
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
    and user_profiles.role in ('admin', 'therapist', 'super_admin', 'manager')
  )
);

-- Insert Dummy Data if empty (to verify report works)
insert into public.leads (
    parent_name, phone, child_name, concern, source, status, created_at
)
select '김철수 부모', '010-1234-5678', '김철수', '언어 발달 지연 문의', '네이버 블로그', 'new', now()
where not exists (select 1 from public.leads limit 1);

insert into public.leads (
    parent_name, phone, child_name, concern, source, status, created_at
)
select '이영희 부모', '010-9876-5432', '이영희', '사회성 부족', '지인 소개', 'contacted', now() - interval '2 days'
where not exists (select 1 from public.leads limit 1);

insert into public.leads (
    parent_name, phone, child_name, concern, source, status, created_at, converted_at
)
select '박지성 부모', '010-1111-2222', '박지성', '집중력 저하', '인스타그램', 'converted', now() - interval '5 days', now()
where not exists (select 1 from public.leads limit 1);
