-- Create reviews table
create table if not exists public.reviews (
    id uuid default gen_random_uuid() primary key,
    center_id uuid not null references public.centers(id) on delete cascade,
    parent_id uuid references auth.users(id) on delete set null,
    rating integer not null check (rating >= 1 and rating <= 5),
    content text not null,
    parent_name text, -- Optional manual name if we want to allow masking or custom names
    is_visible boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.reviews enable row level security;

-- Public Read (Center filtered)
create policy "Public can read visible reviews"
    on public.reviews for select
    using (is_visible = true);

-- Authenticated Parents can insert (linked to their center)
create policy "Parents can insert reviews"
    on public.reviews for insert
    with check (
        auth.role() = 'authenticated' and
        (
            -- Must match the center they belong to (optional strict check, but usually nice)
            exists (
                select 1 from public.children c
                where c.parent_id = auth.uid()
                and c.center_id = reviews.center_id
            )
            OR
            -- Or if we don't strictly enforce children-link (e.g. just signed up parents)
            auth.uid() = parent_id
        )
    );

-- Users can update THEIR OWN reviews
create policy "Users can update own reviews"
    on public.reviews for update
    using (auth.uid() = parent_id);

-- Super Admin Full Access
create policy "Super Admin full access reviews"
    on public.reviews for all
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'super_admin'
        )
    );
