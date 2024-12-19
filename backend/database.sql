-- Create chats table
create table if not exists public.chats (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    question text not null,
    response jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_archived boolean default false not null
);

-- Set up RLS (Row Level Security)
alter table public.chats enable row level security;

-- Create policy to allow users to see only their own chats
create policy "Users can view their own chats"
    on public.chats
    for all
    using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists chats_user_id_idx on public.chats(user_id);
create index if not exists chats_created_at_idx on public.chats(created_at);

-- Create response history table
create table if not exists public.response_history (
    id uuid default gen_random_uuid() primary key,
    chat_id uuid references public.chats(id) on delete cascade not null,
    user_id uuid references auth.users(id) not null,
    verse text not null,
    reference text not null,
    relevance text not null,
    explanation text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for response history
alter table public.response_history enable row level security;

-- Create policy to allow users to see only their own response history
create policy "Users can view their own response history"
    on public.response_history
    for all
    using (auth.uid() = user_id);

-- Create indexes for response history
create index if not exists response_history_chat_id_idx on public.response_history(chat_id);
create index if not exists response_history_user_id_idx on public.response_history(user_id);
create index if not exists response_history_created_at_idx on public.response_history(created_at);
