-- Create chats table
create table public.chats (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users not null,
    question text not null,
    response jsonb not null,
    is_archived boolean default false not null
);

-- Set up RLS (Row Level Security)
alter table public.chats enable row level security;

-- Create policies
create policy "Users can view their own chats"
    on public.chats for select
    using (auth.uid() = user_id);

create policy "Users can insert their own chats"
    on public.chats for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own chats"
    on public.chats for update
    using (auth.uid() = user_id);

-- Create indexes
create index chats_user_id_idx on public.chats(user_id);
create index chats_created_at_idx on public.chats(created_at);
create index chats_is_archived_idx on public.chats(is_archived);
